import axios from 'axios';
import { IResponse, InventoryItem, InventoryFilterParams, IUser, Entity } from '../types';
import { getStoredItem, USER_KEY, ENTITY_KEY } from '../hooks/useStore';

const API_BASE_URL = 'http://localhost:4000/api';

class InventoryService {
  private readonly baseURL = API_BASE_URL;

  /**
   * Get auth token from storage
   */
  private getAuthToken(): string | undefined {
    return getStoredItem<IUser | null>(USER_KEY, null)?.auth_token;
  }

  /**
   * Get entity ID from storage
   */
  private getEntityId(): string | undefined {
    return getStoredItem<Entity | null>(ENTITY_KEY, null)?.uuid;
  }

  /**
   * Get headers with authorization and entity
   */
  private getHeaders() {
    const token = this.getAuthToken();
    const entityId = this.getEntityId();
    
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (entityId) {
      headers['X-Entity'] = entityId;
    }
    
    return { headers };
  }

  /**
   * Get all inventory items with pagination and filtering
   */
  async getItems(params: InventoryFilterParams = {}): Promise<IResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await axios.get(
        `${this.baseURL}/inventory?${queryParams.toString()}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  }

  /**
   * Get inventory item by UUID
   */
  async getItemByUuid(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/inventory/${uuid}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      throw error;
    }
  }

  /**
   * Get inventory item by part number
   */
  async getItemByPartNumber(partNumber: string): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/inventory/part-number/${encodeURIComponent(partNumber)}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory item by part number:', error);
      throw error;
    }
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(page: number = 1, limit: number = 10): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/inventory/low-stock?page=${page}&limit=${limit}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats(): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/inventory/stats`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      throw error;
    }
  }

  /**
   * Create a new inventory item
   */
  async createItem(data: Partial<InventoryItem>): Promise<IResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/inventory`,
        data,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  /**
   * Bulk create inventory items
   */
  async bulkCreateItems(items: Partial<InventoryItem>[]): Promise<IResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/inventory/bulk`,
        { items },
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error bulk creating inventory items:', error);
      throw error;
    }
  }

  /**
   * Update inventory item
   */
  async updateItem(uuid: string, data: Partial<InventoryItem>): Promise<IResponse> {
    try {
      const response = await axios.put(
        `${this.baseURL}/inventory/${uuid}`,
        data,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  /**
   * Adjust stock quantity
   */
  async adjustStock(
    uuid: string, 
    adjustment: {
      quantity: number;
      type?: 'add' | 'subtract' | 'set';
      reason?: string;
    }
  ): Promise<IResponse> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/inventory/${uuid}/stock`,
        adjustment,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw error;
    }
  }

  /**
   * Delete inventory item
   */
  async deleteItem(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/inventory/${uuid}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  /**
   * Add stock to inventory item
   */
  async addStock(uuid: string, quantity: number, reason?: string): Promise<IResponse> {
    return this.adjustStock(uuid, {
      quantity,
      type: 'add',
      reason: reason || 'Stock added',
    });
  }

  /**
   * Subtract stock from inventory item
   */
  async subtractStock(uuid: string, quantity: number, reason?: string): Promise<IResponse> {
    return this.adjustStock(uuid, {
      quantity,
      type: 'subtract',
      reason: reason || 'Stock removed',
    });
  }

  /**
   * Set stock quantity for inventory item
   */
  async setStock(uuid: string, quantity: number, reason?: string): Promise<IResponse> {
    return this.adjustStock(uuid, {
      quantity,
      type: 'set',
      reason: reason || 'Stock manually set',
    });
  }

  /**
   * Search inventory items
   */
  async searchItems(searchTerm: string): Promise<IResponse> {
    try {
      const response = await this.getItems({
        search: searchTerm,
        limit: 20,
      });
      return response;
    } catch (error) {
      console.error('Error searching inventory items:', error);
      throw error;
    }
  }

  /**
   * Get inventory items by type
   */
  async getItemsByType(type: string, page: number = 1, limit: number = 10): Promise<IResponse> {
    try {
      const response = await this.getItems({
        type,
        page,
        limit,
      });
      return response;
    } catch (error) {
      console.error('Error fetching inventory items by type:', error);
      throw error;
    }
  }

  /**
   * Get inventory items by supplier
   */
  async getItemsBySupplier(supplier: string, page: number = 1, limit: number = 10): Promise<IResponse> {
    try {
      const response = await this.getItems({
        supplier,
        page,
        limit,
      });
      return response;
    } catch (error) {
      console.error('Error fetching inventory items by supplier:', error);
      throw error;
    }
  }

  /**
   * Get inventory value summary
   */
  async getInventoryValue(): Promise<{
    total_value: number;
    total_price: number;
    total_items: number;
    total_quantity: number;
  }> {
    try {
      const response = await this.getInventoryStats();
      if (response.success && response.results?.totals) {
        return {
          total_value: response.results.totals.total_value || 0,
          total_price: response.results.totals.total_price || 0,
          total_items: response.results.totals.total_items || 0,
          total_quantity: response.results.totals.total_quantity || 0,
        };
      }
      return {
        total_value: 0,
        total_price: 0,
        total_items: 0,
        total_quantity: 0,
      };
    } catch (error) {
      console.error('Error fetching inventory value:', error);
      return {
        total_value: 0,
        total_price: 0,
        total_items: 0,
        total_quantity: 0,
      };
    }
  }

  /**
   * Export inventory as CSV
   */
  async exportInventory(): Promise<Blob> {
    try {
      const response = await axios.get(
        `${this.baseURL}/inventory/export`,
        {
          ...this.getHeaders(),
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting inventory:', error);
      throw error;
    }
  }

  /**
   * Download inventory as CSV
   */
  async downloadInventory(filename: string = 'inventory-export.csv'): Promise<void> {
    try {
      const blob = await this.exportInventory();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading inventory:', error);
      throw error;
    }
  }

  /**
   * Check if item exists by part number
   */
  async checkPartNumber(partNumber: string): Promise<boolean> {
    try {
      const response = await this.getItemByPartNumber(partNumber);
      return response.success && !!response.results?.item;
    } catch (error) {
      return false;
    }
  }
}

export default new InventoryService();