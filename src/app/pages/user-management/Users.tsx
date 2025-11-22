import { useCallback, useEffect, useMemo, useState } from "react";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import {
  Breadcrumb,
  Button,
  DataTable,
  Input,
} from "../../../ui";
import { CustomAction, TableColumn } from "../../../core/interfaces/table";
import { DateFormatEnums } from "../../../core/utils/date-format";
import { useModal } from "../../../core/hooks/useModal";
import { useDebounce } from "../../../core/hooks/useDebounce";
import { appService } from "../../../core/services/app";

import { StaffDetailsModal } from "./UserDetailModal";
import AddEditStaff from "./AddUserModal";
import { useToast } from "../../../core/hooks/useToast";
import { Roles } from "../../../core/enums/roles";
import { useStore } from "../../../core/hooks/useStore";
import { eventService } from "../../../core/services/events";
import { IEntity } from "../../../core/interfaces/IEntity";
import { IBreadcrumbAction, IBreadcrumbItem } from "../../../ui/components/Breadcrumb";
import { SelectOption } from "../../../core/interfaces/ISelectOption";

const Users = () => {
  const [users, setUsers] = useState<IEntity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { openModal } = useModal();
  const { show } = useToast();
  const { user } = useStore();
  usePageTitle("Users");

  const breadcrumbs: IBreadcrumbItem[] = [
    { label: "Dashboard", url: "/dashboard" },
    { label: "Users", url: "/users", isActive: true },
  ];

  const actions: IBreadcrumbAction[] = [
    {
      label: "Add New User",
      action: () => openAddModal(),
      icon: "plus",
      size: "sm",
      variant: "primary",
    },
  ];

  const sortOptions: SelectOption[] = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const columns: TableColumn[] = [
    {
      header: "User",
      value: (item: IEntity) => [
        `${item.user.first_name} ${item.user.last_name}`,
        item.user.username,
      ],
      type: "column",
    },
    {
      header: "Contact",
      value: (item: IEntity) => [
        item.user.email,
        item.user.phone_number,
      ],
      type: "column",
    },
    {
      header: "Access Status",
      value: (item: IEntity) =>
        item.has_access
          ? "Access Granted"
          : "Access Denied",
          
      type: "status",
      statusClasses: (item: IEntity) =>
        item.has_access
          ? "bg-success-10 text-success"
          : "bg-danger-10 text-danger"
    },

    {
      header: "Verified",
      value: (item: IEntity) =>
        item.user.verified ? "Yes" : "No",
      type: "status",
      statusClasses: (item: IEntity) =>
        item.user.verified
          ? "bg-success-10 text-success"
          : "bg-background-10 text-text",
    },
    {
      header: "Status",
      value: (item: IEntity) =>
        item.user.is_active
          ? "Active"
          : "Inactive",
      type: "status",
      statusClasses: (item: IEntity) =>
        item.user.is_active
          ? "bg-success-10 text-success"
          : "bg-danger-10 text-danger",
    },
    {
      header: "Role",
      value: (item: IEntity) =>
        initialCap(item.role || "") || "N/A",
      type: "column",
    },
    // {
    //   header: "Entity",
    //   value: (item: IEntity) => item.entity?.name || "N/A",
    //   type: "column",
    // },
    {
      header: "Signed Up",
      value: (item: IEntity) => item.user.signup_date,
      type: "date",
      format: DateFormatEnums.DATE_TIME_SHORT,
    },
  ];

  const initialCap = (str: string): string => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const onView = async (item: any) => {
    await openModal(StaffDetailsModal, {
      data: item,
      size: "xl",
    });
  };

  const getUsers = useCallback(
    async (page: number, search: string): Promise<void> => {
      setLoading(true);
      try {
        const res = await appService.getUsers(page, search);

        if (res.success) {
          setUsers(res.results);
          setTotalCount(res.count);
        }
      } catch (err: any) {
        console.log(err, "err");
      } finally {
        setLoading(false);
      }
    },
    []
  );


  useEffect(() => {
    getUsers(currentPage, debouncedSearchTerm);
  }, [getUsers, currentPage, debouncedSearchTerm]);

    useEffect(() => {
        const handleRefresh = () => {
          getUsers(currentPage, debouncedSearchTerm);
        };
        eventService.onRefresh(handleRefresh);
      
        return () => {
          eventService.offRefresh(handleRefresh);
        };
      }, [getUsers, currentPage, debouncedSearchTerm]); 
  

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const openAddModal = async (item?: IEntity) => {
    const result = await openModal(AddEditStaff, {
      data: item,
      size: "xl",
      backdropClose: false,
    });
    if (result?.success) {
      getUsers(currentPage, debouncedSearchTerm);
    }
  };

  const handleStateToggle = async (item: IEntity) => {
    try {
      const res = await appService.addNewUser({
        user_id: item.user.id,
        is_active: !item.user.is_active,
      });
      if (res.success) {
        show(
          "Success",
          res.message || "User state updated successfully!",
          "success"
        );
        //look for update user in the list and updated user
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.user.id === item.user.id
              ? { ...u, user: { ...u.user, has_access: !item.has_access } }
              : u
          )
        );
      } else {
        throw new Error(res.message || "Failed to update user state");
      }
    } catch (error: any) {
      console.error("Error updating user state:", error);
      show("Error", error.message || "Failed to update user state", "error");
    }
  };

   const handleHasAccessToggle = async (item: IEntity) => {
    try {
      const res = await appService.updateMerchantUserState({
        merchant_id: item.id,
        access: !item.has_access,
      });
      if (res.success) {
        show(
          "Success",
          res.message || "User state updated successfully!",
          "success"
        );
        //look for update user in the list and updated user
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.user.id === item.user.id
              ? { ...u, user: { ...u.user, has_access: !item.has_access } }
              : u
          )
        );
      } else {
        throw new Error(res.message || "Failed to update user state");
      }
    } catch (error: any) {
      console.error("Error updating user state:", error);
      show("Error", error.message || "Failed to update user state", "error");
    }
  };
  const handleRoleUpdate = async (item: IEntity) => {
    try {
      const result = await openModal(RoleUpdateModal, {
        data: {
          role: item.role,
          user: item.user,
          entity: item.entity,
        },
        size: "3xl",
        backdropClose: false,
      });

      if (result?.success && result.newRole) {
        // Prepare data for API
        const updateData = {
          merchant_id: item.id,
          role: result.newRole,
        };

        const response = await appService.updateUserRole(updateData);

        if (response.success) {
          show("Success", "User role updated successfully!", "success");
          getUsers(currentPage, debouncedSearchTerm);

        } else {
          throw new Error(response.message || "Failed to update role");
        }
      }
    } catch (error: any) {
      console.error("Error updating role:", error);
      show("Error", error.message || "Failed to update user role", "error");
    }
  };

 const getCustomActions = (item: IEntity): CustomAction[] => {
    const actions: CustomAction[] = [
      {
        title: "View User",
        handler: () => onView(item),
        icon: "eye-line",
        classes: "",
      },
      {
        title: "Update Role",
        handler: () => handleRoleUpdate(item),
        icon: "user-shared-line",
        classes: "text-info hover:bg-info-50",
      },
      {
        title: item.has_access ? "Deny Access" : "Grant Access",
        handler: () => handleHasAccessToggle(item),
        icon: item.has_access ? "forbid-line" : "checkbox-circle-line",
        classes: item.has_access
          ? "text-danger hover:bg-danger-50"
          : "text-success hover:bg-success-50",
      },
    ];

    if (user?.role === Roles.SUPER_ADMIN) {
      actions.push({
        title: item.user.is_active ? "Deactivate" : "Activate",
        handler: () => handleStateToggle(item),
        icon: item.user.is_active ? "forbid-line" : "checkbox-circle-line",
        classes: item.user.is_active
          ? "text-danger hover:bg-danger-50"
          : "text-success hover:bg-success-50",
      });
    }

    return actions;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="rounded-sm shadow-sm overflow-hidden flex-1 flex flex-col">
        <Breadcrumb
          breadcrumbs={breadcrumbs}
          pageTitle="Users"
          pageSubtitle="Manage application users and their profiles"
          actions={actions}
        />
        <div className="overflow-y-auto flex-1">
          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            sortOptions={sortOptions}
            customActions={getCustomActions}
            noDataMessage="No users found matching your criteria."
            page={currentPage}
            count={totalCount}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
          />
        </div>
      </div>
    </div>
  );
};

