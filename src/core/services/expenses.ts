// src/core/services/expenseService.ts

import axios from 'axios';
import { getStoredItem, USER_KEY, ENTITY_KEY } from '../hooks/useStore';
import { IUser, Entity } from '../types';

const API_BASE_URL = 'http://localhost:4000/api';

export interface Expense {
  id: string;
  uuid: string;
  entity_id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  sub_category?: string;
  date: string;
  payment_method: 'cash' | 'bank' | 'mobile_money' | 'credit_card';
  status: 'pending' | 'paid';
  vendor?: string;
  vendor_contact?: string;
  receipt_url?: string;
  receipt_public_id?: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  paid_by?: string;
  paid_by_name?: string;
  paid_at?: string;
  rejected_by?: string;
  rejected_by_name?: string;
  rejected_at?: string;
  rejection_reason?: string;
  metadata?: Record<string, any>;
}

export interface ExpenseFilters {
  search?: string;
  category?: string;
  status?: string;
  payment_method?: string;
  vendor?: string;
  start_date?: string;
  end_date?: string;
  entity_id?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ExpenseFormData {
  title: string;
  description?: string;
  amount: number;
  category: string;
  sub_category?: string;
  date: string;
  payment_method: string;
  vendor?: string;
  vendor_contact?: string;
  status?: string;
  receipt_url?: string;
  receipt_public_id?: string;
  metadata?: Record<string, any>;
}

export interface ExpenseStats {
  total_expenses: number;
  count: number;
  avg_amount: number;
  max_amount: number;
  min_amount: number;
}

export interface ExpenseCategoryBreakdown {
  category: string;
  count: number;
  amount: number;
}

export interface ExpenseStatusBreakdown {
  status: string;
  count: number;
  amount: number;
}

export interface ExpenseOptions {
  categories: string[];
  statuses: string[];
  payment_methods: string[];
}

// ─── Default Categories ──────────────────────────────────────────────────────
export const DEFAULT_CATEGORIES = [
  'Office Supplies',
  'Utilities',
  'Rent',
  'Salaries',
  'Marketing',
  'Transport',
  'Equipment',
  'Food & Drinks',
  'Software',
  'Maintenance',
  'Insurance',
  'Travel',
  'Training',
  'Other',
];

export const CATEGORY_ICONS: Record<string, string> = {
  'Office Supplies': '📎',
  'Utilities': '💡',
  'Rent': '🏠',
  'Salaries': '👨‍💼',
  'Marketing': '📢',
  'Transport': '🚗',
  'Equipment': '🖥️',
  'Food & Drinks': '🍕',
  'Software': '💻',
  'Maintenance': '🔧',
  'Insurance': '🛡️',
  'Travel': '✈️',
  'Training': '📚',
  'Other': '📦',
};

// ─── Status Options ─────────────────────────────────────────────────────────
export const DEFAULT_STATUSES = ['pending', 'approved', 'paid', 'rejected'];
export const DEFAULT_PAYMENT_METHODS = ['cash', 'bank', 'mobile_money', 'credit_card'];

class ExpenseService {
  private readonly baseURL = API_BASE_URL;

  /**
   * Get auth token from storage
   */
  private getAuthToken(): string | undefined {
    return getStoredItem<IUser | null>(USER_KEY, null)?.auth_token;
  }

  /**
   * Get entity ID from storage
   */
  private getEntityId(): string | undefined {
    return getStoredItem<Entity | null>(ENTITY_KEY, null)?.uuid;
  }

  /**
   * Get headers with authorization and entity
   */
  private getHeaders() {
    const token = this.getAuthToken();
    const entityId = this.getEntityId();
    
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (entityId) {
      headers['X-Entity'] = entityId;
    }
    
    return { headers };
  }

  /**
   * Get category icon
   */
  getCategoryIcon(categoryName: string): string {
    return CATEGORY_ICONS[categoryName] || '📦';
  }

