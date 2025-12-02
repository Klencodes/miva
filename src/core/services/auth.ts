import { IResponse } from "../interfaces/IResponse";
import { apiService } from "./api";
import { apiValues } from "./api-values";
import { handleError } from "./error-handler";

export class AuthService {
  /**
   * Login User
   */
  async login(payload: any): Promise<any> {
    try {
      return await apiService.postNoToken<IResponse>(
        apiValues.SIGNIN_ENDPOINT,
        payload
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Signup User
   */
  async register(payload: any): Promise<any> {
    try {
      return await apiService.postNoToken<IResponse>(
        apiValues.SIGNUP_ENDPOINT,
        payload
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Verify user
   */
  async verifyOTP(payload: any): Promise<any> {
    try {
      return await apiService.postNoToken<IResponse>(
        apiValues.VERIFY_OTP_ENDPOINT,
        payload
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Resend user otp
   */
  async resendOTP(payload: any): Promise<any> {
    try {
      return await apiService.postNoToken<IResponse>(
        apiValues.RESEND_OTP_ENDPOINT,
        payload
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }
  /**
   * Get Sessions
   */
  async getUsers(page: number, search: string): Promise<IResponse> {
    try {
      const params: Record<string, string> = {
        page: page.toString(),
      };
      if (search) {
        params.search = search;
      }
      const queryParams = new URLSearchParams(params).toString();
      return await apiService.get<IResponse>(
        `${apiValues.USERS_ENDPOINT}?${queryParams}`
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }
  /**
   * Add new user
   * @param payload
   * @returns
   */
  async addNewUser(payload: any): Promise<IResponse> {
    try {
      return await apiService.post<IResponse>(
        apiValues.ADD_USER_ENDPOINT,
        payload
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Update user
   * @param payload
   * @returns
   */
  async updateUser(payload: any): Promise<IResponse> {
    const url = `${apiValues.USERS_ENDPOINT}${payload.id}/`;
    delete payload.id;
    try {
      return await apiService.put<IResponse>(url, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Update user role
   * @param payload
   * @returns
   */
  async updateUserRole(payload: any): Promise<IResponse> {
    try {
      return await apiService.post<IResponse>(
        apiValues.UPDATE_USER_ROLE_ENDPOINT,
        payload
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }
  /**
   * Resend user otp
   */
  async updateUserState(payload: any): Promise<IResponse> {
    try {
      return await apiService.post<IResponse>(
        apiValues.UPDATE_USER_STATE_ENDPOINT,
        payload
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }
}

export const authService = new AuthService();
