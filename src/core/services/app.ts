import { IResponse, UploadResult } from "../interfaces/IResponse";
import { apiService } from "./api";
import { apiValues } from "./api-values";
import { handleError } from "./error-handler";
import { ExportFilters } from "../../app/pages/products/ExportProductsModal"
export interface IOrderResponse extends IResponse {
  total_orders?: number;
  total_sales?: number;
}

export class AppService {
  /**
   * Upload photo
   * @param formData FormData with image file
   * @returns return server response
   */

  async updateTheme(payload: any): Promise<any> {
    try {
      return await apiService.postFormData<IResponse>(
        apiValues.APP_THEMES_ENDPOINT,
        payload
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  async getTheme(): Promise<any> {
    try {
      return await apiService.getNoToken<IResponse>(
        apiValues.APP_THEMES_ENDPOINT,
        {}
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Upload photo
   * @param formData FormData with image file
   * @returns return server response
   */

  async uploadAsset(formData: FormData): Promise<any> {
    try {
      return await apiService.postFormData<
        IResponse & { results: UploadResult }
      >(apiValues.UPLOAD_ASSETS_ENDPOINT, formData);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Get Countries supported
   * @returns return server response
   */
  async getSupportedCountries(): Promise<any> {
    try {
      return await apiService.get<IResponse>(apiValues.GET_COUNTRIES_ENDPOINT);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Get Dashboard analytics
   */
  async getDashboardAnalytics(payload?: {
    start_date?: string;
    end_date?: string;
    view: string;
  }): Promise<any> {
    try {
      return await apiService.post<IResponse>(
        apiValues.DASHBOARD_ANALYTICS_ENDPOINT,
        payload || { view: "daily" }
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Get Entities
   */
  async getEntities(): Promise<IResponse> {
    try {
      return await apiService.get<IResponse>(
        apiValues.BUSINESS_ENTITIES_ENDPOINT
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Create Business info
   */
  async createBusiness(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(
        apiValues.CREATE_BUSINESS_ENTITY_ENDPOINT,
        payload
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Update Business Info
   */
  async updateBusiness(payload: any): Promise<any> {
    const url = `${apiValues.CREATE_BUSINESS_ENTITY_ENDPOINT}${payload.id}/`;
    delete payload.id;
    try {
      return await apiService.put<IResponse>(url, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Create product
   */
  async createProduct(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(
        apiValues.PRODUCTS_ENDPOINT,
        payload
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }
  /**
   * Create bulk products
   */
  async bulkAddProducts(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(
        apiValues.PRODUCT_BULK_UPLOAD_ENDPOINT,
        payload
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }
  /**
   * Assign user entity
   */
  async assignUserToEntity(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(
        apiValues.ASSIGN_USER_ENTITY_ENDPOINT,
        payload
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Update product
   */
  async updateProduct(payload: any): Promise<any> {
    const url = `${apiValues.PRODUCTS_ENDPOINT}${payload.id}/`;
    delete payload.id;
    try {
      return await apiService.put<IResponse>(url, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }
  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<any> {
    try {
      return await apiService.delete<IResponse>(
        `${apiValues.PRODUCTS_ENDPOINT}${id}/`
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Get products
   */
  async getProducts(payload: any): Promise<any> {
    try {
      const params: Record<string, string> = {
        page: payload?.page.toString(),
      };
      if (payload?.search) {
        params.search = payload?.search;
      }
      if (payload?.category && payload?.category.toLowerCase() !== "all") {
        params.category = payload?.category;
      }
      if(payload?.is_available){
        params.is_available = payload.is_available
      }

      const queryParams = new URLSearchParams(params).toString();
      return await apiService.get<IResponse>(
        `${apiValues.PRODUCTS_ENDPOINT}?${queryParams}`
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }  
  
  /**
   * Get products
   */
  async exportProducts(payload: any): Promise<IResponse> {
    try {
      const params: Record<string, string> = {
        page: payload?.page.toString(),
      };
      if (payload?.search) {
        params.search = payload?.search;
      }
      if (payload?.category && payload?.category.toLowerCase() !== "all") {
        params.category = payload?.category;
      }
      if(payload?.is_available){
        params.is_available = payload.is_available
      }

      const queryParams = new URLSearchParams(params).toString();
      return await apiService.get<IResponse>(
        `${apiValues.PRODUCTS_ENDPOINT}?${queryParams}`
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }  
  /**
   * Get all products
   */
  async getAllProducts(payload: any): Promise<any> {
    try {
      const params: Record<string, string> = {
        page: payload?.page.toString(),
      };
      if (payload?.search) {
        params.search = payload?.search;
      }
      if (payload?.category && payload?.category.toLowerCase() !== "all") {
        params.category = payload?.category;
      }

      const queryParams = new URLSearchParams(params).toString();
      return await apiService.get<IResponse>(
        `${apiValues.ALL_PRODUCTS_ENDPOINT}?${queryParams}`
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }
  
  async syncWholeStock(): Promise<any> {
    try {
      return await apiService.post<IResponse>(
        apiValues.SYNC_PRODUCTS_WHOLE_STOCK_ENDPOINT);
    }
    catch (error: any) {
      throw new Error(handleError(error));
    }
  }
    
         
  async syncProductsPrices(): Promise<any> {
    try {
      return await apiService.post<IResponse>(
        apiValues.SYNC_PRODUCTS_PRICE_CALCULATION_ENDPOINT);
    }
    catch (error: any) {
      throw new Error(handleError(error));
    }
  }
     
  /**
   * Get Order
   */
async getOrders(payload: any): Promise<IOrderResponse> {
  const params: Record<string, string> = {
    page: payload?.page.toString(),
  };

  if (payload?.search) {
    params.search = payload.search;
  }
  if (payload?.payment_method && payload.payment_method.toLowerCase() !== "all") {
    params.payment_method = payload.payment_method;
  }

  // ✅ Read flat fields, not nested dateRange
  if (payload?.start_date) {
    params.start_date = payload.start_date;
  }
  if (payload?.end_date) {
    params.end_date = payload.end_date;
  }

  const queryParams = new URLSearchParams(params).toString();
  return await apiService.get<IOrderResponse>(
    `${apiValues.GET_ORDERS_ENDPOINT}?${queryParams}`
  );
}
  /**
   * Create new customer
   */

  async createCustomer(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(
        apiValues.ADD_CUSTOMERS_ENDPOINT,
        payload
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Get Customers
   */
  async getCustomers(page: number = 1, limit: number = 1000): Promise<any> {
    try {
      return await apiService.get<IResponse>(
        `${apiValues.GET_CUSTOMERS_ENDPOINT}?page=${page}&limit=${limit}`
      );
    } catch (error) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Update product availability
   */

  async updateProductAvailability(payload: any): Promise<any> {
    try {
      return await apiService.patch<IResponse>(
        apiValues.UPDATE_PRODUCT_AVAILABILITY_ENDPOINT,
        payload
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }
  /**
   * Update product stock level
   */

  async updateProductStock(payload: any): Promise<any> {
    try {
      return await apiService.patch<IResponse>(
        apiValues.UPDATE_PRODUCT_STOCK_ENDPOINT,
        payload
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }  
  /**
   * Update product price level
   */

  async updateProductPrice(payload: any): Promise<any> {
    try {
      return await apiService.patch<IResponse>(
        apiValues.UPDATE_PRODUCT_PRICE_ENDPOINT,
        payload
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }
  /**
   * Create new order
   */

  async createOrder(payload: any): Promise<IResponse> {
    try {
      return await apiService.post<IResponse>(
        apiValues.CREATE_ORDER_ENDPOINT,
        payload
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Uppdate Order
   * @param id 
   * @param payload 
   */
  async updateOrder(id: string, payload: any): Promise<IResponse> {
    try{
      return await apiService.put<IResponse>(
        apiValues.GET_ORDERS_ENDPOINT + id + "/",
        payload
      );
    }catch(error: any){
      throw new Error(handleError(error));
    }
  }


  /**
   * Get Product Categories
   */
  async getProductExtraInfo(): Promise<any> {
    try {
      return await apiService.get<IResponse>(
        `${apiValues.GET_PRODUCT_EXTRA_INFO_ENDPOINT}`
      );
    } catch (error) {
      throw new Error(handleError(error));
    }
  }



  /**
   * Get Admin Transaction payouts or history
   */
  async getAdminPayouts(
    page: number,
    search: string,
    status?: string,
    sort?: string
  ): Promise<any> {
    try {
      // Conditionally include parameters only if they are not undefined, null, or 'all'.
      const params: Record<string, string> = {
        page: page.toString(),
      };
      if (search) {
        params.search = search;
      }
      if (status && status.toLowerCase() !== "all") {
        params.status = status;
      }
      if (sort && sort.toLowerCase() !== "all") {
        params.sort = sort;
      }
      const queryParams = new URLSearchParams(params).toString();

      return await apiService.get<IResponse>(
        `${apiValues.ADMIN_PAYOUTS_ENDPOINT}?${queryParams}`
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Get Transaction payouts or history
   */
  async getPayouts(
    page: number,
    search: string,
    status?: string,
    sort?: string
  ): Promise<any> {
    try {
      // Conditionally include parameters only if they are not undefined, null, or 'all'.
      const params: Record<string, string> = {
        page: page.toString(),
      };
      if (search) {
        params.search = search;
      }
      if (status && status.toLowerCase() !== "all") {
        params.status = status;
      }
      if (sort && sort.toLowerCase() !== "all") {
        params.sort = sort;
      }
      const queryParams = new URLSearchParams(params).toString();

      return await apiService.get<IResponse>(
        `${apiValues.PAYOUTS_ENDPOINT}?${queryParams}`
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * request payout
   */
  async requestPayout(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(
        apiValues.PAYOUTS_ENDPOINT,
        payload
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Get Payout accounts/ previously used accounts for payout
   */
  async getPayoutAccounts(): Promise<any> {
    try {
      return await apiService.get<IResponse>(
        apiValues.PAYOUT_ACCOUNTS_ENDPOINT
      );
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Get Transaction payouts or history
   */
  async getPayoutWallet(): Promise<any> {
    try {
      return await apiService.get<IResponse>(apiValues.PAYOUT_WALLET_ENDPOINT);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Get revenue time series (aggregated from orders)
   */
  async getRevenueTimeSeries(params?: { start_date?: string; end_date?: string; group_by?: string }): Promise<any> {
    try {
      return await apiService.post<IResponse>(apiValues.REVENUE_TIME_SERIES_ENDPOINT, params || {});
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

 async updateStockInPieces(): Promise<IResponse> {
    try {
      return await apiService.post<IResponse>("products/sync-product-calculations");
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

}

export const appService = new AppService();
