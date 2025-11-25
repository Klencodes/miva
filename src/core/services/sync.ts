import { DBProduct, DBOrder, DBOrderItem } from "../interfaces/IDBTypes";
import { IResponse } from "../interfaces/IResponse";
import { appService } from "./app";
import { networkService } from "./connection";
import { indexedDBService } from "./indexdb";

// Define the expected response structure from the server's createOrder endpoint
interface ServerOrderResponse {
  success: boolean;
  order_id?: string;
  code?: string;
  message?: string;
  data?: any;
}

interface SyncResults {
  success: number;
  failed: number;
  errors: Array<{ orderId: number; error: string }>;
}

class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  // --- Product Synchronization ---

  async syncProducts(): Promise<{ success: boolean; count: number; error?: string }> {
    if (!networkService.isOnline()) {
      console.log('📶 Offline - skipping product sync');
      return { success: false, count: 0, error: 'No internet connection' };
    }

    if (this.isSyncing) {
      console.log('🔄 Sync already in progress - skipping');
      return { success: false, count: 0, error: 'Sync already in progress' };
    }

    this.isSyncing = true;
    console.log('🔄 Starting products sync...');

    try {
      let allProducts: DBProduct[] = [];
      let page = 1;
      let hasMore = true;
      let totalFetched = 0;

      // Fetch all pages of products
      while (hasMore) {
        try {
          const response: IResponse = await appService.getProducts({
            page,
            search: '',
            category: 'All',
            pageSize: 100 // Increased page size for fewer requests
          });

          if (response.success && response.results && Array.isArray(response.results)) {
            const products: DBProduct[] = response.results.map((product: any) => ({
              id: product.id || product.entity_id, // Fallback to entity_id if id missing
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
              entity_id: product.entity_id, // Critical: must be present
              last_synced: new Date().toISOString()
            }));
            
            allProducts = [...allProducts, ...products];
            // eslint-disable-next-line
            totalFetched += products.length;
            
            // Check if there are more pages
            hasMore = !!response.next && response.results.length > 0;
            page++;
            
            console.log(`📦 Fetched page ${page-1}: ${products.length} products`);
          } else {
            console.warn('Invalid response format or no results:', response);
            hasMore = false;
          }
        } catch (pageError) {
          console.error(`❌ Error fetching products page ${page}:`, pageError);
          hasMore = false; // Stop on first page error
        }
      }

      if (allProducts.length > 0) {
        try {
          // Save products to IndexedDB
          await indexedDBService.saveProducts(allProducts);
          await indexedDBService.setLastSyncTime();
          
          console.log(`✅ Successfully synced ${allProducts.length} products to IndexedDB`);
          return { success: true, count: allProducts.length };
        } catch (saveError) {
          console.error('❌ Failed to save products to IndexedDB:', saveError);
          return { success: false, count: 0, error: 'Failed to save products locally' };
        }
      } else {
        console.log('ℹ️ No products to sync');
        return { success: true, count: 0 };
      }
    } catch (error) {
      console.error('❌ Product sync failed:', error);
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
      console.log('📶 Offline - skipping order sync');
      return { success: 0, failed: 0, errors: [] };
    }

    if (this.isSyncing) {
      console.log('🔄 Sync already in progress - skipping orders');
      return { success: 0, failed: 0, errors: [] };
    }

    this.isSyncing = true;
    console.log('🔄 Starting orders sync...');

    const result: SyncResults = {
      success: 0,
      failed: 0,
      errors: []
    };

    try {
      // Fetch orders marked as 'pending'
      const pendingOrders = await indexedDBService.getPendingOrders();
      
      console.log(`📋 Found ${pendingOrders.count} pending orders to sync`);

      if (pendingOrders.count === 0) {
        console.log('ℹ️ No pending orders to sync');
        return result;
      }

      // Process orders sequentially to avoid overwhelming the server
      for (const order of pendingOrders.results) {
        try {
          if (!order.id) {
            console.error('❌ Order missing local ID:', order);
            result.failed++;
            result.errors.push({ orderId: -1, error: 'Missing local order ID' });
            continue;
          }

          console.log(`🔄 Syncing order ${order.id}...`);

          // Validate required order fields
          if (!this.validateOrder(order)) {
            console.error(`❌ Order ${order.id} validation failed`);
            await indexedDBService.updateOrderStatus(order.id, 'failed');
            result.failed++;
            result.errors.push({ orderId: order.id, error: 'Order validation failed' });
            continue;
          }

          // Prepare order data for server
          const serverOrder = this.prepareOrderForServer(order);

          // Submit to server
          const response: ServerOrderResponse = await appService.createOrder(serverOrder);
          
          if (response.success && (response.order_id || response.data?.order_id)) {
            // Use response.order_id or fallback to response.data.order_id
            const serverOrderId = response.order_id || response.data?.order_id;
            const serverCode = response.code || response.data?.code;
            
            if (serverOrderId) {
              await indexedDBService.updateOrderStatus(
                order.id,
                'synced',
                serverOrderId,
                serverCode
              );
              result.success++;
              console.log(`✅ Order ${order.id} synced successfully. Server ID: ${serverOrderId}`);
            } else {
              throw new Error('Server responded with success but no order ID');
            }
          } else {
            const errorMessage = response.message || 'Server rejected order';
            console.error(`❌ Order ${order.id} sync failed: ${errorMessage}`);
            await indexedDBService.updateOrderStatus(order.id, 'failed');
            result.failed++;
            result.errors.push({ orderId: order.id, error: errorMessage });
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Failed to sync order ${order.id}:`, error);
          
          try {
            await indexedDBService.updateOrderStatus(order.id!, 'failed');
          } catch (updateError) {
            console.error(`❌ Failed to update order ${order.id} status:`, updateError);
          }
          
          result.failed++;
          result.errors.push({ 
            orderId: order.id || -1, 
            error: errorMsg 
          });
        }

        // Small delay between requests to avoid overwhelming the server
        await this.delay(100);
      }

      console.log(`📊 Orders sync completed: ${result.success} successful, ${result.failed} failed`);
    } catch (error) {
      console.error('❌ Orders sync failed:', error);
      result.errors.push({ 
        orderId: -1, 
        error: error instanceof Error ? error.message : 'Unknown sync error' 
      });
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  // Validate order before syncing
  private validateOrder(order: DBOrder): boolean {
    if (!order.entity_id) {
      console.error('Order missing entity_id:', order);
      return false;
    }

    if (!order.items || order.items.length === 0) {
      console.error('Order has no items:', order);
      return false;
    }

    if (typeof order.total !== 'number' || order.total <= 0) {
      console.error('Order has invalid total:', order);
      return false;
    }

    // Validate each item
    for (const item of order.items) {
      if (!item.product_id) {
        console.error('Order item missing product_id:', item);
        return false;
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        console.error('Order item has invalid quantity:', item);
        return false;
      }
      if (typeof item.unit_price !== 'number' || item.unit_price < 0) {
        console.error('Order item has invalid unit_price:', item);
        return false;
      }
    }

    return true;
  }

  // Prepare order data for server submission
  private prepareOrderForServer(order: DBOrder): any {
    return {
      // Root Order Fields
      cashier: order.cashier || 'Unknown Cashier',
      customer: order.customer || null,
      total: order.total,
      subtotal: order.subtotal || order.total, // Fallback to total if subtotal missing
      discount: order.discount || 0,
      tendered_cash: order.tendered_cash || order.total, // Fallback to total
      balance: order.balance || 0,
      balance_label: order.balance_label || 'Change',
      entity_id: order.entity_id,

      // Nested Payment Object
      payment: {
        payment_method: order.payment?.payment_method || 'Cash',
        amount_paid: order.payment?.amount_paid || order.tendered_cash || order.total,
        reference_id: order.payment?.reference_id || undefined
      },
      
      // Nested Items Array
      items: order.items.map((item: DBOrderItem) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        product_name: item.product_name || item.short_name || 'Unknown Product',
        short_name: item.short_name || item.product_name || 'Unknown',
        category_name: item.category_name || 'Uncategorized',
        content_measurement: item.content_measurement || '',
        content_unit: item.content_unit || '',
        selling_unit_quantity: item.selling_unit_quantity || 1,
        selling_unit: item.selling_unit || 'unit',
        image_url: item.image_url || '',
        image_alt: item.image_alt || item.short_name || 'Product image'
      }))
    };
  }

  // Utility function for delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- Sync Status and Control ---

  getSyncStatus(): { isSyncing: boolean; lastSync?: string } {
    return {
      isSyncing: this.isSyncing
    };
  }

  // --- Initialization and Control ---

  async initializeSync(): Promise<void> {
    console.log('🚀 Initializing sync service...');

    // Initial sync if online
    if (networkService.isOnline()) {
      console.log('🌐 Online - performing initial sync');
      try {
        await this.syncProducts();
        await this.syncOrders();
      } catch (error) {
        console.error('❌ Initial sync failed:', error);
      }
    } else {
      console.log('📶 Offline - skipping initial sync');
    }

    // Set up periodic sync (every 5 minutes instead of 2 hours)
    this.syncInterval = setInterval(async () => {
      if (networkService.isOnline() && !this.isSyncing) {
        console.log('🔄 Periodic sync triggered');
        try {
          await this.syncProducts();
          await this.syncOrders();
        } catch (error) {
          console.error('❌ Periodic sync failed:', error);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Sync when coming online
    const handleOnline = async () => {
      console.log('🌐 Connection restored, starting sync...');
      try {
        await this.syncProducts();
        await this.syncOrders();
      } catch (error) {
        console.error('❌ Online event sync failed:', error);
      }
    };

    window.addEventListener('online', handleOnline);

    // Also sync when page becomes visible (user comes back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && networkService.isOnline() && !this.isSyncing) {
        console.log('👀 Page visible, triggering sync...');
        this.syncOrders().catch(error => {
          console.error('❌ Visibility change sync failed:', error);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  // Manual sync trigger with improved reporting
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

    console.log('👤 Manual sync triggered by user');
    
    const productsResult = await this.syncProducts();
    const ordersResult = await this.syncOrders();

    return {
      products: productsResult,
      orders: ordersResult
    };
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('🧹 Sync service destroyed');
  }
}

export const syncService = new SyncService();