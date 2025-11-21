import { IResponse } from "../interfaces/IResponse";
import { apiService } from "./api";
import { apiValues } from "./api-values";
import { handleError } from "./error-handler";


export class AppService {
  /**
   * Upload photo
   * @param formData FormData with image file
   * @returns return server response
   */
  async uploadAsset(formData: FormData): Promise<any> {
    try {
      return await apiService.postFormData<IResponse>(apiValues.UPLOAD_ASSETS_ENDPOINT, formData);
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
   * Create Business info
   */
  async createBusiness(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(apiValues.CREATE_BUSINESS_ENTITY_ENDPOINT, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }


  /**
   * Update Business Info
   */
  async updateBusiness(payload: any): Promise<any> {
    const url = `${apiValues.UPDATE_STATION_ENDPOINT}${payload.id}/`;
    delete payload.id;
    try {
      return await apiService.put<IResponse>(url, payload);
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
    if (payload?.category && payload?.category.toLowerCase() !== 'all') {
      params.category = payload?.category;
    }
   
    const queryParams = new URLSearchParams(params).toString();
    return await apiService.get<IResponse>(`${apiValues.GET_PRODUCTS_ENDPOINT}?${queryParams}`);
  } catch (error: any) {
    throw new Error(handleError(error));
  }
}

  /**
   * Get Sessions
   */
 async getSystemUsers(page: number, search: string, role: string, status: string): Promise<any> {
  try {
     const params: Record<string, string> = {
      page: page.toString(),
    };
    if (search) {
      params.search = search;
    }
    if (status && status.toLowerCase() !== 'all') {
      params.status = status;
    }
    if (role && role.toLowerCase() !== 'all') {
      params.role = role;
    }
    const queryParams = new URLSearchParams(params).toString();
    return await apiService.get<IResponse>(`${apiValues.GET_SYSTEM_USERS_ENDPOINT}?${queryParams}`);
  } catch (error: any) {
    throw new Error(handleError(error));
  }
}
  /**
   * Get Sessions
   */
 async getUsers(page: number, search: string): Promise<any> {
  try {
     const params: Record<string, string> = {
      page: page.toString(),
    };
    if (search) {
      params.search = search;
    }
    const queryParams = new URLSearchParams(params).toString();
    return await apiService.get<IResponse>(`${apiValues.GET_USERS_ENDPOINT}?${queryParams}`);
  } catch (error: any) {
    throw new Error(handleError(error));
  }
}
/**
 * Add new user 
 * @param payload 
 * @returns 
 */
  async addNewUser(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(apiValues.GET_USERS_ENDPOINT, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

/**
 * Update user 
 * @param payload 
 * @returns 
 */
  async updateUser(payload: any): Promise<any> {
    const url = `${apiValues.GET_USERS_ENDPOINT}${payload.id}/`;
    delete payload.id;
    try {
      return await apiService.put<IResponse>(url, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

/**
 * Update user role
 * @param payload 
 * @returns 
 */
  async updateUserRole(payload: any): Promise<any> {
    try {
      return await apiService.put<IResponse>(apiValues.UPDATE_USER_ROLE_ENDPOINT, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }
  
  /**
 * Update merchant user status
 * @param payload 
 * @returns 
 */
  async updateMerchantUserState(payload: any): Promise<any> {
    try {
      return await apiService.put<IResponse>(apiValues.UPDATE_MERCHANT_ACCESS_STATE_ENDPOINT, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }    
  /**
 * Update systme user state
 * @param payload 
 * @returns 
 */
  async updateSystemUserState(payload: any): Promise<any> {
    try {
      return await apiService.put<IResponse>(apiValues.UPDATE_USER_STATE_ENDPOINT, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Get Connector types
   */
  async getConnectorTypes(): Promise<any> {
    try {
      return await apiService.get<IResponse>(apiValues.CONNECTOR_TYPES_ENDPOINT);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Get Entities
   */
  async getEntities(): Promise<any> {
    try {
      return await apiService.get<IResponse>(apiValues.BUSINESS_ENTITIES_ENDPOINT);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Get Pending Entities
   */
  async getPendingEntities(page: number, search: string): Promise<any> {
    try {
      const queryParams = new URLSearchParams({
      page: page.toString(), ...search ? { search } : {} 
    }).toString();
    return await apiService.get<IResponse>(`${apiValues.GET_PENDING_APPROVAL_ENTITIES_ENDPOINT}?${queryParams}`);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Update Entity status
   */
  async updateEntityStatus(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(apiValues.UPDATE_PENDING_ENTITY_STATUS_ENDPOINT, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Create Station Chargers
   */
  async addCharger(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(apiValues.ADD_CHARGERS_ENDPOINT, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }  
  /**
   * Create Station Chargers
   */
  async activateCharger(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(apiValues.ACTIVATE_CHARGERS_ENDPOINT, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }  
  
  /**
   * Update Charger
   */
  async updateCharger(payload: any): Promise<any> {
    const url = `${apiValues.GET_UPDATE_CHARGER_ENDPOINT}${payload.id}/`;
    delete payload.id;
    try {
      return await apiService.put<IResponse>(url, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }
    
  /**
   * Update Charger
   */
  async resetCharger(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(apiValues.RESET_CHARGER_ENDPOINT, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }
  
  /**
   * Update Conncetor 
   */
  async updateConnector(payload: any): Promise<any> {
    const url = `${apiValues.UPDATE_CONNECTOR_ENDPOINT}${payload.connector_id}/`;
    delete payload.connector_id;
    try {
      return await apiService.put<IResponse>(url, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

/**
   * Update Conncetor Charge price
   */
  async updateConnectorChargePrice(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(apiValues.UPDATE_CONNECTOR_CHARGE_PRICE_ENDPOINT, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Get Charger By Id
   */
  async getChargerDetails (chargerId: string): Promise<any> {
    try {
    return await apiService.get<IResponse>(`${apiValues.GET_UPDATE_CHARGER_ENDPOINT}${chargerId}/`);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Update station amenities
   */
  async updateStationAmenities(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(apiValues.UPDATE_STATION_AMENITIES_ENDPOINT, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Get Station amenities
   */
  async getStationAmenities(): Promise<any> {
    try {
      return await apiService.get<IResponse>(apiValues.STATION_AMENITIES_ENDPOINT);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Get Dashboard analytics
   */
  async getDashboardAnalytics(payload?: {start_date?: string; end_date?: string; view: string;}): Promise<any> {
    try {
        return await apiService.post<IResponse>(apiValues.DASHBOARD_ANALYTICS_ENDPOINT, payload || { view: 'daily' });
    } catch (error: any) {
        throw new Error(handleError(error));
    }
  }
  /**
   * Get Super admin Dashboard analytics
   */
  async getSuperAdminDashboardAnalytics(period?: string): Promise<any> {
    try {
        const queryParams = new URLSearchParams({ ...period ? { period } : {} }).toString();
        const url = `${apiValues.SUPER_ADMIN_DASHBOARD_ANALYTICS_ENDPOINT}${queryParams ? '?' + queryParams : ''}`;
        return await apiService.get<IResponse>(url);
    } catch (error: any) {
        throw new Error(handleError(error));
    }
}
  /**
   * Get Dashboard analytics
   */
  async getPlatformConfigData(): Promise<any> {
    try {
        return await apiService.get<IResponse>(apiValues.PLATFORM_CONFIG_DATA_ENDPOINT);
    } catch (error: any) {
        throw new Error(handleError(error));
    }
}
/**
 * Get Admin Transaction payouts or history
 */
async getAdminPayouts(page: number, search: string, status?: string, sort?: string,): Promise<any> {
  try {
    // Conditionally include parameters only if they are not undefined, null, or 'all'.
    const params: Record<string, string> = {
      page: page.toString(),
    };
    if (search) {
      params.search = search;
    }
    if (status && status.toLowerCase() !== 'all') {
      params.status = status;
    }
    if (sort && sort.toLowerCase() !== 'all') {
      params.sort = sort;
    }
    const queryParams = new URLSearchParams(params).toString();

    return await apiService.get<IResponse>(`${apiValues.ADMIN_PAYOUTS_ENDPOINT}?${queryParams}`);
  
  } catch (error: any) {
    throw new Error(handleError(error));
  }
}

/**
   * Get Transaction payouts or history
   */
  async getPayouts(page: number, search: string, status?: string, sort?: string): Promise<any> {
    try{
      // Conditionally include parameters only if they are not undefined, null, or 'all'.
      const params: Record<string, string> = {
        page: page.toString(),
      };
      if (search) {
        params.search = search;
      }
      if (status && status.toLowerCase() !== 'all') {
        params.status = status;
      }
      if (sort && sort.toLowerCase() !== 'all') {
        params.sort = sort;
      }
      const queryParams = new URLSearchParams(params).toString();

      return await apiService.get<IResponse>(`${apiValues.PAYOUTS_ENDPOINT}?${queryParams}`);
    
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * request payout
   */
  async requestPayout(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(apiValues.PAYOUTS_ENDPOINT, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Approve payout request
   */
  async approveRequest(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(apiValues.APPROVE_REQUEST_ENDPOINT, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * Get Payout accounts/ previously used accounts for payout
   */
  async getPayoutAccounts(): Promise<any> {
    try {
      return await apiService.get<IResponse>(apiValues.PAYOUT_ACCOUNTS_ENDPOINT);
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
   * List services
   */
  async listInAppServices(page: number, search?: string): Promise<any> {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(), ...search ? { search } : {} 
      }).toString();
      return await apiService.get<IResponse>(`${apiValues.LIST_IN_APP_SERVICES_ENDPOINT}?${queryParams}`);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * add new service
   */
  async addInAppService(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(apiValues.ADD_UPDATE_IN_APP_SERVICE_ENDPOINT, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * update service 
   */
  async updateInAppService(payload: any): Promise<any> {
    const url = `${apiValues.ADD_UPDATE_IN_APP_SERVICE_ENDPOINT}${payload.id}/`;
    delete payload.id;
    try {
      return await apiService.put<IResponse>(url, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /***
   * update service status
   */
  async updateInAppServiceStatus(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(apiValues.UPDATE_IN_APP_SERVICE_STATUS_ENDPOINT, payload);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * delete service
   */
  async deleteInAppService(serviceId: string): Promise<any> {
    try {
      return await apiService.delete<IResponse>(`${apiValues.DELETE_IN_APP_SERVICE_ENDPOINT}${serviceId}/`);
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }
  /**
   * GET system amenities
   */
  async getSystemAmenities(): Promise<any> {
    try {
      return await apiService.get<IResponse>(apiValues.ADMINISTRATION_AMENITIES_ENDPOINT);
    } catch (error: any){
      throw new Error(handleError(error));
    }
  }

  /**
   * POST system amenity
   */
  async addSystemAmenity(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(apiValues.ADMINISTRATION_AMENITIES_ENDPOINT, payload); 
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }
  /**
   * UPDATE system amenities
   */

  async updateSystemAmenity(payload: any): Promise<any> {
    try {
      const url = `${apiValues.ADMINISTRATION_AMENITIES_ENDPOINT}${payload.id}/`;
      delete payload.id;
      return await apiService.put<IResponse>(url, payload); 
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * DELETE system amenity
   */
  async deleteSystemAmenity(id: string): Promise<any> {
    try {
      return await apiService.delete<IResponse>(`${apiValues.ADMINISTRATION_AMENITIES_ENDPOINT}${id}/`); 
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

/**
   * GET system ConnectorType
   */
  async getSystemConnectorTypes(): Promise<any> {
    try {
      return await apiService.get<IResponse>(apiValues.ADMINISTRATION_CONNECTOR_TYPES_ENDPOINT);
    } catch (error: any){
      throw new Error(handleError(error));
    }
  }

  /**
   * POST system ConnectorType
   */
  async addSystemConnectorType(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(apiValues.ADMINISTRATION_CONNECTOR_TYPES_ENDPOINT, payload); 
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }
  /**
   * UPDATE system ConnectorType
   */

  async updateSystemConnectorType(payload: any): Promise<any> {
    try {
      const url = `${apiValues.ADMINISTRATION_CONNECTOR_TYPES_ENDPOINT}${payload.id}/`;
      delete payload.id;
      return await apiService.put<IResponse>(url, payload); 
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * DELETE system ConnectorType
   */
  async deleteSystemConnectorType(id: string): Promise<any> {
    try {
      return await apiService.delete<IResponse>(`${apiValues.ADMINISTRATION_CONNECTOR_TYPES_ENDPOINT}${id}/`); 
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }


  /**
   * GET system Service Type
   */
  async getSystemServiceTypes(): Promise<any> {
    try {
      return await apiService.get<IResponse>(apiValues.ADMINISTRATION_SERVICE_TYPES_ENDPOINT);
    } catch (error: any){
      throw new Error(handleError(error));
    }
  }

  /**
   * POST system Service Type
   */
  async addSystemServiceType(payload: any): Promise<any> {
    try {
      return await apiService.post<IResponse>(apiValues.ADMINISTRATION_SERVICE_TYPES_ENDPOINT, payload); 
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }
  /**
   * UPDATE system Service Type
   */

  async updateSystemServiceType(payload: any): Promise<any> {
    try {
      const url = `${apiValues.ADMINISTRATION_SERVICE_TYPES_ENDPOINT}${payload.id}/`;
      delete payload.id;
      return await apiService.put<IResponse>(url, payload); 
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * DELETE system Service Type
   */
  async deleteSystemServiceType(id: string): Promise<any> {
    try {
      return await apiService.delete<IResponse>(`${apiValues.ADMINISTRATION_SERVICE_TYPES_ENDPOINT}${id}/`); 
    } catch (error: any) {
      throw new Error(handleError(error));
    }
  }

  /**
   * GET Commission split
   */
  async updateCommissionSplit(payload: any): Promise<any> {
    try {
      return await apiService.put<IResponse>(apiValues.UPDATE_COMMISSION_SPLIT_ENDPOINT, payload);
    } catch(error: any){
      throw new Error(handleError(error));
    }
  }

}  

export const appService = new AppService();