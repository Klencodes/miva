export interface IResponse {
  results: any;
  success: boolean;
  message?: string;
  next?: string | null;
  count?: number | null;
  previous?: string | null;
  hasMore?: boolean;
}
export interface UploadResult {
  public_id: string;
  secure_url: string;
  original_filename: string;
}

export interface IErrorResponse {
  response: boolean;
  message: string;
}
