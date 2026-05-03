import React, { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { appService } from "../../../core/services/app";
import { Breadcrumb, Button, Input } from "../../../ui";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { toast } from "sonner";
import { DateRangePicker } from "../../../ui/components/DateRangePicker";
import { IBreadcrumbItem } from "../../../ui/components/Breadcrumb";
import { dateUtils } from "../../../core/utils/date-format";
import { IRevenueTimeSeries } from "../../../core/interfaces/IRevenueInsight";
import { Roles } from "../../../core/enums/roles";
import { useStore } from "../../../core/hooks/useStore";

const CustomTooltip = (props: any) => {
  const { active, payload, label } = props;
  if (active && payload && payload.length) {
    const salesEntry = payload.find((p: any) => p.dataKey === "total_sales");
    const ordersEntry = payload.find((p: any) => p.dataKey === "total_orders");

    return (
      <div className="bg-card border border-border p-4 shadow-xl rounded-sm backdrop-blur-sm bg-opacity-95">
        <p className="text-xs font-bold text-text mb-3 border-b border-border pb-2">
          {dateUtils.formatDate(label, "mediumDate")}
        </p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between space-x-8"
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-[10px] text-text-light uppercase tracking-wider font-medium">
                  {entry.name}:
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-text">
                {Number(entry.value).toLocaleString(undefined, {
                  minimumFractionDigits:
                    entry.dataKey === "total_orders" ? 0 : 2,
                })}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-light uppercase tracking-wider font-medium">
              Orders:
            </span>
            <span className="text-[11px] font-mono font-bold text-primary">
              {ordersEntry ? Number(ordersEntry.value) : 0}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-text-light uppercase tracking-wider font-medium">
              Sales:
            </span>
            <span className="text-[11px] font-mono font-bold text-text">
              ₵{" "}
              {salesEntry
                ? Number(salesEntry.value).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })
                : "0.00"}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

function RevenueInsightsView() {
  usePageTitle("Revenue Insights");
  const { user } = useStore();

// 1. Set simple defaults for state
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");

// 2. Add this useEffect to set dates once the user is loaded
useEffect(() => {
  if (user) {
    const today = new Date();
    const lookbackDays = user.role === Roles.SALES ? 7 : 30;
    
    const start = new Date();
    start.setDate(today.getDate() - lookbackDays);

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  }
}, [user]);


  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");

  const [timeSeriesData, setTimeSeriesData] = useState<IRevenueTimeSeries[]>(
    [],
  );
  const [comparisonData, setComparisonData] = useState<IRevenueTimeSeries[]>(
    [],
  );
  const [summary, setSummary] = useState<{
    total_sales: number;
    total_orders: number;
  }>({ total_sales: 0, total_orders: 0 });
  const [comparisonSummary, setComparisonSummary] = useState<{
    total_sales: number;
    total_orders: number;
  }>({ total_sales: 0, total_orders: 0 });
  const [chartMode, setChartMode] = useState<"area" | "bar" | "both">("area");
  const [loading, setLoading] = useState(true);

  const handleGroupByChange = (val: any) => {
    setGroupBy(val as "day" | "week" | "month");
  };

  const fetchData = useCallback(async () => {
    try {
      if (!startDate || !endDate) return;
      setLoading(true);
      const params = {
        start_date: startDate,
        end_date: endDate,
        group_by: groupBy,
      };

      const response = await appService.getRevenueTimeSeries(params);

      if (response && response.success) {
        const results = response.results as any;
        // API returns { data: [...], summary: {...}, comparison: { data, summary } }
        const current = Array.isArray(results?.data) ? results.data : [];
        const comparison = Array.isArray(results?.comparison?.data)
          ? results.comparison.data
          : [];
        setTimeSeriesData(current);
        setComparisonData(comparison);
        setSummary(results?.summary || { total_sales: 0, total_orders: 0 });
        setComparisonSummary(
          results?.comparison?.summary || { total_sales: 0, total_orders: 0 },
        );
      } else {
        toast.error("Error", {
          description: "Failed to fetch revenue insights",
        });
      }
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      toast.error("Error", { description: "Failed to fetch revenue data" });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, groupBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const breadcrumbs: IBreadcrumbItem[] = [
    { label: "Store", url: "/store" },
    { label: "Revenue Insights", url: "/insights/revenue", isActive: true },
  ];

  const totalSales = summary?.total_sales || 0;
  const totalOrders = summary?.total_orders || 0;
  const prevTotalSales = comparisonSummary?.total_sales || 0;
  const prevTotalOrders = comparisonSummary?.total_orders || 0;

  const computePct = (current: number, previous: number) => {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
  };

  const salesPct = computePct(totalSales, prevTotalSales);
  const ordersPct = computePct(totalOrders, prevTotalOrders);

  const chartData = Array.isArray(timeSeriesData)
    ? timeSeriesData.map((d, idx) => ({
        ...d,
        total_sales_prev:
          (comparisonData[idx] && Number(comparisonData[idx].total_sales)) || 0,
        total_orders_prev:
          (comparisonData[idx] && Number(comparisonData[idx].total_orders)) ||
          0,
      }))
    : [];

    const groupOptions = [
      { label: "Group By", value: "" },
      { label: "Daily", value: "day" },
      { label: "Weekly", value: "week" },
      { label: "Monthly", value: "month" },
    ];

    // Filter out weekly/monthly if the user is SALES
    const filteredOptions = user?.role === Roles.SALES 
      ? groupOptions.filter(opt => opt.value === "" || opt.value === "day")
      : groupOptions;
      
    const CHART_MODES = [
      { id: 'area', label: 'Area' },
      { id: 'bar',  label: 'Bar' },
      { id: 'both', label: 'Both' },
    ] as const; 

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="rounded-sm overflow-hidden flex flex-col">
        <Breadcrumb
          breadcrumbs={breadcrumbs}
          pageTitle="Revenue Insights"
          pageSubtitle="Analytical overview of platform revenue and performance metrics"
        />
      </div>

      {/* Filter Section */}
      <div className="flex justify-end items-center space-x-4 mb-4">
        <div className="-mb-5">
          <Input
            type="select"
            // label="Group By"
            labelType="default"
            value={groupBy}
            onChange={handleGroupByChange}
            selectOptions={filteredOptions}
          />
        </div>
          <div className="flex items-center space-x-2">
            {CHART_MODES.map(({ id, label }) => (
              <Button
                key={id}
                variant={chartMode === id ? "primary" : "ghost"}
                onClick={() => setChartMode(id)}
                title={label}
              />
            ))}
      
        </div>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          onChange={fetchData}
          userRole={user?.role || ""}
          
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[500px] bg-card shadow-sm border border-border p-6 rounded-sm">
          <div className="flex flex-col items-center">
            <div className="relative w-12 h-12">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute top-1 left-1 w-12 h-12 border-4 border-info border-b-transparent rounded-full animate-spin-reverse opacity-50"></div>
            </div>
            <span className="mt-4 text-text font-semibold text-sm tracking-wide">
              Analysing Revenue Data...
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-card shadow-sm border border-border p-8 rounded-sm overflow-hidden relative group">
              <div className="absolute top-8 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="ri-flashlight-line text-6xl text-primary"></i>
              </div>
              <h3 className="text-[10px] font-bold text-text-light uppercase tracking-widest mb-2 border-l-2 border-primary pl-2">
                Total Sales
              </h3>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-primary tracking-tight">
                  ₵{" "}
                  {totalSales.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex items-center space-x-3 mt-2">
                <span className="text-sm text-text-light">
                  Prev: ₵{" "}
                  {prevTotalSales.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span
                  className={`text-sm font-bold ${salesPct >= 0 ? "text-success" : "text-danger"} flex items-center`}
                >
                  <i
                    className={`ri-arrow-${salesPct >= 0 ? "up" : "down"}-line mr-1`}
                  ></i>
                  {Math.abs(salesPct).toFixed(2)}%
                </span>
              </div>

              <p className="text-[11px] text-text-light mt-4 font-medium uppercase tracking-tight">
                Cumulative sales across the reporting period.
              </p>
            </div>

            <div className="bg-card shadow-sm border border-border p-8 rounded-sm overflow-hidden relative group">
              <div className="absolute top-8 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="ri-shopping-cart-2-line text-6xl text-success"></i>
              </div>
              <h3 className="text-[10px] font-bold text-text-light uppercase tracking-widest mb-2 border-l-2 border-success pl-2">
                Total Orders
              </h3>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-success tracking-tight">
                  {totalOrders}
                </span>
                <span className="text-sm font-bold text-success opacity-70 uppercase tracking-widest">
                  Orders
                </span>
              </div>

              <div className="flex items-center space-x-3 mt-2">
                <span className="text-sm text-text-light">
                  Prev: {prevTotalOrders} Orders
                </span>
                <span
                  className={`text-sm font-bold ${ordersPct >= 0 ? "text-success" : "text-danger"} flex items-center`}
                >
                  <i
                    className={`ri-arrow-${ordersPct >= 0 ? "up" : "down"}-line mr-1`}
                  ></i>
                  {Math.abs(ordersPct).toFixed(2)}%
                </span>
              </div>

              <p className="text-[11px] text-text-light mt-4 font-medium uppercase tracking-tight">
                Total number of orders in the reporting period.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div className="px-6 py-4  flex items-center justify-between bg-card">
              <div className="flex flex-col">
                <h2 className="text-sm font-bold text-text uppercase tracking-widest">
                  Revenue Analytics
                </h2>
                <p className="text-[10px] text-text-light mt-1 uppercase tracking-tight">
                  Time-series representation of costs, fees and energy
                </p>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm shadow-primary"></div>
                  <span className="text-[10px] font-bold text-text-light uppercase tracking-tight">
                    Total Sales
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-success shadow-sm shadow-success"></div>
                  <span className="text-[10px] font-bold text-text-light uppercase tracking-tight">
                    Total Orders
                  </span>
                </div>
              </div>
            </div>
            {(chartMode === "area" || chartMode === "both") && (
              <div className="bg-card shadow-sm flex flex-col min-h-[500px] rounded-sm overflow-hidden">
                <div
                  className="p-6 flex-1 w-full bg-gradient-to-b from-card to-card-light">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorSales"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--primary-color)"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--primary-color)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorOrders"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--success-color)"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--success-color)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="4 4"
                        vertical={false}
                        stroke="var(--border-color)"
                        opacity={0.4}
                      />
                      <XAxis
                        dataKey="period"
                        tickFormatter={(val) =>
                          dateUtils.formatDate(val, "shortDate")
                        }
                        tick={{
                          fontSize: 10,
                          fill: "var(--text-light-color)",
                          fontWeight: 600,
                        }}
                        axisLine={{
                          stroke: "var(--border-color)",
                          strokeWidth: 0.5,
                        }}
                      />
                      <YAxis
                        tick={{
                          fontSize: 10,
                          fill: "var(--text-light-color)",
                          fontWeight: 600,
                        }}
                        tickFormatter={(val) => `${val}`}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        type="monotone"
                        name="Total Sales"
                        dataKey="total_sales"
                        stroke="var(--primary-color)"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorSales)"
                      />
                      <Area
                        type="monotone"
                        name="Total Orders"
                        dataKey="total_orders"
                        stroke="var(--success-color)"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorOrders)"
                      />
                      {/* Comparison (previous period) */}
                      <Line
                        type="monotone"
                        name="Sales (Previous)"
                        dataKey="total_sales_prev"
                        stroke="var(--text-light-color)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        name="Orders (Previous)"
                        dataKey="total_orders_prev"
                        stroke="var(--text-light-color)"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {(chartMode === "bar" || chartMode === "both") && (
              <div className="bg-card shadow-sm flex flex-col min-h-[500px] rounded-sm overflow-hidden">
                <div className="p-6 w-full bg-gradient-to-b from-card to-card-light mt-4 rounded-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="4 4"
                        vertical={false}
                        stroke="var(--border-color)"
                        opacity={0.4}
                      />
                      <XAxis
                        dataKey="period"
                        tickFormatter={(val) =>
                          dateUtils.formatDate(val, "shortDate")
                        }
                        tick={{
                          fontSize: 10,
                          fill: "var(--text-light-color)",
                          fontWeight: 600,
                        }}
                        axisLine={{
                          stroke: "var(--border-color)",
                          strokeWidth: 0.5,
                        }}
                      />
                      <YAxis
                        tick={{
                          fontSize: 10,
                          fill: "var(--text-light-color)",
                          fontWeight: 600,
                        }}
                        tickFormatter={(val) => `${val}`}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />

                      <Bar
                        dataKey="total_sales"
                        name="Total Sales"
                        barSize={14}
                        fill="var(--primary-color)"
                      />
                      <Bar
                        dataKey="total_orders"
                        name="Total Orders"
                        barSize={10}
                        fill="var(--success-color)"
                      />

                      <Line
                        type="monotone"
                        name="Sales (Previous)"
                        dataKey="total_sales_prev"
                        stroke="var(--text-light-color)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        name="Orders (Previous)"
                        dataKey="total_orders_prev"
                        stroke="var(--text-light-color)"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default RevenueInsightsView;
