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
      return { success: false, count: 0, error: "No internet connection" };
    }
    if (this.isSyncing) {
      return { success: false, count: 0, error: "Sync already in progress" };
    }

    this.isSyncing = true;

    try {
      let allProducts: DBProduct[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        try {
          const response: IResponse = await appService.getAllProducts({
            page,
            search: "",
            category: "All",
          });

          if (response.success && response.results && Array.isArray(response.results)) {
            // FIX: map ALL product fields used by the POS:
            //   price_per_unit, price_per_piece, stock_in_pieces,
            //   content_unit_type, allow_pieces_sell were all missing.
            //   When the product came from local cache after a sync, piece-price
            //   calculations and stock deductions would use `undefined`.
            const products: DBProduct[] = response.results.map((product: any) => ({
              id: product.id,
              short_name: product.short_name || "",
              name: product.name || "",
              category_name: product.category_name || "Uncategorized",

              // Stock — both virtual (units) and stored (pieces)
              stock: typeof product.stock === "number" ? product.stock : 0,
              stock_in_pieces:
                typeof product.stock_in_pieces === "number"
                  ? product.stock_in_pieces
                  : (typeof product.stock === "number" ? product.stock : 0) *
                    (typeof product.selling_unit_quantity === "number"
                      ? product.selling_unit_quantity
                      : 1),

              // Pricing
              price: typeof product.price === "number" ? product.price : 0,
              price_per_unit:
                typeof product.price_per_unit === "number" ? product.price_per_unit : 0,
              price_per_piece:
                typeof product.price_per_piece === "number"
                  ? product.price_per_piece
                  : product.price_per_unit && product.selling_unit_quantity
                  ? product.price_per_unit / product.selling_unit_quantity
                  : 0,

              is_available: Boolean(product.is_available),

              // Images
              image_url: product.image_url || "",
              image_alt: product.image_alt || product.short_name || "Product image",

              // Content / packaging fields
              content_measurement: product.content_measurement || "",
              content_unit: product.content_unit || "",
              content_unit_type: product.content_unit_type || product.content_unit || "piece",
              selling_unit_quantity:
                typeof product.selling_unit_quantity === "number"
                  ? product.selling_unit_quantity
                  : 1,
              selling_unit: product.selling_unit || "unit",

              // Selling rules
              allow_pieces_sell: product.allow_pieces_sell !== false,

              entity_id: product.entity_id,
              last_synced: new Date().toISOString(),
            }));

            allProducts = [...allProducts, ...products];
            hasMore = !!response.next && response.results.length > 0;
            page++;
          } else {
            hasMore = false;
          }
        } catch (pageError) {
          console.error(`❌ Error fetching products page ${page}:`, pageError);
          hasMore = false;
        }
      }

      if (allProducts.length > 0) {
        await indexedDBService.saveProducts(allProducts);
        await indexedDBService.setLastSyncTime();
        return { success: true, count: allProducts.length };
      }

      return { success: true, count: 0 };
    } catch (error) {
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : "Unknown error during product sync",
      };
    } finally {
      this.isSyncing = false;
    }
  }

  // --- Order Synchronization ---
  async syncOrders(): Promise<SyncResults> {
    if (!networkService.isOnline()) return { success: 0, failed: 0, errors: [] };
    if (this.isSyncing)             return { success: 0, failed: 0, errors: [] };

    this.isSyncing = true;

    const result: SyncResults = { success: 0, failed: 0, errors: [] };

    try {
      const uploadResult = await this.uploadPendingOrders();
      result.success += uploadResult.success;
      result.failed  += uploadResult.failed;
      result.errors.push(...uploadResult.errors);

      if (uploadResult.success > 0) {
        await this.downloadServerOrders();
      }
    } catch (error) {
      result.errors.push({
        orderId: -1,
        error: error instanceof Error ? error.message : "Unknown sync error",
      });
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private async uploadPendingOrders(): Promise<SyncResults> {
    const result: SyncResults = { success: 0, failed: 0, errors: [] };

    try {
      const pendingOrdersResponse = await indexedDBService.getPendingOrders();
      if (!pendingOrdersResponse.success) {
        console.error("❌ Failed to fetch pending orders:", pendingOrdersResponse.message);
        return result;
      }

      const pendingOrders = pendingOrdersResponse.results || [];
      console.log(`📤 Found ${pendingOrders.length} pending orders to sync`);
      if (pendingOrders.length === 0) return result;

      for (const order of pendingOrders) {
        try {
          if (!order.id) {
            result.failed++;
            result.errors.push({ orderId: -1, error: "Missing local order ID" });
            continue;
          }

          const validation = this.validateOrder(order);
          if (!validation.valid) {
            console.error(`❌ Order ${order.id} validation failed:`, validation.error);
            result.failed++;
            result.errors.push({ orderId: order.id, error: validation.error });
            continue;
          }

          const serverOrder = this.prepareOrderForServer(order);
          console.log(`🔄 Syncing order ${order.code} (local ID: ${order.id})`);

          const response = await appService.createOrder(serverOrder);

          if (response.success) {
            const serverOrderId = response.results?.id;

            // FIX: wrap serverOrderId in the object shape that updateOrderStatus expects.
            // Previously this was called as updateOrderStatus(id, status, serverOrderId)
            // where serverOrderId is a string — but the method signature is
            // updateOrderStatus(id, status, serverData: { serverId?, ... }).
            // Passing a plain string meant serverData?.serverId was always undefined
            // and the server ID was never saved to the local record.
            await indexedDBService.updateOrderStatus(
              order.id,
              "synced",
              serverOrderId ? { serverId: serverOrderId } : undefined
            );
            result.success++;
            console.log(`✅ Order ${order.code} synced (server ID: ${serverOrderId})`);
          } else {
            const errorMessage = response.message || "Server rejected order";
            console.error(`❌ Server rejected order ${order.code}:`, errorMessage);
            result.failed++;
            result.errors.push({ orderId: order.id, error: errorMessage });
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          console.error(`❌ Error syncing order ${order.code}:`, error);
          result.failed++;
          result.errors.push({ orderId: order.id || -1, error: errorMsg });
        }

        await this.delay(300);
      }

      console.log(`📊 Upload complete: ${result.success} succeeded, ${result.failed} failed`);
    } catch (error) {
      console.error("❌ Error in uploadPendingOrders:", error);
      result.errors.push({
        orderId: -1,
        error: error instanceof Error ? error.message : "Unknown upload error",
      });
    }

    return result;
  }

  private async downloadServerOrders(): Promise<void> {
    try {
      const response = await appService.getOrders({
        page: 1,
        pageSize: 500,
        search: "",
        payment_method: "all",
      });

      if (response.success && response.results && Array.isArray(response.results)) {
        const serverOrders = response.results;
        console.log(`📥 Found ${serverOrders.length} orders on server`);
        if (serverOrders.length > 0) {
          await indexedDBService.saveOrders(serverOrders);
          console.log(`💾 Saved ${serverOrders.length} server orders to local DB`);
        }
      }
    } catch (error) {
      console.error("❌ Error downloading server orders:", error);
    }
  }

  private validateOrder(order: DBOrder): { valid: boolean; error?: string } {
    if (!order.entity_id) return { valid: false, error: "Order missing entity_id" };
    if (!order.items || order.items.length === 0) return { valid: false, error: "Order has no items" };
    if (typeof order.total !== "number" || order.total <= 0) return { valid: false, error: "Order has invalid total" };
    if (!order.payment?.payment_method) return { valid: false, error: "Order missing payment method" };

    for (const item of order.items) {
      if (!item.product_id) return { valid: false, error: "Order item missing product_id" };
      if (!item.quantity_type || typeof item.quantity_type !== "string") return { valid: false, error: "Order item missing quantity_type" };
      if (typeof item.quantity !== "number" || item.quantity <= 0) return { valid: false, error: "Order item has invalid quantity" };
      if (typeof item.unit_price !== "number" || item.unit_price < 0) return { valid: false, error: "Order item has invalid unit_price" };
    }

    return { valid: true };
  }

  private prepareOrderForServer(order: DBOrder): any {
    return {
      cashier: order.cashier || "Unknown Cashier",
      customer: order.customer || "Walk-in Customer",
      total: Number(order.total.toFixed(2)),
      subtotal: order.subtotal ? Number(order.subtotal.toFixed(2)) : Number(order.total.toFixed(2)),
      discount: order.discount ? Number(order.discount.toFixed(2)) : 0,
      tendered_cash: order.tendered_cash
        ? Number(order.tendered_cash.toFixed(2))
        : Number(order.total.toFixed(2)),
      balance: order.balance ? Number(order.balance.toFixed(2)) : 0,
      balance_label: order.balance_label || (order.balance >= 0 ? "Change" : "Owings"),
      entity_id: order.entity_id,
      code: order.code,
      payment: {
        payment_method: order.payment?.payment_method || "Cash",
        amount_paid: order.payment?.amount_paid
          ? Number(order.payment.amount_paid.toFixed(2))
          : order.tendered_cash
          ? Number(order.tendered_cash.toFixed(2))
          : Number(order.total.toFixed(2)),
        transaction_id: order.payment?.transaction_id || "",
      },
      items: order.items.map((item: IOrderItem) => ({
        product_id: item.product_id,
        quantity: Number(item.quantity),
        quantity_type: item.quantity_type || "units",
        unit_price: Number(item.unit_price.toFixed(2)),
        price_per_piece: item.price_per_piece
          ? Number(item.price_per_piece.toFixed(2))
          : Number(item.unit_price.toFixed(2)),
        product_name: item.product_name || item.short_name || "Unknown Product",
        short_name: item.short_name || item.product_name || "Unknown",
        category_name: item.category_name || "Uncategorized",
        content_measurement: item.content_measurement || "",
        content_unit: item.content_unit || "",
        selling_unit_quantity: item.selling_unit_quantity || 1,
        selling_unit: item.selling_unit || "unit",
        image_url: item.image_url || "",
        image_alt: item.image_alt || item.short_name || "Product image",
      })),
      created_at: order.created_at || new Date().toISOString(),
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getSyncStatus(): { isSyncing: boolean } {
    return { isSyncing: this.isSyncing };
  }

  async manualSync(): Promise<{
    products: { success: boolean; count: number; error?: string };
    orders: SyncResults;
  }> {
    if (!networkService.isOnline()) throw new Error("No internet connection");
    if (this.isSyncing)             throw new Error("Sync already in progress");

    const productsResult = await this.syncProducts();
    const ordersResult   = await this.syncOrders();

    return { products: productsResult, orders: ordersResult };
  }

  async forceSyncOrder(localOrderId: number): Promise<{ success: boolean; error?: string }> {
    if (!networkService.isOnline()) return { success: false, error: "No internet connection" };
    if (this.isSyncing)             return { success: false, error: "Sync already in progress" };

    try {
      const ordersResponse = await indexedDBService.getPendingOrders();
      const order = ordersResponse.results?.find((o: { id: number }) => o.id === localOrderId);

      if (!order) {
        const allOrdersResponse = await indexedDBService.getAllOrders();
        const existingOrder = allOrdersResponse.results?.find((o: { id: number }) => o.id === localOrderId);
        if (existingOrder) {
          return {
            success: false,
            error: `Order is already ${existingOrder.status}. Server ID: ${existingOrder.server_id || "N/A"}`,
          };
        }
        return { success: false, error: "Order not found" };
      }

      this.isSyncing = true;
      const result = await this.syncSingleOrder(order);
      this.isSyncing = false;
      return result;
    } catch (error) {
      this.isSyncing = false;
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  private async syncSingleOrder(order: DBOrder): Promise<{ success: boolean; error?: string }> {
    console.log(`🔄 Force syncing order ${order.code} (ID: ${order.id})`);
    const serverOrder = this.prepareOrderForServer(order);
    const response = await appService.createOrder(serverOrder);

    if (response.success) {
      const serverOrderId = response.results?.id;
      // FIX: same fix as uploadPendingOrders — wrap in object
      await indexedDBService.updateOrderStatus(
        order.id!,
        "synced",
        serverOrderId ? { serverId: serverOrderId } : undefined
      );
      console.log(`✅ Order ${order.code} force-synced successfully`);
      return { success: true };
    }

    const errorMsg = response.message || "Server rejected order";
    console.error(`❌ Order ${order.code} force-sync failed:`, errorMsg);
    return { success: false, error: errorMsg };
  }

  startAutoSync(intervalMinutes = 5): void {
    if (this.syncInterval) clearInterval(this.syncInterval);

    const intervalMs = intervalMinutes * 60 * 1000;
    this.syncInterval = setInterval(async () => {
      if (networkService.isOnline() && !this.isSyncing) {
        try {
          await this.syncProducts();
          await this.syncOrders();
        } catch (error) {
          console.error("Auto-sync error:", error);
        }
      }
    }, intervalMs);

    console.log(`🔄 Auto-sync started (every ${intervalMinutes} minutes)`);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log("⏹️ Auto-sync stopped");
    }
  }

  destroy(): void {
    this.stopAutoSync();
  }
}

export const syncService = new SyncService();