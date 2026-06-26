// services/userService.ts
import axios from 'axios';
import { IResponse, IUser, IUserQueryParams, ICreateUserData, IUpdateUserData, IUserEntityAssignment } from '../types';
import { getStoredItem, USER_KEY } from '../hooks/useStore';

const API_BASE_URL = 'https://miva-server.vercel.app/api';

class UserService {
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
   * Get all users with pagination and filtering
   */
  async getUsers(params: IUserQueryParams = {}): Promise<IResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await axios.get(
        `${this.baseURL}/users?${queryParams.toString()}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get user by UUID
   */
  async getUserByUuid(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/users/${uuid}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Get current user's entities
   */
  async getMyEntities(): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/users/me/entities`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user entities:', error);
      throw error;
    }
  }

  /**
   * Get current user's permissions
   */
  async getMyPermissions(): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/users/me/permissions`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(data: ICreateUserData): Promise<IResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/users`,
        data,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(uuid: string, data: IUpdateUserData): Promise<IResponse> {
    try {
      const response = await axios.put(
        `${this.baseURL}/users/${uuid}`,
        data,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Toggle user active status
   */
  async toggleUserActive(uuid: string, isActive: boolean): Promise<IResponse> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/users/${uuid}/active`,
        { is_active: isActive },
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }

  /**
   * Soft delete user (deactivate)
   */
  async deleteUser(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/users/${uuid}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Permanently delete user
   */
  async permanentDeleteUser(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/users/${uuid}/permanent`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error permanently deleting user:', error);
      throw error;
    }
  }

  /**
   * Update user password (admin only)
   */
  async updateUserPassword(uuid: string, new_password: string, confirm_password: string): Promise<IResponse> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/users/${uuid}/password`,
        { new_password, confirm_password },
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  }

  /**
   * Assign entity to user
   */
  async assignEntityToUser(uuid: string, assignment: IUserEntityAssignment): Promise<IResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/users/${uuid}/entities`,
        assignment,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error assigning entity to user:', error);
      throw error;
    }
  }

  /**
   * Remove entity from user
   */
  async removeEntityFromUser(uuid: string, entityId: string): Promise<IResponse> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/users/${uuid}/entities/${entityId}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error removing entity from user:', error);
      throw error;
    }
  }

  /**
   * Set primary entity
   */
  async setPrimaryEntity(uuid: string, entityId: string): Promise<IResponse> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/users/${uuid}/entities/${entityId}/primary`,
        {},
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error setting primary entity:', error);
      throw error;
    }
  }

  /**
   * Get users by entity
   */
  async getUsersByEntity(entityId: string, params: { page?: number; limit?: number } = {}): Promise<IResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await axios.get(
        `${this.baseURL}/entities/${entityId}/users?${queryParams.toString()}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching entity users:', error);
      throw error;
    }
  }

  /**
   * Bulk assign entities to users
   */
  async bulkAssignEntities(
    assignments: Array<{
      userUuid: string;
      entityId: string;
      role?: string;
      isPrimary?: boolean;
    }>
  ): Promise<IResponse[]> {
    try {
      const results = await Promise.all(
        assignments.map(({ userUuid, entityId, role, isPrimary }) =>
          this.assignEntityToUser(userUuid, {
            entity_id: entityId,
            role: role as any,
            is_primary: isPrimary,
          })
        )
      );
      return results;
    } catch (error) {
      console.error('Error bulk assigning entities:', error);
      throw error;
    }
  }
}

const  userServiceInstance = new UserService();
export default userServiceInstance;