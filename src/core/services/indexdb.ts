export interface DBProduct {
  id: string;
  short_name?: string; 
  name: string;
  category_name: string;
  stock: number;
  price: number;
  is_available: boolean;
  image_url?: string;
  image_alt?: string;
  content_measurement: string;
  content_unit: string;
  selling_unit_quantity: number;
  selling_unit: string;
  last_synced: string;
  entity_id: string; 
}

export interface DBOrderItem {
  id?: string; // uuidv4 for the item itself
  order_id?: string; // The server's UUID for the parent order (set during sync)
  product_id: string;
  quantity: number;
  unit_price: number; // Server uses unit_price for the price of one selling unit at time of sale
  product_name: string;
  short_name: string;
  category_name: string;
  content_measurement: string;
  content_unit: string;
  selling_unit_quantity: number;
  selling_unit: string;
  image_url?: string;
  image_alt?: string;
}

// Corresponds to server's 'paymentSchema'
export interface DBPayment {
  payment_method: string;
  amount_paid: number;
  reference_id?: string;
}

// Corresponds to server's 'orderSchema'
export interface DBOrder {
  // Local IndexedDB Key (autoIncrement)
  id?: number; 

  // Fields that align directly with the server's orderSchema
  server_id?: string; // <-- FIX: Stores the server's UUID ('id' on server) after sync
  code?: string; // Server-generated code
  cashier: string | null;
  customer: string | null; // Server uses string (ID or name)
  total: number;
  subtotal: number;
  discount: number;
  tendered_cash: number;
  balance: number;
  balance_label?: string;
  items: DBOrderItem[]; // Array of DBOrderItem
  payment: DBPayment;    // Single DBPayment object
  entity_id?: string;

  // Client-side synchronization fields
  status: 'pending' | 'synced' | 'failed';
  created_at: string;
  synced_at?: string;
}

export interface ProductsResponse {
  success: boolean;
  results: DBProduct[];
  message: string;
  next: string | null;
  count: number;
  previous: string | null;
}

export interface OrderResponse {
  success: boolean;
  server_id?: string; // Use server_id for clarity
  message?: string;
}

