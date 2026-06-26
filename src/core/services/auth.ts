import { IResponse, OTPType } from '../types';
import api from './api';

const authService = {
  checkUsers:      (): Promise<IResponse> => api.get('/auth/check-users'),
  createAdmin:     (data: any): Promise<IResponse> => api.post('/auth/create-admin', data),
  sendOTP:         (email: string, type: OTPType = 'verification'): Promise<IResponse> => api.post('/auth/send-otp', { email, type }),
  verifyOTP:       (email: string, otp: string, type: OTPType = 'verification'): Promise<IResponse> => api.post('/auth/verify-otp', { email, otp, type }),
  resendOTP:       (email: string, type: OTPType = 'verification'): Promise<IResponse> => api.post('/auth/resend-otp', { email, type }),
  login:           (email: string, password: string): Promise<IResponse> => api.post('/auth/login', { email, password }),
  logout:          (): Promise<IResponse> => api.post('/auth/logout'),
  forgotPassword:  (email: string): Promise<IResponse> => api.post('/auth/forgot-password', { email }),
  resetPassword:   (data: { otp: string; email: string; new_password: string; confirm_password: string }): Promise<IResponse> => api.post('/auth/reset-password', data),
  changePassword:  (data: { current_password: string; new_password: string; confirm_password: string }): Promise<IResponse> => api.post('/auth/change-password', data),
  getCurrentUser:  (): Promise<IResponse> => api.get('/auth/me'),
};

export default authService;