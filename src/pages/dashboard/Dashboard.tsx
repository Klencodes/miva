import React, { useMemo, useState } from 'react';
import { generateInitialInventory, generateSampleInvoices } from '../../data/sampleData';


// Simple chart components (you can replace with your actual chart library)
const SimpleBarChart: React.FC<{ data: any; title: string; height: number }> = ({ data, title, height }) => {
  return (
    <div>
      <h3 className="font-semibold text-text mb-2">{title}</h3>
      <div className="flex items-end justify-between h-[220px] gap-1">
        {data.datasets[0].data.map((value: number, index: number) => {
          const maxValue = Math.max(...data.datasets[0].data);
          const heightPercent = (value / maxValue) * 100;
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                style={{ height: `${Math.max(heightPercent, 5)}%` }}
              />
              <span className="text-xs text-text-light mt-1">{data.labels[index]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SimplePieChart: React.FC<{ data: any; title: string }> = ({ data, title }) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
  
  return (
    <div>
      <h3 className="font-semibold text-text mb-2">{title}</h3>
      <div className="flex flex-col items-center">
        <div className="relative w-40 h-40">
          {data.datasets[0].data.map((value: number, index: number) => {
            const percentage = (value / total) * 100;
            const previous = data.datasets[0].data.slice(0, index).reduce((a: number, b: number) => a + b, 0);
            const previousPercent = (previous / total) * 100;
            const startAngle = (previousPercent / 100) * 360;
            const endAngle = ((previousPercent + percentage) / 100) * 360;
            
            if (percentage === 0) return null;
            
            const x1 = 80 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
            const y1 = 80 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
            const x2 = 80 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
            const y2 = 80 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
            const largeArc = percentage > 50 ? 1 : 0;
            
            return (
              <svg key={index} className="absolute inset-0 w-full h-full" viewBox="0 0 160 160">
                <path
                  d={`M 80 80 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={colors[index % colors.length]}
                />
              </svg>
            );
          })}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-text">{total}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {data.labels.map((label: string, index: number) => (
            <div key={index} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="text-xs text-text-light">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  // Sample data
  const inventory = useMemo(() => generateInitialInventory(), []);
  const invoices = useMemo(() => generateSampleInvoices(), []);
  
  // State
  const [isOffline, setIsOffline] = useState(false);
  const [showLowStockAlert, setShowLowStockAlert] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Helper functions
  const generateDailyReport = () => {
    const today = new Date().toDateString();
    const todayInvoices = invoices.filter(inv => 
      new Date(inv.date).toDateString() === today
    );
    const totalRevenue = todayInvoices.reduce((sum, inv) => sum + inv.total, 0);
    return {
      totalRevenue,
      invoiceCount: todayInvoices.length
    };
  };

  const generateProfitLoss = () => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalCost = inventory.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
    const grossProfit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    return { grossProfit, margin };
  };

  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenue = new Array(12).fill(0);
    
    invoices.forEach(inv => {
      const month = new Date(inv.date).getMonth();
      monthlyRevenue[month] += inv.total;
    });
    
    return {
      labels: months,
      values: monthlyRevenue
    };
  };

  const getPaymentMethodData = () => {
    const methods: Record<string, number> = {};
    invoices.forEach(inv => {
      methods[inv.paymentMethod] = (methods[inv.paymentMethod] || 0) + inv.total;
    });
    return {
      labels: Object.keys(methods),
      values: Object.values(methods)
    };
  };

  // Computed values
  const dailyReport = useMemo(() => generateDailyReport(), [invoices]);
  const profitLoss = useMemo(() => generateProfitLoss(), [invoices, inventory]);
  const monthlyData = useMemo(() => getMonthlyData(), [invoices]);
  const paymentData = useMemo(() => getPaymentMethodData(), [invoices]);

  const totalInventoryValue = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [inventory]);

  const totalSales = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + inv.total, 0);
  }, [invoices]);

  const lowStockItems = useMemo(() => {
    return inventory.filter(item => item.quantity < item.reorderThreshold);
  }, [inventory]);

  const topSelling = useMemo(() => {
    const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!itemSales[item.id]) {
          itemSales[item.id] = { name: item.description, quantity: 0, revenue: 0 };
        }
        itemSales[item.id].quantity += item.quantity;
        itemSales[item.id].revenue += item.total;
      });
    });
    return Object.values(itemSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [invoices]);

  const stockStatus = useMemo(() => {
    const total = inventory.length;
    const low = lowStockItems.length;
    const healthy = total - low;
    return { total, low, healthy };
  }, [inventory, lowStockItems]);

  const recentInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [invoices]);

  return (
    <div className="">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text flex items-center gap-3">
            Dashboard Overview
          </h2>
          <p className="text-text-light text-sm mt-1">Real-time business insights at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-light bg-card px-4 py-2 shadow-sm">
            {new Date().toLocaleDateString('en-GH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          {isOffline && (
            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
              Offline Mode
            </span>
          )}
        </div>
      </div>

      {showLowStockAlert && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-danger-50 p-4 mb-6 rounded-r-xl shadow-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-danger-70 font-semibold">Low Stock Alert</p>
                <p className="text-danger-60 text-sm">{lowStockItems.length} items are below reorder threshold</p>
              </div>
            </div>
            <button 
              onClick={() => setShowLowStockAlert(false)}
              className="text-danger-50 hover:text-danger-70 bg-card px-3 py-1 shadow-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <div className="bg-card  p-6 hover:shadow-xl transition-all duration-300 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light text-sm font-medium">Inventory Value</p>
              <p className="text-2xl font-bold text-text">GHS {totalInventoryValue.toFixed(2)}</p>
              <p className="text-xs text-text-light mt-1">{inventory.length} total items</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3  shadow-blue-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12% this month</span>
          </div>
        </div>

        <div className="bg-card  p-6 hover:shadow-xl transition-all duration-300 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light text-sm font-medium">Total Sales</p>
              <p className="text-2xl font-bold text-text">GHS {totalSales.toFixed(2)}</p>
              <p className="text-xs text-text-light mt-1">{invoices.length} invoices</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3  shadow-emerald-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.11 0-2 .895-2 2s.89 2 2 2 2 .895 2 2-.89 2-2 2m0-8c1.11 0 2 .895 2 2s-.89 2-2 2-2 .895-2 2 .89 2 2 2" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+8.5% vs last month</span>
          </div>
        </div>

        <div className="bg-card p-6 hover:shadow-xl transition-all duration-300 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light text-sm font-medium">Today's Revenue</p>
              <p className="text-2xl font-bold text-text">GHS {dailyReport.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-text-light mt-1">{dailyReport.invoiceCount} invoices today</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3  shadow-amber-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-6 3v-3m-6 3V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{dailyReport.invoiceCount} transactions</span>
          </div>
        </div>

        <div className="bg-card  p-6 hover:shadow-xl transition-all duration-300 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light text-sm font-medium">Gross Profit</p>
              <p className="text-2xl font-bold text-emerald-600">GHS {profitLoss.grossProfit.toFixed(2)}</p>
              <p className="text-xs text-text-light mt-1">Margin: {profitLoss.margin.toFixed(1)}%</p>
            </div>
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-3  shadow-rose-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${profitLoss.margin > 30 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
              {profitLoss.margin > 30 ? 'Healthy margin ✅' : 'Margin needs improvement'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-card  p-6 lg:col-span-2 border border-slate-100">
          <SimpleBarChart 
            data={{
              labels: monthlyData.labels,
              datasets: [{ label: 'Monthly Revenue', data: monthlyData.values }]
            }}
            title="Monthly Revenue Trend"
            height={220}
          />
        </div>
        <div className="bg-card  p-6 border border-slate-100">
          <SimplePieChart 
            data={{
              labels: paymentData.labels,
              datasets: [{ label: 'Payment Methods', data: paymentData.values }]
            }}
            title="Payment Method Distribution"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card  p-6 border border-slate-100">
          <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
            <span className="text-lg">🏆</span> Top Selling Items
          </h3>
          {topSelling.length > 0 ? (
            <div className="space-y-3">
              {topSelling.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                      {index + 1}
                    </span>
                    <span className="text-sm text-text">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-text">GHS {item.revenue.toFixed(2)}</span>
                    <span className="text-xs text-text-light block">Qty: {item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-light text-sm">No sales data available</p>
          )}
        </div>

        <div className="bg-card  p-6 border border-slate-100">
          <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
            <span className="text-lg">📦</span> Stock Status
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-light">Healthy Stock</span>
                <span className="font-medium text-text">{stockStatus.healthy} items</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                     style={{ width: `${(stockStatus.healthy / stockStatus.total) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-light">Low Stock</span>
                <span className="font-medium text-danger-60">{stockStatus.low} items</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div className="bg-red-500 h-2.5 rounded-full transition-all duration-500" 
                     style={{ width: `${(stockStatus.low / stockStatus.total) * 100}%` }} />
              </div>
            </div>
            <div className="pt-2 text-xs text-text-light">
              Total: {stockStatus.total} unique items
            </div>
          </div>
        </div>

        <div className="bg-card  p-6 border border-slate-100">
          <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
            <span className="text-lg">🕐</span> Recent Activity
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {recentInvoices.length > 0 ? (
              recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                  <div>
                    <span className="text-sm text-text">{inv.number}</span>
                    <span className="text-xs text-text-light block">{inv.customer}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-text">GHS {inv.total.toFixed(2)}</span>
                    <span className={`text-xs block ${inv.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {inv.paymentStatus}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-text-light text-sm">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;