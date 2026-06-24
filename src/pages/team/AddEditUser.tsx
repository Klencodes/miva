import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  BuildingIcon,
} from "lucide-react";
import Input from "../../components/common/Input";
import { Button } from "../../components/common";
import { useModal } from "../../core/hooks/useModal";
import { Entity, IUser, UserPermissions } from "../../core/types";
import { Roles } from "../../core/enums/roles";
import UserService from "../../core/services/user";
import { useStore } from "../../core/contexts/StoreProvider";
// Define the form data type explicitly
type FormData = Partial<IUser> & {
  password?: string;
  entity_id?: string;
  permissions: UserPermissions;
};

const AddEditUser = () => {
  const { modalRef, modalData } = useModal();
  const { storeEntities, setStoreEntities } = useStore();
  const user = modalData?.user as IUser;
  const editing = !!user;
  const [loading, setLoading] = useState(false);
  const defaultPermissions: UserPermissions = {
    can_edit_inventory: false,
    can_delete_inventory: false,
    can_create_invoice: false,
    can_edit_invoice: false,
    can_delete_invoice: false,
    can_build_assembly: false,
    can_manage_users: false,
    can_view_reports: false,
    can_manage_settings: false,
    can_view_activity_logs: false,
  };

  const [formData, setFormData] = useState<FormData>({
    entity_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    role: Roles.SALES,
    entities: [],
    permissions: { ...defaultPermissions },
    is_active: true,
    verified: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        entity_id: user.entities?.map((e) => e.uuid) || [],
        permissions: user.permissions || { ...defaultPermissions },
        is_active: user.is_active !== undefined ? user.is_active : true,
      });
    }
    //eslint-disable-next-line
  }, [user]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name?.trim()) {
      newErrors.first_name = "First name is required";
    }
    if (!formData.last_name?.trim()) {
      newErrors.last_name = "Last name is required";
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

  const handleSubmit = async (e: React.FormEvent) => {
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
          const result = await UserService.updateUser(user?.uuid, formData);
          if (result.success) {
            modalData?.close({ action: "edit" });
          }
        } else {
          const createData = {
            entity_id: formData.entity_id || "",
            first_name: formData.first_name || "",
            last_name: formData.last_name || "",
            email: formData.email || "",
            phone: formData.phone || "",
            address: formData.address || "",
            role: formData.role || Roles.SALES,
            password: formData.password || "",
            permissions: formData.permissions,
            is_active: formData.is_active ?? true,
            verified: formData.verified ?? false,
          };
          const response = await UserService.createUser(createData);
          if (response.success) {
            modalData?.close({ action: "add" });
          }
        }
      } catch (error) {
        console.error("Error saving user:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle all input changes - detects if it's an event or direct value
  const handleInputChange = (field: keyof FormData) => (value: any) => {
    // If the value is an event object (from text inputs), extract the value
    const actualValue =
      value?.target?.value !== undefined ? value.target.value : value;

    setFormData((prev: FormData) => ({ ...prev, [field]: actualValue }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: "" }));
    }
  };

  // Handle permission changes
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

  const fetchEntities = useCallback(async () => {
    if (storeEntities?.length > 0 || editing) return;
    try {
      setLoading(true);
      const res = await UserService.getMyEntities();
      const entities: Entity[] = res?.results?.entities || [];

      // Filter out the "ALL_ENTITIES" entity
      const filteredEntities = entities.filter(
        (e: Entity) => e.uuid !== "ALL_ENTITIES",
      );

      setStoreEntities(filteredEntities);
    } catch (err) {
      console.error("Failed to load entities:", err);
    } finally {
      setLoading(false);
    }
  }, [storeEntities, setStoreEntities, editing]);

  useEffect(()=>{
    fetchEntities();
  },[fetchEntities])
  const entityOptions = useMemo(() => {
    return storeEntities.map((e) => ({
      value: e.uuid,
      label: `${e.branch || "Main"} | ${e.name}`,
    }));
  }, [storeEntities]);
  // Role options
  const roleOptions = [
    { value: Roles.SUPER_ADMIN, label: "Super Admin" },
    { value: Roles.ADMIN, label: "Admin" },
    { value: Roles.SALES, label: "Sales" },
    { value: Roles.TECHNICIAN, label: "Technician" },
    { value: Roles.VIEWER, label: "Viewer" },
  ];

  // Permission groups
  const permissionGroups = [
    {
      title: "Inventory",
      icon: <Package className="w-4 h-4" />,
      permissions: [
        { key: "can_edit_inventory" as const, label: "Edit Inventory" },
        { key: "can_delete_inventory" as const, label: "Delete Inventory" },
        { key: "can_build_assembly" as const, label: "Build Assembly" },
      ],
    },
    {
      title: "Invoices",
      icon: <FileText className="w-4 h-4" />,
      permissions: [
        { key: "can_create_invoice" as const, label: "Create Invoice" },
        { key: "can_edit_invoice" as const, label: "Edit Invoice" },
        { key: "can_delete_invoice" as const, label: "Delete Invoice" },
      ],
    },
    {
      title: "System",
      icon: <Settings className="w-4 h-4" />,
      permissions: [
        { key: "can_manage_users" as const, label: "Manage Users" },
        { key: "can_view_reports" as const, label: "View Reports" },
        { key: "can_manage_settings" as const, label: "Manage Settings" },
        { key: "can_view_activity_logs" as const, label: "View Activity Logs" },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 border-b border-border px-6 py-4 flex justify-between items-center bg-card">
        {/* Header */}
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
      <div className="flex-1 overflow-y-auto space-y-6 pb-4">
        <form className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-text-light flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <Input
                  type="text"
                  label="First Name"
                  placeholder="John"
                  value={formData.first_name}
                  onChange={handleInputChange("first_name")}
                  error={errors.first_name}
                  prefixIcon={<User size={16} />}
                  required
                  name="first_name"
                />
              </div>
              <div className="mb-4">
                <Input
                  type="text"
                  label="Last Name"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={handleInputChange("last_name")}
                  error={errors.last_name}
                  prefixIcon={<User size={16} />}
                  required
                  name="last_name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                value={formData.phone || ""}
                onChange={handleInputChange("phone")}
                placeholder="024-123-4567"
                error={errors.phone}
                prefixIcon={<Phone className="w-4 h-4" />}
                required
                disabled={isSubmitting}
              />
              <Input
                label="Email Address"
                type="email"
                value={formData.email || ""}
                onChange={handleInputChange("email")}
                placeholder="user@email.com"
                error={errors.email}
                prefixIcon={<Mail className="w-4 h-4" />}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Role"
                type="select"
                value={formData.role || Roles.VIEWER}
                onChange={handleInputChange("role")}
                selectOptions={roleOptions}
                selectPlaceholder="Select role"
                error={errors.role}
                prefixIcon={<Shield className="w-4 h-4" />}
                disabled={isSubmitting}
                required
              />
              <Input
                label="Address"
                value={formData.address || ""}
                onChange={handleInputChange("address")}
                placeholder="123 Street Name, City"
                prefixIcon={<MapPin className="w-4 h-4" />}
                disabled={isSubmitting}
              />
            </div>
            {/* {!editing &&  */}
              <div className="grid grid-cols-1 gap-4">
                <Input
                  type="multi-select"
                  label="Entity"
                  value={formData.entity_id || ""}
                  onChange={handleInputChange("entity_id")}
                  selectOptions={entityOptions}
                  selectPlaceholder="Select entity"
                  prefixIcon={<BuildingIcon size={14} />}
                  disabled={loading}
                />
              </div>
            {/* } */}
          </div>

          {/* Password */}
          <div className="space-y-4 border-t border-border pt-4">
            <h4 className="text-sm font-medium text-text-light flex items-center gap-2">
              <Key className="w-4 h-4" />
              {editing ? "Change Password (Optional)" : "Set Password"}
            </h4>

            <Input
              type={showPassword ? "text" : "password"}
              label="Password"
              value={formData.password || ""}
              onChange={handleInputChange("password")}
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
          <div className="space-y-4 border-t border-border pt-4">
            <h4 className="text-sm font-medium text-text-light flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Permissions
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {permissionGroups.map((group) => (
                <div
                  key={group.title}
                  className="border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-text">
                    {group.icon}
                    {group.title}
                  </div>
                  {group.permissions.map((perm) => (
                    <div key={perm.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={perm.key}
                        checked={formData.permissions?.[perm.key] || false}
                        onChange={() => handlePermissionChange(perm.key)}
                        disabled={isSubmitting}
                        className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                      />
                      <label
                        htmlFor={perm.key}
                        className="text-sm text-text-light cursor-pointer"
                      >
                        {perm.label}
                      </label>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-border p-4">
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
          onClick={handleSubmit}
          className="flex items-center gap-2"
          disabled={isSubmitting}
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? "Saving..." : editing ? "Update User" : "Create User"}
        </Button>
      </div>
    </div>
  );
};

export default AddEditUser;
