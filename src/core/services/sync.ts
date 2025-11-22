import { IResponse } from "../interfaces/IResponse";
import { appService } from "./app";
import { networkService } from "./connection";
import { DBProduct, indexedDBService, DBOrder, DBOrderItem, DBPayment } from "./indexdb"; // Ensure DBOrder/Item/Payment are imported

// Define the expected response structure from the server's createOrder endpoint
interface ServerOrderResponse {
  success: boolean;
  order_id?: string; // The server's UUID ('id' on Mongoose schema)
  code?: string; // The server's generated order code
  message?: string;
}

class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  // --- Product Synchronization ---

  async syncProducts(): Promise<boolean> {
    // 💡 FIX 1: Use networkService.isOnline() for sync guard.
    if (!networkService.isOnline() || this.isSyncing) return false;

    this.isSyncing = true;
    console.log('🔄 Starting products sync...');

    try {
      let allProducts: DBProduct[] = [];
      let page = 1;
      let hasMore = true;

      // Fetch all pages of products
      while (hasMore) {
        // Assuming appService.getProducts returns an IResponse with results array
        const response: IResponse = await appService.getProducts({
          page,
          search: '',
          category: 'All'
        });

        if (response.success && response.results) {
          // 💡 FIX 2: Ensure mapping uses required DBProduct fields for type safety
          const products: DBProduct[] = response.results.map((product: any) => ({
            id: product.id,
            short_name: product.short_name,
            name: product.name,
            category_name: product.category_name,
            stock: product.stock,
            price: product.price,
            is_available: product.is_available,
            image_url: product.image_url,
            image_alt: product.image_alt,
            content_measurement: product.content_measurement,
            content_unit: product.content_unit,
            selling_unit_quantity: product.selling_unit_quantity,
            selling_unit: product.selling_unit,
            entity_id: product.entity_id, // Ensure this is mapped!
            last_synced: new Date().toISOString()
          }));

          allProducts = [...allProducts, ...products];
          hasMore = !!response.next;
          page++;
        } else {
          hasMore = false;
        }
      }

      if (allProducts.length > 0) {
        // Clear existing products and save new ones
        await indexedDBService.clearProducts();
        await indexedDBService.saveProducts(allProducts);
        await indexedDBService.setLastSyncTime();
        
        console.log(`✅ Synced ${allProducts.length} products to IndexedDB`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Product sync failed:', error);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  // --- Order Synchronization ---

  async syncOrders(): Promise<{ success: number; failed: number }> {
    if (!networkService.isOnline() || this.isSyncing) {
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    console.log('🔄 Starting orders sync...');

    const result = { success: 0, failed: 0 };

    try {
      // Fetch orders marked as 'pending'
      const pendingOrders: DBOrder[] = await indexedDBService.getPendingOrders();
      
      for (const order of pendingOrders) {
        try {
          // 🚨 FIX 3: Convert the local DBOrder to the EXACT structure required by the server's orderSchema.
          // This includes all root fields and the fully denormalized item list.
          const serverOrder = {
            // Root Order Fields
            cashier: order.cashier,
            customer: order.customer, // String
            total: order.total,
            subtotal: order.subtotal,
            discount: order.discount,
            tendered_cash: order.tendered_cash,
            balance: order.balance,
            balance_label: order.balance_label,
            entity_id: order.entity_id,

            // Nested Payment Object
            payment: order.payment, // DBPayment matches server paymentSchema
            
            // Nested Items Array (Must be a complete DBOrderItem array structure, 
            // as it matches the server's orderItemSchema)
            items: order.items.map((item: DBOrderItem) => ({
              // Retain all fields from DBOrderItem (which match server's orderItemSchema)
              id: item.id, 
              order_id: item.order_id,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              product_name: item.product_name,
              short_name: item.short_name,
              category_name: item.category_name,
              content_measurement: item.content_measurement,
              content_unit: item.content_unit,
              selling_unit_quantity: item.selling_unit_quantity,
              selling_unit: item.selling_unit,
              image_url: item.image_url,
              image_alt: item.image_alt,
            })),
          };

          // Submit to server
          const response: ServerOrderResponse = await appService.createOrder(serverOrder);
          
          if (response.success && response.order_id) {
            // 🚨 FIX 4: Pass the server's UUID ('order_id') and Code for local storage
            await indexedDBService.updateOrderStatus(
              order.id!,
              'synced',
              response.order_id, // serverUuid
              response.code     // serverCode (assuming appService returns it)
            );
            result.success++;
            console.log(`✅ Order ${order.id} synced successfully. Server ID: ${response.order_id}`);
          } else {
            await indexedDBService.updateOrderStatus(order.id!, 'failed');
            result.failed++;
            console.error(`❌ Order ${order.id} sync failed: Server rejection. Message: ${response.message}`);
          }
        } catch (error) {
          console.error(`❌ Failed to sync order ${order.id}:`, error);
          await indexedDBService.updateOrderStatus(order.id!, 'failed');
          result.failed++;
        }
      }

      console.log(`📊 Orders sync completed: ${result.success} successful, ${result.failed} failed`);
    } catch (error) {
      console.error('❌ Orders sync failed:', error);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  // --- Initialization and Control (No major changes needed) ---

  // Initialize automatic synchronization
  async initializeSync(): Promise<void> {
    // Initial sync if online
    if (networkService.isOnline()) {
      await this.syncProducts();
      await this.syncOrders();
    }

    // Set up periodic sync (every 2 minutes)
    this.syncInterval = setInterval(async () => {
      if (networkService.isOnline()) {
        await this.syncProducts();
        await this.syncOrders();
      }
    }, 2 * 60 * 60 * 1000);

    // Sync when coming online
    window.addEventListener('online', async () => {
      console.log('🌐 Connection restored, starting sync...');
      await this.syncProducts();
      await this.syncOrders();
    });
  }

  // Manual sync trigger
  async manualSync(): Promise<{ products: boolean; orders: { success: number; failed: number } }> {
    if (!networkService.isOnline()) {
      throw new Error('No internet connection');
    }

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
  }
}

export const syncService = new SyncService();