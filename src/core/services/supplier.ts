// services/supplierService.ts
import { IResponse } from '../types';
import api from './api';

type SupplierData = {
  name: string; email: string; phone_code: string; phone_number: string;
  secondary_code?: string; secondary_number?: string; address?: string;
  city?: string; state?: string; country?: string; zip_code?: string;
  website?: string; tax_id?: string; registration_number?: string;
  notes?: string; status?: 'active' | 'inactive'; metadata?: Record<string, any>;
};

const supplierService = {
  getSuppliers:  (params?: { page?: number; limit?: number; search?: string; status?: string; sort_by?: string; sort_order?: 'asc' | 'desc' }): Promise<IResponse> =>
                   api.get('/suppliers', { params }),
  getByUuid:     (uuid: string): Promise<IResponse> => api.get(`/suppliers/${uuid}`),
  create:        (data: SupplierData): Promise<IResponse> => api.post('/suppliers', data),
  update:        (uuid: string, data: Partial<SupplierData>): Promise<IResponse> => api.put(`/suppliers/${uuid}`, data),
  delete:        (uuid: string): Promise<IResponse> => api.del(`/suppliers/${uuid}`),
  getOrders:     (id: string, params?: { page?: number; limit?: number; status?: string; date_from?: string; date_to?: string }): Promise<IResponse> =>
                   api.get(`/suppliers/${id}/orders`, { params }),
  getStats:      (id: string): Promise<IResponse> => api.get(`/suppliers/${id}/stats`),
  bulkImport:    (suppliers: any[]): Promise<IResponse> => api.post('/suppliers/bulk-import', { suppliers }),
  export:        (params?: { format?: 'csv' | 'excel' | 'pdf'; status?: string; date_from?: string; date_to?: string }): Promise<Blob> =>
                   api.get('/suppliers/export', { params, responseType: 'blob' }),
};

export default supplierService;