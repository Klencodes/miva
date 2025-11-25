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
import { IResponse } from "../../../core/interfaces/IResponse";
import { indexedDBService } from "../../../core/services/indexdb";
import { DBOrder } from "../../../core/interfaces/IDBTypes";
import useNetworkStatus from "../../../core/hooks/useNetworkStatus";

export default function OrdersList() {
  // 1. STATE ADJUSTMENTS: Use IOrder interface and remove Payout/Wallet state
  const [orders, setOrders] = useState<IOrder[] | DBOrder[] | null>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("all");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { openModal } = useModal();
  const loadingRef = useRef(false);
  const isOnline = useNetworkStatus();

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  usePageTitle("Sales Orders");

  // 3. BREADCRUMBS: Update breadcrumbs
  const breadcrumbs: IBreadcrumbItem[] = [
    { label: "Dashboard", url: "/dashboard" },
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
      value: (item: IOrder) => item.cashier, // In a real app, you'd look up the user's name
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
      handler: () => handleOpenReceipt(item),
      icon: "printer-line",
      classes: "",
    },
    {
      title: "View Details",
      handler: () => onViewDetails(item),
      icon: "eye-line",
      classes: "",
    },
  ];

  // 8. DATA FETCHING: Update function to fetch Orders
  const fetchOrdersData = useCallback(
    async (
      pageParam: number = 1,
      search: string = "",
      payment_method: string = "All"
    ) => {
      if (loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);

      try {
        const payload = {
          page: pageParam,
          search,
          payment_method,
        };

        let response: IOrder[] | DBOrder[] = []; // Initialize as empty array
        let count = 0;

        if (isOnline) {
          try {
            const serverResponse: IResponse = await appService.getOrders(
              payload
            );

            if (serverResponse.success && serverResponse.results) {
              response = serverResponse.results as IOrder[];
              count = serverResponse.count as number;

              // Cache the results in IndexedDB
              if (currentPage === 1 && !search && payment_method === "All") {
                await indexedDBService.saveOrders(serverResponse.results);
                await indexedDBService.setLastSyncTime();
              }
            } else {
              throw new Error("Server response not successful");
            }
          } catch (serverError) {
            const localResponse = await indexedDBService.getAllOrders();
            response = localResponse.results as DBOrder[];
          }
        } else {
          const localResponse = await indexedDBService.getAllOrders();
          console.log(localResponse, "localResponselocalResponselocalResponselocalResponse")
          response = localResponse.results as DBOrder[];
          count = localResponse.count as number;
        }

        // Ensure orders is always an array
        setOrders(response);
        setTotalCount(count);
      } catch (error) {
        toast.error("Failed to load products");
        // Set empty array on error
        setOrders([]);
        setTotalCount(0);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    //eslint-disable-next-line
    [isOnline]
  );

  // 9. EFFECT HOOKS: Adjust dependencies and remove wallet fetching
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedPaymentMethod]);

  useEffect(() => {
    fetchOrdersData(currentPage, debouncedSearchTerm, selectedPaymentMethod);
  }, [
    fetchOrdersData,
    currentPage,
    debouncedSearchTerm,
    selectedPaymentMethod,
  ]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchOrdersData(currentPage, debouncedSearchTerm, selectedPaymentMethod);
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
      toast.info("Syncing data...");
      const result = await syncService.manualSync();

      if (result.products) {
        toast.success("Orders synced successfully");
        // Refresh current view
        fetchOrdersData(1, searchTerm, selectedPaymentMethod);
      }

      if (result.orders.success > 0) {
        toast.success(`${result.orders.success} orders synced`);
      }
    } catch (error) {
      toast.error("Sync failed");
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
                obj
              );
          };

          return {
            code: order.code,
            customer: order.customer,
            total: order.total,
            discount: order.discount,
            "payment.payment_method": getNestedValue(
              order,
              "payment.payment_method"
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

        <div className="overflow-y-auto flex-1">
          <DataTable
            columns={columns}
            data={orders}
            loading={loading}
            onSearch={handleSearch}
            filterOptions={paymentMethodOptions}
            onFilter={handleFilter}
            page={currentPage}
            limit={10}
            count={totalCount}
            onPageChange={handlePageChange}
            customActions={getCustomActions}
            noDataMessage="No sales orders found."
          />
        </div>
      </div>
    </div>
  );
}
