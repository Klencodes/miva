import React, { useState, useCallback, useEffect } from "react";
import {
  Plus,
  Mail,
  Phone,
  Building,
  Calendar,
  Package,
  RefreshCw,
} from "lucide-react";
import { Button, DataTable } from "../../components/common";
import { useModal } from "../../core/hooks/useModal";
import { Supplier } from "../../core/types";
import AddEditSupplier from "./AddEditSupplier";
import SupplierDetails from "./SupplierDetails";
import SupplierService from "../../core/services/supplier";
import { toast } from "sonner";

const ListSuppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedSort, setSelectedSort] = useState("name_asc");
  const { openModal } = useModal();
  const limit = 10;

  // ── Fetch suppliers from API ─────────────────────────────────────────────
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params: any = {
        page,
        limit,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (selectedFilter !== "all") {
        params.status = selectedFilter;
      }

      // Handle sorting
      switch (selectedSort) {
        case "name_asc":
          params.sort_by = "name";
          params.sort_order = "asc";
          break;
        case "name_desc":
          params.sort_by = "name";
          params.sort_order = "desc";
          break;
        case "newest":
          params.sort_by = "created_at";
          params.sort_order = "desc";
          break;
        case "oldest":
          params.sort_by = "created_at";
          params.sort_order = "asc";
          break;
        case "orders_desc":
          params.sort_by = "total_orders";
          params.sort_order = "desc";
          break;
        case "orders_asc":
          params.sort_by = "total_orders";
          params.sort_order = "asc";
          break;
        case "spent_desc":
          params.sort_by = "total_spent";
          params.sort_order = "desc";
          break;
        case "spent_asc":
          params.sort_by = "total_spent";
          params.sort_order = "asc";
          break;
        default:
          params.sort_by = "name";
          params.sort_order = "asc";
      }

      const response = await SupplierService.getSuppliers(params);
      
      if (response.success) {
        const suppliersData = response.results?.suppliers || [];
        setSuppliers(suppliersData);
        setTotalCount(response.results?.pagination?.total || 0);
      } else {
        toast.error("Error", {
          description: response.message || "Failed to load suppliers",
        });
      }
    } catch (error: any) {
      console.error("Error fetching suppliers:", error);
      toast.error("Error", {
        description: error.message || "Failed to load suppliers",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, searchTerm, selectedFilter, selectedSort]);

  // ── Load data on mount and when dependencies change ─────────────────────
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // ── Refresh handler ──────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSuppliers();
    toast.success("Success", { description: "Suppliers refreshed" });
  };

  // ── Helper functions ─────────────────────────────────────────────────────
  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700",
      inactive: "bg-red-100 text-red-700",
    };
    return colors[status || "inactive"] || "bg-slate-100 text-slate-700";
  };

  const getStatusLabel = (status?: string) => {
    const labels: Record<string, string> = {
      active: "Active",
      inactive: "Inactive",
    };
    return labels[status || "inactive"] || status;
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return `GHC${amount.toLocaleString()}`;
  };

  // ── Filter options ────────────────────────────────────────────────────────
  const filterOptions = [
    { value: "all", label: "All Suppliers" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const sortOptions = [
    { value: "name_asc", label: "Name A-Z" },
    { value: "name_desc", label: "Name Z-A" },
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "orders_desc", label: "Most Orders" },
    { value: "orders_asc", label: "Least Orders" },
    { value: "spent_desc", label: "Highest Spent" },
    { value: "spent_asc", label: "Lowest Spent" },
  ];

  // ── Handler functions ────────────────────────────────────────────────────
  // ── Handler functions ────────────────────────────────────────────────────
const handleAddSupplier = useCallback(async (supplier?: Supplier) => {
  const result = await openModal(AddEditSupplier, {
    data: { supplier },
    size: "xl",
    side: "right",
  });

  if (result?.action === "add" && result?.supplier) {
    // Refresh the list to get the newly created supplier
    fetchSuppliers();
    toast.success("Success", {
      description: "Supplier created successfully",
    });
  } else if (result?.action === "edit" && result?.supplier) {
    // Refresh the list to get the updated supplier
    fetchSuppliers();
    toast.success("Success", {
      description: "Supplier updated successfully",
    });
  }
}, [fetchSuppliers, openModal]);

const handleViewSupplier = useCallback(async (supplier: Supplier) => {
  const result = await openModal(SupplierDetails, {
    data: { supplier },
    size: "xl",
    side: "right",
  });

  if (result?.action === "edit") {
    handleAddSupplier(result?.supplier);
  }
  
  if (result?.action === "delete" && result?.success) {
    fetchSuppliers();
  }
}, [openModal, handleAddSupplier, fetchSuppliers]);

const handleDeleteSupplier = useCallback(async (supplierId: string) => {
  if (
    window.confirm(
      "Are you sure you want to delete this supplier? This action cannot be undone.",
    )
  ) {
    try {
      const response = await SupplierService.deleteSupplier(supplierId);
      if (response.success) {
        toast.success("Success", {
          description: "Supplier deleted successfully",
        });
        fetchSuppliers();
      }
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to delete supplier",
      });
    }
  }
}, [fetchSuppliers]);

