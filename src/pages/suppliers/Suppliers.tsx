import React, { useState, useRef, useEffect } from "react";
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
import { ColumnDef } from "../../components/common/Datatable";
import { useModal } from "../../core/hooks/useModal";
import { Supplier } from "../../core/types";
import AddEditSupplier from "./AddEditSupplier";
import SupplierDetails from "./SupplierDetails";
import SupplierService from "../../core/services/supplier";
import { toast } from "sonner";
import { usePageTitle } from "../../core/hooks/usePageTitle";
import { eventService } from "../../core/services/events";

const ListSuppliers: React.FC = () => {
  const { openModal } = useModal();
  usePageTitle("Suppliers");

  // ── State ──────────────────────────────────────────────────────────────────
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const LIMIT = 10;

  // ── Refs to always have latest values without re-creating fetch ────────────
  const searchRef = useRef(searchQuery);
  const filterStatusRef = useRef(filterStatus);
  const pageRef = useRef(page);

  useEffect(() => { searchRef.current = searchQuery; }, [searchQuery]);
  useEffect(() => { filterStatusRef.current = filterStatus; }, [filterStatus]);
  useEffect(() => { pageRef.current = page; }, [page]);

  // ── Helper functions ──────────────────────────────────────────────────────
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

  // ── Fetch (stable, never recreated) ───────────────────────────────────────
  const fetchSuppliers = useRef(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pageRef.current,
        limit: LIMIT,
      };

      if (searchRef.current) {
        params.search = searchRef.current;
      }

      if (filterStatusRef.current !== "all") {
        params.status = filterStatusRef.current;
      }

      const response = await SupplierService.getSuppliers(params);

      if (response.success) {
        setSuppliers(response.results || []);
        setCount(response.count || 0);
      } else {
        toast.error("Error", { description: response.message || "Failed to load suppliers" });
      }
    } catch (error: any) {
      console.error("Error fetching suppliers:", error);
      toast.error("Error", { description: error.message || "Failed to load suppliers" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }).current;

  // ── Trigger fetch when page / search / filter / refreshKey change ──────────
  useEffect(() => {
    fetchSuppliers();
    //eslint-disable-next-line
  }, [page, searchQuery, filterStatus, refreshKey]);

  // ── Listen for refresh events ──────────────────────────────────────────────
  useEffect(() => {
    const handleRefresh = () => setRefreshKey(prev => prev + 1);
    eventService.onRefresh(handleRefresh);
    return () => eventService.offRefresh(handleRefresh);
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSearch = (query: string) => {
    searchRef.current = query;
    pageRef.current = 1;
    setSearchQuery(query);
    // setPage(1);
  };

  const handleFilter = (filter: string) => {
    filterStatusRef.current = filter;
    pageRef.current = 1;
    setFilterStatus(filter);
    setPage(1);
  };

  const handleSort = (sortValue: string) => {
    if (!sortValue) return;
    const [field, direction] = sortValue.split('_');
    const dir = direction as 'asc' | 'desc';

    setSuppliers((prev) =>
      [...prev].sort((a, b) => {
        let cmp = 0;

        switch (field) {
          case "name":
            cmp = (a.name || "").localeCompare(b.name || "");
            break;
          case "created_at":
          case "newest":
          case "oldest":
            cmp = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
            break;
          case "total_orders":
          case "orders":
            cmp = (a.total_orders || 0) - (b.total_orders || 0);
            break;
          case "total_spent":
          case "spent":
            cmp = (a.total_spent || 0) - (b.total_spent || 0);
            break;
          case "status":
            cmp = (a.status || "").localeCompare(b.status || "");
            break;
          default:
            cmp = 0;
        }

        return dir === "asc" ? cmp : -cmp;
      })
    );
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSuppliers();
    toast.success("Success", { description: "Suppliers refreshed" });
  };

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  const handleAddSupplier = async (supplier?: Supplier) => {
    const result = await openModal(AddEditSupplier, {
      data: { supplier },
      size: "xl",
      side: "right",
    });

    if (result?.action === "add" && result?.supplier) {
      fetchSuppliers();
      toast.success("Success", {
        description: "Supplier created successfully",
      });
    } else if (result?.action === "edit" && result?.supplier) {
      fetchSuppliers();
      toast.success("Success", {
        description: "Supplier updated successfully",
      });
    }
  };

  const handleViewSupplier = async (supplier: Supplier) => {
    const result = await openModal(SupplierDetails, {
      data: { supplier },
      size: "2xl",
      side: "right",
    });

    if (result?.action === "edit") {
      handleAddSupplier(result?.supplier);
    }

    if (result?.action === "delete" && result?.success) {
      fetchSuppliers();
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this supplier? This action cannot be undone.",
      )
    ) {
      try {
        const response = await SupplierService.delete(supplierId);
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
  };

  const handleToggleStatus = async (supplier: Supplier) => {
    try {
      const newStatus = supplier.status === "active" ? "inactive" : "active";
      const response = await SupplierService.update(supplier.uuid, {
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
  };

  // ── Column definitions ─────────────────────────────────────────────────────
  const columns: ColumnDef[] = [
    {
      header: "SUPPLIER",
      sortable: true,
      sortField: "name",
      value: (item: Supplier) => {
        return [
          <div className="flex items-center space-x-3" key={item.uuid}>
            {/* <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
              {item.name?.charAt(0).toUpperCase() || "?"}
            </div> */}
            <div>
              <div className="font-medium text-text">{item.name}</div>
              <div className="text-xs text-text-light flex items-center gap-2">
                <Building className="w-3 h-3" />
                {item.address || "No address"}
              </div>
            </div>
          </div>
        ];
      },
      type: "column",
      bold: true,
      onClick: (item: Supplier) => handleViewSupplier(item),
    },
    {
      header: "CONTACTS",
      value: (item: Supplier) => {
        return [
          <div className="flex flex-col gap-1" key={item.uuid}>
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
        ];
      },
      type: "column",
    },
    {
      header: "ORDERS",
      sortable: true,
      sortField: "total_orders",
      value: (item: Supplier) => {
        return [
          <div className="flex items-center gap-2" key={item.uuid}>
            <Package className="w-4 h-4 text-text-light" />
            <span className="font-medium">{item.total_orders || 0}</span>
          </div>
        ];
      },
      type: "column",
    },
    {
      header: "TOTAL SPENT",
      sortable: true,
      sortField: "total_spent",
      value: (item: Supplier) => {
        return [
          <div className="flex items-center gap-2" key={item.uuid}>
            <span className="font-medium">
              {formatCurrency(item.total_spent)}
            </span>
          </div>
        ];
      },
      type: "column",
      bold: true,
    },
    {
      header: "JOINED",
      sortable: true,
      sortField: "created_at",
      value: (item: Supplier) => {
        return [
          <div className="flex items-center gap-2" key={item.uuid}>
            <Calendar className="w-4 h-4 text-text-light" />
            <span className="text-sm text-text">
              {formatDate(item.created_at)}
            </span>
          </div>
        ];
      },
      type: "column",
    },
    {
      header: "STATUS",
      sortable: true,
      sortField: "status",
      value: (item: Supplier) => {
        return [
          <div className="flex items-center gap-2" key={item.uuid}>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
            >
              {getStatusLabel(item.status)}
            </span>
          </div>
        ];
      },
      type: "column",
    },
  ];

  // ── Row actions ────────────────────────────────────────────────────────────
  const getCustomActions = (item: Supplier) => {
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
      classes: item.status === "active" ? "text-amber-600" : "text-emerald-600",
    });

    actions.push({
      title: "Delete",
      icon: "delete",
      handler: () => handleDeleteSupplier(item.uuid),
      classes: "text-danger",
    });

    return actions;
  };

  // ── Filter / sort option lists ─────────────────────────────────────────────
  const filterOptions = [
    { value: "all", label: "All Suppliers" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const sortOptions = [
    { value: "name_asc", label: "Name A-Z" },
    { value: "name_desc", label: "Name Z-A" },
    { value: "created_at_asc", label: "Oldest First" },
    { value: "created_at_desc", label: "Newest First" },
    { value: "total_orders_asc", label: "Least Orders" },
    { value: "total_orders_desc", label: "Most Orders" },
    { value: "total_spent_asc", label: "Lowest Spent" },
    { value: "total_spent_desc", label: "Highest Spent" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="">
      <div className="flex justify-between items-center pb-4">
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
          <Button onClick={() => handleAddSupplier()}>
            <Plus className="w-5 h-5" />
            Add Supplier
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        loading={loading}
        placeholder="Search by name, email, phone, or address..."
        searchLabel="Search Suppliers"
        noDataMessage={
          searchQuery || filterStatus !== "all"
            ? "No suppliers match your filters"
            : "No suppliers found. Add your first supplier!"
        }
        addButtonText="Add Supplier"
        page={page}
        limit={LIMIT}
        count={count}
        filterOptions={filterOptions}
        sortOptions={sortOptions}
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