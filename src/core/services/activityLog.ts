// services/activityLogService.ts
import axios from 'axios';
import { IResponse, Entity, IUser } from '../types';
import { getStoredItem, USER_KEY, ENTITY_KEY } from '../hooks/useStore';

const API_BASE_URL = 'https://miva-server.vercel.app/api';

export interface IActivityLogFilterParams {
  page?: number;
  limit?: number;
  entity_id?: string;
  action?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  status?: string;
}

export interface IActivityLog {
  uuid: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  description: string;
  metadata: any;
  entity_id: string;
  created_at: string;
  updated_at: string;
  status: string;
}

class ActivityLogService {
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
   * Get all activity logs with pagination and filtering
   */
  async getActivityLogs(params: IActivityLogFilterParams = {}): Promise<IResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await axios.get(
        `${this.baseURL}/activity-logs?${queryParams.toString()}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  }

  /**
   * Get activity log by UUID
   */
  async getActivityLogByUuid(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/activity-logs/${uuid}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching activity log:', error);
      throw error;
    }
  }

  /**
   * Get activity logs for a specific entity
   */
  async getEntityActivityLogs(entityId: string, params: IActivityLogFilterParams = {}): Promise<IResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await axios.get(
        `${this.baseURL}/activity-logs/entity/${entityId}?${queryParams.toString()}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching entity activity logs:', error);
      throw error;
    }
  }

  /**
   * Get activity logs for a specific user
   */
  async getUserActivityLogs(userId: string, params: IActivityLogFilterParams = {}): Promise<IResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await axios.get(
        `${this.baseURL}/activity-logs/user/${userId}?${queryParams.toString()}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user activity logs:', error);
      throw error;
    }
  }

  /**
   * Get activity log statistics
   */
  async getActivityStats(entityId?: string): Promise<IResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (entityId) {
        queryParams.append('entity_id', entityId);
      }

      const response = await axios.get(
        `${this.baseURL}/activity-logs/stats?${queryParams.toString()}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      throw error;
    }
  }

  /**
   * Get activity logs by action type
   */
  async getActivityLogsByAction(action: string, params: IActivityLogFilterParams = {}): Promise<IResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await axios.get(
        `${this.baseURL}/activity-logs/action/${action}?${queryParams.toString()}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching activity logs by action:', error);
      throw error;
    }
  }

  /**
   * Get recent activity logs (last 24 hours)
   */
  async getRecentActivityLogs(limit: number = 20): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/activity-logs/recent?limit=${limit}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activity logs:', error);
      throw error;
    }
  }

  /**
   * Get activity logs for a specific date range
   */
  async getActivityLogsByDateRange(dateFrom: string, dateTo: string, params: IActivityLogFilterParams = {}): Promise<IResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      queryParams.append('date_from', dateFrom);
      queryParams.append('date_to', dateTo);
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await axios.get(
        `${this.baseURL}/activity-logs/date-range?${queryParams.toString()}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching activity logs by date range:', error);
      throw error;
    }
  }

  /**
   * Export activity logs
   */
  async exportActivityLogs(params: IActivityLogFilterParams = {}, format: string = 'csv'): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams();
      
      queryParams.append('format', format);
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const headers = this.getHeaders();
      const response = await axios.get(
        `${this.baseURL}/activity-logs/export?${queryParams.toString()}`,
        {
          ...headers,
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting activity logs:', error);
      throw error;
    }
  }

  /**
   * Get activity log summary
   */
  async getActivitySummary(entityId?: string): Promise<IResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (entityId) {
        queryParams.append('entity_id', entityId);
      }

      const response = await axios.get(
        `${this.baseURL}/activity-logs/summary?${queryParams.toString()}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching activity summary:', error);
      throw error;
    }
  }
}

const activityLogServiceInstance = new ActivityLogService();
export default activityLogServiceInstance;