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
          const response: IResponse = await appService.getProducts({
            page,
            search: '',
            category: 'All',
            pageSize: 10
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
      // Fetch orders marked as 'pending'
      const pendingOrdersResponse = await indexedDBService.getPendingOrders();
      
      if (!pendingOrdersResponse.success) {
        console.error('❌ Failed to fetch pending orders:', pendingOrdersResponse.message);
        return result;
      }

      const pendingOrders = pendingOrdersResponse.results || [];
      

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
          const response = await appService.createOrder(serverOrder);
          
          if (response.success) {
            const serverOrderId = response.results?.id;
            const serverCode = response.results?.code;
            const serverCreatedAt = response.results?.created_at;
            
            if (serverOrderId) {
              await indexedDBService.updateOrderStatus(
                order.id,
                'synced',
                serverOrderId,
                serverCode,
                serverCreatedAt
              );
              result.success++;
            } else {
              await indexedDBService.updateOrderStatus(order.id, 'synced');
              result.success++;
            }
          } else {
            const errorMessage = response.message || 'Server rejected order';
            result.failed++;
            result.errors.push({ orderId: order.id, error: errorMessage });
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.failed++;
          result.errors.push({ 
            orderId: order.id || -1, 
            error: errorMsg 
          });
        }

        await this.delay(500);
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

    try {
      const ordersResponse = await indexedDBService.getPendingOrders();
      const order = ordersResponse.results?.find((o: { id: number; }) => o.id === localOrderId);
      
      if (!order) {
        return { success: false, error: 'Order not found or already synced' };
      }

      return await this.syncSingleOrder(order);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMsg };
    }
  }

  private async syncSingleOrder(order: DBOrder): Promise<{ success: boolean; error?: string }> {
    
    const serverOrder = this.prepareOrderForServer(order);
    const response = await appService.createOrder(serverOrder);
    
    if (response.success) {
      const serverOrderId = response.results?.id;
      const serverCode = response.results?.code;
      const serverCreatedAt = response.results?.created_at;
      
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
  }
}

export const syncService = new SyncService();