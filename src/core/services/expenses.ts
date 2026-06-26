// services/expenseService.ts
import { IResponse, ExpenseFilters, ExpenseFormData } from '../types';
import api from './api';

export const DEFAULT_CATEGORIES = [
  'Office Supplies','Utilities','Rent','Salaries','Marketing',
  'Transport','Equipment','Food & Drinks','Software','Maintenance',
  'Insurance','Travel','Training','Other',
];

export const CATEGORY_ICONS: Record<string, string> = {
  'Office Supplies':'📎', Utilities:'💡', Rent:'🏠', Salaries:'👨‍💼',
  Marketing:'📢', Transport:'🚗', Equipment:'🖥️', 'Food & Drinks':'🍕',
  Software:'💻', Maintenance:'🔧', Insurance:'🛡️', Travel:'✈️',
  Training:'📚', Other:'📦',
};

export const DEFAULT_STATUSES         = ['pending', 'approved', 'paid', 'rejected'];
export const DEFAULT_PAYMENT_METHODS  = ['cash', 'bank', 'mobile_money', 'credit_card'];

type DateEntityFilter = { start_date?: string; end_date?: string; entity_id?: string };

const expenseService = {
  // Local helpers (no API call)
  getCategoryIcon:       (name: string) => CATEGORY_ICONS[name] || '📦',
  getCategoriesWithIcons:(cats: string[] = DEFAULT_CATEGORIES) =>
                           cats.map(name => ({ name, icon: CATEGORY_ICONS[name] || '📦' })),

  // API methods
  create:                (data: ExpenseFormData): Promise<IResponse> => api.post('/expenses', data),
  getByUuid:             (uuid: string): Promise<IResponse> => api.get(`/expenses/${uuid}`),
  getExpenses:           (filters: ExpenseFilters = {}): Promise<IResponse> => api.get('/expenses', { params: filters }),
  update:                (uuid: string, data: Partial<ExpenseFormData>): Promise<IResponse> => api.put(`/expenses/${uuid}`, data),
  approve:               (uuid: string): Promise<IResponse> => api.patch(`/expenses/${uuid}/approve`, {}),
  markAsPaid:            (uuid: string): Promise<IResponse> => api.patch(`/expenses/${uuid}/pay`, {}),
  reject:                (uuid: string, reason: string): Promise<IResponse> => api.patch(`/expenses/${uuid}/reject`, { reason }),
  delete:                (uuid: string): Promise<IResponse> => api.delete(`/expenses/${uuid}`),
  getStats:              (filters: DateEntityFilter = {}): Promise<IResponse> => api.get('/expenses/stats', { params: filters }),
  getCategoryBreakdown:  (filters: DateEntityFilter = {}): Promise<IResponse> => api.get('/expenses/stats/categories', { params: filters }),
  getStatusBreakdown:    (filters: DateEntityFilter = {}): Promise<IResponse> => api.get('/expenses/stats/status', { params: filters }),
  getOptions:            (): Promise<IResponse> => api.get('/expenses/options'),
};

export default expenseService;