import { ENTITY_KEY, getStoredItem } from "../hooks/useStore";
import { DBProduct, ProductsResponse, DBOrder, DBCustomer, CustomerResponse } from "../interfaces/IDBTypes";
import { IEntityItem } from "../interfaces/IEntity";
import { IOrder, IOrderItem, IOrderPayment } from "../interfaces/IOrder";
import { IResponse } from "../interfaces/IResponse";

class IndexedDBService {
  private dbName = 'GodDidMart';
  private version = 7; 
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

        // Orders store - IMPORTANT: keyPath is 'id' (local auto-increment ID)
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

  // --- Order methods ---

  // Create a new order (offline-first approach)
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

      // Create order with local fields only
      const orderToSave: Omit<DBOrder, 'id'> = {
        ...orderData,
        entity_id: entityId,
        status: 'pending', // Local status
        created_at: new Date().toISOString(), // Use local created_at for server
        synced_at: undefined,
        server_id: undefined, // No server ID yet
        server_created_at: undefined
      };

      console.log('💾 Saving order to IndexedDB:', orderToSave);

      const request = store.add(orderToSave);

      request.onsuccess = () => {
        const savedOrder: DBOrder = {
          ...orderToSave,
          id: request.result as number // Local auto-increment ID
        };
        
        console.log('✅ Order saved with local ID:', savedOrder.id);
        
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

  // Save orders from server (with server IDs)
  async saveOrders(orders: IOrder[]): Promise<void> {
    const db = await this.ensureDB();
    const entityId = this.entityIdString;

    if (!entityId) {
      throw new Error('Entity ID is required to save orders');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      
      let savedCount = 0;
      let skippedCount = 0;

      orders.forEach((order: IOrder) => {
        // Only save orders that belong to current entity
        if (order.entity_id !== entityId) {
          skippedCount++;
          return;
        }

        // Convert IOrder to DBOrder for storage
        const orderToSave: DBOrder = {
          id: undefined, // Will be auto-generated if new
          server_id: order.id, // Server ID
          code: order.code,
          cashier: order.cashier,
          customer: order.customer,
          total: order.total,
          subtotal: order.subtotal,
          discount: order.discount,
          tendered_cash: order.tendered_cash,
          balance: order.balance,
          balance_label: order.balance_label,
          items: order.items as IOrderItem[],
          payment: order.payment as IOrderPayment,
          entity_id: order.entity_id,
          status: 'synced', // Server orders are synced
          created_at: order.created_at, // Use server's created_at
          synced_at: new Date().toISOString(),
          server_created_at: order.created_at // Server creation time
        };

        // Check if this order already exists locally
        const getRequest = store.index('server_id').get(order.id);
        
        getRequest.onsuccess = () => {
          const existingOrder = getRequest.result as DBOrder;
          
          if (existingOrder) {
            // Update existing order with server data, preserve local ID
            orderToSave.id = existingOrder.id;
            console.log('🔄 Updating existing order with server data:', orderToSave.id);
          }
          
          const putRequest = store.put(orderToSave);
          putRequest.onsuccess = () => {
            savedCount++;
            if (!existingOrder) {
              console.log('✅ Saved new server order:', order.id);
            }
          };
          putRequest.onerror = (error) => {
            console.error(`Failed to save server order ${order.id}:`, error);
          };
        };
        
        getRequest.onerror = () => {
          // If index query fails, try to save anyway
          const putRequest = store.put(orderToSave);
          putRequest.onsuccess = () => savedCount++;
          putRequest.onerror = () => {
            console.error(`Failed to save server order ${order.id}:`, putRequest.error);
          };
        };
      });

      transaction.oncomplete = () => {
        console.log(`✅ Saved ${savedCount} server orders, skipped ${skippedCount}`);
        resolve();
      };
      
      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  // Get all orders (local + server)
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

        console.log(`🔄 Updating order status: local=${localOrderId}, server=${serverId}, status=${status}`);

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

  // Cleanup old synced orders
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
          const orderDate = new Date(order.created_at || '');
          
          // Delete orders older than retention period AND already synced
          if (order.status === 'synced' && orderDate < cutoffTime) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          console.log(`🧹 Cleaned up ${deletedCount} old orders`);
          resolve(deletedCount);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Debug method to see all orders
  async debugAllOrders(): Promise<IResponse> {
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

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['orders'], 'readonly');
      const store = transaction.objectStore('orders');
      const entityIndex = store.index('entity_id');
      
      const request = entityIndex.getAll(IDBKeyRange.only(entityId));

      request.onsuccess = () => {
        const orders = request.result as DBOrder[];
        
        console.log('🔍 All orders in IndexedDB:', orders);
        
        orders.forEach((order, index) => {
          console.log(`Order ${index + 1}:`, {
            local_id: order.id,
            server_id: order.server_id,
            code: order.code,
            status: order.status,
            entity_id: order.entity_id,
            total: order.total,
            items: order.items?.length,
            created_at: order.created_at,
            synced_at: order.synced_at
          });
        });

        const pendingCount = orders.filter(o => o.status === 'pending').length;
        const syncedCount = orders.filter(o => o.status === 'synced').length;
        
        console.log(`📊 Order counts - Pending: ${pendingCount}, Synced: ${syncedCount}`);

        resolve({
          success: true,
          message: `Found ${orders.length} total orders (${pendingCount} pending, ${syncedCount} synced)`,
          results: orders,
          count: orders.length,
          next: null,
          previous: null
        });
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }


  // --- Customer methods ---

  async saveCustomer(customerData: Omit<DBCustomer, 'created_at' | 'entity_id'> & { created_at?: string, entity_id?: string }): Promise<DBCustomer> {
    const db = await this.ensureDB();
    const entityId = this.entityIdString;

    if (!entityId) {
      throw new Error('Entity ID is required to save a customer');
    }

    // CORRECTED: Use the server's id field or generate local ID
    const customerId = customerData.id || this.generateLocalId();
    
    const customerToSave: DBCustomer = {
      ...customerData as DBCustomer,
      id: customerId,  // ✅ Store the server's id in the id field
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
        // CORRECTED: Store server's id in id field
        const customerToSave: DBCustomer = {
          ...customer,
          id: customer.id, // This comes from server
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

        // Sort by creation date (newest first)
        customers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // CORRECTED: Use the id field directly (server returns id, not server_id)
        const results: DBCustomer[] = customers.map(c => ({
          id: c.id,  // ✅ Use c.id directly
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