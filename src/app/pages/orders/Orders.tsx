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
import { EditOrderModal } from "./EditOrder"
type DisplayOrder = IOrder & {
  status?: string;
  synced_at?: string;
  entity_id?: string;
};

export default function OrdersList() {
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("all");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { openModal } = useModal();
  const loadingRef = useRef(false);
  const isOnline = useNetworkStatus();
  const entity = getStoredItem<IEntityItem | null>(ENTITY_KEY, null);
  const { user } = useStore();

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const [dateRange, setDateRange] = useState<{ start_date: string; end_date: string }>(() => {
    const today = new Date();
    return {
      start_date: today.toISOString().split("T")[0],
      end_date: today.toISOString().split("T")[0],
    };
  });

  usePageTitle("Sales Orders");

  const breadcrumbs: IBreadcrumbItem[] = [
    { label: "Store", url: "/store" },
    { label: "Orders", url: "/orders", isActive: true },
  ];

  const paymentMethodOptions: SelectOption[] = [
    { value: "all", label: "All Methods" },
    { value: "Cash", label: "Cash" },
    { value: "Mobile Money", label: "Mobile Money" },
  ];

  const columns: TableColumn[] = [
    {
      header: "Order Code",
      value: (item: IOrder) => item.code,
      type: "column",
      bold: true,
      onClick: (item: IOrder) => onViewDetails(item)
    },
    {
      header: "Customer",
      value: (item: IOrder) => item.customer,
      type: "column",
    },
    {
      header: "Items",
      value: (item: IOrder) => `${item.items.length} unique items`,
      type: "column",
    },
    {
      header: "Total Amount",
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
      statusClasses: (item: IOrder) => {
        switch (item.payment.payment_method) {
          case "Cash":        return "bg-success-10 text-success";
          case "Mobile Money": return "bg-info-10 text-info";
          default:            return "bg-gray-10 text-gray";
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

  const getCustomActions = (item: IOrder): CustomAction[] => [
    ...((user?.role === "admin" || user?.role === "super_admin") ? [{
      title: "Edit Order",
      handler: () => handleEditOrder(item),
      icon: "edit-line",
      classes: "",
    }] : []),
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
    if (!success) {
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

  const convertDBOrderToIOrder = (dbOrder: DBOrder): IOrder => ({
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
  } as IOrder & { status?: string; synced_at?: string; entity_id?: string });

  const fetchOrdersData = useCallback(
    async (
      pageParam = 1,
      search = "",
      payment_method = "all",
      dateRangeParam?: { start_date: string; end_date: string }
    ) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      try {
        let mergedOrders: IOrder[] = [];
        let count = 0;

        if (isOnline) {
          try {
            // FIX: pass start_date/end_date as flat fields, not nested under dateRange
            const serverPayload: any = {
              page: pageParam,
              search,
              payment_method,
            };
            if (dateRangeParam?.start_date) serverPayload.start_date = dateRangeParam.start_date;
            if (dateRangeParam?.end_date)   serverPayload.end_date   = dateRangeParam.end_date;

            const serverResponse = await appService.getOrders(serverPayload);

            if (serverResponse.success && serverResponse.results) {
              const serverOrders = serverResponse.results as IOrder[];
              count = serverResponse.count as number;
              setTotalOrders(serverResponse.total_orders || count);
              setTotalSales(serverResponse.total_sales || 0);

              await indexedDBService.saveOrders(serverOrders);

              // FIX: Always merge local pending orders (not synced yet) so they
              // show up in the list even when online — they are real sales.
              const localResponse = await indexedDBService.getPendingOrders();
              const localPending: DBOrder[] = localResponse.results || [];
              const converted = localPending.map(convertDBOrderToIOrder);

              // Deduplicate: server orders win by ID; pending orders have temp IDs
              const orderMap = new Map<string, IOrder>();
              serverOrders.forEach((o) => orderMap.set(o.id, o));
              converted.forEach((o) => {
                if (!orderMap.has(o.id)) orderMap.set(o.id, o);
              });

              mergedOrders = Array.from(orderMap.values());
              // Sort newest first
              mergedOrders.sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              );
              count = mergedOrders.length;
            }
          } catch (serverError) {
            console.log("Server fetch failed, falling back to local:", serverError);
          }
        }

        // Offline path OR server fetch failed and mergedOrders is still empty
        if (mergedOrders.length === 0) {
          const localResponse = await indexedDBService.getAllOrders({
            includePending: true,
            page: pageParam,
            search,
            payment_method,
            dateRange: dateRangeParam,
          });

          if (localResponse.success && localResponse.results) {
            const localOrders = localResponse.results as DBOrder[];
            mergedOrders = localOrders.map(convertDBOrderToIOrder);
            count = localResponse.count as number;

            setTotalOrders(count);
            setTotalSales(
              mergedOrders.reduce((acc, o) => acc + (o.total || 0), 0)
            );
          }
        }

        setOrders(mergedOrders);
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
    [isOnline]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedPaymentMethod, dateRange]);

  useEffect(() => {
    fetchOrdersData(currentPage, debouncedSearchTerm, selectedPaymentMethod, dateRange);
  }, [fetchOrdersData, currentPage, debouncedSearchTerm, selectedPaymentMethod, dateRange]);

  useEffect(() => {
    const handleRefresh = () =>
      fetchOrdersData(currentPage, debouncedSearchTerm, selectedPaymentMethod, dateRange);
    eventService.onRefresh(handleRefresh);
    return () => eventService.offRefresh(handleRefresh);
  }, [fetchOrdersData, currentPage, debouncedSearchTerm, selectedPaymentMethod, dateRange]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleSearch = (term: string) => setSearchTerm(term);
  const handleFilter = (filterValue: string) => setSelectedPaymentMethod(filterValue);

  const onViewDetails = async (item: IOrder) => {
    const res = await openModal(OrderDetailsModal, {
      data: { title: "Order Details", subtitle: `Code: ${item.code}`, order: item },
      size: "xl",
      side: "right",
      backdropClose: true,
    });
    if (res?.action === "print_receipt") handleOpenReceipt(item);
  };

  const handleOpenReceipt = async (item: IOrder) => {
    await openModal(OrderReceipt, {
      data: { title: "Order Receipt", subtitle: `Code: ${item.code}`, order: item },
      size: "lg",
      side: "right",
      backdropClose: false,
    });
  };

  const handleEditOrder = async (order: IOrder) => {
  const result = await openModal(EditOrderModal, {
    side: "right",
    size: "2xl",
    data: {
      order: order,
      title: "Edit Order",
      subtitle: `Modify order ${order.code}`,
      onOrderUpdated: () => {
            fetchOrdersData(currentPage, debouncedSearchTerm, selectedPaymentMethod, dateRange);
            // toast.success("Order updated successfully");
      }
    }
  });
  
  if (result?.action === "updated") {
    // Order was updated successfully
    console.log("Order updated:", result.order);
  }
};

  const handleManualSync = async () => {
    if (!isOnline) { toast.error("No internet connection"); return; }
    try {
      toast.info("Syncing orders...");
      const result = await syncService.syncOrders();
      if (result.success) {
        fetchOrdersData(1, searchTerm, selectedPaymentMethod, dateRange);
        toast.success("Orders synced successfully");
      }
    } catch { toast.error("Sync failed"); }
  };

  // FIX: export uses /all-style call with no page limit so all matching
  // orders are exported, not just the current page.
  const handleExport = async (): Promise<void> => {
    setExportLoading(true);
    try {
      const serverPayload: any = {
        search: debouncedSearchTerm,
        payment_method: selectedPaymentMethod,
      };
      if (dateRange?.start_date) serverPayload.start_date = dateRange.start_date;
      if (dateRange?.end_date)   serverPayload.end_date   = dateRange.end_date;

      const res = await appService.getOrders(serverPayload);

      if (res.success && res.results && res.results.length > 0) {
        const exportData: IOrder[] = res.results;

        const csvHeaders = [
          { key: "code",                    label: "Order Code" },
          { key: "customer",                label: "Customer Name" },
          { key: "total",                   label: "Total Amount" },
          { key: "discount",                label: "Discount" },
          { key: "payment.payment_method",  label: "Payment Method" },
          { key: "created_at",              label: "Order Date" },
          { key: "cashier",                 label: "Cashier" },
        ];

        const getNestedValue = (obj: any, path: string) =>
          path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : ""), obj);

        const csvData = exportData.map((order: IOrder) => ({
          code: order.code,
          customer: order.customer,
          total: order.total,
          discount: order.discount,
          "payment.payment_method": getNestedValue(order, "payment.payment_method"),
          created_at: new Date(order.created_at).toLocaleString(),
          cashier: order.cashier,
        }));

        const csvContent = await convertToCSV(csvData, csvHeaders);
        const timestamp = new Date().toISOString().split("T")[0];
        await downloadCSV(csvContent, `orders-export-${timestamp}.csv`);

        toast.success("Export Successful", {
          description: `${exportData.length} order records exported successfully.`,
        });
      } else {
        toast.error("No Data", { description: "No order records found to export." });
      }
    } catch {
      toast.error("Export Error", { description: "Failed to export orders. Please try again." });
    } finally {
      setExportLoading(false);
    }
  };

  const handleDateRangeChange = (dr: { start_date: string; end_date: string }) => {
    setDateRange(dr);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="rounded-sm shadow-sm overflow-hidden flex-1 flex flex-col">
        <Breadcrumb
          breadcrumbs={breadcrumbs}
          pageTitle="Sales Orders"
          pageSubtitle="Review and manage sales transaction history"
          actions={actions}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div className="bg-card rounded-sm p-4">
            <div className="text-sm text-text-light font-medium mb-1">Total Sales</div>
            <div className="text-2xl font-bold text-text">
              GHS {totalSales.toFixed(2)}
            </div>
            <div className="text-xs text-text-light mt-1">Ready for review</div>
          </div>
          <div className="bg-card rounded-sm p-4">
            <div className="text-sm text-text-light font-medium mb-1">Total Orders</div>
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