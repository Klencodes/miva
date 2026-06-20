import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Plus, Mail, Phone } from "lucide-react";
import { Button, DataTable } from "../../components/common";
import { IUser } from "../../core/types";
import { Roles } from "../../core/enums/roles";
import { useModal } from "../../core/hooks/useModal";
import AddEditUser from "./AddEditUser";
import UserDetail from "./UserDetails";
import { eventService } from "../../core/services/events";
import UserService from "../../core/services/user"
const Users = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [count, setCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedSort, setSelectedSort] = useState("name_asc");
  const [refreshKey, setRefreshKey] = useState(0);
  const { openModal } = useModal();

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        is_active?: boolean;
      } = {
        page,
        limit,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (selectedFilter !== "all") {
        if (selectedFilter === "active") {
          params.is_active = true;
        } else if (selectedFilter === "inactive") {
          params.is_active = false;
        } else {
          params.role = selectedFilter;
        }
      }

      const response = await UserService.getUsers(params);
      
      if (response.success) {
        const userData = response.results?.users || [];
        setUsers(userData);
        setCount(response.results?.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchTerm, selectedFilter]);

  // Listen for entity refresh events
  useEffect(() => {
    const handleRefresh = () => {
      setRefreshKey(prev => prev + 1);
      fetchUsers();
    };

    eventService.onRefresh(handleRefresh);

    return () => {
      eventService.offRefresh(handleRefresh);
    };
  }, [fetchUsers]);

  // Fetch users on mount and when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, refreshKey]);

  // Filter options
  const filterOptions = [
    { value: "all", label: "All Users" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: Roles.SUPER_ADMIN, label: "Super Admin" },
    { value: Roles.ADMIN, label: "Admin" },
    { value: Roles.SALES, label: "Sales" },
    { value: Roles.TECHNICIAN, label: "Technician" },
    { value: Roles.VIEWER, label: "Viewer" },
  ];

  const sortOptions = [
    { value: "name_asc", label: "Name A-Z" },
    { value: "name_desc", label: "Name Z-A" },
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "role_asc", label: "Role A-Z" },
    { value: "role_desc", label: "Role Z-A" },
  ];

  // Sort users
  const sortedUsers = useMemo(() => {
    const result = [...users];

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
            (new Date(b.created_at || "").getTime() || 0) - 
            (new Date(a.created_at || "").getTime() || 0)
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            (new Date(a.created_at || "").getTime() || 0) - 
            (new Date(b.created_at || "").getTime() || 0)
        );
        break;
      case "role_asc":
        result.sort((a, b) => a.role.localeCompare(b.role));
        break;
      case "role_desc":
        result.sort((a, b) => b.role.localeCompare(a.role));
        break;
      default:
        break;
    }

    return result;
  }, [users, selectedSort]);

  // Get paginated data
  const paginatedData = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return sortedUsers.slice(start, end);
  }, [sortedUsers, page, limit]);

  // Helper functions
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-purple-100 text-purple-700",
      admin: "bg-blue-100 text-blue-700",
      sales: "bg-emerald-100 text-emerald-700",
      technician: "bg-amber-100 text-amber-700",
      viewer: "bg-slate-100 text-slate-700",
    };
    return colors[role] || "bg-slate-100 text-slate-700";
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Admin",
      sales: "Sales",
      technician: "Technician",
      viewer: "Viewer",
    };
    return labels[role] || role;
  };

  // Handler functions
  const handleAddUser = async (userData?: IUser) => {
    const result = await openModal(AddEditUser, {
      data: { user: userData },
      size: "xl",
      side: "right",
    });

    if (result?.action === "add" || result?.action === "edit") {
      fetchUsers(); 
    }
  };

  const handleViewUser = async (userData: IUser) => {
    const result = await openModal(UserDetail, {
      data: { user: userData },
      size: "xl",
      side: "right",
    });

    if (result?.action === "edit") {
      handleAddUser(result?.user);
    }
  };

  const handleDeleteUser = useCallback(async (userId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    ) {
      try {
        // const response = await UserService.deleteUser(userId);
        // if (response.success) {
          fetchUsers();
        // }
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  }, [fetchUsers]);

  const handleToggleActive = useCallback(async (userId: string) => {
    try {
      // const user = users.find(u => u.uuid === userId);
      // if (user) {
      //   const response = await UserService.toggleUserActive(userId, !user.is_active);
      //   if (response.success) {
          fetchUsers();
      //   }
      // }
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  }, [users, fetchUsers]);

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
      header: "User",
      value: (item: IUser) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
            {item.name.charAt(0).toUpperCase()}
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
      onClick: (item: IUser) => handleViewUser(item),
    },
    {
      header: "Phone",
      value: (item: IUser) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-text-light" />
          {item.phone}
        </div>
      ),
      type: "column" as const,
    },
    {
      header: "Role",
      value: (item: IUser) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(item.role)}`}
        >
          {getRoleLabel(item.role)}
        </span>
      ),
      type: "column" as const,
      sortable: true,
      sortField: "role",
    },
    {
      header: "Status",
      value: (item: IUser) => (
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.is_active !== false
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {item.is_active !== false ? "Active" : "Inactive"}
          </span>
          {item.verified && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              Verified
            </span>
          )}
        </div>
      ),
      type: "column" as const,
    },
    {
      header: "Last Login",
      value: (item: IUser) =>
        item.last_login ? (
          <div className="text-sm text-text-light">
            {new Date(item.last_login).toLocaleDateString()}
          </div>
        ) : (
          <span className="text-sm text-text-light">Never</span>
        ),
      type: "column" as const,
    },
  ];

  // Custom actions
  const getCustomActions = useCallback(
    (item: IUser) => {
      const actions = [];

      actions.push({
        title: "View Details",
        icon: "view",
        handler: () => handleViewUser(item),
      });

      actions.push({
        title: "Edit",
        icon: "edit",
        handler: () => handleAddUser(item),
      });

      actions.push({
        title: item.is_active !== false ? "Deactivate" : "Activate",
        icon: "check",
        handler: () => handleToggleActive(item.uuid || item.id),
        classes:
          item.is_active !== false ? "text-amber-600" : "text-emerald-600",
      });

      actions.push({
        title: "Delete",
        icon: "delete",
        handler: () => handleDeleteUser(item.uuid || item.id),
        classes: "text-danger",
      });

      return actions;
    },
    [handleViewUser, handleAddUser, handleToggleActive, handleDeleteUser],
  );

  return (
    <div className="space-y-4">
      {/* Header with Entity Dropdown */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-text">Users</h2>
          <p className="text-text-light text-sm">
            Manage system users and permissions
          </p>
          <div className="flex gap-4 mt-2 text-sm flex-wrap">
            <span>Total: {count}</span>
            <span className="text-emerald-600">
              Active: {users.filter((u) => u.is_active !== false).length}
            </span>
            <span className="text-purple-600">
              Super Admin:{" "}
              {users.filter((u) => u.role === Roles.SUPER_ADMIN).length}
            </span>
            <span className="text-blue-600">
              Admin: {users.filter((u) => u.role === Roles.ADMIN).length}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleAddUser()}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add User
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginatedData}
        loading={loading}
        placeholder="Search users by name, email, phone, or role..."
        searchLabel="Search Users"
        noDataMessage={
          searchTerm || selectedFilter !== "all"
            ? "No users match your filters"
            : "No users found. Add your first user!"
        }
        addButtonText="Add User"
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
        onAdd={handleAddUser}
      />
    </div>
  );
};

export default Users;