  /**
   * Get categories with icons
   */
  getCategoriesWithIcons(categories: string[] = []): Array<{ name: string; icon: string }> {
    // If no categories provided, use defaults
    const categoryList = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    
    return categoryList.map(name => ({
      name,
      icon: this.getCategoryIcon(name),
    }));
  }

  /**
   * Create a new expense
   */
  async createExpense(data: ExpenseFormData): Promise<{
    success: boolean;
    results?: { expense: Expense };
    message?: string;
  }> {
    try {
      const response = await axios.post(
        `${this.baseURL}/expenses`,
        data,
        this.getHeaders()
      );
      
      return {
        success: true,
        results: response.data.results,
      };
    } catch (error: any) {
      console.error('Error creating expense:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create expense',
      };
    }
  }

  /**
   * Get expense by UUID
   */
  async getExpenseByUuid(uuid: string): Promise<{
    success: boolean;
    results?: { expense: Expense };
    message?: string;
  }> {
    try {
      const response = await axios.get(
        `${this.baseURL}/expenses/${uuid}`,
        this.getHeaders()
      );
      
      return {
        success: true,
        results: response.data.results,
      };
    } catch (error: any) {
      console.error('Error getting expense:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to get expense',
      };
    }
  }

  /**
   * Get expenses with filters
   */
  async getExpenses(filters: ExpenseFilters = {}): Promise<{
    success: boolean;
    results?: {
      expenses: Expense[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
      };
    };
    message?: string;
  }> {
    try {
      const params: Record<string, any> = {};
      
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      if (filters.payment_method) params.payment_method = filters.payment_method;
      if (filters.vendor) params.vendor = filters.vendor;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.entity_id) params.entity_id = filters.entity_id;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.sort_order) params.sort_order = filters.sort_order;

      const response = await axios.get(
        `${this.baseURL}/expenses`,
        {
          ...this.getHeaders(),
          params,
        }
      );
      
