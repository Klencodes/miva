// services/entityService.ts
import axios from 'axios';
import { IResponse, IEntityQueryParams, ICreateEntityData, IUpdateEntityData, IUser } from '../types';
import { getStoredItem, USER_KEY } from '../hooks/useStore';

const API_BASE_URL = 'http://localhost:4000/api';

class EntityService {
  private readonly baseURL = API_BASE_URL;

  /**
   * Get auth token from storage
   */
  private getAuthToken(): string | undefined {
    return getStoredItem<IUser | null>(USER_KEY, null)?.auth_token;
  }

  /**
   * Get headers with authorization
   */
  private getHeaders() {
    const token = this.getAuthToken();
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    };
  }

  /**
   * Get all entities with pagination and filtering
   */
  async getEntities(params: IEntityQueryParams = {}): Promise<IResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await axios.get(
        `${this.baseURL}/entities?${queryParams.toString()}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching entities:', error);
      throw error;
    }
  }

  /**
   * Get entity by UUID
   */
  async getEntityByUuid(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/entities/${uuid}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching entity:', error);
      throw error;
    }
  }

  /**
   * Get entity by email
   */
  async getEntityByEmail(email: string): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/entities/email/${encodeURIComponent(email)}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching entity by email:', error);
      throw error;
    }
  }

  /**
   * Get entity statistics
   */
  async getEntityStats(): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/entities/stats`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching entity stats:', error);
      throw error;
    }
  }

  /**
   * Get users by entity
   */
  async getEntityUsers(entityUuid: string, params: { page?: number; limit?: number } = {}): Promise<IResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await axios.get(
        `${this.baseURL}/entities/${entityUuid}/users?${queryParams.toString()}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching entity users:', error);
      throw error;
    }
  }

  /**
   * Create a new entity
   */
  async createEntity(data: ICreateEntityData): Promise<IResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/entities`,
        data,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error creating entity:', error);
      throw error;
    }
  }

  /**
   * Update entity
   */
  async updateEntity(uuid: string, data: IUpdateEntityData): Promise<IResponse> {
    try {
      const response = await axios.put(
        `${this.baseURL}/entities/${uuid}`,
        data,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating entity:', error);
      throw error;
    }
  }

  /**
   * Toggle entity active status
   */
  async toggleEntityActive(uuid: string, isActive: boolean): Promise<IResponse> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/entities/${uuid}/active`,
        { is_active: isActive },
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error toggling entity status:', error);
      throw error;
    }
  }

  /**
   * Soft delete entity (deactivate)
   */
  async deleteEntity(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/entities/${uuid}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting entity:', error);
      throw error;
    }
  }

  /**
   * Permanently delete entity
   */
  async permanentDeleteEntity(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/entities/${uuid}/permanent`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error permanently deleting entity:', error);
      throw error;
    }
  }

  /**
   * Bulk create entities
   */
  async bulkCreateEntities(entitiesData: ICreateEntityData[]): Promise<IResponse[]> {
    try {
      const results = await Promise.all(
        entitiesData.map((entityData) => this.createEntity(entityData))
      );
      return results;
    } catch (error) {
      console.error('Error bulk creating entities:', error);
      throw error;
    }
  }

  /**
   * Bulk update entities
   */
  async bulkUpdateEntities(updates: Array<{ uuid: string; data: IUpdateEntityData }>): Promise<IResponse[]> {
    try {
      const results = await Promise.all(
        updates.map(({ uuid, data }) => this.updateEntity(uuid, data))
      );
      return results;
    } catch (error) {
      console.error('Error bulk updating entities:', error);
      throw error;
    }
  }

  /**
   * Search entities by term
   */
  async searchEntities(searchTerm: string): Promise<IResponse> {
    try {
      return await this.getEntities({ search: searchTerm, limit: 20 });
    } catch (error) {
      console.error('Error searching entities:', error);
      throw error;
    }
  }

  /**
   * Get entity options for dropdown/select
   */
  async getEntityOptions(filterActive: boolean = true): Promise<Array<{ label: string; value: string }>> {
    try {
      const params: IEntityQueryParams = { limit: 100 };
      if (filterActive) {
        params.is_active = true;
      }
      
      const response = await this.getEntities(params);
      const entities = response.results?.entities || [];
      return entities.map((entity: any) => ({
        label: entity.name,
        value: entity.uuid,
      }));
    } catch (error) {
      console.error('Error fetching entity options:', error);
      return [];
    }
  }

  /**
   * Get entity by registration number
   */
  async getEntityByRegistrationNumber(registrationNumber: string): Promise<IResponse | null> {
    try {
      const response = await this.getEntities({
        search: registrationNumber,
        limit: 1,
      });
      return response.results?.entities?.length > 0 ? response : null;
    } catch (error) {
      console.error('Error fetching entity by registration number:', error);
      return null;
    }
  }

  /**
   * Get entity by tax ID
   */
  async getEntityByTaxId(taxId: string): Promise<IResponse | null> {
    try {
      const response = await this.getEntities({
        search: taxId,
        limit: 1,
      });
      return response.results?.entities?.length > 0 ? response : null;
    } catch (error) {
      console.error('Error fetching entity by tax ID:', error);
      return null;
    }
  }
}

export default new EntityService();