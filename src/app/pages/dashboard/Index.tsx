import { FC, useState, useEffect, useMemo } from "react";
import OverviewList from "./OverviewList";
import SalesRevenue from "./SalesRevenue";
import { useStore } from "../../../core/hooks/useStore";
import TargetChart from "./TargetChart";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { appService } from "../../../core/services/app";
import { IOverviewData, IChartData, IDashboardData } from "../../../core/interfaces/IDashboard";
import { eventService } from "../../../core/services/events";
import { Button } from "../../../ui";
import { Roles } from "../../../core/enums/roles";


const Dashboard: FC = () => {
  const { user } = useStore();
  const [showContent, setShowContent] = useState(false);
  const [salesOverview, setSalesOverview] = useState<IOverviewData | null>(null);
  const [chartData, setChartData] = useState<IChartData>({ series: [], categories: [] });
  const [sellingTab, setSellingTab] = useState("daily");
  const [dashboardData, setDashboardData] = useState<IDashboardData | null>(null);
  usePageTitle("Dashboard");

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

   const fetchAnalytics = async () => {
      const payload = {
        view: sellingTab // daily, weekly, monthly
      };
      try {
        const res: any = await appService.getDashboardAnalytics(payload);
        if (res.success && res.results) {
          setDashboardData(res.results);
        } else {
          setDashboardData(null);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
        setDashboardData(null);
      }
    };

  useEffect(() => { 
    fetchAnalytics();
    // eslint-disable-next-line 
  }, [sellingTab]);

  useEffect(() => {
    if (dashboardData) {
      const overview = dashboardData.sales_overview;
      setSalesOverview(overview);

      // Build chart data
      const graph = dashboardData.sales_graph;
      const categories = graph.map((g) => {
        if (sellingTab === "daily" && g.hour) return g.hour;
        if (sellingTab === "weekly" && g.day) return g.day;
        if (sellingTab === "monthly" && g.month) return g.month;
        return "";
      });
      
      setChartData({
        series: graph.map((g) => g.total),
        categories
      });

      setShowContent(true);
    } else {
      setShowContent(false);
    }
  }, [dashboardData, sellingTab]);

  const handleTabClick = (tab: string) => {
    setSellingTab(tab);
  };
  useEffect(() => {
    const handleRefresh = () => {
      fetchAnalytics();
    };

    eventService.onRefresh(handleRefresh);

    return () => {
      eventService.offRefresh(handleRefresh);
    };
    // eslint-disable-next-line 
  }, []);
  return (
    <div className="h-full">
      <div className="grid grid-cols-1 gap-6">
        {/* Greeting Card */}
        <div className="w-full bg-card rounded-sm shadow flex flex-col text-text text-xl p-6">
          <div>
            {greeting} <span className="px-1"><strong>{user?.first_name || ''}!</strong></span>
          </div>
          <p className="text-sm text-text-light">Business overview</p>
        </div>
      
      {user && [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.OWNER].includes(user.role) && (
        <div className="flex items-center justify-end w-full">
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
      )}

        {/* Overview List */}
        <div className="w-full">
          {showContent && salesOverview ? (
            <OverviewList salesOverview={salesOverview} />
          ) : (
            <div className="bg-card rounded-sm p-8 pt-4 animate-pulse">
              <div className="flex space-x-4">
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-background rounded w-3/4"></div>
                  <div className="h-8 bg-background rounded w-1/2"></div>
                  <div className="h-4 bg-background rounded w-2/3"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Target Chart */}
          <div className="xl:col-span-4">
            {showContent && salesOverview ? (
              <TargetChart 
                salesOverview={salesOverview}
                view={sellingTab}
              />
            ) : (
              <div className="bg-card rounded-sm p-8 pt-4 animate-pulse h-80">
                <div className="h-6 bg-background rounded w-1/3 mb-4"></div>
                <div className="h-48 bg-background rounded"></div>
              </div>
            )}
          </div>

          {/* Sales Revenue */}
          <div className="xl:col-span-8">
            {showContent ? (
              <SalesRevenue 
                chartData={chartData} 
                view={sellingTab} 
              />
            ) : (
              <div className="bg-card rounded-sm p-8 pt-4 animate-pulse h-80">
                <div className="h-6 bg-background rounded w-1/3 mb-4"></div>
                <div className="h-48 bg-background rounded"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;