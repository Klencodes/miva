export interface IResponse {
  results: any;
  success: boolean;
  message: string;
  next?: string | null;
  count?: number | null;
  previous?: string | null;
}

export interface IErrorResponse {
  response: boolean;
  message: string;
}