// services/invoiceService.ts
import axios from 'axios';
import { Entity, Invoice, InvoiceFilterParams, InvoicePayment, IResponse, IUser } from '../types';
import { getStoredItem, USER_KEY, ENTITY_KEY } from '../hooks/useStore';

const API_BASE_URL = 'https://miva-server.vercel.app/api/';

class InvoiceService {
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
   * Get all invoices with pagination and filtering
   */
  async getInvoices(params: InvoiceFilterParams = {}): Promise<IResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await axios.get(
        `${this.baseURL}/invoices?${queryParams.toString()}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  /**
   * Get invoice by UUID
   */
  async getInvoiceByUuid(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/invoices/${uuid}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoice by number
   */
  async getInvoiceByNumber(number: string): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/invoices/number/${encodeURIComponent(number)}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice by number:', error);
      throw error;
    }
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/invoices/stats`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice stats:', error);
      throw error;
    }
  }

  /**
   * Get next invoice number
   */
  async getNextInvoiceNumber(): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/invoices/next-number`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching next invoice number:', error);
      throw error;
    }
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(page: number = 1, limit: number = 10): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/invoices/overdue?page=${page}&limit=${limit}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
      throw error;
    }
  }

  /**
   * Get invoices by customer
   */
  async getInvoicesByCustomer(customerId: string, page: number = 1, limit: number = 10): Promise<IResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/invoices/customer/${customerId}?page=${page}&limit=${limit}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching customer invoices:', error);
      throw error;
    }
  }

  /**
   * Create a new invoice
   */
  async createInvoice(data: Partial<Invoice>): Promise<IResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/invoices`, data, this.getHeaders() );
      return response.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Bulk create invoices
   */
  async bulkCreateInvoices(invoices: Partial<Invoice>[]): Promise<IResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/invoices/bulk`,
        { invoices },
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error bulk creating invoices:', error);
      throw error;
    }
  }

  /**
   * Update invoice
   */
  async updateInvoice(uuid: string, data: Partial<Invoice>): Promise<IResponse> {
    try {
      const response = await axios.put(
        `${this.baseURL}/invoices/${uuid}`,
        data,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  /**
   * Add payment to invoice
   */
  async addPayment(uuid: string, paymentData: InvoicePayment): Promise<IResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/invoices/${uuid}/payments`,
        paymentData,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/invoices/${uuid}/paid`,
        {},
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      throw error;
    }
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/invoices/${uuid}/cancel`,
        {},
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      throw error;
    }
  }

  /**
   * Delete invoice (only if draft or cancelled)
   */
  async deleteInvoice(uuid: string): Promise<IResponse> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/invoices/${uuid}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  /**
   * Send invoice via email
   */
  async sendInvoice(uuid: string, email?: string, message?: string): Promise<IResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/invoices/${uuid}/send`,
        { email, message },
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error sending invoice:', error);
      throw error;
    }
  }

  /**
   * Export invoice (PDF)
   */
  async exportInvoice(uuid: string, format: string = 'pdf'): Promise<Blob> {
    try {
      const response = await axios.get(
        `${this.baseURL}/invoices/${uuid}/export?format=${format}`,
        {
          ...this.getHeaders(),
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting invoice:', error);
      throw error;
    }
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoice(uuid: string, filename?: string): Promise<void> {
    try {
      const blob = await this.exportInvoice(uuid, 'pdf');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `invoice-${uuid}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  }
}

const  invoiceServiceInstance = new InvoiceService();
export default invoiceServiceInstance;