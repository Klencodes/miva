import { useCallback, useEffect, useState } from "react";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { appService } from "../../../core/services/app";

import { CustomAction, TableColumn } from "../../../core/interfaces/table";
import { DateFormatEnums } from "../../../core/utils/date-format";
import { useDebounce } from "../../../core/hooks/useDebounce";
import { eventService } from "../../../core/services/events";
import { PayoutDetailsModal } from "./PayoutDetailsModal";
import { useModal } from "../../../core/hooks/useModal";
import RequestPayoutModal from "./PayoutRequestModal";
import { IPayout, IPayoutWallet } from "../../../core/interfaces/IPayout";
import { useStore } from "../../../core/hooks/useStore";
import { Roles } from "../../../core/enums/roles";
import { convertToCSV, downloadCSV, onDownloadReceipt } from "../../../core/utils/fileFormators";
import { SelectOption } from "../../../core/interfaces/ISelectOption";
import { Breadcrumb, Button, DataTable } from "../../../ui";
import { IBreadcrumbItem, IBreadcrumbAction } from "../../../ui/components/Breadcrumb";
import { toast } from "sonner";



export default function PayoutsList() {
  const [payouts, setPayouts] = useState<IPayout[] | null>([]);
  const [payoutWallet, setPayoutWallet] = useState<IPayoutWallet | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [walletLoading, setWalletLoading] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { openModal } = useModal();
  const { user, entity } = useStore();
  
  usePageTitle("Payouts");

  const breadcrumbs: IBreadcrumbItem[] = [
    { label: "Store", url: "/store" },
    { label: "Payouts", url: "/payouts", isActive: true },
  ];

  const statusOptions: SelectOption[] = [
    { value: "all", label: "All" },
    { value: "Successful", label: "Successful" },
    { value: "Pending", label: "Pending" },
    { value: "Failed", label: "Failed" },
  ];

  const columns: TableColumn[] = [
    {
      header: "Reference",
      value: (item: IPayout) => item.reference,
      type: "column",
      bold: true
    },
    {
      header: "Account",
      value: (item: IPayout) => [
        item.payout_account.account_name,
        `${item.payout_account.account_type} • ${item.payout_account.bank}`
      ],
      type: "column",
    },
    {
      header: "Amount",
      value: (item: IPayout) => `${item.currency} ${parseFloat(item.amount).toLocaleString()}`,
      type: "column",
    },
    {
      header: "Status",
      value: (item: IPayout) => item.status,
      type: "status",
      statusClasses: (item: IPayout) => {
        switch (item.status) {
          case "Successful":
            return "bg-success-10 text-success";
          case "Pending":
            return "bg-info-10 text-info";
          case "Failed":
            return "bg-danger-10 text-danger";
          default:
            return "bg-gray-10 text-gray";
        }
      },
    },
    {
      header: "Account Number",
      value: (item: IPayout) => item.payout_account.account_number,
      type: "column",
    },
    {
      header: "Requested",
      value: (item: IPayout) => item.created,
      type: "date",
      format: DateFormatEnums.DATE_TIME_SHORT,
    },
    {
      header: "Completed",
      value: (item: IPayout) => item.time_completed,
      type: "date",
      format: DateFormatEnums.DATE_TIME_SHORT,
    },
  ];

const actions: IBreadcrumbAction[] = [
    {
      label: exportLoading ? "Exporting..." : "Export as CSV",
      action: () => handleExport(),
      icon: exportLoading ? "loader-4-line" : "download",
      size: "sm",
      variant: "outline",
      disabled: exportLoading,
    },
  ];

  const getCustomActions = (item: IPayout): CustomAction[] => [
    {
      title: "View Details",
      handler: () => onViewDetails(item),
      icon: "eye-line",
      classes: "",
    },
    // ...(item.status === "Pending" ? [{
    //   title: "Cancel Payout",
    //   handler: () => onCancelPayout(item),
    //   icon: "close-circle-line",
    //   classes: "text-danger hover:bg-danger-50",
    // }] : []),
  ];

  const fetchPayoutsData = useCallback(
    async (page: number, search: string, statusSelect: string): Promise<void> => {
      setLoading(true);
      try {
        const res = await appService.getPayouts(page, search, statusSelect);

        if (res.success) {
          setPayouts(res.results);
          setTotalCount(res.count);
        }
      } catch (err: any) {
        console.error("Failed to fetch payouts:", err);
        setPayouts([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchPayoutWallet = useCallback(async (): Promise<void> => {
    setWalletLoading(true);
    try {
      const res = await appService.getPayoutWallet();
      if (res.success) {
        setPayoutWallet(res.results);
      }
      
    } catch (err: any) {
      console.error("Failed to fetch payout wallet:", err);
      setPayoutWallet(null);
    } finally {
      setWalletLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedStatus]);

  useEffect(() => {
    fetchPayoutsData(currentPage, debouncedSearchTerm, selectedStatus);
    fetchPayoutWallet();
  }, [fetchPayoutsData, fetchPayoutWallet, currentPage, debouncedSearchTerm, selectedStatus]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchPayoutsData(currentPage, debouncedSearchTerm, selectedStatus);
      fetchPayoutWallet();
    };

    eventService.onRefresh(handleRefresh);

    return () => {
      eventService.offRefresh(handleRefresh);
    };
  }, [fetchPayoutsData, fetchPayoutWallet, currentPage, debouncedSearchTerm, selectedStatus]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleSort = (sortValue: string) => {
    setSelectedStatus(sortValue);
  };

    const openRequestPayoutModal = async () => {
 
    const availableAmount = payoutWallet ? parseFloat(payoutWallet.payout_amount_available) : 0;
    const currency = payoutWallet?.currency || "GHS";

    await openModal(RequestPayoutModal, {
      data: {
        title: "Request New Payout",
        subtitle: "Enter your payout details below",
        balance: availableAmount,
        currency,
      },
      size: "xl",
      backdropClose: false,
    });

  };
  
  const onViewDetails = async (item: IPayout) => {
    const result = await openModal(PayoutDetailsModal, {
      data: {
        title: "Payout Details",
        subtitle: `Reference: ${item.reference}`, 
        payout: item,
      },
      size: "3xl",
      backdropClose: true,
    });

    if (result?.action === "download_receipt" && entity) {
      onDownloadReceipt(entity, item);
    }
    if (result?.action === "complete") {
      fetchPayoutsData(currentPage, debouncedSearchTerm, selectedStatus);
      fetchPayoutWallet();
    }
}
 const isSuperAdmin = user?.role === Roles.SUPER_ADMIN;

   const handleExport = async (): Promise<void> => {
    setExportLoading(true);
    try {
      const res = await appService.getPayouts(1, '', '',);
      
      if (res.success && res.results && res.results.length > 0) {
        const exportData: IPayout[] = res.results;
        
        // FIX 1: Define CSV headers for Payout data
        const csvHeaders = [
          { key: 'id', label: 'Payout ID' },
          { key: 'reference', label: 'Reference' },
          { key: 'amount', label: 'Amount' },
          { key: 'currency', label: 'Currency' },
          { key: 'status', label: 'Status' },
          { key: 'payout_account.account_name', label: 'Account Name' },
          { key: 'payout_account.account_number', label: 'Account Number' },
          { key: 'payout_account.bank', label: 'Bank/Mobile Operator' },
          { key: 'created', label: 'Request Time' },
          { key: 'time_completed', label: 'Completion Time' },
        ];

        // FIX 2: Prepare data for CSV, handling nested objects
        const csvData = exportData.map((payout: IPayout) => {
          const getNestedValue = (obj: any, path: string) => {
            return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : '', obj);
          };

          return {
            id: payout.id.toUpperCase(),
            reference: payout.reference,
            amount: payout.amount,
            currency: payout.currency,
            status: payout.status, 
            'payout_account.account_name': getNestedValue(payout, 'payout_account.account_name'),
            'payout_account.account_number': getNestedValue(payout, 'payout_account.account_number'),
            'payout_account.bank': getNestedValue(payout, 'payout_account.bank'),
            created: new Date(payout.created).toLocaleString(), // Format date
            time_completed: payout.time_completed ? new Date(payout.time_completed).toLocaleString() : '',
          };
        });

        const csvContent = await convertToCSV(csvData, csvHeaders);
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `payouts-export-${timestamp}.csv`; // FIX: Change filename to Payouts
        
        await downloadCSV(csvContent, filename);

        // FIX 3: Add Success Toast
        toast.success("Export Successful", {description: `${exportData.length} payout records exported successfully.`});

      } else {
        // FIX 4: Add Warning Toast
        toast.error("No Data", {description: "No payout records found to export."});
      }
    } catch (error) {
      console.error("Error exporting payouts:", error);
      // FIX 5: Add Error Toast
      toast.error("Export Error", {description: "Failed to export payouts. Please try again."});
    } finally {
      setExportLoading(false);
    }
  };
 

  return (
    <div className="flex flex-col h-full">
      <div className="rounded-sm shadow-sm overflow-hidden flex-1 flex flex-col">
        <Breadcrumb
          breadcrumbs={breadcrumbs}
          pageTitle="Payouts"
          pageSubtitle="Manage Your Payout History and Requests"
          actions={actions}
        />
        
        {/* Payout Wallet Summary Section */}
        {payoutWallet && !walletLoading && (
            <div className={`grid grid-cols-1 md:grid-cols-${isSuperAdmin ? 2 : 3} gap-4 mb-3`}>              
            <div className="bg-card rounded-sm p-4 item-center">
                <div className="text-sm text-text-light font-medium mb-1">Available Balance</div>
                <div className="text-2xl font-bold text-text">
                  {payoutWallet.currency} {parseFloat(payoutWallet.payout_amount_available).toLocaleString()}
                </div>
                <div className="text-xs text-text-light mt-1">Ready for payout</div>
              </div>
              
              <div className="bg-card rounded-sm p-4 item-center">
                <div className="text-sm text-text-light font-medium mb-1">Total Paid Out</div>
                <div className="text-2xl font-bold text-success">
                  {payoutWallet.currency} {parseFloat(payoutWallet.payout_amount_paidout).toLocaleString()}
                </div>
                <div className="text-xs text-text-light mt-1">All time payouts</div>
              </div>
              
              {!isSuperAdmin && (
                <div className="bg-primary-50 rounded-sm p-4">
                <div className="text-sm text-white font-medium mb-1">Quick Actions</div>
                <Button
                    size="sm"
                  onClick={openRequestPayoutModal}
                >
                  Request Payout
                </Button>
                <div className="text-xs text-white mt-2">
                  Transfer funds to your bank account
                </div>
              </div>)}
            </div>
        )}

        <div className="overflow-y-auto flex-1">
          <DataTable
            columns={columns}
            data={payouts}
            loading={loading}
            onSearch={handleSearch}
            filterOptions={statusOptions}
            onFilter={handleSort}
            page={currentPage}
            limit={10}
            count={totalCount}
            onPageChange={handlePageChange}
            customActions={getCustomActions}
            noDataMessage="No payouts found. Request your first payout to get started."
          />
        </div>
      </div>
    </div>
  );
}