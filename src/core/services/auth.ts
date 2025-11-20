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
        return await apiService.postNoToken<IResponse>(apiValues.SIGNIN_ENDPOINT, payload);
      } catch (error: any) {
        throw new Error(handleError(error));
      }
    }
  
      /**
     * Signup User
     */
    async register(payload: any): Promise<any> {
      try {
        return await apiService.postNoToken<IResponse>(apiValues.SIGNUP_ENDPOINT, payload);
      } catch (error: any) {
        throw new Error(handleError(error));
      }
    }    
    
  /**
   * Verify user
   */
  async verifyOTP(payload: any): Promise<any> {
    try {
      return await apiService.postNoToken<IResponse>(apiValues.VERIFY_OTP_ENDPOINT, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Resend user otp
   */
  async resendOTP(payload: any): Promise<any> {
    try {
      return await apiService.postNoToken<IResponse>(apiValues.RESEND_OTP_ENDPOINT, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  }
  
  
  export const authService = new AuthService();