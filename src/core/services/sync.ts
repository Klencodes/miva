import { DBProduct, DBOrder } from "../interfaces/IDBTypes";
import { IOrderItem } from "../interfaces/IOrder";
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
  created_at?: string;
}

interface SyncResults {
  success: number;
  failed: number;
  errors: Array<{ orderId: number; error: any }>;
}

class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  // --- DEBUG METHOD ---
  async debugSyncIssues(): Promise<void> {
    console.log('🔍 DEBUG: Starting sync issue diagnosis...');
    
    // 1. Check if we have entity ID
    const entity = indexedDBService['entityIdString'];
    console.log('Entity ID:', entity);
    
    // 2. Check all orders in database
    const debugResponse = await indexedDBService.debugAllOrders();
    console.log('Debug response:', debugResponse);
    
    // 3. Check pending orders specifically
    const pendingResponse = await indexedDBService.getPendingOrders();
    console.log('Pending orders response:', pendingResponse);
    
    // 4. Check if orders have correct status
    if (debugResponse.results && debugResponse.results.length > 0) {
      const orders = debugResponse.results as DBOrder[];
      const statuses = orders.map(o => o.status);
      console.log('All order statuses:', statuses);
      
      // Check if any order has no status
      const noStatusOrders = orders.filter(o => !o.status);
      if (noStatusOrders.length > 0) {
        console.log('⚠️ Orders with no status:', noStatusOrders);
      }
    }
    
    console.log('🔍 DEBUG: Diagnosis complete');
  }

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
            pageSize: 100
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
            // eslint-disable-next-line 
            totalFetched += products.length;
            
            hasMore = !!response.next && response.results.length > 0;
            page++;
            
            console.log(`📦 Fetched page ${page-1}: ${products.length} products`);
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
      // DEBUG: First check what's in the database
      console.log('🔍 Checking database before sync...');
      await this.debugSyncIssues();

      // Fetch orders marked as 'pending'
      const pendingOrdersResponse = await indexedDBService.getPendingOrders();
      console.log('Pending orders response:', pendingOrdersResponse);
      
      if (!pendingOrdersResponse.success) {
        console.error('❌ Failed to fetch pending orders:', pendingOrdersResponse.message);
        return result;
      }

      const pendingOrders = pendingOrdersResponse.results || [];
      
      console.log(`📋 Found ${pendingOrders.length} pending orders to sync`);

      if (pendingOrders.length === 0) {
        console.log('ℹ️ No pending orders to sync');
        return result;
      }

      console.log('📝 Pending orders details:', pendingOrders.map((o: { id: any; code: any; total: any; status: any; items: string | any[]; entity_id: any; }) => ({
        id: o.id,
        code: o.code,
        total: o.total,
        status: o.status,
        items: o.items?.length,
        entity_id: o.entity_id
      })));

      // Process orders sequentially
      for (const order of pendingOrders) {
        try {
          if (!order.id) {
            console.error('❌ Order missing local ID:', order);
            result.failed++;
            result.errors.push({ orderId: -1, error: 'Missing local order ID' });
            continue;
          }

          console.log(`🔄 Syncing order ${order.id} (Local ID) - Code: ${order.code}`);

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
          console.log('📤 Prepared order for server:', JSON.stringify(serverOrder, null, 2));

          // Submit to server
          console.log('📤 Submitting order to server...');
          const response: ServerOrderResponse = await appService.createOrder(serverOrder);
          
          console.log('📥 Server response:', response);
          
          if (response.success) {
            const serverOrderId = response.order_id || response.data?.order_id || response.data?.id;
            const serverCode = response.code || response.data?.code;
            const serverCreatedAt = response.data?.created_at || response.created_at;
            
            if (serverOrderId) {
              await indexedDBService.updateOrderStatus(
                order.id,
                'synced',
                serverOrderId,
                serverCode,
                serverCreatedAt
              );
              result.success++;
              console.log(`✅ Order ${order.id} synced successfully. Server ID: ${serverOrderId}`);
            } else {
              console.warn('⚠️ Server responded with success but no order ID. Response:', response);
              await indexedDBService.updateOrderStatus(order.id, 'synced');
              result.success++;
              console.log(`✅ Order ${order.id} synced (no server ID returned)`);
            }
          } else {
            const errorMessage = response.message || 'Server rejected order';
            console.error(`❌ Order ${order.id} sync failed: ${errorMessage}`);
            result.failed++;
            result.errors.push({ orderId: order.id, error: errorMessage });
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Failed to sync order ${order.id}:`, error);
          result.failed++;
          result.errors.push({ 
            orderId: order.id || -1, 
            error: errorMsg 
          });
        }

        await this.delay(500);
      }

      console.log(`📊 Orders sync completed: ${result.success} successful, ${result.failed} failed`);
      
      if (result.errors.length > 0) {
        console.error('❌ Sync errors:', result.errors);
      }
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
      customer: order.customer || null,
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
        reference_id: order.payment?.reference_id || null
      },
      
      items: order.items.map((item: IOrderItem) => ({
        id: item.id,
        order_id: item.order_id,
        product_id: item.product_id,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price.toFixed(2)),
        product_name: item.product_name || item.short_name || 'Unknown Product',
        short_name: item.short_name || item.product_name || 'Unknown',
        category_name: item.category_name || 'Uncategorized',
        content_measurement: item.content_measurement || '',
        content_unit: item.content_unit || '',
        selling_unit_quantity: item.selling_unit_quantity,
        selling_unit: item.selling_unit || 'unit',
        image_url: item.image_url || '',
        image_alt: item.image_alt || item.short_name || 'Product image'
      }))
    };

    return serverOrder;
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

    this.syncInterval = setInterval(async () => {
      if (networkService.isOnline() && !this.isSyncing) {
        console.log('🔄 Periodic sync triggered');
        try {
          await this.syncOrders();
        } catch (error) {
          console.error('❌ Periodic sync failed:', error);
        }
      }
    }, 5 * 60 * 1000);

    const handleOnline = async () => {
      console.log('🌐 Connection restored, starting sync...');
      try {
        await this.syncOrders();
      } catch (error) {
        console.error('❌ Online event sync failed:', error);
      }
    };

    window.addEventListener('online', handleOnline);

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

  // Force sync specific order (for debugging/retry)
  async forceSyncOrder(localOrderId: number): Promise<{ success: boolean; error?: string }> {
    if (!networkService.isOnline()) {
      return { success: false, error: 'No internet connection' };
    }

    try {
      const ordersResponse = await indexedDBService.getPendingOrders();
      const order = ordersResponse.results?.find((o: { id: number; }) => o.id === localOrderId);
      
      if (!order) {
        const allOrders = await indexedDBService.debugAllOrders();
        const anyOrder = allOrders.results?.find((o: { id: number; }) => o.id === localOrderId);
        if (anyOrder) {
          console.log(`Order found but status is ${anyOrder.status}, updating to pending...`);
          // Update to pending and retry
          await indexedDBService.updateOrderStatus(localOrderId, 'pending');
          const updatedOrder = { ...anyOrder, status: 'pending' };
          return await this.syncSingleOrder(updatedOrder);
        }
        return { success: false, error: 'Order not found' };
      }

      return await this.syncSingleOrder(order);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMsg };
    }
  }

  private async syncSingleOrder(order: DBOrder): Promise<{ success: boolean; error?: string }> {
    console.log(`🔄 Force syncing order ${order.id}...`);
    
    const serverOrder = this.prepareOrderForServer(order);
    const response: ServerOrderResponse = await appService.createOrder(serverOrder);
    
    if (response.success) {
      const serverOrderId = response.order_id || response.data?.order_id || response.data?.id;
      const serverCode = response.code || response.data?.code;
      const serverCreatedAt = response.data?.created_at || response.created_at;
      
      await indexedDBService.updateOrderStatus(
        order.id!,
        'synced',
        serverOrderId,
        serverCode,
        serverCreatedAt
      );
      
      return { success: true };
    } else {
      return { success: false, error: response.message || 'Server rejected order' };
    }
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