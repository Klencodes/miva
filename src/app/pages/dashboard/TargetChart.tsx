import { FC, useEffect, useState, useMemo } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { IOverviewData } from "../../../core/interfaces/IDashboard";

interface TargetChartProps {
  salesOverview: IOverviewData;
  view: string;
}

const TargetChart: FC<TargetChartProps> = ({ salesOverview, view }) => {
  const [chartOptions, setChartOptions] = useState<ApexOptions>({
    series: [],
    chart: {
      toolbar: { show: false },
      type: 'bar',
    }
  });

  const formatLargeNumber = (val: number): string => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'K';
    }
    return val.toFixed(2);
  };

  // Generate comparison chart data
  const chartData = useMemo(() => {
    const { overview_data_previous, period, comparison } = salesOverview;
    
    return {
      categories: [period.previous_label, period.current_label],
      sales: [overview_data_previous.total_sales, comparison.sales_change_value],
      orders: [overview_data_previous.total_orders, comparison.orders_change_value],
    };
  }, [salesOverview]);

  useEffect(() => {
    if (!salesOverview) return;

    const options: ApexOptions = {
      series: [
        {
          name: 'Sales',
          data: chartData.sales,
          color: '#ff6b57',
        },
        {
          name: 'Orders',
          data: chartData.orders,
          color: '#34C759',
        },
      ],
      chart: {
        height: 311,
        type: 'line',
        parentHeightOffset: 0,
        toolbar: {
          show: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 40,
        colors: ['transparent'],
      },
      grid: {
        borderColor: '#485e9029',
        strokeDashArray: 5,
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '100%',
          borderRadius: 2,
        },
      },
      legend: {
        show: true,
        position: 'top',
      },
      tooltip: {
        enabled: true,
        shared: true,
        followCursor: false,
        intersect: false,
        x: {
          show: true,
          format: 'dd MMM',
        },
        marker: {
          show: true,
        },
        style: {
          fontSize: '12px',
          fontFamily: '"Jost", sans-serif',
        },
      },
      xaxis: {
        crosshairs: {
          show: false,
        },
        labels: {
          style: {
            colors: Array.from({ length: 2 }, () => '#747474'),
            fontSize: '14px',
            fontFamily: '"Jost", sans-serif',
            fontWeight: 400,
          },
        },
        categories: chartData.categories,
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          offsetX: -15,
          formatter: (val: number): string => {
            return formatLargeNumber(val);
          },
          style: {
            colors: ['#747474'],
            fontSize: '14px',
            fontFamily: '"Jost", sans-serif',
            fontWeight: 400,
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
    };

    setChartOptions(options);
  }, [salesOverview, chartData]);

  if (!salesOverview) return null;

  const { comparison } = salesOverview;
  const title = view === 'daily' 
    ? 'Today vs Yesterday' 
    : view === 'weekly' 
    ? 'This Week vs Last Week' 
    : 'This Month vs Last Month';

  return (
    <div className="bg-card text-text-light text-sm rounded-lg relative">
      <div className="px-6 font-medium text-base flex flex-wrap items-center justify-between">
        <div>
          <h1 className="mb-0 inline-flex items-center py-4 overflow-hidden whitespace-nowrap text-ellipsis text-lg font-semibold">
            {title}
          </h1>
          <p className="text-xs text-text-light mb-0">
            Sales Change: <span className={comparison.sales_change_value >= 0 ? 'text-success' : 'text-danger'}>{comparison.sales_change}</span>
          </p>
        </div>
      </div>
      <div className="p-6 pt-0">
        <div className="kkdash-chart-container">
          <Chart
            options={chartOptions}
            series={chartOptions.series as ApexAxisChartSeries}
            type="bar"
            height={311}
          />
        </div>
      </div>
    </div>
  );
};

export default TargetChart;