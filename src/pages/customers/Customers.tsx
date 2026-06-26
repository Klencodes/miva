import { useState, useCallback, useEffect } from "react";
import {
  Plus,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Button, DataTable } from "../../components/common";
import { ICustomer } from "../../core/types";
import { useModal } from "../../core/hooks/useModal";
import { eventService } from "../../core/services/events";
import CustomerService from "../../core/services/customer";
import AddEditCustomer from "./AddEditCustomer";
import CustomerDetail from "./CustomerDetails";
import { toast } from "sonner";
import { usePageTitle } from "../../core/hooks/usePageTitle";
import ConfirmModal from "../../components/common/ConfirmModal";

const Customers = () => {
  const { openModal } = useModal();
  usePageTitle("Customers");
  // State management
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedSort, setSelectedSort] = useState("name_asc");
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 10;
  // Fetch customers from API
  const fetchCustomers = useCallback(async () => {
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

      if (selectedFilter === "active") {
        params.is_active = true;
      } else if (selectedFilter === "inactive") {
        params.is_active = false;
      }

      // Apply sorting
      switch (selectedSort) {
        case "name_asc":
          params.sort = "name_asc";
          break;
        case "name_desc":
          params.sort = "name_desc";
          break;
        case "balance_desc":
          params.sort = "balance_desc";
          break;
        case "balance_asc":
          params.sort = "balance_asc";
          break;
        case "newest":
          params.sort = "created_at_desc";
          break;
        case "oldest":
          params.sort = "created_at_asc";
          break;
        default:
          params.sort = "name_asc";
      }

      const response = await CustomerService.getCustomers(params);
      
      if (response.success) {
        const customerData = response.results || [];
        setCustomers(customerData);
        setCount(response.count || 0);
      } else {
        toast.error('Error', { description: response.message || 'Failed to load customers' });
      }
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast.error('Error', { description: error.message || 'Failed to load customers' });
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchTerm, selectedFilter, selectedSort]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      setRefreshKey(prev => prev + 1);
      fetchCustomers();
    };

    eventService.onRefresh(handleRefresh);

    return () => {
      eventService.offRefresh(handleRefresh);
    };
  }, [fetchCustomers]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers, refreshKey]);

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

  // Handler functions
  //eslint-disable-next-line
  const handleAddCustomer = async (customer?: ICustomer) => {
    const result = await openModal(AddEditCustomer, {
      data: { customer },
      size: "xl",
      side: "right",
    });

    if (result?.success) {
      fetchCustomers();
    }
  };
  //eslint-disable-next-line
  const handleViewCustomer = async (customer: ICustomer) => {
    const result = await openModal(CustomerDetail, {
      data: { customer },
      size: "xl",
      side: "right",
    });

    if (result?.action === "edit") {
      handleAddCustomer(result?.customer);
    }
  };

  const handleDeleteCustomer = useCallback(async (customerId: string) => {

      const res = await openModal(ConfirmModal,{
          data: {
            title: "Delete Customer",
            message: "Are you sure you want to delete this customer? This action cannot be undone."
          }
      })
    if (res?.confirmed) {
      try {
        const response = await CustomerService.deleteCustomer(customerId);
        if (response.success) {
          toast.success('Success', { description: response.message || 'Customer deleted successfully' });
          fetchCustomers();
        }
      } catch (error: any) {
        console.error('Error deleting customer:', error);
        toast.error('Error', { description: error.message || 'Failed to delete customer' });
      }
    }
    //esline-disable-next-line
  }, [fetchCustomers, openModal]);

  const handleToggleActive = useCallback(async (customerId: string) => {
    const customer = customers.find(c => c.uuid === customerId);
    if (!customer) return;

    try {
      const newStatus = customer.is_active === false ? true : false;
      const response = await CustomerService.toggleCustomerActive(customerId, newStatus);
      
      if (response.success) {
        toast.success('Success', { 
          description: `Customer ${newStatus ? 'activated' : 'deactivated'} successfully` 
        });
        fetchCustomers();
      }
    } catch (error: any) {
      console.error('Error toggling customer status:', error);
      toast.error('Error', { description: error.message || 'Failed to update customer status' });
    }
  }, [customers, fetchCustomers]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    // setPage(1);
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
      value: (item: ICustomer) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
            {item?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-text">{item.name}</div>
            <div className="text-xs text-text-light flex items-center gap-2">
              <Mail className="w-3 h-3" />
              {item.email || 'No email'}
            </div>
          </div>
        </div>
      ),
      type: "column" as const,
      sortable: true,
      sortField: "name",
      bold: true,
      onClick: (item: ICustomer) => handleViewCustomer(item),
    },
    {
      header: "Phone",
      value: (item: ICustomer) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-text-light" />
          {item.phone || '-'}
        </div>
      ),
      type: "column" as const,
    },
    {
      header: "Balance",
      value: (item: ICustomer) => (
        <div className="font-medium">
          <span className={item.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}>
            GHS {item.balance?.toFixed(2) || '0.00'}
          </span>
        </div>
      ),
      type: "column" as const,
    },
    {
      header: "Address",
      value: (item: ICustomer) => (
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-text-light mt-0.5" />
          <span className="text-sm">{item.address || '-'}</span>
        </div>
      ),
      type: "column" as const,
    },
    {
      header: "Tax ID",
      value: (item: ICustomer) => item.tax_id || "-",
      type: "column" as const,
    },
    {
      header: "Status",
      value: (item: ICustomer) => (
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
    (item: ICustomer) => {
      const actions = [];

      actions.push({
        title: "View Details",
        icon: "view",
        handler: () => handleViewCustomer(item),
      });

      actions.push({
        title: "Edit",
        icon: "edit",
        handler: () => handleAddCustomer(item),
      });

      actions.push({
        title: item.is_active !== false ? "Deactivate" : "Activate",
        icon: "check",
        handler: () => handleToggleActive(item.uuid || ""),
        classes:
          item.is_active !== false ? "text-amber-600" : "text-emerald-600",
      });

      actions.push({
        title: "Delete",
        icon: "delete",
        handler: () => handleDeleteCustomer(item.uuid || ""),
        classes: "text-danger",
      });

      return actions;
    },
    [
      handleViewCustomer,
      handleAddCustomer,
      handleToggleActive,
      handleDeleteCustomer,
    ],
  );

  return (
    <div className="space-y-4 p-6 sm:p-2">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text">Customers</h2>
          <p className="text-text-light text-sm">
            Manage your customer database
          </p>

        </div>
        <Button onClick={() => handleAddCustomer()} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Customer
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={customers}
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
        onAdd={() => handleAddCustomer()}
      />
    </div>
  );
};

export default Customers;