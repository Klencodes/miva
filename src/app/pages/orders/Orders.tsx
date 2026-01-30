import { useCallback, useEffect, useRef, useState } from "react";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { appService } from "../../../core/services/app";
import { CustomAction, TableColumn } from "../../../core/interfaces/table";
import { DateFormatEnums } from "../../../core/utils/date-format";
import { useDebounce } from "../../../core/hooks/useDebounce";
import { eventService } from "../../../core/services/events";
import { SelectOption } from "../../../core/interfaces/ISelectOption";
import { Breadcrumb, DataTable } from "../../../ui";
import {
  IBreadcrumbItem,
  IBreadcrumbAction,
} from "../../../ui/components/Breadcrumb";
import { convertToCSV, downloadCSV } from "../../../core/utils/fileFormators";
import { IOrder } from "../../../core/interfaces/IOrder";
import { OrderDetailsModal } from "./OrderDetails";
import { useModal } from "../../../core/hooks/useModal";
import OrderReceipt from "./OrderReceipt";
import { toast } from "sonner";
import { syncService } from "../../../core/services/sync";
import { indexedDBService } from "../../../core/services/indexdb";
import { DBOrder } from "../../../core/interfaces/IDBTypes";
import useNetworkStatus from "../../../core/hooks/useNetworkStatus";
import {
  downloadReceiptAsPDF,
  printReceiptDirectly,
} from "../../../core/utils/receipt";
import { ENTITY_KEY, getStoredItem, useStore } from "../../../core/hooks/useStore";
import { IEntityItem } from "../../../core/interfaces/IEntity";

