import axios from 'axios';
import { Entity, IResponse, IUser } from '../types';
import { getStoredItem, USER_KEY, ENTITY_KEY } from '../hooks/useStore';

const API_BASE_URL = 'http://localhost:4000/api';

class DashboardService {
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
   * Get complete dashboard statistics with optional date range
   */
  async getDashboardStats(dateFrom?: string, dateTo?: string, entity_id?: string): Promise<IResponse> {
    try {
      const params: Record<string, string> = {};
      
      if (dateFrom) {
        params.date_from = dateFrom;
      }
      
      if (dateTo) {
        params.date_to = dateTo;
      } 
      if (entity_id) {
        params.entity_id = entity_id;
      }
      

      const response = await axios.get(
        `${this.baseURL}/dashboard`,
        {
          ...this.getHeaders(),
          params,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats(): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/dashboard/inventory`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      throw error;
    }
  }

  /**
   * Get invoice statistics with optional date range
   */
  async getInvoiceStats(dateFrom?: string, dateTo?: string): Promise<IResponse> {
    try {
      const params: Record<string, string> = {};
      
      if (dateFrom) {
        params.date_from = dateFrom;
      }
      
      if (dateTo) {
        params.date_to = dateTo;
      }

      const response = await axios.get(
        `${this.baseURL}/dashboard/invoices`,
        {
          ...this.getHeaders(),
          params,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice stats:', error);
      throw error;
    }
  }

  /**
   * Get weekly sales data with optional date range
   */
  async getWeeklySales(dateFrom?: string, dateTo?: string): Promise<IResponse> {
    try {
      const params: Record<string, string> = {};
      
      if (dateFrom) {
        params.date_from = dateFrom;
      }
      
      if (dateTo) {
        params.date_to = dateTo;
      }

      const response = await axios.get(
        `${this.baseURL}/dashboard/weekly-sales`,
        {
          ...this.getHeaders(),
          params,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching weekly sales:', error);
      throw error;
    }
  }

  /**
   * Get top selling items with optional date range
   */
  async getTopSelling(limit: number = 5, dateFrom?: string, dateTo?: string): Promise<IResponse> {
    try {
      const params: Record<string, string | number> = { limit };
      
      if (dateFrom) {
        params.date_from = dateFrom;
      }
      
      if (dateTo) {
        params.date_to = dateTo;
      }
      if (limit) {
        params.limit = limit;
      }
      const response = await axios.get(
        `${this.baseURL}/dashboard/top-selling`,{
            ...this.getHeaders(),
            params
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching top selling items:', error);
      throw error;
    }
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(limit: number = 10): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/dashboard/recent-transactions?limit=${limit}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }
  }

  /**
   * Get monthly revenue trend
   */
  async getMonthlyRevenue(months: number = 12): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/dashboard/monthly-revenue?months=${months}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      throw error;
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/dashboard/customers`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      throw error;
    }
  }

  /**
   * Get inventory by type
   */
  async getInventoryByType(): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/dashboard/inventory-by-type`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory by type:', error);
      throw error;
    }
  }

  /**
   * Get low stock count
   */
  async getLowStockCount(): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/dashboard/low-stock`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching low stock count:', error);
      throw error;
    }
  }

  /**
   * Get invoice status breakdown
   */
  async getInvoiceStatusBreakdown(): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/dashboard/invoice-status`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice status breakdown:', error);
      throw error;
    }
  }
}
const dashboardServiceInstance = new DashboardService();
export default dashboardServiceInstance;
