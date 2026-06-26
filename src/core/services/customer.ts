// services/customerService.ts
import axios from 'axios';
import { IResponse, ICustomer, ICustomerFilterParams, Entity, IUser } from '../types';
import { getStoredItem, USER_KEY, ENTITY_KEY } from '../hooks/useStore';

const API_BASE_URL = 'https://miva-server.vercel.app/api';

class CustomerService {
  private readonly baseURL = API_BASE_URL;

  private getAuthToken(): string | undefined {
    return getStoredItem<IUser | null>(USER_KEY, null)?.auth_token;
  }

  private getEntityId(): string | undefined {
    return getStoredItem<Entity | null>(ENTITY_KEY, null)?.uuid;
  }

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
   * Get all customers with pagination and filtering
   */
  async getCustomers(params: ICustomerFilterParams = {},): Promise<IResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await axios.get(
        `${this.baseURL}/customers?${queryParams.toString()}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  /**
   * Get customer by UUID
   */
  async getCustomerByUuid(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/customers/${uuid}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  /**
   * Get customer by email
   */
  async getCustomerByEmail(email: string): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/customers/email/${encodeURIComponent(email)}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching customer by email:', error);
      throw error;
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/customers/stats`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      throw error;
    }
  }

  /**
   * Search customers
   */
  async searchCustomers(searchTerm: string, limit: number = 10): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/customers/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: Partial<ICustomer>): Promise<IResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/customers`,
        data,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Bulk create customers
   */
  async bulkCreateCustomers(customers: Partial<ICustomer>[]): Promise<IResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/customers/bulk`,
        { customers },
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error bulk creating customers:', error);
      throw error;
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(uuid: string, data: Partial<ICustomer>): Promise<IResponse> {
    try {
      const response = await axios.put(
        `${this.baseURL}/customers/${uuid}`,
        data,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Toggle customer active status
   */
  async toggleCustomerActive(uuid: string, isActive: boolean): Promise<IResponse> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/customers/${uuid}/active`,
        { is_active: isActive },
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error toggling customer status:', error);
      throw error;
    }
  }

  /**
   * Delete customer
   */
  async deleteCustomer(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/customers/${uuid}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }
}
const customerServiceInstance = new CustomerService();
export default customerServiceInstance;