export default Users;

// Role Update Modal Component
const RoleUpdateModal = () => {
  const { modalRef, modalData } = useModal();
  const [selectedRole, setSelectedRole] = useState(modalData.role || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRole) {
      return;
    }

    setIsLoading(true);
    try {
      modalRef!.close({ success: true, newRole: selectedRole });
    } catch (error) {
      console.error("Error in role update modal:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const roleOptions = useMemo(
    () => [
      { value: "", label: "Select Role" },
      // { value: "owner", label: "Owner" },
      { value: "admin", label: "Administrator" },
      { value: "manager", label: "Manager" },
      { value: "operator", label: "Operator" },
      { value: "finance", label: "Finance" },
    ],
    []
  );
  return (
    <div className="flex flex-col w-full mx-auto p-4">
      {/* Header */}
      <div className="flex flex-row justify-between items-start mb-4">
        <div className="flex flex-col">
          <h2 className="text-xl text-text font-bold">Update User Role</h2>
          <h4 className="text-sm text-text-light mt-1">
            Change role for {modalData.user.first_name}{" "}
            {modalData.user.last_name}
          </h4>
        </div>
        <button
          onClick={() => modalRef!.dismiss()}
          className="w-6 h-6 rounded-full text-text-light hover:bg-background-50 transition-colors flex items-center justify-center"
          aria-label="Close modal"
        >
          <i className="ri-close-line text-lg"></i>
        </button>
      </div>

      {/* Current Information */}
      <div className="bg-background-50 rounded-sm p-3 mb-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-text-light">Current Role:</span>
            <p className="font-medium">
              {initialCap(modalData?.role || "N/A")}
            </p>
          </div>
          <div>
            <span className="text-text-light">Entity:</span>
            <p className="font-medium">{modalData.entity?.name || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Role Selection */}
      <div className="grid grid-cols-1 gap-4">
        <Input
          label="Select Role"
          type="select"
          value={selectedRole}
          onChange={(value) => setSelectedRole(value)}
          selectOptions={roleOptions}
          required={true}
        />
      </div>

      {/* Role Descriptions */}
      <div className="bg-info-5 border border-info-20 rounded-sm p-3 mb-6">
        <div className="flex items-start">
          <i className="ri-information-line text-info text-sm mr-2 mt-0.5"></i>
          <div className="text-xs text-info">
            <p className="font-medium mb-1">Role Permissions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Owner:</strong> Full system access and administration
              </li>
              <li>
                <strong>Admin:</strong> Administrative privileges
              </li>
              <li>
                <strong>Manager:</strong> Management level access
              </li>
              <li>
                <strong>Operator:</strong> Operational tasks and basic access
              </li>
              <li>
                <strong>Finance:</strong> Financial reporting and transactions
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-border">
        <Button
          onClick={() => modalRef!.dismiss()}
          disabled={isLoading}
          variant="ghost"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedRole || isLoading}
          variant="primary"
        >
          {isLoading ? "Updating..." : "Update Role"}
        </Button>
      </div>
    </div>
  );
};

// Helper function for role modal
const initialCap = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};
