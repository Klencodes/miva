import { DBProduct, DBOrder } from "../interfaces/IDBTypes";
import { IOrderItem } from "../interfaces/IOrder";
import { IResponse } from "../interfaces/IResponse";
import { appService } from "./app";
import { networkService } from "./connection";
import { indexedDBService } from "./indexdb";

interface SyncResults {
  success: number;
  failed: number;
  errors: Array<{ orderId: number; error: any }>;
}

class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  // --- Product Synchronization ---
  async syncProducts(): Promise<{ success: boolean; count: number; error?: string }> {
    if (!networkService.isOnline()) {
      return { success: false, count: 0, error: 'No internet connection' };
    }

    if (this.isSyncing) {
      return { success: false, count: 0, error: 'Sync already in progress' };
    }

    this.isSyncing = true;

    try {
      let allProducts: DBProduct[] = [];
      let page = 1;
      let hasMore = true;

      // Fetch all pages of products
      while (hasMore) {
        try {
          const response: IResponse = await appService.getAllProducts({
            page,
            search: '',
            category: 'All',
          });

          if (response.success && response.results && Array.isArray(response.results)) {
            const products: DBProduct[] = response.results.map((product: any) => ({
              id: product.id || product.entity_id,
              short_name: product.short_name || '',
              name: product.name || '',
              category_name: product.category_name || 'Uncategorized',
              stock: typeof product.stock === 'number' ? product.stock : 0,
              price: typeof product.price === 'number' ? product.price : 0,
              is_available: Boolean(product.is_available),
              image_url: product.image_url || '',
              image_alt: product.image_alt || product.short_name || 'Product image',
              content_measurement: product.content_measurement || '',
              content_unit: product.content_unit || '',
              selling_unit_quantity: typeof product.selling_unit_quantity === 'number' ? product.selling_unit_quantity : 1,
              selling_unit: product.selling_unit || 'unit',
              entity_id: product.entity_id,
              last_synced: new Date().toISOString()
            }));
            
            allProducts = [...allProducts, ...products];
            
            hasMore = !!response.next && response.results.length > 0;
            page++;
            
          } else {
            console.warn('Invalid response format or no results:', response);
            hasMore = false;
          }
        } catch (pageError) {
          console.error(`❌ Error fetching products page ${page}:`, pageError);
          hasMore = false;
        }
      }

      if (allProducts.length > 0) {
        try {
          await indexedDBService.saveProducts(allProducts);
          await indexedDBService.setLastSyncTime();
          
          return { success: true, count: allProducts.length };
        } catch (saveError) {
          return { success: false, count: 0, error: 'Failed to save products locally' };
        }
      } else {
        return { success: true, count: 0 };
      }
    } catch (error) {
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : 'Unknown error during product sync' 
      };
    } finally {
      this.isSyncing = false;
    }
  }

  // --- Order Synchronization ---
  async syncOrders(): Promise<SyncResults> {
    if (!networkService.isOnline()) {
      return { success: 0, failed: 0, errors: [] };
    }

    if (this.isSyncing) {
      return { success: 0, failed: 0, errors: [] };
    }

    this.isSyncing = true;

    const result: SyncResults = {
      success: 0,
      failed: 0,
      errors: []
    };

    try {
      // STEP 1: Upload pending orders to server
      const uploadResult = await this.uploadPendingOrders();
      result.success += uploadResult.success;
      result.failed += uploadResult.failed;
      result.errors.push(...uploadResult.errors);

      // STEP 2: Download server orders to local DB (NEW)
      if (uploadResult.success > 0) {
        await this.downloadServerOrders();
      }

    } catch (error) {
      result.errors.push({ 
        orderId: -1, 
        error: error instanceof Error ? error.message : 'Unknown sync error' 
      });
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  // Upload pending orders to server
  private async uploadPendingOrders(): Promise<SyncResults> {
    const result: SyncResults = {
      success: 0,
      failed: 0,
      errors: []
    };

    try {
      // Fetch orders marked as 'pending'
      const pendingOrdersResponse = await indexedDBService.getPendingOrders();
      
      if (!pendingOrdersResponse.success) {
        console.error('❌ Failed to fetch pending orders:', pendingOrdersResponse.message);
        return result;
      }

      const pendingOrders = pendingOrdersResponse.results || [];
      
      console.log(`📤 Found ${pendingOrders.length} pending orders to sync`);

      if (pendingOrders.length === 0) {
        return result;
      }

      // Process orders sequentially
      for (const order of pendingOrders) {
        try {
          if (!order.id) {
            console.error('❌ Order missing local ID:', order);
            result.failed++;
            result.errors.push({ orderId: -1, error: 'Missing local order ID' });
            continue;
          }

          // Validate required order fields
          const validation = this.validateOrder(order);
          if (!validation.valid) {
            console.error(`❌ Order ${order.id} validation failed:`, validation.error);
            result.failed++;
            result.errors.push({ orderId: order.id, error: validation.error });
            continue;
          }

          // Prepare order data for server
          const serverOrder = this.prepareOrderForServer(order);

          // Submit to server
          console.log(`🔄 Syncing order ${order.code} (local ID: ${order.id})`);
          const response = await appService.createOrder(serverOrder);
          
          if (response.success) {
            const serverOrderId = response.results?.id;
            
            if (serverOrderId) {
              // Update local order with server details
              await indexedDBService.updateOrderStatus(
                order.id,
                'synced',
                serverOrderId,
              );
              result.success++;
              console.log(`✅ Order ${order.code} synced successfully (server ID: ${serverOrderId})`);
            } else {
              // Mark as synced even without server ID (edge case)
              await indexedDBService.updateOrderStatus(order.id, 'synced');
              result.success++;
              console.log(`✅ Order ${order.code} synced (no server ID)`);
            }
          } else {
            const errorMessage = response.message || 'Server rejected order';
            console.error(`❌ Server rejected order ${order.code}:`, errorMessage);
            result.failed++;
            result.errors.push({ orderId: order.id, error: errorMessage });
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Error syncing order ${order.code}:`, error);
          result.failed++;
          result.errors.push({ 
            orderId: order.id || -1, 
            error: errorMsg 
          });
        }

        // Small delay to avoid overwhelming server
        await this.delay(300);
      }

      console.log(`📊 Upload complete: ${result.success} succeeded, ${result.failed} failed`);
      
    } catch (error) {
      console.error('❌ Error in uploadPendingOrders:', error);
      result.errors.push({ 
        orderId: -1, 
        error: error instanceof Error ? error.message : 'Unknown upload error' 
      });
    }

    return result;
  }

  // Download server orders to local DB
  private async downloadServerOrders(): Promise<void> {
    try {
      console.log('📥 Downloading server orders...');
      
      // Get the last sync timestamp or use a default
      const lastSyncTime = await indexedDBService.getLastSyncTime();
      
      // Fetch orders from server (consider adding date filtering)
      const response = await appService.getOrders({
        page: 1,
        pageSize: 500, 
        search: '',
        payment_method: 'all',
        // You might want to add date filtering here
        // created_after: lastSyncTime
      });

      if (response.success && response.results && Array.isArray(response.results)) {
        const serverOrders = response.results;
        console.log(`📥 Found ${serverOrders.length} orders on server`);
        
        if (serverOrders.length > 0) {
          // Save server orders to local DB
          await indexedDBService.saveOrders(serverOrders);
          console.log(`💾 Saved ${serverOrders.length} server orders to local DB`);
        }
      }
    } catch (error) {
      console.error('❌ Error downloading server orders:', error);
      // Don't throw - this shouldn't fail the entire sync
    }
  }

  // Validate order before syncing
  private validateOrder(order: DBOrder): { valid: boolean; error?: string } {
    if (!order.entity_id) {
      return { valid: false, error: 'Order missing entity_id' };
    }

    if (!order.items || order.items.length === 0) {
      return { valid: false, error: 'Order has no items' };
    }

    if (typeof order.total !== 'number' || order.total <= 0) {
      return { valid: false, error: 'Order has invalid total' };
    }

    if (!order.payment || !order.payment.payment_method) {
      return { valid: false, error: 'Order missing payment method' };
    }

    // Validate each item
    for (const item of order.items) {
      if (!item.product_id) {
        return { valid: false, error: 'Order item missing product_id' };
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return { valid: false, error: 'Order item has invalid quantity' };
      }
      if (typeof item.unit_price !== 'number' || item.unit_price < 0) {
        return { valid: false, error: 'Order item has invalid unit_price' };
      }
    }

    return { valid: true };
  }

  // Prepare order data for server submission
  private prepareOrderForServer(order: DBOrder): any {
    const serverOrder = {
      cashier: order.cashier || 'Unknown Cashier',
      customer: order.customer || "Walk-in Customer",
      total: Number(order.total.toFixed(2)),
      subtotal: order.subtotal ? Number(order.subtotal.toFixed(2)) : Number(order.total.toFixed(2)),
      discount: order.discount ? Number(order.discount.toFixed(2)) : 0,
      tendered_cash: order.tendered_cash ? Number(order.tendered_cash.toFixed(2)) : Number(order.total.toFixed(2)),
      balance: order.balance ? Number(order.balance.toFixed(2)) : 0,
      balance_label: order.balance_label || (order.balance >= 0 ? 'Change' : 'Owings'),
      entity_id: order.entity_id,
      code: order.code,

      payment: {
        payment_method: order.payment?.payment_method || 'Cash',
        amount_paid: order.payment?.amount_paid 
          ? Number(order.payment.amount_paid.toFixed(2))
          : order.tendered_cash 
            ? Number(order.tendered_cash.toFixed(2))
            : Number(order.total.toFixed(2)),
        transaction_id: order.payment?.transaction_id || ''
      },
      
      items: order.items.map((item: IOrderItem) => ({
        product_id: item.product_id,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price.toFixed(2)),
        price_per_piece: item.price_per_piece ? Number(item.price_per_piece.toFixed(2)) : Number(item.unit_price.toFixed(2)),
        product_name: item.product_name || item.short_name || 'Unknown Product',
        short_name: item.short_name || item.product_name || 'Unknown',
        category_name: item.category_name || 'Uncategorized',
        content_measurement: item.content_measurement || '',
        content_unit: item.content_unit || '',
        selling_unit_quantity: item.selling_unit_quantity || 1,
        selling_unit: item.selling_unit || 'unit',
        image_url: item.image_url || '',
        image_alt: item.image_alt || item.short_name || 'Product image'
      })),
      // Preserve the client-created timestamp when syncing
      created_at: order.created_at || new Date().toISOString()
    };

    return serverOrder;
  }

  // Utility function for delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- Sync Status and Control ---

  getSyncStatus(): { isSyncing: boolean } {
    return {
      isSyncing: this.isSyncing
    };
  }

  // Manual sync trigger
  async manualSync(): Promise<{ 
    products: { success: boolean; count: number; error?: string }; 
    orders: SyncResults 
  }> {
    if (!networkService.isOnline()) {
      throw new Error('No internet connection');
    }

    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }
    
    const productsResult = await this.syncProducts();
    const ordersResult = await this.syncOrders();
    
    return {
      products: productsResult,
      orders: ordersResult
    };
  }

  // Force sync specific order
  async forceSyncOrder(localOrderId: number): Promise<{ success: boolean; error?: string }> {
    if (!networkService.isOnline()) {
      return { success: false, error: 'No internet connection' };
    }

    if (this.isSyncing) {
      return { success: false, error: 'Sync already in progress' };
    }

    try {
      // Get all pending orders
      const ordersResponse = await indexedDBService.getPendingOrders();
      const order = ordersResponse.results?.find((o: { id: number; }) => o.id === localOrderId);
      
      if (!order) {
        // Check if order exists but is already synced
        const allOrdersResponse = await indexedDBService.getAllOrders();
        const existingOrder = allOrdersResponse.results?.find((o: { id: number; }) => o.id === localOrderId);
        
        if (existingOrder) {
          return { 
            success: false, 
            error: `Order is already ${existingOrder.status}. Server ID: ${existingOrder.server_id || 'N/A'}` 
          };
        }
        return { success: false, error: 'Order not found' };
      }

      this.isSyncing = true;
      const result = await this.syncSingleOrder(order);
      this.isSyncing = false;
      
      return result;
    } catch (error) {
      this.isSyncing = false;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMsg };
    }
  }

  private async syncSingleOrder(order: DBOrder): Promise<{ success: boolean; error?: string }> {
    console.log(`🔄 Force syncing order ${order.code} (ID: ${order.id})`);
    
    const serverOrder = this.prepareOrderForServer(order);
    const response = await appService.createOrder(serverOrder);
    
    if (response.success) {
      const serverOrderId = response.results?.id;
      await indexedDBService.updateOrderStatus(
        order.id!,
        'synced',
        serverOrderId,
      );
      
      console.log(`✅ Order ${order.code} force-synced successfully`);
      return { success: true };
    } else {
      const errorMsg = response.message || 'Server rejected order';
      console.error(`❌ Order ${order.code} force-sync failed:`, errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  // Start auto-sync interval
  startAutoSync(intervalMinutes: number = 5): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    const intervalMs = intervalMinutes * 60 * 1000;
    this.syncInterval = setInterval(async () => {
      if (networkService.isOnline() && !this.isSyncing) {
        try {
          await this.syncProducts();
          await this.syncOrders();
        } catch (error) {
          console.error('Auto-sync error:', error);
        }
      }
    }, intervalMs);
    
    console.log(`🔄 Auto-sync started (every ${intervalMinutes} minutes)`);
  }

  // Stop auto-sync
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Auto-sync stopped');
    }
  }

  // Cleanup
  destroy(): void {
    this.stopAutoSync();
  }
}

export const syncService = new SyncService();