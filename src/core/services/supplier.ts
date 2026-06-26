import axios from 'axios';
import { IResponse, IUser } from '../types';
import { getStoredItem, USER_KEY } from '../hooks/useStore';

const API_BASE_URL = 'https://miva-server.vercel.app/api';

class SupplierService {
  private readonly baseURL = API_BASE_URL;

  /**
   * Get all suppliers with pagination and filtering
   */
  async getSuppliers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<IResponse> {
    try {
      const token = getStoredItem<IUser | null>(USER_KEY, null)?.auth_token;
      const response = await axios.get(`${this.baseURL}/suppliers`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  }

  /**
   * Get supplier by UUID
   */
  async getSupplierByUuid(uuid: string): Promise<IResponse> {
    try {
      const token = getStoredItem<IUser | null>(USER_KEY, null)?.auth_token;
      const response = await axios.get(`${this.baseURL}/suppliers/${uuid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching supplier:', error);
      throw error;
    }
  }

  /**
   * Create a new supplier
   */
  async createSupplier(data: {
    name: string;
    email: string;
    phone_code: string;
    phone_number: string;
    secondary_code?: string;
    secondary_number?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zip_code?: string;
    website?: string;
    tax_id?: string;
    registration_number?: string;
    notes?: string;
    status?: 'active' | 'inactive';
    metadata?: Record<string, any>;
  }): Promise<IResponse> {
    try {
      const token = getStoredItem<IUser | null>(USER_KEY, null)?.auth_token;
      const response = await axios.post(`${this.baseURL}/suppliers`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  /**
   * Update a supplier
   */
  async updateSupplier(
    uuid: string,
    data: {
      name?: string;
      email?: string;
      phone_code?: string;
      phone_number?: string;
      secondary_code?: string;
      secondary_number?: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      zip_code?: string;
      website?: string;
      tax_id?: string;
      registration_number?: string;
      notes?: string;
      status?: 'active' | 'inactive';
      metadata?: Record<string, any>;
    }
  ): Promise<IResponse> {
    try {
      const token = getStoredItem<IUser | null>(USER_KEY, null)?.auth_token;
      const response = await axios.put(`${this.baseURL}/suppliers/${uuid}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  }

  /**
   * Delete a supplier
   */
  async deleteSupplier(uuid: string): Promise<IResponse> {
    try {
      const token = getStoredItem<IUser | null>(USER_KEY, null)?.auth_token;
      const response = await axios.delete(`${this.baseURL}/suppliers/${uuid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }

  /**
   * Get supplier orders
   */
  async getSupplierOrders(
    supplierId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      date_from?: string;
      date_to?: string;
    }
  ): Promise<IResponse> {
    try {
      const token = getStoredItem<IUser | null>(USER_KEY, null)?.auth_token;
      const response = await axios.get(`${this.baseURL}/suppliers/${supplierId}/orders`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching supplier orders:', error);
      throw error;
    }
  }

  /**
   * Get supplier statistics
   */
  async getSupplierStats(supplierId: string): Promise<IResponse> {
    try {
      const token = getStoredItem<IUser | null>(USER_KEY, null)?.auth_token;
      const response = await axios.get(`${this.baseURL}/suppliers/${supplierId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching supplier stats:', error);
      throw error;
    }
  }

  /**
   * Bulk import suppliers
   */
  async bulkImportSuppliers(suppliers: any[]): Promise<IResponse> {
    try {
      const token = getStoredItem<IUser | null>(USER_KEY, null)?.auth_token;
      const response = await axios.post(`${this.baseURL}/suppliers/bulk-import`, 
        { suppliers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error importing suppliers:', error);
      throw error;
    }
  }

  /**
   * Export suppliers
   */
  async exportSuppliers(params?: {
    format?: 'csv' | 'excel' | 'pdf';
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<any> {
    try {
      const token = getStoredItem<IUser | null>(USER_KEY, null)?.auth_token;
      const response = await axios.get(`${this.baseURL}/suppliers/export`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting suppliers:', error);
      throw error;
    }
  }
}

const supplierServiceInstance = new SupplierService();
export default supplierServiceInstance;