const handleToggleStatus = useCallback(async (supplier: Supplier) => {
  try {
    const newStatus = supplier.status === "active" ? "inactive" : "active";
    const response = await SupplierService.updateSupplier(supplier.uuid, {
      status: newStatus,
    });
    
    if (response.success) {
      toast.success("Success", {
        description: `Supplier ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
      });
      fetchSuppliers();
    }
  } catch (error: any) {
    toast.error("Error", {
      description: error.message || "Failed to update supplier status",
    });
  }
}, [fetchSuppliers]);

const handleSearch = useCallback((term: string) => {
  setSearchTerm(term);
  setPage(1);
}, []);

const handleFilter = useCallback((filter: string) => {
  setSelectedFilter(filter);
  setPage(1);
}, []);

const handleSort = useCallback((sort: string) => {
  setSelectedSort(sort);
  setPage(1);
}, []);

const handlePageChange = useCallback((newPage: number) => {
  setPage(newPage);
}, []);
  // ── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      header: "SUPPLIER",
      value: (item: Supplier) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
            {item.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <div className="font-medium text-text">{item.name}</div>
            <div className="text-xs text-text-light flex items-center gap-2">
              <Building className="w-3 h-3" />
              {item.address || "No address"}
            </div>
          </div>
        </div>
      ),
      type: "column" as const,
      sortable: true,
      sortField: "name",
      bold: true,
      onClick: (item: Supplier) => handleViewSupplier(item),
    },
    {
      header: "CONTACTS",
      value: (item: Supplier) => (
        <div className="flex flex-col gap-1">
          <div className="text-sm text-text flex items-center gap-1">
            <Mail className="w-3 h-3 text-text-light" />
            {item.email || "N/A"}
          </div>
          <div className="text-sm text-text flex items-center gap-1">
            <Phone className="w-3 h-3 text-text-light" />
            {item.phone_code || ""} {item.phone_number || "N/A"}
            {item.secondary_number && (
              <span className="text-text-light text-xs ml-1">
                (Alt: {item.secondary_code || ""} {item.secondary_number})
              </span>
            )}
          </div>
        </div>
      ),
      type: "column" as const,
    },
    {
      header: "ORDERS",
      value: (item: Supplier) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-text-light" />
          <span className="font-medium">{item.total_orders || 0}</span>
        </div>
      ),
      type: "column" as const,
      sortable: true,
      sortField: "total_orders",
    },
    {
      header: "TOTAL SPENT",
      value: (item: Supplier) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {formatCurrency(item.total_spent)}
          </span>
        </div>
      ),
      type: "column" as const,
      sortable: true,
      sortField: "total_spent",
    },
    {
      header: "JOINED",
      value: (item: Supplier) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-text-light" />
          <span className="text-sm text-text">
            {formatDate(item.created_at)}
          </span>
        </div>
      ),
      type: "column" as const,
      sortable: true,
      sortField: "created_at",
    },
    {
      header: "STATUS",
      value: (item: Supplier) => (
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
          >
            {getStatusLabel(item.status)}
          </span>
        </div>
      ),
      type: "column" as const,
      sortable: true,
      sortField: "status",
    },
  ];

  // ── Custom actions ────────────────────────────────────────────────────────
  const getCustomActions = useCallback(
    (item: Supplier) => {
      const actions = [];

      actions.push({
        title: "View Details",
        icon: "view",
        handler: () => handleViewSupplier(item),
      });

      actions.push({
        title: "Edit",
        icon: "edit",
        handler: () => handleAddSupplier(item),
      });

      actions.push({
        title: item.status === "active" ? "Deactivate" : "Activate",
        icon: "check",
        handler: () => handleToggleStatus(item),
        classes:
          item.status === "active" ? "text-amber-600" : "text-emerald-600",
      });

      actions.push({
        title: "Delete",
        icon: "delete",
        handler: () => handleDeleteSupplier(item.uuid),
        classes: "text-danger",
      });

      return actions;
    },
    [
      handleViewSupplier,
      handleAddSupplier,
      handleToggleStatus,
      handleDeleteSupplier,
    ],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Suppliers</h2>
          <p className="text-text-light text-sm">
            Manage your suppliers and their information
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => handleAddSupplier()}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Supplier
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        loading={loading}
        placeholder="Search suppliers by name, email, phone, or address..."
        searchLabel="Search Suppliers"
        noDataMessage={
          searchTerm || selectedFilter !== "all"
            ? "No suppliers match your filters"
            : "No suppliers found. Add your first supplier!"
        }
        addButtonText="Add Supplier"
        page={page}
        limit={limit}
        count={totalCount}
        sortOptions={sortOptions}
        filterOptions={filterOptions}
        customActions={getCustomActions}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onAdd={() => handleAddSupplier()}
      />
    </div>
  );
};

export default ListSuppliers;