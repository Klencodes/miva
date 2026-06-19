import {
  X,
  Edit,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar,
  Check,
  X as XIcon,
  Package,
  FileText,
  Settings,
} from "lucide-react";
import { Button } from "../../components/common";
import { useModal } from "../../core/hooks/useModal";

const UserDetail = () => {
  const { modalData, modalRef } = useModal();
  const user = modalData?.user;
  if (!user) {
    return null;
  }

  const formatDate = (date?: Date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  const handleEdit = () => {
    modalRef?.close({ action: "edit" });
  };

  // Permission groups for display
  const permissionGroups = [
    {
      title: "Inventory",
      icon: <Package className="w-4 h-4" />,
      permissions: [
        { key: "canEditInventory", label: "Edit Inventory" },
        { key: "canDeleteInventory", label: "Delete Inventory" },
        { key: "canBuildAssembly", label: "Build Assembly" },
      ],
    },
    {
      title: "Invoices",
      icon: <FileText className="w-4 h-4" />,
      permissions: [
        { key: "canCreateInvoice", label: "Create Invoice" },
        { key: "canEditInvoice", label: "Edit Invoice" },
        { key: "canDeleteInvoice", label: "Delete Invoice" },
      ],
    },
    {
      title: "System",
      icon: <Settings className="w-4 h-4" />,
      permissions: [
        { key: "canManageUsers", label: "Manage Users" },
        { key: "canViewReports", label: "View Reports" },
        { key: "canManageSettings", label: "Manage Settings" },
        { key: "canViewActivityLogs", label: "View Activity Logs" },
      ],
    },
  ];

  return (
    <div className=" max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xl">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-text">{user.name}</h3>
            <p className="text-sm text-text-light">User Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleEdit}
            className="flex items-center gap-2"
            size="sm"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <button
            onClick={() => modalRef?.close()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-light" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Status Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              user.isActive !== false
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {user.isActive !== false ? "Active" : "Inactive"}
          </span>
          {user.verified && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Verified
            </span>
          )}
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}
          >
            {getRoleLabel(user.role)}
          </span>
        </div>

        {/* User Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-text-light mb-2">
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">Email</span>
            </div>
            <p className="text-text font-medium">{user.email}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-text-light mb-2">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">Phone</span>
            </div>
            <p className="text-text font-medium">{user.phone}</p>
          </div>

          {user.address && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 md:col-span-2">
              <div className="flex items-center gap-2 text-text-light mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">Address</span>
              </div>
              <p className="text-text font-medium">{user.address}</p>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-text-light mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Joined</span>
            </div>
            <p className="text-text font-medium">
              {formatDate(user.created_at)}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-text-light mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Last Login</span>
            </div>
            <p className="text-text font-medium">
              {formatDate(user.last_login)}
            </p>
          </div>
        </div>

        {/* Permissions */}
        <div className="space-y-4">
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
                {group.permissions.map((perm) => {
                  const hasPermission =
                    user.permissions?.[
                      perm.key as keyof typeof user.permissions
                    ] || false;
                  return (
                    <div key={perm.key} className="flex items-center gap-2">
                      {hasPermission ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XIcon className="w-4 h-4 text-red-400" />
                      )}
                      <span
                        className={`text-sm ${hasPermission ? "text-text" : "text-text-light"}`}
                      >
                        {perm.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
