import { FC, useMemo } from "react";
import { IOverviewData } from "../../../core/interfaces/IDashboard";

interface ISalesOverview {
  id: number;
  type: string;
  icon: string;
  label: string;
  total: number | string;
  statusRate: string | number;
  dataPeriod: string;
  statusColor: string;
  totalSales: string;
  separator?: string;
  change?: string;
  changeValue?: number;
}

interface OverviewListProps {
  salesOverview: IOverviewData | null;
}

const OverviewList: FC<OverviewListProps> = ({ salesOverview }) => {

  const overviewData = useMemo((): ISalesOverview[] => {
    if (!salesOverview) return [];

    const { overview_data, comparison, period } = salesOverview;

    return [
      {
        id: 1,
        type: 'primary',
        icon: 'shopping-cart',
        label: 'Total Orders',
        total: overview_data.total_orders,
        statusRate: comparison.orders_change,
        change: comparison.orders_change,
        changeValue: comparison.orders_change_value,
        dataPeriod: `${period.current_label} Orders`,
        statusColor: comparison.orders_change_value >= 0 ? 'success' : 'danger',
        totalSales: 'false',
      },
      {
        id: 2,
        type: 'success',
        icon: 'money-dollar-circle',
        label: 'Total Sales',
        total: overview_data.total_sales,
        statusRate: comparison.sales_change,
        change: comparison.sales_change,
        changeValue: comparison.sales_change_value,
        dataPeriod: `${period.current_label} Sales`,
        statusColor: comparison.sales_change_value >= 0 ? 'success' : 'danger',
        totalSales: 'true',
      },
      {
        id: 3,
        type: 'info',
        icon: 'box-3',
        label: 'Total Products',
        total: overview_data.total_products,
        statusRate: '0',
        dataPeriod: 'Since last month',
        statusColor: 'success',
        totalSales: 'false',
      },
      {
        id: 4,
        type: 'danger',
        icon: 'percent',
        label: 'Total Discount',
        total: overview_data.total_discount,
        statusRate: `GHC ${overview_data.total_discount?.toFixed(2)}`,
        dataPeriod: `Discount ${period.current_label}`,
        statusColor: 'success',
        totalSales: 'true',
      },
    ];
  }, [salesOverview]);

  if (!salesOverview) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {overviewData.map((overview) => (
        <div
          key={overview.id}
          className="bg-card py-6 px-6 pb-3 overflow-hidden rounded-sm relative text-sm text-text flex justify-between"
        >
            <div>
              <span className="font-normal text-text text-sm">
                {overview.label}
              </span>
              <h4 className="mb-0 text-2xl font-semibold leading-normal text-text">
                <span>
                  {overview.totalSales === 'true' && <span>GHC </span>}
                  {typeof overview.total === 'number' 
                    ? overview.total?.toFixed(2).toLocaleString()
                    : overview.total
                  }
                </span>
              </h4>
              <div>
                <span className="inline-flex items-center w-full h-8 rounded-sm gap-2">
                  <span className={`flex items-center text-xs font-medium gap-1 text-${overview.statusColor}`}>
                    {overview.statusRate}
                  </span>
                  <span className="text-xs text-text-light">
                    {overview.dataPeriod}
                  </span>
                </span>
              </div>
            </div>
            <div
              className={`h-16 w-16 flex items-center justify-start overflow-hidden bg-${overview.type}-10 text-${overview.type} rounded-full`}
            >
              <div className={`flex items-center justify-center text-${overview.type} ml-4`}>
                  {/* Replace with your icon component */}
                  <i className={`text-3xl ri-${overview.icon}-fill`}></i>
              </div>
            </div>
        </div>
      ))}
    </div>
  );
};

export default OverviewList;