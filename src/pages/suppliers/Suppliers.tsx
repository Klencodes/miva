// features/suppliers/ListSuppliers.tsx
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Plus,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Check,
  X,
} from "lucide-react";
import { Button, DataTable } from "../../components/common";
import { useModal } from "../../core/hooks/useModal";

import { generateSampleSuppliers } from "../../data/sampleData";
import { Supplier } from "../../core/types";
import AddEditSupplier from "./AddEditSupplier";
import SupplierDetails from "./SupplierDetails";

const ListSuppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const stored = localStorage.getItem("SUPPLIERS");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((s: any) => ({
          ...s,
          created_at: s.created_at ? new Date(s.created_at) : undefined,
          updated_at: s.updated_at ? new Date(s.updated_at) : undefined,
        }));
      }
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
    return generateSampleSuppliers();
  });

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [count, setCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedSort, setSelectedSort] = useState("name_asc");
  const { openModal } = useModal();

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("SUPPLIERS", JSON.stringify(suppliers));
    } catch (error) {
      console.error("Error saving suppliers:", error);
    }
  }, [suppliers]);

  // Filter options
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

  // Filter and search suppliers
  const filteredSuppliers = useMemo(() => {
    let result = [...suppliers];

    if (selectedFilter === "active") {
      result = result.filter((s) => s.status === "active");
    } else if (selectedFilter === "inactive") {
      result = result.filter((s) => s.status === "inactive");
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.email.toLowerCase().includes(search) ||
          s.phone_number.includes(search) ||
          s.address.toLowerCase().includes(search) ||
          s.id.toLowerCase().includes(search),
      );
    }

    return result;
  }, [suppliers, selectedFilter, searchTerm]);

  // Sort suppliers
  const sortedSuppliers = useMemo(() => {
    const result = [...filteredSuppliers];

    switch (selectedSort) {
      case "name_asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "newest":
        result.sort(
          (a, b) =>
            (b.created_at ? new Date(b.created_at).getTime() : 0) -
            (a.created_at ? new Date(a.created_at).getTime() : 0),
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            (a.created_at ? new Date(a.created_at).getTime() : 0) -
            (b.created_at ? new Date(b.created_at).getTime() : 0),
        );
        break;
      case "orders_desc":
        result.sort((a, b) => (b.total_orders || 0) - (a.total_orders || 0));
        break;
      case "orders_asc":
        result.sort((a, b) => (a.total_orders || 0) - (b.total_orders || 0));
        break;
      case "spent_desc":
        result.sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0));
        break;
      case "spent_asc":
        result.sort((a, b) => (a.total_spent || 0) - (b.total_spent || 0));
        break;
      default:
        break;
    }

    return result;
  }, [filteredSuppliers, selectedSort]);

  // Update count
  useEffect(() => {
    setCount(sortedSuppliers.length);
  }, [sortedSuppliers.length]);

  // Get paginated data
  const paginatedData = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return sortedSuppliers.slice(start, end);
  }, [sortedSuppliers, page, limit]);

  // Helper functions
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

  // Handler functions
  const handleAddSupplier = async (supplier?: Supplier) => {
    const result = await openModal(AddEditSupplier, {
      data: { supplier },
      size: "xl",
      side: "right",
    });

    if (result?.action === "add" && result?.supplier) {
      const newSupplier: Supplier = {
        ...result.supplier,
        id:
          result.supplier.id ||
          `SUP-${String(suppliers.length + 1).padStart(3, "0")}`,
        created_at: new Date(),
        total_orders: 0,
        total_spent: 0,
        status: result.supplier.status || "active",
      };
      setSuppliers((prev) => [...prev, newSupplier]);
    } else if (result?.action === "edit" && result?.supplier) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === supplier?.id
            ? {
                ...s,
                ...result.supplier,
                updated_at: new Date(),
              }
            : s,
        ),
      );
    }
  };

  const handleViewSupplier = async (supplier: Supplier) => {
    const result = await openModal(SupplierDetails, {
      data: { supplier },
      size: "xl",
      side: "right",
    });

    if (result?.action === "edit") {
      handleAddSupplier(result?.supplier);
    }
  };

  const handleDeleteSupplier = useCallback((supplierId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this supplier? This action cannot be undone.",
      )
    ) {
      setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    }
  }, []);

  const handleToggleStatus = useCallback((supplierId: string) => {
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === supplierId
          ? {
              ...s,
              status: s.status === "active" ? "inactive" : "active",
              updated_at: new Date(),
            }
          : s,
      ),
    );
  }, []);

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

  // Table columns
  const columns = [
    {
      header: "SUPPLIER",
      value: (item: Supplier) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
            {item.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-text">{item.name}</div>
            <div className="text-xs text-text-light flex items-center gap-2">
              <Building className="w-3 h-3" />
              {item.address}
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
            {item.email}
          </div>
          <div className="text-sm text-text flex items-center gap-1">
            <Phone className="w-3 h-3 text-text-light" />
            {item.phone_code} {item.phone_number}
            {item.secondary_number && (
              <span className="text-text-light text-xs ml-1">
                (Alt: {item.secondary_code} {item.secondary_number})
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

  // Custom actions
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
        handler: () => handleToggleStatus(item.id),
        classes:
          item.status === "active" ? "text-amber-600" : "text-emerald-600",
      });

      actions.push({
        title: "Delete",
        icon: "delete",
        handler: () => handleDeleteSupplier(item.id),
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
          <div className="flex gap-4 mt-2 text-sm flex-wrap">
            <span>Total: {sortedSuppliers.length}</span>
            <span className="text-emerald-600">
              Active:{" "}
              {sortedSuppliers.filter((s) => s.status === "active").length}
            </span>
            <span className="text-red-600">
              Inactive:{" "}
              {sortedSuppliers.filter((s) => s.status === "inactive").length}
            </span>
            <span className="text-blue-600">
              Total Orders:{" "}
              {sortedSuppliers.reduce(
                (sum, s) => sum + (s.total_orders || 0),
                0,
              )}
            </span>
            <span className="text-purple-600">
              Total Spent:{" "}
              {formatCurrency(
                sortedSuppliers.reduce(
                  (sum, s) => sum + (s.total_spent || 0),
                  0,
                ),
              )}
            </span>
          </div>
        </div>
        <Button
          onClick={() => handleAddSupplier()}
          className="flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Supplier
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={paginatedData}
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
        count={count}
        sortOptions={sortOptions}
        filterOptions={filterOptions}
        customActions={getCustomActions}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onAdd={handleAddSupplier}
      />
    </div>
  );
};

export default ListSuppliers;