class IndexedDBService {
  private dbName = 'GodDidMart';
  private version = 2;
  private db: IDBDatabase | null = null;
  private readonly pageSize = 10;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productsStore = db.createObjectStore('products', { keyPath: 'id' });
          productsStore.createIndex('category_name', 'category_name', { unique: false });
          productsStore.createIndex('last_synced', 'last_synced', { unique: false });
          // Note: Full text search in IDB is usually done by iterating and filtering (as you are doing)
          // or using a library like lunr.js. This index only helps with prefix matching.
          productsStore.createIndex('search_index', ['short_name', 'name'], { unique: false }); 
          productsStore.createIndex('entity_id', 'entity_id', { unique: false });
        }

        // Orders store
        if (!db.objectStoreNames.contains('orders')) {
          const ordersStore = db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
          ordersStore.createIndex('status', 'status', { unique: false });
          ordersStore.createIndex('created_at', 'created_at', { unique: false });
          ordersStore.createIndex('entity_id', 'entity_id', { unique: false });
        }

        // Sync metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          const metadataStore = db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // --- Product methods ---

  async getProducts(params: {
    page?: number;
    search?: string;
    category?: string;
    pageSize?: number;
  }): Promise<ProductsResponse> {
    const db = await this.ensureDB();
    const {
      page = 1,
      search = '',
      category = 'All',
      pageSize = this.pageSize
    } = params;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const request = store.getAll();

      request.onsuccess = () => {
        let products = request.result;

        // Apply search filter (Manual filtering is correct for IDB)
        if (search.trim()) {
          const searchLower = search.toLowerCase().trim();
          products = products.filter((p: DBProduct) =>
            (p.short_name?.toLowerCase()?.includes(searchLower) || p.short_name === undefined) ||
            p.name.toLowerCase().includes(searchLower) ||
            p.category_name.toLowerCase().includes(searchLower)
          );
        }

        // Apply category filter
        if (category && category !== 'All') {
          products = products.filter((p: DBProduct) => p.category_name === category);
        }

        // Apply pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedProducts = products.slice(startIndex, endIndex);
        const hasNext = endIndex < products.length;

        const response: ProductsResponse = {
          success: true,
          message: 'Products fetched successfully',
          results: paginatedProducts,
          next: hasNext ? `page=${page + 1}` : null,
          count: products.length,
          previous: page > 1 ? `page=${page - 1}` : null
        };

        resolve(response);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getProductById(id: string): Promise<DBProduct | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveProducts(products: DBProduct[]): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readwrite');
      const store = transaction.objectStore('products');
      
      products.forEach(product => {
        // Ensure all required fields are present before saving, 
        // including the now-required entity_id.
        if (!product.entity_id) {
          console.warn('Skipping product due to missing entity_id:', product.id);
          return; 
        }

        store.put({
          ...product,
          last_synced: new Date().toISOString()
        });
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async clearProducts(): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readwrite');
      const store = transaction.objectStore('products');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Order methods ---

  // Input data must now match the DBOrder structure (minus auto-generated fields)
  async createOrder(
    orderData: Omit<
      DBOrder, 
      'id' | 'status' | 'created_at' | 'synced_at' | 'code' | 'server_id'
    >
  ): Promise<OrderResponse> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      
      const order: Omit<DBOrder, 'id'> = {
        ...orderData,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const request = store.add(order);

      request.onsuccess = () => {
        resolve({
          success: true,
          message: 'Order saved locally'
        });
      };
      transaction.onerror = (event) => reject(transaction.error || (event.target as IDBRequest).error);
    });
  }

  async getPendingOrders(): Promise<DBOrder[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['orders'], 'readonly');
      const store = transaction.objectStore('orders');
      const statusIndex = store.index('status');
      const request = statusIndex.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // serverUuid is the server's generated UUID (the 'id' field on your server schema)
  async updateOrderStatus(orderId: number, status: DBOrder['status'], serverUuid?: string, serverCode?: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise(async (resolve, reject) => {
      const transaction = db.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      
      const getRequest = store.get(orderId);
      
      getRequest.onsuccess = () => {
        const order = getRequest.result as DBOrder;
        if (!order) {
          reject(new Error('Order not found'));
          return;
        }

        const updatedOrder = {
          ...order,
          status,
          synced_at: status === 'synced' ? new Date().toISOString() : order.synced_at,
          server_id: serverUuid || order.server_id, // <-- FIX: Store server's UUID
          code: serverCode || order.code // Store server's generated code
        };

        const putRequest = store.put(updatedOrder);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = (event) => reject((event.target as IDBRequest).error);
      };

      getRequest.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  // --- Metadata methods (No changes needed) ---

  async setMetadata(key: string, value: any): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMetadata(key: string): Promise<any> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Utility methods (No changes needed) ---
  
  async getLastSyncTime(): Promise<string | null> {
    return this.getMetadata('last_product_sync');
  }

  async setLastSyncTime(): Promise<void> {
    await this.setMetadata('last_product_sync', new Date().toISOString());
  }

  async getDatabaseSize(): Promise<number> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products', 'orders'], 'readonly');
      const productsStore = transaction.objectStore('products');
      const ordersStore = transaction.objectStore('orders');
      
      const productsRequest = productsStore.count();
      const ordersRequest = ordersStore.count();
      
      let productCount = 0;
      let orderCount = 0;
      let completed = 0;
      
      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          resolve(productCount + orderCount);
        }
      };
      
      productsRequest.onsuccess = () => {
        productCount = productsRequest.result;
        checkComplete();
      };
      
      ordersRequest.onsuccess = () => {
        orderCount = ordersRequest.result;
        checkComplete();
      };
      
      productsRequest.onerror = (event) => reject((event.target as IDBRequest).error);
      ordersRequest.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }
}

export const indexedDBService = new IndexedDBService();