export interface IRevenueTimeSeries {
  period: string; // YYYY-MM-DD or ISO date
  total_sales: number;
  total_orders: number;
}

export interface IRevenueTimeSeriesResponse {
  data: IRevenueTimeSeries[];
  summary: {
    total_sales: number;
    total_orders: number;
  };
}
