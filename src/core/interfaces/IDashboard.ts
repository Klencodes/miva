export interface IOverviewData {
  currency: string;
  period: {
    view: string;
    current_label: string;
    previous_label: string;
  };
  overview_data: {
    total_orders: number;
    total_products: number;
    total_sales: number;
    total_discount: number;
  };
  overview_data_previous: {
    total_orders: number;
    total_sales: number;
    total_discount: number;
  };
  comparison: {
    sales_change: string;
    sales_change_value: number;
    orders_change: string;
    orders_change_value: number;
  };
}

export interface IChartData {
  series: number[];
  categories: string[];
}

export interface IDashboardData {
  sales_overview: IOverviewData;
  sales_graph: Array<{
    hour?: string;
    day?: string;
    date?: string;
    month?: string;
    total: number;
  }>;
  target_sales_chart: any[];
}