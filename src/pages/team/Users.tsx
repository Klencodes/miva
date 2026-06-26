import React, { useState, useRef, useEffect } from "react";
import { Plus, Mail, Phone } from "lucide-react";
import { Button, DataTable } from "../../components/common";
import { ColumnDef } from "../../components/common/Datatable";
import { IUser } from "../../core/types";
import { Roles } from "../../core/enums/roles";
import { useModal } from "../../core/hooks/useModal";
import AddEditUser from "./AddEditUser";
import UserDetail from "./UserDetails";
import { eventService } from "../../core/services/events";
import UserService from "../../core/services/user";
import { usePageTitle } from "../../core/hooks/usePageTitle";
import { toast } from "sonner";
import ConfirmModal from "../../components/common/ConfirmModal";

const Users = () => {
  const { openModal } = useModal();
  usePageTitle("Teams");

  // ── State ──────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
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

  // ── Fetch (stable, never recreated) ───────────────────────────────────────
  const fetchUsers = useRef(async () => {
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
        if (filterStatusRef.current === "active") {
          params.is_active = true;
        } else if (filterStatusRef.current === "inactive") {
          params.is_active = false;
        } else {
          params.role = filterStatusRef.current;
        }
      }

      const response = await UserService.getUsers(params);

      if (response.success) {
        setUsers(response.results || []);
        setCount(response.count || 0);
      } else {
        toast.error("Error", { description: response.message || "Failed to load users" });
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Error", { description: error.message || "Failed to load users" });
    } finally {
      setLoading(false);
    }
  }).current;

  // ── Trigger fetch when page / search / filter / refreshKey change ──────────
  useEffect(() => {
    fetchUsers();
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

    setUsers((prev) =>
      [...prev].sort((a, b) => {
        let cmp = 0;

        switch (field) {
          case "name":
            cmp = (a.name || "").localeCompare(b.name || "");
            break;
          case "role":
            cmp = (a.role || "").localeCompare(b.role || "");
            break;
          case "newest":
          case "created_at":
            cmp = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
            break;
          case "oldest":
            cmp = new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
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

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  const handleAddUser = async (userData?: IUser) => {
    const result = await openModal(AddEditUser, {
      data: { user: userData },
      size: "xl",
      side: "right",
    });

    if (result?.action === "add" || result?.action === "edit") {
      fetchUsers();
      toast.success("Success", {
        description: result?.action === "add" ? "User created successfully" : "User updated successfully",
      });
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

  const handleDeleteUser = async (user: IUser) => {
    const res = await openModal(ConfirmModal, {
      data:{
        title: "Delete User",
        message: `Are you sure you want to delete ${user?.name}? This action cannot be undone.`
      }
    })
    if (res?.confirmed) {
      try {
        const response = await UserService.delete(user.uuid);
        if (response.success) {
          toast.success("Success", {
            description: "User deleted successfully",
          });
          fetchUsers();
        }
      } catch (error: any) {
        toast.error("Error", {
          description: error.message || "Failed to delete user",
        });
      }
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      const user = users.find(u => u.uuid === userId);
      if (user) {
        const response = await UserService.toggleActive(userId, !user.is_active);
        if (response.success) {
          toast.success("Success", {
            description: `User ${user.is_active !== false ? "deactivated" : "activated"} successfully`,
          });
          fetchUsers();
        }
      }
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to toggle user status",
      });
    }
  };

  // ── Column definitions ─────────────────────────────────────────────────────
  const columns: ColumnDef[] = [
    {
      header: "USER",
      sortable: true,
      sortField: "name",
      value: (item: IUser) => {
        return [
          <div className="flex items-center space-x-3" key={item.uuid}>
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
              {`${item.first_name?.charAt(0).toUpperCase()}${item.last_name?.charAt(0).toUpperCase()}`}
            </div>
            <div>
              <div className="font-medium text-text">{item.name}</div>
              <div className="text-xs text-text-light flex items-center gap-2">
                <Mail className="w-3 h-3" />
                {item.email}
              </div>
            </div>
          </div>
        ];
      },
      type: "column",
      bold: true,
      onClick: (item: IUser) => handleViewUser(item),
    },
    {
      header: "PHONE",
      value: (item: IUser) => {
        return [
          <div className="flex items-center gap-2" key={item.uuid}>
            <Phone className="w-4 h-4 text-text-light" />
            {item.phone || "—"}
          </div>
        ];
      },
      type: "column",
    },
    {
      header: "ROLE",
      sortable: true,
      sortField: "role",
      value: (item: IUser) => {
        return [
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(item.role)}`}
            key={item.uuid}
          >
            {getRoleLabel(item.role)}
          </span>
        ];
      },
      type: "column",
    },
    {
      header: "STATUS",
      value: (item: IUser) => {
        return [
          <div className="flex items-center gap-2" key={item.uuid}>
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
        ];
      },
      type: "column",
    },
    {
      header: "LAST LOGIN",
      value: (item: IUser) => {
        return [
          <div className="text-sm text-text-light" key={item.uuid}>
            {item.last_login ? (
              new Date(item.last_login).toLocaleDateString()
            ) : (
              <span className="text-sm text-text-light">Never</span>
            )}
          </div>
        ];
      },
      type: "column",
    },
  ];

  // ── Row actions ────────────────────────────────────────────────────────────
  const getCustomActions = (item: IUser) => {
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
      classes: item.is_active !== false ? "text-amber-600" : "text-emerald-600",
    });

    actions.push({
      title: "Delete",
      icon: "delete",
      handler: () => handleDeleteUser(item),
      classes: "text-danger",
    });

    return actions;
  };

  // ── Filter / sort option lists ─────────────────────────────────────────────
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
    { value: "created_at_asc", label: "Oldest First" },
    { value: "created_at_desc", label: "Newest First" },
    { value: "role_asc", label: "Role A-Z" },
    { value: "role_desc", label: "Role Z-A" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="">
      <div className="flex justify-between items-center pb-4">
        <div>
          <h2 className="text-2xl font-bold text-text">Users</h2>
          <p className="text-text-light text-sm">
            Manage system users and permissions
          </p>
        </div>
        <Button onClick={() => handleAddUser()}>
          <Plus className="w-5 h-5" />
          Add User
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        placeholder="Search by name, email, phone, or role..."
        searchLabel="Search Users"
        noDataMessage={
          searchQuery || filterStatus !== "all"
            ? "No users match your filters"
            : "No users found. Add your first user!"
        }
        addButtonText="Add User"
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
        onAdd={() => handleAddUser()}
      />
    </div>
  );
};

export default Users;