export default function OrdersList() {
  // 1. STATE ADJUSTMENTS: Use IOrder interface and remove Payout/Wallet state
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("all");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { openModal } = useModal();
  const loadingRef = useRef(false);
  const isOnline = useNetworkStatus();
  const entity = getStoredItem<IEntityItem | null>(ENTITY_KEY, null);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  const { user } = useStore();
  // const [dateRange, setDateRange] = useState<{
  //   start_date: string;
  //   end_date: string;
  // }>({ start_date: "", end_date: "" });
    const [dateRange, setDateRange] = useState<{start_date: string, end_date: string}>(() => {
    const today = new Date();
    // const thirtyDaysAgo = new Date();
    // thirtyDaysAgo.setDate(today.getDate() - 30);

    return {
      // start_date: thirtyDaysAgo.toISOString().split('T')[0],
      start_date: today.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0]
    };
  });

  usePageTitle("Sales Orders");

  // 3. BREADCRUMBS: Update breadcrumbs
  const breadcrumbs: IBreadcrumbItem[] = [
    { label: "Store", url: "/store" },
    { label: "Orders", url: "/orders", isActive: true },
  ];

  // 4. FILTER OPTIONS: Change status to payment method filter
  const paymentMethodOptions: SelectOption[] = [
    { value: "all", label: "All Methods" },
    { value: "Cash", label: "Cash" },
    { value: "Mobile Money", label: "Mobile Money" },
  ];

  // 5. COLUMNS: Define columns for Orders data
  const columns: TableColumn[] = [
    {
      header: "Order Code",
      value: (item: IOrder) => item.code,
      type: "column",
      bold: true,
    },
    {
      header: "Customer",
      value: (item: IOrder) => item.customer,
      type: "column",
    },
    {
      header: "Items",
      // Show the number of unique items
      value: (item: IOrder) => `${item.items.length} unique items`,
      type: "column",
    },
    {
      header: "Total Amount",
      // Assuming a currency (e.g., GHS) for display
      value: (item: IOrder) =>
        `GHS ${item.total.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      type: "column",
    },
    {
      header: "Payment Method",
      value: (item: IOrder) => item.payment.payment_method,
      type: "status",
      // You can define custom status classes based on payment method if needed
      statusClasses: (item: IOrder) => {
        switch (item.payment.payment_method) {
          case "Cash":
            return "bg-success-10 text-success";
          case "Mobile Money":
            return "bg-info-10 text-info";
          default:
            return "bg-gray-10 text-gray";
        }
      },
    },
    {
      header: "Cashier",
      value: (item: IOrder) => item.cashier,
      type: "column",
    },
    {
      header: "Order Date",
      value: (item: IOrder) => item.created_at,
      type: "date",
      format: DateFormatEnums.DATE_TIME_SHORT,
    },
  ];

  // 6. BREADCRUMB ACTIONS: Keep Export
  const actions: IBreadcrumbAction[] = [
    {
      label: loading ? "Syncing Orders..." : "Sync Orders",
      action: () => handleManualSync(),
      icon: loading ? "loader-4" : "refresh",
      size: "sm",
      variant: "outline",
      disabled: loading,
    },
    {
      label: exportLoading ? "Exporting..." : "Export as CSV",
      action: () => handleExport(),
      icon: exportLoading ? "loader-4" : "download",
      size: "sm",
      variant: "outline",
      disabled: exportLoading,
    },
  ];

  // 7. CUSTOM ACTIONS: Define actions for individual order rows
  const getCustomActions = (item: IOrder): CustomAction[] => [
    {
      title: "Print Receipt",
      handler: () => handlePrint(item),
      icon: "printer-line",
      classes: "",
    },
    {
      title: "Download Receipt",
      handler: () => handleDownload(item),
      icon: "download-line",
    },
    {
      title: "Preview Receipt",
      handler: () => handleOpenReceipt(item),
      icon: "eye-line",
      classes: "",
    },
    {
      title: "View Details",
      handler: () => onViewDetails(item),
      icon: "eye-line",
      classes: "",
    },
  ];

  const handlePrint = (item: IOrder) => {
    const success = printReceiptDirectly(item, entity!);

    if (success) {
      // toast.success("Opening print preview...");
    } else {
      toast.error("Failed to open print window. Please check popup blocker.");
    }
  };

  const handleDownload = async (item: IOrder) => {
    toast.info("Generating PDF...");

    const success = await downloadReceiptAsPDF(item, entity!);

    if (success) {
      toast.success("Receipt downloaded successfully");
    } else {
      toast.error("Failed to generate PDF");
    }
  };

  // 8. DATA FETCHING: Update function to fetch Orders
  const convertDBOrderToIOrder = (dbOrder: DBOrder): IOrder => {
    return {
      id: dbOrder.server_id || dbOrder.id?.toString() || `local-${dbOrder.id}`,
      code: dbOrder.code || `LOCAL-${dbOrder.id}`,
      cashier: dbOrder.cashier || "",
      customer: dbOrder.customer || "",
      total: dbOrder.total || 0,
      subtotal: dbOrder.subtotal || dbOrder.total || 0,
      discount: dbOrder.discount || 0,
      tendered_cash: dbOrder.tendered_cash || 0,
      balance: dbOrder.balance || 0,
      balance_label: dbOrder.balance_label || "Change",
      items: dbOrder.items || [],
      payment: dbOrder.payment || { payment_method: "Cash", amount_paid: 0 },
      created_at: dbOrder.created_at || new Date().toISOString(),
      // Type assertion - add IndexedDB fields to IOrder
    } as IOrder & { status?: string; synced_at?: string; entity_id?: string };
  };

  // In your component
  type DisplayOrder = IOrder & {
    status?: string;
    synced_at?: string;
    entity_id?: string;
  };

  // Update the fetchOrdersData function to use this conversion
  const fetchOrdersData = useCallback(
    async (
      pageParam: number = 1,
      search: string = "",
      payment_method: string = "All",
      dateRange?: { start_date: string; end_date: string },
    ) => {
      if (loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);

      try {
        const payload = {
          page: pageParam,
          search,
          payment_method,
          dateRange,
        };

        let orders: IOrder[] = [];
        let count = 0;

        if (isOnline) {
          try {
            const serverResponse = await appService.getOrders(payload);

            if (serverResponse.success && serverResponse.results) {
              // Server orders are already IOrder[]
              orders = serverResponse.results as IOrder[];
              count = serverResponse.count as number;
              setTotalOrders(serverResponse.total_orders || count);
              setTotalSales(serverResponse.total_sales || 0);
              // Save server orders to IndexedDB
              await indexedDBService.saveOrders(orders);
            }
          } catch (serverError) {
            console.log("Server fetch failed, using local data:", serverError);
          }
        } else {
          // ALWAYS get local orders (including pending)
          const localResponse = await indexedDBService.getAllOrders({
            includePending: true,
            ...payload,
          });

          if (localResponse.success && localResponse.results) {
            const localOrders = localResponse.results as DBOrder[];

            // Convert DBOrder to IOrder
            const convertedLocalOrders = localOrders.map(
              convertDBOrderToIOrder,
            );

            // Merge with server orders
            if (orders.length > 0) {
              // Create a map of orders by ID to avoid duplicates
              const orderMap = new Map<string, IOrder>();

              // Add server orders first
              orders.forEach((order) => orderMap.set(order.id, order));

              // Add local orders (pending ones will have different IDs)
              convertedLocalOrders.forEach((order) => {
                if (!orderMap.has(order.id)) {
                  orderMap.set(order.id, order);
                }
              });

              orders = Array.from(orderMap.values());
            } else {
              orders = convertedLocalOrders;
            }

            count = localResponse.count as number;

            // Set totals from local data when offline
            setTotalOrders(count);
            const localTotalSales = convertedLocalOrders.reduce(
              (acc, o) => acc + (o.total || 0),
              0,
            );
            setTotalSales(localTotalSales);
          }
        }
        setOrders(orders);
        setTotalCount(count);
      } catch (error) {
        toast.error("Failed to load orders");
        setOrders([]);
        setTotalCount(0);
        setTotalOrders(0);
        setTotalSales(0);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [isOnline],
  );

  // 9. EFFECT HOOKS: Adjust dependencies and remove wallet fetching
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedPaymentMethod, dateRange]);

  useEffect(() => {
    fetchOrdersData(
      currentPage,
      debouncedSearchTerm,
      selectedPaymentMethod,
      dateRange,
    );
  }, [
    fetchOrdersData,
    currentPage,
    debouncedSearchTerm,
    selectedPaymentMethod,
    dateRange,
  ]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchOrdersData(
        currentPage,
        debouncedSearchTerm,
        selectedPaymentMethod,
        dateRange,
      );
    };

    eventService.onRefresh(handleRefresh);

    return () => {
      eventService.offRefresh(handleRefresh);
    };
  }, [
    fetchOrdersData,
    currentPage,
    debouncedSearchTerm,
    selectedPaymentMethod,
    dateRange,
  ]);

  // 10. HANDLERS: Update handler logic
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilter = (filterValue: string) => {
    setSelectedPaymentMethod(filterValue);
  };

  const onViewDetails = async (item: IOrder) => {
    // Logic to open Order Details Modal (Uncomment and replace with your modal logic)

    const res = await openModal(OrderDetailsModal, {
      data: {
        title: "Order Details",
        subtitle: `Code: ${item.code}`,
        order: item,
      },
      size: "3xl",
      side: "right",

      backdropClose: true,
    });

    if (res?.action === "print_receipt") {
      handleOpenReceipt(item);
    }
    if (res?.action === "download_receipt") {
    }
  };

  const handleOpenReceipt = async (item: IOrder) => {
    await openModal(OrderReceipt, {
      data: {
        title: "Order Receipt",
        subtitle: `Code: ${item.code}`,
        order: item,
      },
      size: "xl",
      side: "right",
      backdropClose: false,
    });
  };

  // Manual sync trigger
  const handleManualSync = async () => {
    if (!isOnline) {
      toast.error("No internet connection");
      return;
    }

    try {
      toast.info("Syncing orders...");
      const result = await syncService.syncOrders();

      if (result.success) {
        // Refresh current view
        fetchOrdersData(1, searchTerm, selectedPaymentMethod);
        toast.success(`Orders synced successfully`);
      }
    } catch (error) {
      toast.error("Sync failed");
    }
  };

  //force sync a single order
  //eslint-disable-next-line
  const forceSyncSingleOrder = async (orderId: number) => {
    try {
      const result = await syncService.forceSyncOrder(orderId);
      if (result) {
      }
    } catch {
      toast.error("Sync single order failed");
    }
  };

  // 11. EXPORT LOGIC: Update export logic for Orders
  const handleExport = async (): Promise<void> => {
    setExportLoading(true);
    try {
      const payload = {
        page: currentPage,
        search: debouncedSearchTerm,
        payment_method: selectedPaymentMethod,
      };
      const res = await appService.getOrders(payload);

      if (res.success && res.results && res.results.length > 0) {
        const exportData: IOrder[] = res.results;

        const csvHeaders = [
          { key: "code", label: "Order Code" },
          { key: "customer", label: "Customer Name" },
          { key: "total", label: "Total Amount" },
          { key: "discount", label: "Discount" },
          { key: "payment.payment_method", label: "Payment Method" },
          { key: "created_at", label: "Order Date" },
          { key: "cashier", label: "Cashier ID" },
        ];

        const csvData = exportData.map((order: IOrder) => {
          const getNestedValue = (obj: any, path: string) => {
            return path
              .split(".")
              .reduce(
                (acc, part) =>
                  acc && acc[part] !== undefined ? acc[part] : "",
                obj,
              );
          };

          return {
            code: order.code,
            customer: order.customer,
            total: order.total,
            discount: order.discount,
            "payment.payment_method": getNestedValue(
              order,
              "payment.payment_method",
            ),
            created_at: new Date(order.created_at).toLocaleString(),
            cashier: order.cashier,
          };
        });

        const csvContent = await convertToCSV(csvData, csvHeaders);

        const timestamp = new Date().toISOString().split("T")[0];
        const filename = `orders-export-${timestamp}.csv`;

        await downloadCSV(csvContent, filename);

        toast.success("Export Successful", {
          description: `${exportData.length} order records exported successfully.`,
        });
      } else {
        toast.error("No Data", {
          description: "No order records found to export.",
        });
      }
    } catch (error) {
      toast.error("Export Error", {
        description: "Failed to export orders. Please try again.",
      });
    } finally {
      setExportLoading(false);
    }
  };
  const handleDateRangeChange = (dateRange: {
    start_date: string;
    end_date: string;
  }) => {
    setDateRange(dateRange);
  };

  // 12. RENDER: Remove Payout-specific UI elements (Wallet Summary)
  return (
    <div className="flex flex-col h-full">
      <div className="rounded-sm shadow-sm overflow-hidden flex-1 flex flex-col">
        <Breadcrumb
          breadcrumbs={breadcrumbs}
          pageTitle="Sales Orders"
          pageSubtitle="Review and manage sales transaction history"
          actions={actions}
        />

        {/* Removed Payout Wallet Summary/Request Section */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-3`}>
          <div className="bg-card rounded-sm p-4 item-center">
            <div className="text-sm text-text-light font-medium mb-1">
              Total Sales
            </div>
            <div className="text-2xl font-bold text-text">
              GHS {parseFloat(totalSales.toFixed(2))}
            </div>
            <div className="text-xs text-text-light mt-1">Ready for review</div>
          </div>

          <div className="bg-card rounded-sm p-4 item-center">
            <div className="text-sm text-text-light font-medium mb-1">
              Total Orders
            </div>
            <div className="text-2xl font-bold text-success">{totalOrders || 0}</div>
            <div className="text-xs text-text-light mt-1">All time orders</div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <DataTable
            columns={columns}
            data={orders}
            loading={loading}
            onSearch={handleSearch}
            filterOptions={paymentMethodOptions}
            onFilter={handleFilter}
            page={currentPage}
            count={totalCount}
            onPageChange={handlePageChange}
            customActions={getCustomActions}
            currentDateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            noDataMessage="No sales orders found."
            userRole={user?.role}
          />
        </div>
      </div>
    </div>
  );
}
