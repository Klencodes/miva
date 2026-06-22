import axios from 'axios';
import { IResponse, IUser, OTPType } from '../types';
import { getStoredItem, USER_KEY } from '../hooks/useStore';

const API_BASE_URL = 'http://localhost:4000/api';

class AuthService {
  private readonly baseURL = API_BASE_URL;

  /**
   * Check if any user exists in the system
   */
  async checkUsers(): Promise<IResponse> {
    try {
      const response = await axios.get(`${this.baseURL}/auth/check-users`);
      return response.data;
    } catch (error) {
      console.error('Error checking users:', error);
      throw error;
    }
  }

  /**
   * Create admin account (only if no admin exists)
   */
  async createAdmin(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    confirm_password: string;
    phone?: string;
    address?: string;
  }): Promise<IResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/auth/create-admin`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  }


   async sendOTP(email: string, type: OTPType = 'verification'): Promise<IResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/send-otp`, { email, type });
      return response.data;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(email: string, otp: string, type: OTPType = 'verification'): Promise<IResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, { email, otp, type });
      return response.data;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(email: string, type: OTPType = 'verification'): Promise<IResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/resend-otp`, { email, type });
      return response.data;
    } catch (error) {
      console.error('Error resending OTP:', error);
      throw error;
    }
  }

  
  /**
   * Login user
   */
  async login(email: string, password: string): Promise<IResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, { email, password });
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const token = getStoredItem<IUser| null>(USER_KEY, null)?.auth_token;
      if (token) {
        await axios.post(`${this.baseURL}/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<IResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/auth/forgot-password`, { email });
      return response.data;
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, new_password: string, confirm_password: string): Promise<IResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/auth/reset-password`, {
        token,
        new_password,
        confirm_password
      });
      return response.data;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, new_password: string, confirm_password: string): Promise<IResponse> {
    try {
      const token = getStoredItem<IUser | null>(USER_KEY, null)?.auth_token;
      const response = await axios.post(`${this.baseURL}/auth/change-password`,
        { currentPassword, new_password, confirm_password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<IResponse> {
    try {
      const token = getStoredItem<IUser | null>(USER_KEY, null)?.auth_token;
      const response = await axios.get(`${this.baseURL}/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }
}
// Create and export the instance
const authServiceInstance = new AuthService();
export default authServiceInstance;
