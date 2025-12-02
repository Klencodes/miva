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

import { StaffDetailsModal } from "./UserDetailModal";
import AddUserModal from "./AddUserModal";
import { Roles } from "../../../core/enums/roles";
import { useStore } from "../../../core/hooks/useStore";
import { eventService } from "../../../core/services/events";
import { IBreadcrumbAction, IBreadcrumbItem } from "../../../ui/components/Breadcrumb";
import { SelectOption } from "../../../core/interfaces/ISelectOption";
import { toast } from "sonner";
import { IUser } from "../../../core/interfaces/IUser";
import AssignUserEntity from "./AssignUserEntity";
import { authService } from "../../../core/services/auth";

const Users = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { openModal } = useModal();
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
      icon: "add",
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
      value: (item: IUser) => [
        `${item?.first_name} ${item.last_name}`,
        item?.username,
      ],
      type: "column",
    },
    {
      header: "Contact",
      value: (item: IUser) => [
        item.email,
        item.phone_number,
      ],
      type: "column",
    },
    // {
    //   header: "Access Status",
    //   value: (item: IUser) =>
    //     item.has_access
    //       ? "Access Granted"
    //       : "Access Denied",
          
    //   type: "status",
    //   statusClasses: (item: IEntity) =>
    //     item.has_access
    //       ? "bg-success-10 text-success"
    //       : "bg-danger-10 text-danger"
    // },

    {
      header: "Verified",
      value: (item: IUser) =>
        item.verified ? "Yes" : "No",
      type: "status",
      statusClasses: (item: IUser) =>
        item.verified
          ? "bg-success-10 text-success"
          : "bg-danger-10 text-danger",
    },
    {
      header: "Status",
      value: (item: IUser) =>
        item.deactivated
          ? "Deactivated"
          : "Active",
      type: "status",
      statusClasses: (item: IUser) =>
        item.deactivated
          ? "bg-danger-10 text-danger"
          : "bg-success-10 text-success",
    },
    {
      header: "Role",
      value: (item: IUser) =>
        initialCap(item.role || "") || "N/A",
      type: "column",
    },
    {
      header: "Signed Up",
      value: (item: IUser) => item.created_at,
      type: "date",
      format: DateFormatEnums.DATE_TIME_SHORT,
    },
  ];

  const initialCap = (str: string): string => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const onView = async (item: IUser) => {
    await openModal(StaffDetailsModal, {
      data: item,
      size: "xl",
      side: 'right',
    });
  };

  const openAssignModal = async (item: any) => {
    await openModal(AssignUserEntity, {
      data: item,
      size: "xl",
      side: 'right',
    });
  };

  const getUsers = useCallback(
    async (page: number, search: string): Promise<void> => {
      setLoading(true);
      try {
        const res = await authService.getUsers(page, search);

        if (res.success) {
          setUsers(res.results);
          setTotalCount(res.count!);
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

  const openAddModal = async (item?: IUser) => {
    const result = await openModal(AddUserModal, {
      data: item,
      size: "xl",
      side: 'right',
      backdropClose: false,
    });
    if (result?.success) {
      getUsers(currentPage, debouncedSearchTerm);
    }
  };

  const handleStateToggle = async (item: IUser) => {
    try {
      const res = await authService.updateUserState({
        user_id: item.id,
        deactivated: !item.deactivated,
      });
      if (res.success) {
        toast.success(
          "Success",
          {description: res.message || "User state updated successfully!",
          }
        );
        //look for update user in the list and updated user
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === item.id
              ? { ...u, deactivated: !item.deactivated  }
              : u
          )
        );
      } else {
        throw new Error(res.message || "Failed to update user state");
      }
    } catch (error: any) {
      toast.success("Error", {description: error.message || "Failed to update user state", });
    }
  };


  const handleRoleUpdate = async (item: IUser) => {
    try {
      const result = await openModal(RoleUpdateModal, {
        data: {
          role: item.role,
          user: item,
        },
        side: 'right',
        size: "xl",
        backdropClose: false,
      });

      if (result?.success && result.newRole) {
        // Prepare data for API
        const updateData = {
          user_id: item.id,
          role: result.newRole,
        };

        const response = await authService.updateUserRole(updateData);

        if (response.success) {
          toast.success("Success", {description: response.message, });
          getUsers(currentPage, debouncedSearchTerm);

        } else {
          throw new Error(response.message || "Failed to update role");
        }
      }
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error("Error", {description: error.message || "Failed to update user role", });
    }
  };

 const getCustomActions = (item: IUser): CustomAction[] => {
    const actions: CustomAction[] = [
      {
        title: "Edit User",
        handler: () => openAddModal(item),
        icon: "edit-line",
        classes: "",
      }, 
      {
        title: "View User",
        handler: () => onView(item),
        icon: "eye-line",
        classes: "",
      },
      {
        title: "Assign Entity",
        handler: () => openAssignModal(item),
        icon: "user-shared-line",
        classes: "",
      },
      {
        title: "Update Role",
        handler: () => handleRoleUpdate(item),
        icon: "user-shared-line",
        classes: "text-info hover:bg-info-50",
      },
     
    ];

    if (user?.role === Roles.SUPER_ADMIN) {
      actions.push({
        title: !item.deactivated ? "Deactivate" : "Activate",
        handler: () => handleStateToggle(item),
        icon: !item.deactivated ? "forbid-line" : "checkbox-circle-line",
        classes: !item.deactivated
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
      { value: "sales", label: "Sales" },
      { value: "operator", label: "Operator" },
    ],
    []
  );
  return (
    <div className="flex flex-col w-full h-full mx-auto">
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

     <div className=" flex-1">
       {/* Current Information */}
      <div className="bg-background rounded-sm p-3 mb-4">
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