      return {
        success: true,
        results: response.data.results,
      };
    } catch (error: any) {
      console.error('Error getting expenses:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to get expenses',
      };
    }
  }

  /**
   * Update expense
   */
  async updateExpense(uuid: string, data: Partial<ExpenseFormData>): Promise<{
    success: boolean;
    results?: { expense: Expense };
    message?: string;
  }> {
    try {
      const response = await axios.put(
        `${this.baseURL}/expenses/${uuid}`,
        data,
        this.getHeaders()
      );
      
      return {
        success: true,
        results: response.data.results,
      };
    } catch (error: any) {
      console.error('Error updating expense:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update expense',
      };
    }
  }

  /**
   * Approve expense
   */
  async approveExpense(uuid: string): Promise<{
    success: boolean;
    results?: { expense: Expense };
    message?: string;
  }> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/expenses/${uuid}/approve`,
        {},
        this.getHeaders()
      );
      
      return {
        success: true,
        results: response.data.results,
      };
    } catch (error: any) {
      console.error('Error approving expense:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to approve expense',
      };
    }
  }

  /**
   * Mark expense as paid
   */
  async markExpenseAsPaid(uuid: string): Promise<{
    success: boolean;
    results?: { expense: Expense };
    message?: string;
  }> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/expenses/${uuid}/pay`,
        {},
        this.getHeaders()
      );
      
      return {
        success: true,
        results: response.data.results,
      };
    } catch (error: any) {
      console.error('Error marking expense as paid:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to mark expense as paid',
      };
    }
  }

  /**
   * Reject expense
   */
  async rejectExpense(uuid: string, reason: string): Promise<{
    success: boolean;
    results?: { expense: Expense };
    message?: string;
  }> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/expenses/${uuid}/reject`,
        { reason },
        this.getHeaders()
      );
      
      return {
        success: true,
        results: response.data.results,
      };
    } catch (error: any) {
      console.error('Error rejecting expense:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to reject expense',
      };
    }
  }

  /**
   * Delete expense
   */
  async deleteExpense(uuid: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/expenses/${uuid}`,
        this.getHeaders()
      );
      
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to delete expense',
      };
    }
  }

  /**
   * Get expense statistics
   */
  async getExpenseStats(filters: {
    start_date?: string;
    end_date?: string;
    entity_id?: string;
  } = {}): Promise<{
    success: boolean;
    results?: ExpenseStats;
    message?: string;
  }> {
    try {
      const params: Record<string, any> = {};
      
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.entity_id) params.entity_id = filters.entity_id;

      const response = await axios.get(
        `${this.baseURL}/expenses/stats`,
        {
          ...this.getHeaders(),
          params,
        }
      );
      
      return {
        success: true,
        results: response.data.results,
      };
    } catch (error: any) {
      console.error('Error getting expense stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to get expense stats',
      };
    }
  }

  /**
   * Get expense category breakdown
   */
  async getExpenseCategoryBreakdown(filters: {
    start_date?: string;
    end_date?: string;
    entity_id?: string;
  } = {}): Promise<{
    success: boolean;
    results?: ExpenseCategoryBreakdown[];
    message?: string;
  }> {
    try {
      const params: Record<string, any> = {};
      
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.entity_id) params.entity_id = filters.entity_id;

      const response = await axios.get(
        `${this.baseURL}/expenses/stats/categories`,
        {
          ...this.getHeaders(),
          params,
        }
      );
      
      return {
        success: true,
        results: response.data.results,
      };
    } catch (error: any) {
      console.error('Error getting expense category breakdown:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to get expense category breakdown',
      };
    }
  }

  /**
   * Get expense status breakdown
   */
  async getExpenseStatusBreakdown(filters: {
    start_date?: string;
    end_date?: string;
    entity_id?: string;
  } = {}): Promise<{
    success: boolean;
    results?: ExpenseStatusBreakdown[];
    message?: string;
  }> {
    try {
      const params: Record<string, any> = {};
      
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.entity_id) params.entity_id = filters.entity_id;

      const response = await axios.get(
        `${this.baseURL}/expenses/stats/status`,
        {
          ...this.getHeaders(),
          params,
        }
      );
      
      return {
        success: true,
        results: response.data.results,
      };
    } catch (error: any) {
      console.error('Error getting expense status breakdown:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to get expense status breakdown',
      };
    }
  }

  /**
   * Get expense options (categories, statuses, payment methods)
   * Falls back to defaults if server doesn't return data
   */
  async getExpenseOptions(): Promise<{
    success: boolean;
    results?: ExpenseOptions;
    message?: string;
  }> {
    try {
      const response = await axios.get(
        `${this.baseURL}/expenses/options`,
        this.getHeaders()
      );
      
      // If server returns data, use it
      if (response.data.success && response.data.results) {
        return {
          success: true,
          results: {
            categories: response.data.results.categories || DEFAULT_CATEGORIES,
            statuses: response.data.results.statuses || DEFAULT_STATUSES,
            payment_methods: response.data.results.payment_methods || DEFAULT_PAYMENT_METHODS,
          },
        };
      }
      
      // If server doesn't return categories, use defaults
      return {
        success: true,
        results: {
          categories: DEFAULT_CATEGORIES,
          statuses: DEFAULT_STATUSES,
          payment_methods: DEFAULT_PAYMENT_METHODS,
        },
      };
    } catch (error: any) {
      console.error('Error getting expense options, using defaults:', error);
      // Return default options if server fails
      return {
        success: true,
        results: {
          categories: DEFAULT_CATEGORIES,
          statuses: DEFAULT_STATUSES,
          payment_methods: DEFAULT_PAYMENT_METHODS,
        },
        message: 'Using default options',
      };
    }
  }
}

const expenseServiceInstance = new ExpenseService();
export default expenseServiceInstance;