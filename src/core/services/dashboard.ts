// services/dashboardService.ts
import { IResponse } from '../types';
import api from './api';

const dashboardService = {
  getStats:              (date_from?: string, date_to?: string, entity_id?: string): Promise<IResponse> =>
                           api.get('/dashboard', { params: { date_from, date_to, entity_id } }),
  getInventoryStats:     (): Promise<IResponse> => api.get('/dashboard/inventory'),
  getInvoiceStats:       (date_from?: string, date_to?: string): Promise<IResponse> =>
                           api.get('/dashboard/invoices', { params: { date_from, date_to } }),
  getWeeklySales:        (date_from?: string, date_to?: string): Promise<IResponse> =>
                           api.get('/dashboard/weekly-sales', { params: { date_from, date_to } }),
  getTopSelling:         (limit = 5, date_from?: string, date_to?: string): Promise<IResponse> =>
                           api.get('/dashboard/top-selling', { params: { limit, date_from, date_to } }),
  getRecentTransactions: (limit = 10): Promise<IResponse> =>
                           api.get('/dashboard/recent-transactions', { params: { limit } }),
  getMonthlyRevenue:     (months = 12): Promise<IResponse> =>
                           api.get('/dashboard/monthly-revenue', { params: { months } }),
  getCustomerStats:      (): Promise<IResponse> => api.get('/dashboard/customers'),
  getInventoryByType:    (): Promise<IResponse> => api.get('/dashboard/inventory-by-type'),
  getLowStockCount:      (): Promise<IResponse> => api.get('/dashboard/low-stock'),
  getInvoiceStatus:      (): Promise<IResponse> => api.get('/dashboard/invoice-status'),
};

export default dashboardService;