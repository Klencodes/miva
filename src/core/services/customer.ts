// services/customerService.ts
import { IResponse, ICustomer, ICustomerFilterParams } from '../types';
import api from './api';

const customerService = {
  getCustomers:        (params: ICustomerFilterParams = {}): Promise<IResponse> =>
                         api.get('/customers', { params }),
  getByUuid:           (uuid: string): Promise<IResponse> => api.get(`/customers/${uuid}`),
  getByEmail:          (email: string): Promise<IResponse> => api.get(`/customers/email/${encodeURIComponent(email)}`),
  getStats:            (): Promise<IResponse> => api.get('/customers/stats'),
  search:              (q: string, limit = 10): Promise<IResponse> => api.get('/customers/search', { params: { q, limit } }),
  create:              (data: Partial<ICustomer>): Promise<IResponse> => api.post('/customers', data),
  bulkCreate:          (customers: Partial<ICustomer>[]): Promise<IResponse> => api.post('/customers/bulk', { customers }),
  update:              (uuid: string, data: Partial<ICustomer>): Promise<IResponse> => api.put(`/customers/${uuid}`, data),
  toggleActive:        (uuid: string, is_active: boolean): Promise<IResponse> => api.patch(`/customers/${uuid}/active`, { is_active }),
  delete:              (uuid: string): Promise<IResponse> => api.del(`/customers/${uuid}`),
};

export default customerService;