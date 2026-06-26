// services/invoiceService.ts
import { IResponse, Invoice, InvoiceFilterParams, InvoicePayment } from '../types';
import api from './api';

const invoiceService = {
  getInvoices:       (params: InvoiceFilterParams = {}): Promise<IResponse> => api.get('/invoices', { params }),
  getByUuid:         (uuid: string): Promise<IResponse> => api.get(`/invoices/${uuid}`),
  getByNumber:       (number: string): Promise<IResponse> => api.get(`/invoices/number/${encodeURIComponent(number)}`),
  getStats:          (): Promise<IResponse> => api.get('/invoices/stats'),
  getNextNumber:     (): Promise<IResponse> => api.get('/invoices/next-number'),
  getOverdue:        (page = 1, limit = 10): Promise<IResponse> => api.get('/invoices/overdue', { params: { page, limit } }),
  getByCustomer:     (customerId: string, page = 1, limit = 10): Promise<IResponse> =>
                       api.get(`/invoices/customer/${customerId}`, { params: { page, limit } }),
  create:            (data: Partial<Invoice>): Promise<IResponse> => api.post('/invoices', data),
  bulkCreate:        (invoices: Partial<Invoice>[]): Promise<IResponse> => api.post('/invoices/bulk', { invoices }),
  update:            (uuid: string, data: Partial<Invoice>): Promise<IResponse> => api.put(`/invoices/${uuid}`, data),
  addPayment:        (uuid: string, payment: InvoicePayment): Promise<IResponse> => api.post(`/invoices/${uuid}/payments`, payment),
  markAsPaid:        (uuid: string): Promise<IResponse> => api.patch(`/invoices/${uuid}/paid`, {}),
  cancel:            (uuid: string): Promise<IResponse> => api.patch(`/invoices/${uuid}/cancel`, {}),
  delete:            (uuid: string): Promise<IResponse> => api.del(`/invoices/${uuid}`),
  send:              (uuid: string, email?: string, message?: string): Promise<IResponse> =>
                       api.post(`/invoices/${uuid}/send`, { email, message }),
  export:            (uuid: string, format = 'pdf'): Promise<Blob> =>
                       api.get(`/invoices/${uuid}/export`, { params: { format }, responseType: 'blob' }),
  download: async (uuid: string, filename?: string): Promise<void> => {
    const blob = await invoiceService.export(uuid);
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: filename || `invoice-${uuid}.pdf` }).click();
    URL.revokeObjectURL(url);
  },
};

export default invoiceService;