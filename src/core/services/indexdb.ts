import { ENTITY_KEY, getStoredItem } from "../hooks/useStore";
import { DBProduct, ProductsResponse, DBOrder, DBCustomer, CustomerResponse } from "../interfaces/IDBTypes";
import { IEntityItem } from "../interfaces/IEntity";
import { IOrder } from "../interfaces/IOrder";
import { IResponse } from "../interfaces/IResponse";

class IndexedDBService {
  private dbName = 'GodDidMart';
  private version = 9; // Incremented version for new hold_orders store
  private db: IDBDatabase | null = null;
  private readonly pageSize = 10;

  private get entityIdString(): string | null {
    const entity = getStoredItem<IEntityItem | null>(ENTITY_KEY, null);
    return entity?.id || null;
  }

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
        const transaction = (event.target as IDBOpenDBRequest).transaction;

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productsStore = db.createObjectStore('products', { keyPath: 'id' });
          productsStore.createIndex('category_name', 'category_name', { unique: false });
          productsStore.createIndex('last_synced', 'last_synced', { unique: false });
          productsStore.createIndex('entity_id', 'entity_id', { unique: false });
        }

        // Orders store (regular orders for sync)
        if (!db.objectStoreNames.contains('orders')) {
          const ordersStore = db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
          ordersStore.createIndex('status', 'status', { unique: false });
          ordersStore.createIndex('created_at', 'created_at', { unique: false });
          ordersStore.createIndex('entity_id', 'entity_id', { unique: false });
          ordersStore.createIndex('server_id', 'server_id', { unique: false });
        } else if (transaction) {
          // Ensure server_id index exists for existing stores
          const ordersStore = transaction.objectStore('orders');
          if (!ordersStore.indexNames.contains('server_id')) {
            ordersStore.createIndex('server_id', 'server_id', { unique: false });
          }
        }

        // HOLD ORDERS store - Separate store for local hold orders only
        if (!db.objectStoreNames.contains('hold_orders')) {
          const holdOrdersStore = db.createObjectStore('hold_orders', { keyPath: 'id', autoIncrement: true });
          holdOrdersStore.createIndex('status', 'status', { unique: false });
          holdOrdersStore.createIndex('created_at', 'created_at', { unique: false });
          holdOrdersStore.createIndex('entity_id', 'entity_id', { unique: false });
          holdOrdersStore.createIndex('code', 'code', { unique: true });
        }

        // Customers store
        if (!db.objectStoreNames.contains('customers')) {
          const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
          customersStore.createIndex('status', 'status', { unique: false });
          customersStore.createIndex('full_name', 'full_name', { unique: false });
          customersStore.createIndex('entity_id', 'entity_id', { unique: false });
        }

        // Sync metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
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

  // ============= HOLD ORDERS METHODS (LOCAL ONLY - NO SYNC) =============

  // Create a hold order (local only, never synced)
  async createHoldOrder(holdOrderData: Omit<DBOrder, 'id' | 'status' | 'created_at' | 'server_id' | 'synced_at' | 'server_created_at'>): Promise<IResponse> {
    const db = await this.ensureDB();
    const entityId = this.entityIdString;

    if (!entityId) {
      return {
        success: false,
        message: 'Entity ID is required to create a hold order',
        results: null,
        count: 0,
        next: null,
        previous: null
      };
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['hold_orders'], 'readwrite');
      const store = transaction.objectStore('hold_orders');

      const orderToSave: Omit<DBOrder, 'id'> = {
        ...holdOrderData,
        entity_id: entityId,
        status: 'hold', // Special status for hold orders
        created_at: new Date().toISOString(),
        synced_at: undefined,
        server_id: undefined,
        server_created_at: undefined
      };


      const request = store.add(orderToSave);

      request.onsuccess = () => {
        const savedOrder: DBOrder = {
          ...orderToSave,
          id: request.result as number // Local auto-increment ID
        };
        
        
        resolve({ 
          success: true, 
          results: savedOrder, 
          message: 'Hold order created successfully',
          count: 1,
          next: null,
          previous: null
        });
      };

      request.onerror = (event) => {
        console.error('❌ Failed to save hold order:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  // Get all hold orders
  async getHoldOrders(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
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
      pageSize = 100, // Default to show all hold orders
      search = ''
    } = params || {};

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['hold_orders'], 'readonly');
      const store = transaction.objectStore('hold_orders');
      const entityIndex = store.index('entity_id');
      
      const request = entityIndex.getAll(IDBKeyRange.only(entityId));

      request.onsuccess = () => {
        let holdOrders = request.result as DBOrder[];

        // Apply search filter if provided
        if (search.trim()) {
          const searchLower = search.toLowerCase().trim();
          holdOrders = holdOrders.filter((order: DBOrder) =>
            order.code?.toLowerCase().includes(searchLower) ||
            order.customer?.toLowerCase().includes(searchLower) ||
            order.cashier?.toLowerCase().includes(searchLower)
          );
        }

        // Sort by creation date (newest first)
        holdOrders.sort((a, b) => {
          const dateA = new Date(a.created_at || '').getTime();
          const dateB = new Date(b.created_at || '').getTime();
          return dateB - dateA; // Newest first
        });

        // Apply pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedOrders = holdOrders.slice(startIndex, endIndex);
        const hasMore = endIndex < holdOrders.length;

        resolve({
          success: true,
          message: `Hold orders fetched successfully`,
          results: paginatedOrders,
          count: holdOrders.length,
          next: hasMore ? `page=${page + 1}` : null,
          previous: page > 1 ? `page=${page - 1}` : null
        });
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get a single hold order by ID
  async getHoldOrderById(id: number): Promise<IResponse> {
    const db = await this.ensureDB();
    const entityId = this.entityIdString;

    if (!entityId) {
      return { 
        success: false, 
        message: 'Entity ID not found', 
        results: null, 
        count: 0, 
        next: null, 
        previous: null 
      };
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['hold_orders'], 'readonly');
      const store = transaction.objectStore('hold_orders');
      const request = store.get(id);

      request.onsuccess = () => {
        const holdOrder = request.result as DBOrder | undefined;
        
        if (holdOrder && holdOrder.entity_id === entityId) {
          resolve({
            success: true,
            message: 'Hold order found',
            results: holdOrder,
            count: 1,
            next: null,
            previous: null
          });
        } else {
          resolve({
            success: false,
            message: 'Hold order not found',
            results: null,
            count: 0,
            next: null,
            previous: null
          });
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Delete a hold order
  async deleteHoldOrder(id: number): Promise<IResponse> {
    const db = await this.ensureDB();
    const entityId = this.entityIdString;

    if (!entityId) {
      return { 
        success: false, 
        message: 'Entity ID not found', 
        results: null, 
        count: 0, 
        next: null, 
        previous: null 
      };
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['hold_orders'], 'readwrite');
      const store = transaction.objectStore('hold_orders');
      
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const holdOrder = getRequest.result as DBOrder | undefined;
        
        if (!holdOrder) {
          resolve({
            success: false,
            message: 'Hold order not found',
            results: null,
            count: 0,
            next: null,
            previous: null
          });
          return;
        }

        if (holdOrder.entity_id !== entityId) {
          resolve({
            success: false,
            message: 'Hold order does not belong to current entity',
            results: null,
            count: 0,
            next: null,
            previous: null
          });
          return;
        }

        const deleteRequest = store.delete(id);
        
        deleteRequest.onsuccess = () => {
          resolve({
            success: true,
            message: 'Hold order deleted successfully',
            results: { id },
            count: 1,
            next: null,
            previous: null
          });
        };

        deleteRequest.onerror = () => {
          resolve({
            success: false,
            message: 'Failed to delete hold order',
            results: null,
            count: 0,
            next: null,
            previous: null
          });
        };
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  // Count hold orders
  async countHoldOrders(): Promise<IResponse> {
    const db = await this.ensureDB();
    const entityId = this.entityIdString;

    if (!entityId) {
      return { 
        success: false, 
        message: 'Entity ID not found', 
        results: null, 
        count: 0, 
        next: null, 
        previous: null 
      };
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['hold_orders'], 'readonly');
      const store = transaction.objectStore('hold_orders');
      const entityIndex = store.index('entity_id');
      
      const request = entityIndex.count(IDBKeyRange.only(entityId));

      request.onsuccess = () => {
        resolve({
          success: true,
          message: 'Hold orders counted',
          results: { count: request.result },
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

  // Clear all hold orders for current entity
  async clearHoldOrders(): Promise<IResponse> {
    const db = await this.ensureDB();
    const entityId = this.entityIdString;

    if (!entityId) {
      return { 
        success: false, 
        message: 'Entity ID not found', 
        results: null, 
        count: 0, 
        next: null, 
        previous: null 
      };
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['hold_orders'], 'readwrite');
      const store = transaction.objectStore('hold_orders');
      const entityIndex = store.index('entity_id');
      
      const request = entityIndex.openCursor(IDBKeyRange.only(entityId));

      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve({
            success: true,
            message: `Cleared ${deletedCount} hold orders`,
            results: { deletedCount },
            count: 1,
            next: null,
            previous: null
          });
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // ============= REGULAR ORDERS METHODS (FOR SYNC) =============

  // Create a regular order (for sync)
  async createOrder(orderData: Omit<DBOrder, 'id' | 'status' | 'created_at' | 'server_id'>): Promise<IResponse> {
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

      const orderToSave: Omit<DBOrder, 'id'> = {
        ...orderData,
        entity_id: entityId,
        status: 'pending', // Will be synced to server
        created_at: new Date().toISOString(),
        synced_at: undefined,
        server_id: undefined,
        server_created_at: undefined
      };


      const request = store.add(orderToSave);

      request.onsuccess = () => {
        const savedOrder: DBOrder = {
          ...orderToSave,
          id: request.result as number // Local auto-increment ID
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
        console.error('❌ Failed to save order:', request.error);
        reject(request.error);
      };
    });
  }

  // Get all regular orders (local pending + server synced) - NO hold orders
  async getAllOrders(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    payment_method?: string;
    includePending?: boolean;
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
      pageSize = 10,
      search = '',
      payment_method = 'all',
      includePending = true
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
        orders.sort((a, b) => {
          const dateA = new Date(a.created_at || '').getTime();
          const dateB = new Date(b.created_at || '').getTime();
          return dateB - dateA;
        });

        // Apply pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedOrders = orders.slice(startIndex, endIndex);
        const hasMore = endIndex < orders.length;

        // Count orders by status for informative message
        const pendingCount = orders.filter(o => o.status === 'pending').length;
        const syncedCount = orders.filter(o => o.status === 'synced').length;

        resolve({
          success: true,
          message: `Orders fetched (${syncedCount} synced, ${pendingCount} pending)`,
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

  // Save orders from server (with server IDs)
// First, let's add a utility function to properly handle the id field
private prepareOrderForSave(order: IOrder, existingOrder?: DBOrder): any {
  // Create the base object without id
  const orderData: any = {
    ...order,
    server_id: order.id,
    status: 'synced',
    synced_at: new Date().toISOString(),
    server_created_at: order.created_at
  };

  // Only add id if it exists and is valid
  if (existingOrder?.id !== undefined && existingOrder?.id !== null) {
    orderData.id = existingOrder.id;
  }
  
  return orderData;
}

// Then update the saveOrders method:
async saveOrders(orders: IOrder[]): Promise<void> {
  const db = await this.ensureDB();
  const entityId = this.entityIdString;

  if (!entityId) {
    throw new Error('Entity ID is required to save orders');
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['orders'], 'readwrite');
    const store = transaction.objectStore('orders');
    // eslint-disable-next-line 
    let savedCount = 0;
    // eslint-disable-next-line 
    let skippedCount = 0;
    // eslint-disable-next-line 
    let errorCount = 0;

    const processNextOrder = async (index: number) => {
      if (index >= orders.length) {
        // All orders processed
        resolve();
        return;
      }

      const order = orders[index];
      
      // Only save orders that belong to current entity
      if (order.entity_id !== entityId) {
        skippedCount++;
        processNextOrder(index + 1);
        return;
      }

      try {
        // First, check if order exists
        const existingOrder = await new Promise<DBOrder | undefined>((resolve, reject) => {
          const request = store.index('server_id').get(order.id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        const orderToSave = this.prepareOrderForSave(order, existingOrder);

        await new Promise<void>((resolve, reject) => {
          const request = store.put(orderToSave);
          request.onsuccess = () => {
            savedCount++;
            resolve();
          };
          request.onerror = () => {
            errorCount++;
            reject(request.error);
          };
        });

      } catch (error) {
        errorCount++;
      }

      // Process next order
      processNextOrder(index + 1);
    };

    // Start processing
    processNextOrder(0);
    
    transaction.onerror = (event) => {
      console.error('Transaction error:', event);
      reject(transaction.error);
    };
  });
}

  // Get pending orders for sync
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

        // Sort by creation date (oldest first for sync priority)
        orders.sort((a, b) => {
          const dateA = new Date(a.created_at || '').getTime();
          const dateB = new Date(b.created_at || '').getTime();
          return dateA - dateB; // Oldest first
        });

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

  // Update order status when synced with server
  async updateOrderStatus(
    localOrderId: number, 
    status: DBOrder['status'], 
    serverId?: string, 
    serverCode?: string,
    serverCreatedAt?: string
  ): Promise<void> {
    const db = await this.ensureDB();
    const entityId = this.entityIdString;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      
      const getRequest = store.get(localOrderId);
      
      getRequest.onsuccess = () => {
        const order = getRequest.result as DBOrder;

        if (!order || order.entity_id !== entityId) {
          reject(new Error(`Order not found or entity mismatch`));
          return;
        }

        const updatedOrder: DBOrder = {
          ...order,
          status,
          synced_at: new Date().toISOString(),
          server_id: serverId || order.server_id,
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

  // Get order by server ID (for looking up server orders)
  async getOrderByServerId(serverId: string): Promise<DBOrder | null> {
    const db = await this.ensureDB();
    const entityId = this.entityIdString;

    return new Promise((resolve, reject) => {
      if (!entityId) {
        resolve(null);
        return;
      }

      const transaction = db.transaction(['orders'], 'readonly');
      const store = transaction.objectStore('orders');
      const serverIdIndex = store.index('server_id');
      
      const request = serverIdIndex.get(serverId);

      request.onsuccess = () => {
        const order = request.result as DBOrder | undefined;
        if (order && order.entity_id === entityId) {
          resolve(order);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // ============= PRODUCTS METHODS =============
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

        if (search.trim()) {
          const searchLower = search.toLowerCase().trim();
          products = products.filter((p: DBProduct) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.short_name?.toLowerCase().includes(searchLower) ||
            p.category_name.toLowerCase().includes(searchLower)
          );
        }

        if (category && category !== 'All') {
          products = products.filter((p: DBProduct) => p.category_name === category);
        }

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

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // ============= CUSTOMERS METHODS =============
  async saveCustomer(customerData: Omit<DBCustomer, 'created_at' | 'entity_id'> & { created_at?: string, entity_id?: string }): Promise<DBCustomer> {
    const db = await this.ensureDB();
    const entityId = this.entityIdString;

    if (!entityId) {
      throw new Error('Entity ID is required to save a customer');
    }

    const customerId = customerData.id || this.generateLocalId();
    
    const customerToSave: DBCustomer = {
      ...customerData as DBCustomer,
      id: customerId,
      server_id: customerData.server_id || (customerData.status === 'synced' ? customerId : undefined),
      created_at: customerData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
          id: customer.id,
          server_id: customer.server_id || customer.id,
          status: customer.status || 'synced',
          synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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

  async getCustomers(): Promise<CustomerResponse> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['customers'], 'readonly');
      const store = transaction.objectStore('customers');
      
      const request = store.getAll();

      request.onsuccess = () => {
        let customers = request.result as DBCustomer[];       

        customers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const results: DBCustomer[] = customers.map(c => ({
          id: c.id,
          server_id: c.server_id,
          full_name: c.full_name,
          phone_number: c.phone_number,
          address: c.address,
          email: c.email,
          created_at: c.created_at,
          updated_at: c.updated_at,
          status: c.status,
          synced_at: c.synced_at,
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

  // ============= METADATA METHODS =============
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

  // ============= UTILITY METHODS =============
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

  isReady(): boolean {
    return this.db !== null;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const indexedDBService = new IndexedDBService();