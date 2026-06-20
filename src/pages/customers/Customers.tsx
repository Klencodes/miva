// features/customers/Customers.tsx
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Plus,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Building,
} from "lucide-react";
import { Button, DataTable } from "../../components/common";
import { Customer } from "../../core/types";
import { useNavigate } from "react-router-dom";
import { generateSampleCustomers } from "../../data/sampleData";
import { useModal } from "../../core/hooks/useModal";
import AddEditCustomer from "./AddEditCustomer";
import CustomerDetail from "./CustomerDetails";

const Customers = () => {
  const navigate = useNavigate();

  // State management
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const stored = localStorage.getItem("CUSTOMERS");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        }));
      }
    } catch (error) {
      console.error("Error loading customers:", error);
    }
    return generateSampleCustomers();
  });

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [count, setCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedSort, setSelectedSort] = useState("name_asc");
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { openModal } = useModal();

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("CUSTOMERS", JSON.stringify(customers));
    } catch (error) {
      console.error("Error saving customers:", error);
    }
  }, [customers]);

  // Filter options
  const filterOptions = [
    { value: "all", label: "All Customers" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const sortOptions = [
    { value: "name_asc", label: "Name A-Z" },
    { value: "name_desc", label: "Name Z-A" },
    { value: "balance_desc", label: "Highest Balance" },
    { value: "balance_asc", label: "Lowest Balance" },
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
  ];

  // Filter and search customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Apply status filter
    if (selectedFilter === "active") {
      result = result.filter((c) => c.is_active !== false);
    } else if (selectedFilter === "inactive") {
      result = result.filter((c) => c.is_active === false);
    }

    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          c.phone.includes(search) ||
          c.id.toLowerCase().includes(search),
      );
    }

    return result;
  }, [customers, selectedFilter, searchTerm]);

  // Sort customers
  const sortedCustomers = useMemo(() => {
    const result = [...filteredCustomers];

    switch (selectedSort) {
      case "name_asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "balance_desc":
        result.sort((a, b) => (b.balance || 0) - (a.balance || 0));
        break;
      case "balance_asc":
        result.sort((a, b) => (a.balance || 0) - (b.balance || 0));
        break;
      case "newest":
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case "oldest":
        result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      default:
        break;
    }

    return result;
  }, [filteredCustomers, selectedSort]);

  // Update count
  useEffect(() => {
    setCount(sortedCustomers.length);
  }, [sortedCustomers.length]);

  // Get paginated data
  const paginatedData = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return sortedCustomers.slice(start, end);
  }, [sortedCustomers, page, limit]);


  const addEditCustomer = async (customer?: Customer) => {
    const result = await openModal(AddEditCustomer, {
      data: { customer },
      size: "xl",
      side: "right",
    });

    if (result?.success) {
      setCustomers((prev) => [...prev, result?.customer]);
    }
  };

  const handleViewCustomer = async (customer: Customer) => {
    const result = await openModal(CustomerDetail, {
      data: { customer },
      size: "xl",
      side: "right",
    });

    if (result?.action === "edit") {
      addEditCustomer(result?.customer)
    }
  };

  const handleDeleteCustomer = useCallback((customerId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this customer? This action cannot be undone.",
      )
    ) {
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    }
  }, []);

  const handleToggleActive = useCallback((customerId: string) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              is_active: c.is_active === false ? true : false,
              updatedAt: new Date(),
            }
          : c,
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
      header: "Customer",
      value: (item: Customer) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
            {item?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-text">{item.name}</div>
            <div className="text-xs text-text-light flex items-center gap-2">
              <Mail className="w-3 h-3" />
              {item.email}
            </div>
          </div>
        </div>
      ),
      type: "column" as const,
      sortable: true,
      sortField: "name",
      bold: true,
      onClick: (item: Customer) => handleViewCustomer(item),
    },
    {
      header: "Phone",
      value: (item: Customer) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-text-light" />
          {item.phone}
        </div>
      ),
      type: "column" as const,
    },
    {
      header: "Address",
      value: (item: Customer) => (
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-text-light mt-0.5" />
          <span className="text-sm">{item.address}</span>
        </div>
      ),
      type: "column" as const,
    },
    {
      header: "Tax ID",
      value: (item: Customer) => item.taxId || "-",
      type: "column" as const,
    },
    {
      header: "Balance",
      value: (item: Customer) => (
        <div className="text-right">
          <div
            className={`font-semibold ${(item.balance || 0) > 0 ? "text-amber-600" : "text-emerald-600"}`}
          >
            GHS {(item.balance || 0).toFixed(2)}
          </div>
          {item.creditLimit && (
            <div className="text-xs text-text-light">
              Limit: GHS {item.creditLimit.toFixed(2)}
            </div>
          )}
        </div>
      ),
      type: "column" as const,
      sortable: true,
      sortField: "balance",
    },
    {
      header: "Status",
      value: (item: Customer) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.is_active !== false
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {item.is_active !== false ? "Active" : "Inactive"}
        </span>
      ),
      type: "column" as const,
    },
  ];

  // Custom actions
  const getCustomActions = useCallback(
    (item: Customer) => {
      const actions = [];

      actions.push({
        title: "View Details",
        icon: "view",
        handler: () => handleViewCustomer(item),
      });

      actions.push({
        title: "Edit",
        icon: "edit",
        handler: () => addEditCustomer(item),
      });

      actions.push({
        title: item.is_active !== false ? "Deactivate" : "Activate",
        icon: "check",
        handler: () => handleToggleActive(item.id),
        classes:
          item.is_active !== false ? "text-amber-600" : "text-emerald-600",
      });

      actions.push({
        title: "Delete",
        icon: "delete",
        handler: () => handleDeleteCustomer(item.id),
        classes: "text-danger",
      });

      return actions;
    },
    [
      handleViewCustomer,
      addEditCustomer,
      handleToggleActive,
      handleDeleteCustomer,
    ],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Customers</h2>
          <p className="text-text-light text-sm">
            Manage your customer database
          </p>
          <div className="flex gap-4 mt-2 text-sm flex-wrap">
            <span>Total: {sortedCustomers.length}</span>
            <span className="text-emerald-600">
              Active:{" "}
              {sortedCustomers.filter((c) => c.is_active !== false).length}
            </span>
            <span className="text-amber-600">
              With Balance:{" "}
              {sortedCustomers.filter((c) => (c.balance || 0) > 0).length}
            </span>
          </div>
        </div>
        <Button onClick={() => addEditCustomer()} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Customer
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={paginatedData}
        loading={loading}
        placeholder="Search customers by name, email, or phone..."
        searchLabel="Search Customers"
        noDataMessage={
          searchTerm || selectedFilter !== "all"
            ? "No customers match your filters"
            : "No customers found. Add your first customer!"
        }
        addButtonText="Add Customer"
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
        onAdd={addEditCustomer}
      />
    </div>
  );
};

export default Customers;
