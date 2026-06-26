// src/core/services/expenseService.ts

import axios from "axios";
import { getStoredItem, USER_KEY, ENTITY_KEY } from "../hooks/useStore";
import { IUser, Entity, IResponse, ExpenseFilters, ExpenseFormData } from "../types";

const API_BASE_URL = "https://miva-server.vercel.app/api/";

// ─── Default Categories ──────────────────────────────────────────────────────
export const DEFAULT_CATEGORIES = [
  "Office Supplies",
  "Utilities",
  "Rent",
  "Salaries",
  "Marketing",
  "Transport",
  "Equipment",
  "Food & Drinks",
  "Software",
  "Maintenance",
  "Insurance",
  "Travel",
  "Training",
  "Other",
];

export const CATEGORY_ICONS: Record<string, string> = {
  "Office Supplies": "📎",
  Utilities: "💡",
  Rent: "🏠",
  Salaries: "👨‍💼",
  Marketing: "📢",
  Transport: "🚗",
  Equipment: "🖥️",
  "Food & Drinks": "🍕",
  Software: "💻",
  Maintenance: "🔧",
  Insurance: "🛡️",
  Travel: "✈️",
  Training: "📚",
  Other: "📦",
};

// ─── Status Options ─────────────────────────────────────────────────────────
export const DEFAULT_STATUSES = ["pending", "approved", "paid", "rejected"];
export const DEFAULT_PAYMENT_METHODS = [
  "cash",
  "bank",
  "mobile_money",
  "credit_card",
];

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
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (entityId) {
      headers["X-Entity"] = entityId;
    }

    return { headers };
  }

  /**
   * Get category icon
   */
  getCategoryIcon(categoryName: string): string {
    return CATEGORY_ICONS[categoryName] || "📦";
  }

  /**
   * Get categories with icons
   */
  getCategoriesWithIcons(
    categories: string[] = [],
  ): Array<{ name: string; icon: string }> {
    // If no categories provided, use defaults
    const categoryList =
      categories.length > 0 ? categories : DEFAULT_CATEGORIES;

    return categoryList.map((name) => ({
      name,
      icon: this.getCategoryIcon(name),
    }));
  }

  /**
   * Create a new expense
   */
  async createExpense(data: ExpenseFormData): Promise<IResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/expenses`,
        data,
        this.getHeaders(),
      );

      return response.data;
    } catch (error: any) {
      console.error("Error creating expense:", error);
      throw error;
    }
  }

  /**
   * Get expense by UUID
   */
  async getExpenseByUuid(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/expenses/${uuid}`,
        this.getHeaders(),
      );

      return response.data;
    } catch (error: any) {
      console.error("Error getting expense:", error);
      throw error;
    }
  }

  /**
   * Get expenses with filters
   */
  async getExpenses(filters: ExpenseFilters = {}): Promise<IResponse> {
    try {
      const params: Record<string, any> = {};

      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      if (filters.payment_method)
        params.payment_method = filters.payment_method;
      if (filters.vendor) params.vendor = filters.vendor;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.entity_id) params.entity_id = filters.entity_id;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.sort_order) params.sort_order = filters.sort_order;

      const response = await axios.get(`${this.baseURL}/expenses`, {
        ...this.getHeaders(),
        params,
      });

      return response.data;
    } catch (error: any) {
      console.error("Error getting expenses:", error);
      throw error;
    }
  }

  /**
   * Update expense
   */
  async updateExpense(
    uuid: string,
    data: Partial<ExpenseFormData>,
  ): Promise<IResponse> {
    try {
      const response = await axios.put(
        `${this.baseURL}/expenses/${uuid}`,
        data,
        this.getHeaders(),
      );

      return response.data.results;
    } catch (error: any) {
      console.error("Error updating expense:", error);
      throw error;
    }
  }

  /**
   * Approve expense
   */
  async approveExpense(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/expenses/${uuid}/approve`,
        {},
        this.getHeaders(),
      );

      return response.data;
    } catch (error: any) {
      console.error("Error approving expense:", error);
      throw error;
    }
  }

  /**
   * Mark expense as paid
   */
  async markExpenseAsPaid(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/expenses/${uuid}/pay`,
        {},
        this.getHeaders(),
      );

      return response.data;
    } catch (error: any) {
      console.error("Error marking expense as paid:", error);
      throw error;
    }
  }

  /**
   * Reject expense
   */
  async rejectExpense(uuid: string, reason: string): Promise<IResponse> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/expenses/${uuid}/reject`,
        { reason },
        this.getHeaders(),
      );

      return response.data;
    } catch (error: any) {
      console.error("Error rejecting expense:", error);
      throw error;
    }
  }

  /**
   * Delete expense
   */
  async deleteExpense(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/expenses/${uuid}`,
        this.getHeaders(),
      );

      return response.data;
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  }

  /**
   * Get expense statistics
   */
  async getExpenseStats(
    filters: {
      start_date?: string;
      end_date?: string;
      entity_id?: string;
    } = {},
  ): Promise<IResponse> {
    try {
      const params: Record<string, any> = {};

      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.entity_id) params.entity_id = filters.entity_id;

      const response = await axios.get(`${this.baseURL}/expenses/stats`, {
        ...this.getHeaders(),
        params,
      });

      return response.data;
    } catch (error: any) {
      console.error("Error getting expense stats:", error);
      throw error;
    }
  }

  /**
   * Get expense category breakdown
   */
  async getExpenseCategoryBreakdown(
    filters: {
      start_date?: string;
      end_date?: string;
      entity_id?: string;
    } = {},
  ): Promise<IResponse> {
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
        },
      );

      return response.data;
    } catch (error: any) {
      console.error("Error getting expense category breakdown:", error);
      throw error;
    }
  }

  /**
   * Get expense status breakdown
   */
  async getExpenseStatusBreakdown(
    filters: {
      start_date?: string;
      end_date?: string;
      entity_id?: string;
    } = {},
  ): Promise<IResponse> {
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
        },
      );

      return response.data;
    } catch (error: any) {
      console.error("Error getting expense status breakdown:", error);
      throw error;
    }
  }

  /**
   * Get expense options (categories, statuses, payment methods)
   * Falls back to defaults if server doesn't return data
   */
  async getExpenseOptions(): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/expenses/options`,
        this.getHeaders(),
      );

      return response.data;
    } catch (error: any) {
      console.error("Error getting expense options, using defaults:", error);
      // Return default options if server fails
      throw error;
    }
  }
}

const expenseServiceInstance = new ExpenseService();
export default expenseServiceInstance;
