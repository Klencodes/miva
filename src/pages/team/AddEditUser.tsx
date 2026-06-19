import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Key,
  Package,
  FileText,
  Settings,
} from "lucide-react";
import Input from "../../components/common/Input";
import { Button } from "../../components/common";
import { useModal } from "../../core/hooks/useModal";
import { IUser, UserPermissions } from "../../core/types";
import { Roles } from "../../core/enums/roles";

// Define the form data type explicitly
type FormData = Partial<IUser> & {
  password?: string;
  permissions: UserPermissions;
};

const AddEditUser = () => {
  const { modalRef, modalData } = useModal();
  const user = modalData?.user as IUser;
  const editing = !!user;

  const defaultPermissions: UserPermissions = {
    canEditInventory: false,
    canDeleteInventory: false,
    canCreateInvoice: false,
    canEditInvoice: false,
    canDeleteInvoice: false,
    canBuildAssembly: false,
    canManageUsers: false,
    canViewReports: false,
    canManageSettings: false,
    canViewActivityLogs: false,
  };

  const [formData, setFormData] = useState<FormData>({
    name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    role: Roles.VIEWER,
    permissions: { ...defaultPermissions },
    isActive: true,
    verified: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        permissions: user.permissions || { ...defaultPermissions },
        isActive: user.isActive !== undefined ? user.isActive : true,
      });
    }
  }, [user]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    if (!editing && !formData.password) {
      newErrors.password = "Password is required for new users";
    } else if (!editing && formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      try {
        const saveData = { ...formData };
        // Remove password if empty
        if (!saveData.password) {
          delete saveData.password;
        }
        if (editing) {
          modalData?.close({ action: "edit", user: saveData });
        } else {
          modalData?.close({ action: "add", user: saveData });
        }
      } catch (error) {
        console.error("Error saving user:", error);
        alert("An error occurred while saving the user. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Fix: Use proper type for field key
  const handleInputChange = <K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ) => {
    setFormData((prev: FormData) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: "" }));
    }
  };

  // Fix: Properly typed permission handler
  const handlePermissionChange = (permission: keyof UserPermissions) => {
    setFormData((prev: FormData) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission],
      },
    }));
  };

  const handleClose = () => {
    if (!isSubmitting) {
      modalRef?.close();
    }
  };

  // Role options
  const roleOptions = [
    { value: Roles.SUPER_ADMIN, label: "Super Admin" },
    { value: Roles.ADMIN, label: "Admin" },
    { value: Roles.SALES, label: "Sales" },
    { value: Roles.TECHNICIAN, label: "Technician" },
    { value: Roles.VIEWER, label: "Viewer" },
  ];

  // Permission groups - Fix: Properly type the permission keys
  const permissionGroups = [
    {
      title: "Inventory",
      icon: <Package className="w-4 h-4" />,
      permissions: [
        { key: "canEditInventory" as const, label: "Edit Inventory" },
        { key: "canDeleteInventory" as const, label: "Delete Inventory" },
        { key: "canBuildAssembly" as const, label: "Build Assembly" },
      ],
    },
    {
      title: "Invoices",
      icon: <FileText className="w-4 h-4" />,
      permissions: [
        { key: "canCreateInvoice" as const, label: "Create Invoice" },
        { key: "canEditInvoice" as const, label: "Edit Invoice" },
        { key: "canDeleteInvoice" as const, label: "Delete Invoice" },
      ],
    },
    {
      title: "System",
      icon: <Settings className="w-4 h-4" />,
      permissions: [
        { key: "canManageUsers" as const, label: "Manage Users" },
        { key: "canViewReports" as const, label: "View Reports" },
        { key: "canManageSettings" as const, label: "Manage Settings" },
        { key: "canViewActivityLogs" as const, label: "View Activity Logs" },
      ],
    },
  ];

  return (
    <div className="">
      <div className="max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h3 className="text-lg font-semibold text-text">
              {editing ? "Edit User" : "Add New User"}
            </h3>
            <p className="text-sm text-text-light">
              {editing
                ? "Update user information and permissions"
                : "Enter user details and set permissions"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-text-light" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-text-light flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={formData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter full name"
                error={errors.name}
                prefixIcon={<User className="w-4 h-4" />}
                required
                disabled={isSubmitting}
              />

              <Input
                label="Email Address"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="user@email.com"
                error={errors.email}
                prefixIcon={<Mail className="w-4 h-4" />}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                value={formData.phone || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="024-123-4567"
                error={errors.phone}
                prefixIcon={<Phone className="w-4 h-4" />}
                required
                disabled={isSubmitting}
              />

              <Input
                label="Role"
                type="select"
                value={formData.role || Roles.VIEWER}
                onChange={(value) => handleInputChange("role", value)}
                selectOptions={roleOptions}
                selectPlaceholder="Select role"
                error={errors.role}
                prefixIcon={<Shield className="w-4 h-4" />}
                disabled={isSubmitting}
                required
              />
            </div>

            <Input
              label="Address"
              value={formData.address || ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="123 Street Name, City"
              prefixIcon={<MapPin className="w-4 h-4" />}
              disabled={isSubmitting}
            />
          </div>

          {/* Password */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium text-text-light flex items-center gap-2">
              <Key className="w-4 h-4" />
              {editing ? "Change Password (Optional)" : "Set Password"}
            </h4>

            <Input
              type={showPassword ? "text" : "password"}
              label="Password"
              value={formData.password || ""}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder={
                editing ? "Leave blank to keep current" : "Enter password"
              }
              error={errors.password}
              prefixIcon={<Key className="w-4 h-4" />}
              suffixIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-light hover:text-text"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              }
              disabled={isSubmitting}
              required={!editing}
            />
          </div>

          {/* Permissions */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium text-text-light flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Permissions
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {permissionGroups.map((group) => (
                <div
                  key={group.title}
                  className="border border-slate-200 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-text">
                    {group.icon}
                    {group.title}
                  </div>
                  {group.permissions.map((perm) => (
                    <div key={perm.key} className="flex items-center gap-2">
                      <Input
                        type="checkbox"
                        id={perm.key}
                        checked={formData.permissions?.[perm.key] || false}
                        onChange={() => handlePermissionChange(perm.key)}
                        disabled={isSubmitting}
                      />
                      <label
                        htmlFor={perm.key}
                        className="text-sm text-text-light"
                      >
                        {perm.label}
                      </label>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex items-center gap-2"
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4" />
              {isSubmitting
                ? "Saving..."
                : editing
                  ? "Update User"
                  : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditUser;
