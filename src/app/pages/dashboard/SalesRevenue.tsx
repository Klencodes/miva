import { FC, useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useStore } from "../../../core/hooks/useStore";
import { Button } from "../../../ui";
import { IChartData } from "../../../core/interfaces/IDashboard";

interface SalesRevenueProps {
  chartData: IChartData;
  view: string;
  onTabChange: (tab: string) => void;
}

const SalesRevenue: FC<SalesRevenueProps> = ({ chartData, view, onTabChange }) => {
  const { user } = useStore();
  const [sellingTab, setSellingTab] = useState(view);
  
  const [chartOptions, setChartOptions] = useState<ApexOptions>({
    series: [],
    chart: {
      toolbar: { show: false },
      type: 'area',
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

  useEffect(() => {
    setSellingTab(view);
  }, [view]);

  useEffect(() => {
    // Robust check for data
    if (!chartData.series || chartData.series.length === 0) {
      setChartOptions({
        series: [],
        chart: {
          toolbar: { show: false },
          type: 'area',
        }
      });
      return;
    }

    const options: ApexOptions = {
      series: [{
        name: 'Total Revenue',
        data: chartData.series,
      }],
      chart: {
        id: `chartLine${view}`,
        height: 300,
        type: 'area',
        parentHeightOffset: 0,
        toolbar: {
          show: false,
        },
      },
      xaxis: {
        categories: chartData.categories,
        labels: {
          style: {
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
      yaxis: {
        labels: {
          offsetX: -15,
          formatter: (val: number): string => {
            return formatLargeNumber(val);
          },
          style: {
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
      colors: ['#ff6b57'],
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.5,
          opacityTo: 0,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        curve: 'smooth',
        width: 2,
      },
      grid: {
        borderColor: '#485e9029',
        strokeDashArray: 5,
      },
      legend: {
        show: false,
      },
      tooltip: {
        enabled: true,
        shared: true,
        followCursor: false,
      },
    };

    setChartOptions(options);
  }, [chartData, view]);

  const handleTabClick = (tab: string) => {
    setSellingTab(tab);
    onTabChange(tab);
  };

  if (!chartData.series || chartData.series.length === 0) {
    return (
      <div className="bg-card text-text-light text-sm rounded-sm relative">
        <div className="px-6 font-medium text-base flex flex-wrap items-center justify-between">
          <h1 className="mb-0 inline-flex items-center py-4 overflow-hidden whitespace-nowrap text-ellipsis text-lg font-semibold">
            Sales Revenue
          </h1>
        </div>
        <div className="p-6 pt-0 text-center text-text-light">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card text-text-light text-sm rounded-sm relative">
      <div className="px-6 font-medium text-base flex flex-wrap items-center justify-between">
        <h1 className="mb-0 inline-flex items-center py-4 overflow-hidden whitespace-nowrap text-ellipsis text-lg font-semibold">
          Sales Revenue
        </h1>
        <div className="py-4">
          <ul className="flex items-center mb-0 gap-x-2">
            <li>
              <Button
                type="button"
                size="sm"
                variant={sellingTab === 'daily' ? "primary" : "ghost"}
                onClick={() => handleTabClick('daily')}
              >
                Today
              </Button>
            </li>
            <li>
              <Button
                type="button"
                size="sm"
                variant={sellingTab === 'weekly' ? "primary" : "ghost"}
                onClick={() => handleTabClick('weekly')}
              >
                Week
              </Button>
            </li>
            <li>
              <Button
                type="button"
                size="sm"
                variant={sellingTab === 'monthly' ? "primary" : "ghost"}
                onClick={() => handleTabClick('monthly')}
              >
                Month
              </Button>
            </li>
          </ul>
        </div>
      </div>
      <div className="p-6 pt-0">
        <div id="chartLine">
          <Chart
            options={chartOptions}
            series={chartOptions.series as ApexAxisChartSeries}
            type="area"
            height={300}
          />
        </div>
      </div>
    </div>
  );
};

export default SalesRevenue;