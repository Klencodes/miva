import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import { apiValues } from "./api-values";
import { ENTITY_KEY, getStoredItem, USER_KEY } from "../hooks/useStore";
import { IUser } from "../interfaces/IUser";
import { urlConfig } from "./url-config";
import { IEntityItem } from "../interfaces/IEntity";


interface RequestConfigWithAuth extends InternalAxiosRequestConfig {
  _skipAuth?: boolean;
}

class ApiService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = urlConfig.API_BASE_URL;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 20000,
      headers: { Accept: "application/json" },
    });

    this._setupInterceptors();
  }

  private noAuthconfig: RequestConfigWithAuth = {
    _skipAuth: true,
    headers: { "Content-Type": "application/json" } as any,
  };

  private noEntityContextEndpoints: string[] = [
    apiValues.BUSINESS_ENTITIES_ENDPOINT,
    apiValues.CONNECTOR_TYPES_ENDPOINT,
    apiValues.SUPER_ADMIN_DASHBOARD_ANALYTICS_ENDPOINT,
    apiValues.PLATFORM_CONFIG_DATA_ENDPOINT,
    apiValues.GET_PENDING_APPROVAL_ENTITIES_ENDPOINT,
    apiValues.UPDATE_PENDING_ENTITY_STATUS_ENDPOINT,
    apiValues.ADMIN_PAYOUTS_ENDPOINT,
    apiValues.APPROVE_REQUEST_ENDPOINT,
    apiValues.UPDATE_USER_STATE_ENDPOINT,
  ];


  private _clearUserData(): void {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ENTITY_KEY);
    // localStorage.removeItem()
    window.location.href = "/account/login/";
  }

  private _setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config: RequestConfigWithAuth) => {
        if (config._skipAuth) {
          return config;
        }

        const storedUser = getStoredItem<IUser | null>(USER_KEY, null);

        let cleanToken = storedUser?.auth_token;
        if (
          cleanToken &&
          cleanToken.startsWith('"') &&
          cleanToken.endsWith('"')
        ) {
          cleanToken = cleanToken.slice(1, -1);
        }
        
        if (cleanToken) {
          config.headers.Authorization = `Token ${cleanToken}`;
        }

        const shouldSkipEntityContext = this.noEntityContextEndpoints.some((endpoint: string) => config.url?.includes(endpoint));
        if (!shouldSkipEntityContext) {
          const storedEntity = getStoredItem<IEntityItem | null>(ENTITY_KEY, null);
          if (storedEntity) {
            config.headers["X-Entity-Context"] =  storedEntity.id;
          } else {
            delete config.headers["X-Entity-Context"];
          }
        } else {
          delete config.headers["X-Entity-Context"];
        }
        // this._logRequest(
        //     config.method ? config.method.toUpperCase() : 'UNKNOWN', 
        //     config.url || 'UNKNOWN_URL', 
        //     config.data, 
        //     config.headers 
        // );

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    this.client.interceptors.response.use((response: AxiosResponse) => { 
      return response; 
    },
        (error: AxiosError) => {
            const status = error.response?.status;
            if (status === 401 || status === 403) {
                console.error(`🚨 Authorization failure detected: HTTP ${status}`);
                this._clearUserData();
            }
            
            return Promise.reject(error);
        }
    );
  }

  private _logRequest(
    method: string,
    url: string,
    data?: any,
    header?: any
  ): void {
    if (process.env.NODE_ENV !== "production") {
      console.group(`🌐 ${method} Request`);
      console.log(`URL: ${this.baseUrl}${url}`);
      console.log(`Method: ${method}`);
      console.log(`Headers: ${header}`);
      if (data) console.log(`Body:`, data);
      console.groupEnd();
    }
  }

  async get<T>(endpoint: string, params?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(endpoint, { params, });
    return response.data;
  }

  async post<T>(endpoint: string, body: any = {}): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(endpoint, body);
    return response.data;
  }

  async put<T>(endpoint: string, body: any = {}): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(endpoint, body);
    return response.data;
  }

  async patch<T>(endpoint: string, body: any = {}): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(endpoint, body);
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(endpoint);
    return response.data;
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post( endpoint, formData, { headers: {'Content-Type': undefined} });
    return response.data;
  }

  async postNoToken<T>(endpoint: string, body: any = {}): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post( endpoint, body, this.noAuthconfig );
    return response.data;
  }

  async getNoToken<T>(endpoint: string, params?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(endpoint, { ...this.noAuthconfig, params, });
    return response.data;
  }
}

export const apiService = new ApiService();