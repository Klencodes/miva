import { ENTITY_KEY, getStoredItem } from "../hooks/useStore";
import { DBProduct, ProductsResponse, DBOrder, DBCustomer, CustomerResponse } from "../interfaces/IDBTypes";
import { IEntityItem } from "../interfaces/IEntity";
import { IResponse } from "../interfaces/IResponse";

class IndexedDBService {
  private dbName = 'GodDidMart';
  private version = 5; // Increased version to trigger upgrade
  private db: IDBDatabase | null = null;
  private readonly pageSize = 10;

  // FIX: Make entityId a getter that always gets fresh value
  private get entityIdString(): string | null {
    const entity = getStoredItem<IEntityItem | null>(ENTITY_KEY, null);
    return entity?.id || null;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(request.error);
      };
      
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
          productsStore.createIndex('entity_id', 'entity_id', { unique: false });
        } else {
          // Clear existing data during upgrade to ensure clean state
          const transaction = (event.target as IDBOpenDBRequest).transaction;
          if (transaction) {
            const productsStore = transaction.objectStore('products');
            productsStore.clear();
          }
        }

        // Orders store
        if (!db.objectStoreNames.contains('orders')) {
          const ordersStore = db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
          ordersStore.createIndex('status', 'status', { unique: false });
          ordersStore.createIndex('created_at', 'created_at', { unique: false });
          ordersStore.createIndex('entity_id', 'entity_id', { unique: false });
        } else {
          // Clear existing orders during upgrade
          const transaction = (event.target as IDBOpenDBRequest).transaction;
          if (transaction) {
            const ordersStore = transaction.objectStore('orders');
            ordersStore.clear();
          }
        }

        // Customers store
        if (!db.objectStoreNames.contains('customers')) {
          const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
          customersStore.createIndex('status', 'status', { unique: false });
          customersStore.createIndex('full_name', 'full_name', { unique: false });
          customersStore.createIndex('entity_id', 'entity_id', { unique: false });
        } else {
          // Keep existing data, but ensure indexes exist if this is an older version upgrade
          const transaction = (event.target as IDBOpenDBRequest).transaction;
          if (transaction) {
            const customersStore = transaction.objectStore('customers');
            if (!customersStore.indexNames.contains('status')) {
              customersStore.createIndex('status', 'status', { unique: false });
            }
            if (!customersStore.indexNames.contains('full_name')) {
              customersStore.createIndex('full_name', 'full_name', { unique: false });
            }
            if (!customersStore.indexNames.contains('entity_id')) {
              customersStore.createIndex('entity_id', 'entity_id', { unique: false });
            }
          }
        }
        // Sync metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };

      request.onblocked = () => {
        console.warn('IndexedDB opening blocked');
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

  async saveProducts(products: DBProduct[]): Promise<void> {
    const db = await this.ensureDB();
    const entityId = this.entityIdString;

    if (!entityId) {
      throw new Error('Entity ID is required to save products');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readwrite');
      const store = transaction.objectStore('products');
      // eslint-disable-next-line
      let savedCount = 0;
      // eslint-disable-next-line
      let skippedCount = 0;

      products.forEach(product => {
        // FIX: Enhanced entity validation
        if (product.entity_id !== entityId) {
          skippedCount++;
          return;
        }

        const productToSave = {
          ...product,
          last_synced: new Date().toISOString()
        };

        const request = store.put(productToSave);
        request.onsuccess = () => {
          savedCount++;
        };
      });

      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = (event) => {
        reject(transaction.error);
      };
    });
  }

  async getProducts(params: {
    page?: number;
    search?: string;
    category?: string;
    pageSize?: number;
  }): Promise<ProductsResponse> {
    const db = await this.ensureDB();
    const entityId = this.entityIdString;

    if (!entityId) {
      return {
        success: false,
        results: [],
        message: 'Entity ID not found',
        next: null,
        count: 0,
        previous: null
      };
    }

    const {
      page = 1,
      search = '',
      category = 'All',
      pageSize = this.pageSize
    } = params;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const entityIndex = store.index('entity_id');
      
      const request = entityIndex.getAll(IDBKeyRange.only(entityId));

      request.onsuccess = () => {
        let products = request.result as DBProduct[];

        // Apply search filter
        if (search.trim()) {
          const searchLower = search.toLowerCase().trim();
          products = products.filter((p: DBProduct) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.short_name?.toLowerCase().includes(searchLower) ||
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

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getProductById(id: string): Promise<DBProduct | null> {
    const db = await this.ensureDB();
    const entityId = this.entityIdString;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const request = store.get(id);

      request.onsuccess = () => {
        const product = request.result as DBProduct | undefined;
        if (product && product.entity_id === entityId) {
          resolve(product);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearProducts(): Promise<void> {
    const db = await this.ensureDB();
    const entityId = this.entityIdString;

    if (!entityId) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readwrite');
      const store = transaction.objectStore('products');
      const entityIndex = store.index('entity_id');
      const request = entityIndex.openCursor(IDBKeyRange.only(entityId));
      // eslint-disable-next-line
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  }

/**
 * ================================================================
 * @param orders 
 * @returns 
 * ================================================================
 */



// Update the createOrder method to ensure pending status
async createOrder(orderData: Omit<DBOrder, 'id' | 'status' | 'created_at'>): Promise<IResponse> {
  const db = await this.ensureDB();
  const entityId = this.entityIdString;

  if (!entityId) {
    return {
      success: false,
      message: 'Entity ID is required to create an order',
      results: null,
      count: 0,
      next: null,
      previous: null
    };
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['orders'], 'readwrite');
    const store = transaction.objectStore('orders');

    // Create the order with pending status and timestamp
    const orderToSave: Omit<DBOrder, 'id'> = {
      ...orderData,
      entity_id: entityId, // Ensure entity_id is set
      status: 'pending', // Always set to pending for new orders
      created_at: new Date().toISOString(),
      synced_at: undefined // Clear sync timestamp for new orders
    };

    const request = store.add(orderToSave);

    request.onsuccess = () => {
      const savedOrder: DBOrder = {
        ...orderToSave,
        id: request.result as number
      };      
      resolve({ 
        success: true, 
        results: savedOrder, 
        message: 'Order created successfully and pending sync',
        count: 1,
        next: null,
        previous: null
      });
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Update the saveOrders method to preserve pending status
async saveOrders(orders: DBOrder[]): Promise<void> {
  const db = await this.ensureDB();
  const entityId = this.entityIdString;

  if (!entityId) {
    throw new Error('Entity ID is required to save orders');
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['orders'], 'readwrite');
    const store = transaction.objectStore('orders');
    
    let savedCount = 0;
    // eslint-disable-next-line
    let skippedCount = 0;

    orders.forEach(order => {
      // Only save orders that belong to current entity
      if (order.entity_id !== entityId) {
        skippedCount++;
        return;
      }

      // Preserve the existing status when saving orders from server
      // If no status is provided, default to 'synced' for server orders
      const orderToSave: DBOrder = {
        ...order,
        status: order.status || 'synced',
        entity_id: entityId,
        synced_at: new Date().toISOString()
      };

      const request = store.put(orderToSave);
      request.onsuccess = () => savedCount++;
      request.onerror = () => {
        console.error(`Failed to save order: ${order.code || order.id}`, request.error);
      };
    });

    transaction.oncomplete = () => {
      resolve();
    };
    
    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

// Update getAllOrders to properly handle mixed status orders
async getAllOrders(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  payment_method?: string;
  includePending?: boolean; // New parameter to include pending orders
}): Promise<IResponse> {
  const db = await this.ensureDB();
  const entityId = this.entityIdString;

  if (!entityId) {
    return { 
      results: [], 
      count: 0, 
      success: false, 
      message: 'Entity ID not found', 
      next: null, 
      previous: null 
    };
  }

  const {
    page = 1,
    pageSize = 10,
    search = '',
    payment_method = 'all',
    includePending = true // Default to including pending orders
  } = params || {};

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['orders'], 'readonly');
    const store = transaction.objectStore('orders');
    const entityIndex = store.index('entity_id');
    
    const request = entityIndex.getAll(IDBKeyRange.only(entityId));

    request.onsuccess = () => {
      let orders = request.result as DBOrder[];

      // Filter out pending orders if not included
      if (!includePending) {
        orders = orders.filter(order => order.status !== 'pending');
      }

      // Apply search filter
      if (search.trim()) {
        const searchLower = search.toLowerCase().trim();
        orders = orders.filter((order: DBOrder) =>
          order.code?.toLowerCase().includes(searchLower) ||
          order.customer?.toLowerCase().includes(searchLower) ||
          order.cashier?.toLowerCase().includes(searchLower)
        );
      }

      // Apply payment method filter
      if (payment_method && payment_method !== 'all') {
        orders = orders.filter((order: DBOrder) => 
          order.payment?.payment_method === payment_method
        );
      }

      // Sort by creation date (newest first)
      orders.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedOrders = orders.slice(startIndex, endIndex);
      const hasMore = endIndex < orders.length;

      // Count pending orders for information
      const pendingCount = orders.filter(order => order.status === 'pending').length;

      resolve({
        success: true,
        message: `Orders fetched successfully${pendingCount > 0 ? ` (${pendingCount} pending sync)` : ''}`,
        results: paginatedOrders,
        count: orders.length,
        next: hasMore ? `page=${page + 1}` : null,
        previous: page > 1 ? `page=${page - 1}` : null
      });
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}
// Add this method to your IndexedDB service
async getPendingOrders(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  payment_method?: string;
}): Promise<IResponse> {
  const db = await this.ensureDB();
  const entityId = this.entityIdString;

  if (!entityId) {
    return { 
      success: false, 
      message: 'Entity ID not found', 
      results: [], 
      count: 0, 
      next: null, 
      previous: null 
    };
  }

  const {
    page = 1,
    pageSize = 1000,
    search = '',
    payment_method = 'all'
  } = params || {};

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['orders'], 'readonly');
    const store = transaction.objectStore('orders');
    const statusIndex = store.index('status');
    
    const request = statusIndex.getAll(IDBKeyRange.only('pending'));

    request.onsuccess = () => {
      let orders = request.result as DBOrder[];

      // Filter by entity ID
      orders = orders.filter(order => order.entity_id === entityId);

      // Apply search filter
      if (search.trim()) {
        const searchLower = search.toLowerCase().trim();
        orders = orders.filter((order: DBOrder) =>
          order.code?.toLowerCase().includes(searchLower) ||
          order.customer?.toLowerCase().includes(searchLower) ||
          order.cashier?.toLowerCase().includes(searchLower)
        );
      }

      // Apply payment method filter
      if (payment_method && payment_method !== 'all') {
        orders = orders.filter((order: DBOrder) => 
          order.payment?.payment_method === payment_method
        );
      }

      // Sort by creation date (newest first)
      orders.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedOrders = orders.slice(startIndex, endIndex);
      const hasMore = endIndex < orders.length;

      resolve({
        success: true,
        message: 'Pending orders fetched successfully',
        results: paginatedOrders,
        count: orders.length,
        next: hasMore ? `page=${page + 1}` : null,
        previous: page > 1 ? `page=${page - 1}` : null
      });
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Also add a method to count pending orders
async getPendingOrdersCount(): Promise<number> {
  const db = await this.ensureDB();
  const entityId = this.entityIdString;

  if (!entityId) {
    return 0;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['orders'], 'readonly');
    const store = transaction.objectStore('orders');
    const statusIndex = store.index('status');
    
    const request = statusIndex.getAll(IDBKeyRange.only('pending'));

    request.onsuccess = () => {
      const orders = request.result as DBOrder[];
      const entityOrders = orders.filter(order => order.entity_id === entityId);
      resolve(entityOrders.length);
    };

    request.onerror = () => reject(request.error);
  });
}

async cleanupOldOrders(retentionHours: number = 24): Promise<number> {
  const db = await this.ensureDB();
  const entityId = this.entityIdString;

  if (!entityId) {
    return 0;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['orders'], 'readwrite');
    const store = transaction.objectStore('orders');
    const entityIndex = store.index('entity_id');
    
    const request = entityIndex.openCursor(IDBKeyRange.only(entityId));

    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - retentionHours);
    
    let deletedCount = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const order = cursor.value as DBOrder;
        const orderDate = new Date(order.created_at || ''); // Provide a default empty string if created_at is undefined
        
        // Delete orders older than retention period AND already synced
        if (order.status === 'synced' && orderDate < cutoffTime) {
          cursor.delete();
          deletedCount++;
        }
        cursor.continue();
      } else {
        resolve(deletedCount);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

// Update the updateOrderStatus method to include server_created_at
async updateOrderStatus(
  orderId: number, 
  status: DBOrder['status'], 
  serverUuid?: string, 
  serverCode?: string,
  serverCreatedAt?: string
): Promise<void> {
  const db = await this.ensureDB();
  const entityId = this.entityIdString;

  return new Promise(async (resolve, reject) => {
    const transaction = db.transaction(['orders'], 'readwrite');
    const store = transaction.objectStore('orders');
    
    const getRequest = store.get(orderId);
    
    getRequest.onsuccess = () => {
      const order = getRequest.result as DBOrder;
      
      if (!order || order.entity_id !== entityId) {
        reject(new Error(`Order not found or entity mismatch`));
        return;
      }

      const updatedOrder: DBOrder = {
        ...order,
        status,
        synced_at: status === 'synced' ? new Date().toISOString() : order.synced_at,
        server_id: serverUuid || order.server_id,
        code: serverCode || order.code,
        server_created_at: serverCreatedAt || order.server_created_at
      };

      const putRequest = store.put(updatedOrder);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
   * Save a single customer to IndexedDB.
   * Used for offline creation (status: 'pending') or server sync (status: 'synced').
   * @param customerData The customer object. If it's a new offline customer, pass a UUID/local ID for `id` or omit it and it will be generated.
   */
  async saveCustomer(customerData: Omit<DBCustomer, 'created_at' | 'entity_id'> & { created_at?: string, entity_id?: string }): Promise<DBCustomer> {
    const db = await this.ensureDB();
    const entityId = this.entityIdString;

    if (!entityId) {
      throw new Error('Entity ID is required to save a customer');
    }

    // Determine ID and default to a local ID if not provided and status is pending
    const customerId = customerData.id || (customerData.status === 'pending' ? this.generateLocalId() : customerData.id);
    if (!customerId) {
       throw new Error('Customer ID is required for saving.');
    }

    const customerToSave: DBCustomer = {
      ...customerData as DBCustomer,
      id: customerId,
      created_at: customerData.created_at || new Date().toISOString(),
      status: customerData.status || 'synced',
      synced_at: customerData.status === 'synced' ? new Date().toISOString() : undefined,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['customers'], 'readwrite');
      const store = transaction.objectStore('customers');
      
      const request = store.put(customerToSave);

      request.onsuccess = () => {
        resolve(customerToSave);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Bulk save customers (used for server synchronization).
   * @param customers An array of DBCustomer objects (usually with status: 'synced').
   */
  async bulkSaveCustomers(customers: DBCustomer[]): Promise<void> {
    const db = await this.ensureDB();
    const entityId = this.entityIdString;

    if (!entityId) {
      throw new Error('Entity ID is required for bulk saving customers');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['customers'], 'readwrite');
      const store = transaction.objectStore('customers');
      
      let savedCount = 0;

      customers.forEach(customer => {
    
        const customerToSave: DBCustomer = {
          ...customer,
          status: customer.status || 'synced',
          synced_at: new Date().toISOString(),
        };

        const request = store.put(customerToSave);
        request.onsuccess = () => savedCount++;
        request.onerror = () => {
          console.error(`Failed to bulk save customer: ${customer.id}`, request.error);
        };
      });

      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = (event) => {
        reject(transaction.error);
      };
    });
  }

  /**
   * Fetch customers from IndexedDB with optional search/pagination.
   */
  async getCustomers(): Promise<CustomerResponse> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['customers'], 'readonly');
      const store = transaction.objectStore('customers');
      
      const request = store.getAll();

      request.onsuccess = () => {
        let customers = request.result as DBCustomer[];       

        // Sort by creation date (newest first)
        customers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        
        const results: DBCustomer[] = customers.map(c => ({
            id: c.server_id || c.id, 
            full_name: c.full_name,
            phone_number: c.phone_number,
            address: c.address,
            email: c.email,
            created_at: c.created_at,
            updated_at: c.updated_at,
            status: c.status,
        }));

        const response: CustomerResponse = {
          success: true,
          message: 'Customers fetched successfully from local storage',
          results: results,
          count: customers.length,
        };

        resolve(response);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get all customers that are pending synchronization.
   */
  async getPendingCustomers(): Promise<DBCustomer[]> {
    const db = await this.ensureDB();
    const entityId = this.entityIdString;

    if (!entityId) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['customers'], 'readonly');
      const store = transaction.objectStore('customers');
      const statusIndex = store.index('status');
      
      const request = statusIndex.getAll(IDBKeyRange.only('pending'));

      request.onsuccess = () => {
        const customers = request.result as DBCustomer[];
      
        resolve(customers);
      };

      request.onerror = () => reject(request.error);
    });
  }



  private generateLocalId(): string {
    return `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  // --- Metadata methods ---

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

  // --- Utility methods ---
  
  async getLastSyncTime(): Promise<string | null> {
    return this.getMetadata('last_product_sync');
  }

  async setLastSyncTime(): Promise<void> {
    await this.setMetadata('last_product_sync', new Date().toISOString());
  }
  
  async getDatabaseSize(): Promise<number> {
    const db = await this.ensureDB();
    const entityId = this.entityIdString;
    
    if (!entityId) return 0;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products', 'orders'], 'readonly');
      
      const productsStore = transaction.objectStore('products');
      const ordersStore = transaction.objectStore('orders');
      
      const productsIndex = productsStore.index('entity_id');
      const ordersIndex = ordersStore.index('entity_id');
      
      const productsRequest = productsIndex.count(IDBKeyRange.only(entityId));
      const ordersRequest = ordersIndex.count(IDBKeyRange.only(entityId));
      
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

  // FIX: Add method to check if DB is ready
  isReady(): boolean {
    return this.db !== null;
  }

  // FIX: Add method to close DB (useful for cleanup)
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const indexedDBService = new IndexedDBService();