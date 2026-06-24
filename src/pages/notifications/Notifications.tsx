// pages/Notifications.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Archive,
  Trash2,
  Filter,
  X,
  AlertCircle,
  CreditCard,
  FileText,
  Users,
  Building2,
  Settings,
  ChevronDown,
  Search,
  Loader2,
  LogIn,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { DateFormatEnums, formatDate } from "../../core/utils/date-format";
import { Button, Input } from "../../components/common";
import activityLogService from "../../core/services/activityLog";
import { usePageTitle } from "../../core/hooks/usePageTitle";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityLog {
  _id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  description: string;
  metadata: any;
  entity_id?: string;
  ip_address: string;
  user_agent: string;
  status: "success" | "failure";
  created_at: string;
  updated_at: string;
  __v: number;
}

interface Notification {
  id: string;
  uuid: string;
  type:
    | "invoice"
    | "payment"
    | "system"
    | "entity"
    | "user"
    | "alert"
    | "login"
    | "email";
  title: string;
  message: string;
  read: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
  status?: "success" | "failure";
  metadata?: {
    invoice_id?: string;
    invoice_number?: string;
    payment_id?: string;
    entity_id?: string;
    user_id?: string;
    email?: string;
    amount?: number;
    currency?: string;
    action_url?: string;
  };
  sender?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

interface NotificationGroup {
  date: string;
  notifications: Notification[];
}

// ─── Notification Item Component ─────────────────────────────────────────────

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
  onMarkUnread,
  onArchive,
  onDelete,
  onClick,
}) => {
  const [showActions, setShowActions] = useState(false);

  const getIcon = (type: string) => {
    const icons: Record<string, any> = {
      invoice: FileText,
      payment: CreditCard,
      entity: Building2,
      user: Users,
      system: Settings,
      alert: AlertCircle,
      login: LogIn,
      email: Mail,
    };
    const Icon = icons[type] || Bell;
    return Icon;
  };

  const getColor = (type: string, status?: string) => {
    // If status is failure, always show red
    if (status === "failure") {
      return "text-red-500 bg-red-50 dark:bg-red-950/30";
    }

    const colors: Record<string, string> = {
      invoice: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
      payment: "text-green-500 bg-green-50 dark:bg-green-950/30",
      entity: "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
      user: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30",
      system: "text-gray-500 bg-gray-50 dark:bg-gray-800/30",
      alert: "text-red-500 bg-red-50 dark:bg-red-950/30",
      login: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30",
      email: "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
    };
    return colors[type] || colors.system;
  };

  const Icon = getIcon(notification.type);
  const colorClass = getColor(notification.type, notification.status);

  return (
    <div
      className={`
        relative group flex items-start gap-3 p-4 border-b border-border
        hover:bg-background/50 transition-colors duration-150 cursor-pointer
        ${!notification.read ? "bg-primary-5/10 dark:bg-primary-950/20" : ""}
        ${notification.status === "failure" ? "border-l-4 border-l-red-500" : ""}
      `}
      onClick={() => onClick(notification)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Icon */}
      <div
        className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          ${colorClass}
        `}
      >
        <Icon size={18} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-text">
                {notification.title}
              </p>
              {notification.status === "failure" && (
                <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                  Failed
                </span>
              )}
              {notification.status === "success" && (
                <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-600 rounded">
                  Success
                </span>
              )}
            </div>
            <p className="text-sm text-text-light line-clamp-2 mt-0.5">
              {notification.message}
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <span className="text-xs text-text-light whitespace-nowrap">
              {formatDate(
                new Date(notification.created_at),
                DateFormatEnums.CHAT_TIME,
              )}
            </span>
            {!notification.read && (
              <span className="w-2 h-2 rounded-full bg-primary"></span>
            )}
          </div>
        </div>

        {/* Metadata */}
        {notification.metadata?.email && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
              {notification.metadata.email}
            </span>
          </div>
        )}

        {/* Actions */}
        <div
          className={`
            flex items-center gap-1 mt-2 transition-opacity duration-200
            ${showActions ? "opacity-100" : "opacity-0"}
          `}
        >
          {notification.read ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkUnread(notification.uuid);
              }}
              className="p-1 hover:bg-background rounded text-text-light hover:text-text"
              title="Mark as unread"
            >
              <Check size={14} />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.uuid);
              }}
              className="p-1 hover:bg-background rounded text-text-light hover:text-text"
              title="Mark as read"
            >
              <CheckCheck size={14} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive(notification.uuid);
            }}
            className="p-1 hover:bg-background rounded text-text-light hover:text-text"
            title="Archive"
          >
            <Archive size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.uuid);
            }}
            className="p-1 hover:bg-red-50 rounded text-text-light hover:text-red-500"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Notification Filters ────────────────────────────────────────────────────

interface FilterOptions {
  type: string;
  status: string;
  read: boolean | null;
  dateRange: string;
}

const NotificationFilters: React.FC<{
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  totalUnread: number;
}> = ({ filters, onFilterChange, totalUnread }) => {
  const [isOpen, setIsOpen] = useState(false);

  const filterTypes = [
    { value: "all", label: "All" },
    { value: "login", label: "Logins" },
    { value: "user", label: "Users" },
    { value: "email", label: "Emails" },
    { value: "invoice", label: "Invoices" },
    { value: "payment", label: "Payments" },
    { value: "entity", label: "Entities" },
    { value: "system", label: "System" },
    { value: "alert", label: "Alerts" },
  ];

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "success", label: "Success" },
    { value: "failure", label: "Failed" },
  ];

  const readOptions = [
    { value: "all", label: "All" },
    { value: "read", label: "Read" },
    { value: "unread", label: "Unread" },
  ];

  const dateRanges = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Unread count */}
      {totalUnread > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-10 text-primary rounded-full text-sm">
          <Bell size={14} />
          <span className="font-medium">{totalUnread}</span>
          <span className="text-text-light">unread</span>
        </div>
      )}

      {/* Filter dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 border border-border hover:bg-background transition-colors text-sm"
        >
          <Filter size={14} />
          <span>Filters</span>
          <ChevronDown size={14} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-72 bg-card border border-border shadow-lg p-4 z-50">
            {/* Type filter */}
            <div className="mb-3">
              <label className="text-xs font-medium text-text-light block mb-1.5">
                Type
              </label>
              <div className="flex flex-wrap gap-1">
                {filterTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() =>
                      onFilterChange({
                        ...filters,
                        type: type.value,
                      })
                    }
                    className={`
                      px-2.5 py-1 rounded text-xs transition-colors
                      ${
                        filters.type === type.value
                          ? "bg-primary text-white"
                          : "bg-background text-text-light hover:bg-background/80"
                      }
                    `}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status filter */}
            <div className="mb-3">
              <label className="text-xs font-medium text-text-light block mb-1.5">
                Status
              </label>
              <div className="flex gap-1">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      onFilterChange({
                        ...filters,
                        status: option.value,
                      })
                    }
                    className={`
                      px-2.5 py-1 rounded text-xs transition-colors
                      ${
                        filters.status === option.value
                          ? "bg-primary text-white"
                          : "bg-background text-text-light hover:bg-background/80"
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Read status filter */}
            <div className="mb-3">
              <label className="text-xs font-medium text-text-light block mb-1.5">
                Read Status
              </label>
              <div className="flex gap-1">
                {readOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      onFilterChange({
                        ...filters,
                        read:
                          option.value === "all"
                            ? null
                            : option.value === "read",
                      })
                    }
                    className={`
                      px-2.5 py-1 rounded text-xs transition-colors
                      ${
                        (option.value === "all" && filters.read === null) ||
                        (option.value === "read" && filters.read === true) ||
                        (option.value === "unread" && filters.read === false)
                          ? "bg-primary text-white"
                          : "bg-background text-text-light hover:bg-background/80"
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range filter */}
            <div>
              <label className="text-xs font-medium text-text-light block mb-1.5">
                Date Range
              </label>
              <div className="flex flex-wrap gap-1">
                {dateRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() =>
                      onFilterChange({
                        ...filters,
                        dateRange: range.value,
                      })
                    }
                    className={`
                      px-2.5 py-1 rounded text-xs transition-colors
                      ${
                        filters.dateRange === range.value
                          ? "bg-primary text-white"
                          : "bg-background text-text-light hover:bg-background/80"
                      }
                    `}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mark all as read */}
      {/* {totalUnread > 0 && (
        <button
          onClick={() => {
            setNotifications((prev: any) =>
              prev.map((n: Notification) => ({ ...n, read: true }))
            );
            toast.success("All notifications marked as read");
          }}
          className="text-sm text-primary hover:underline"
        >
          Mark all as read
        </button>
      )} */}
    </div>
  );
};

// ─── Empty State ─────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ filterApplied: boolean }> = ({
  filterApplied,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center mb-4">
      <Bell size={32} className="text-text-light" />
    </div>
    <h3 className="text-lg font-semibold text-text mb-2">
      {filterApplied ? "No matching notifications" : "All caught up!"}
    </h3>
    <p className="text-sm text-text-light text-center max-w-sm">
      {filterApplied
        ? "Try adjusting your filters to see more notifications"
        : "You have no notifications at the moment. We'll notify you when something needs your attention."}
    </p>
  </div>
);

// ─── Helper Functions ────────────────────────────────────────────────────────

const mapActionToType = (action: string): Notification["type"] => {
  const actionMap: Record<string, Notification["type"]> = {
    LOGIN: "login",
    LOGOUT: "login",
    USER_CREATED: "user",
    USER_UPDATED: "user",
    USER_DELETED: "user",
    USER_ROLE_CHANGED: "user",
    EMAIL_VERIFIED: "email",
    EMAIL_SENT: "email",
    PASSWORD_RESET: "email",
    INVOICE_CREATED: "invoice",
    INVOICE_UPDATED: "invoice",
    INVOICE_DELETED: "invoice",
    INVOICE_SENT: "invoice",
    INVOICE_MARKED_PAID: "payment",
    INVOICE_PAYMENT_ADDED: "payment",
    ENTITY_CREATED: "entity",
    ENTITY_UPDATED: "entity",
    ENTITY_DELETED: "entity",
    SYSTEM_MAINTENANCE: "system",
    ALERT: "alert",
  };
  return actionMap[action] || "system";
};

const generateNotificationTitle = (log: ActivityLog): string => {
  const titles: Record<string, string> = {
    LOGIN: "User Login",
    LOGOUT: "User Logout",
    USER_CREATED: "New User Created",
    USER_UPDATED: "User Updated",
    USER_DELETED: "User Removed",
    USER_ROLE_CHANGED: "User Role Changed",
    EMAIL_VERIFIED: "Email Verified",
    EMAIL_SENT: "Email Sent",
    PASSWORD_RESET: "Password Reset",
    INVOICE_CREATED: "New Invoice Created",
    INVOICE_UPDATED: "Invoice Updated",
    INVOICE_DELETED: "Invoice Deleted",
    INVOICE_SENT: "Invoice Sent",
    INVOICE_MARKED_PAID: "Invoice Marked as Paid",
    INVOICE_PAYMENT_ADDED: "Payment Received",
    ENTITY_CREATED: "New Entity Created",
    ENTITY_UPDATED: "Entity Updated",
    ENTITY_DELETED: "Entity Deleted",
  };
  return titles[log.action] || log.action.replace(/_/g, " ").toUpperCase();
};

const generateNotificationMessage = (log: ActivityLog): string => {
  return log.description;
};

// ─── Main Component ──────────────────────────────────────────────────────────

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    type: "all",
    status: "all",
    read: null,
    dateRange: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  usePageTitle("Notifications");
  // Fetch activity logs as notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status !== "all" ? filters.status : undefined,
        action: filters.type !== "all" ? filters.type.toUpperCase() : undefined,
        search: searchTerm || undefined,
      };

      // Add date range
      if (filters.dateRange !== "all") {
        const date = new Date();
        switch (filters.dateRange) {
          case "today":
            params.date_from = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
            ).toISOString();
            break;
          case "week":
            const weekAgo = new Date(date);
            weekAgo.setDate(weekAgo.getDate() - 7);
            params.date_from = weekAgo.toISOString();
            break;
          case "month":
            const monthAgo = new Date(date);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            params.date_from = monthAgo.toISOString();
            break;
          case "year":
            const yearAgo = new Date(date);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            params.date_from = yearAgo.toISOString();
            break;
        }
      }


      const response = await activityLogService.getActivityLogs(params);

      if (response.success && response.results) {
        // Handle different response structures
        let logs: ActivityLog[] = [];
        let total = 0;
        let totalPages = 0;

        if (Array.isArray(response.results)) {
          logs = response.results;
          total = logs.length;
        } else if (response.results.logs) {
          logs = response.results.logs;
          total = response.results.pagination?.total || logs.length;
          totalPages = response.results.pagination?.totalPages || 0;
        } else if (response.results.data) {
          logs = response.results.data;
          total = response.results.pagination?.total || logs.length;
          totalPages = response.results.pagination?.totalPages || 0;
        }


        setPagination((prev) => ({
          ...prev,
          total: total,
          totalPages: totalPages,
        }));

        // Convert activity logs to notifications
        const notificationsData: Notification[] = logs.map((log) => ({
          id: log._id,
          uuid: log._id,
          type: mapActionToType(log.action),
          title: generateNotificationTitle(log),
          message: generateNotificationMessage(log),
          read: false,
          archived: false,
          status: log.status,
          created_at: log.created_at,
          updated_at: log.updated_at,
          metadata: {
            email: log.metadata?.email,
            ...log.metadata,
          },
          sender: {
            name: log.user_name || "System",
            email: log.user_id || "system@mivaprestige.com",
          },
        }));

        setNotifications(notificationsData);
      } else {
        console.log("No results in response");
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Error", { description: "Failed to load notifications" });
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    filters.type,
    filters.status,
    filters.dateRange,
    searchTerm,
  ]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Filter notifications (client-side filtering for read status)
  const filteredNotifications = notifications.filter((notif) => {
    // Read filter
    if (filters.read !== null && notif.read !== filters.read) return false;
    return true;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce<
    NotificationGroup[]
  >((groups, notif) => {
    const date = new Date(notif.created_at);
    const dateStr = formatDate(date, DateFormatEnums.SHORT_DATE);
   

    const existingGroup = groups.find((g) => g.date === dateStr);
    if (existingGroup) {
      existingGroup.notifications.push(notif);
    } else {
      groups.push({ date: dateStr, notifications: [notif] });
    }
    return groups;
  }, []);

  // Stats
  const totalUnread = notifications.filter((n) => !n.read).length;
  const totalArchived = notifications.filter((n) => n.archived).length;

  // Handlers
  const handleMarkRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.uuid === id
          ? { ...n, read: true, updated_at: new Date().toISOString() }
          : n,
      ),
    );
    toast.success("Marked as read");
  }, []);

  const handleMarkUnread = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.uuid === id
          ? { ...n, read: false, updated_at: new Date().toISOString() }
          : n,
      ),
    );
    toast.success("Marked as unread");
  }, []);

  const handleArchive = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.uuid === id
          ? { ...n, archived: true, updated_at: new Date().toISOString() }
          : n,
      ),
    );
    toast.success("Archived");
  }, []);

  const handleDelete = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.uuid !== id));
    toast.success("Deleted");
  }, []);

  const handleClick = useCallback(
    (notification: Notification) => {
      // Mark as read if not already
      if (!notification.read) {
        handleMarkRead(notification.uuid);
      }
    },
    [handleMarkRead],
  );

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map((n) => n.uuid));
    }
  }, [selectedIds, filteredNotifications]);

  const handleBulkMarkRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) =>
        selectedIds.includes(n.uuid)
          ? { ...n, read: true, updated_at: new Date().toISOString() }
          : n,
      ),
    );
    setSelectedIds([]);
    toast.success(`${selectedIds.length} notifications marked as read`);
  }, [selectedIds]);

  const handleBulkArchive = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) =>
        selectedIds.includes(n.uuid)
          ? { ...n, archived: true, updated_at: new Date().toISOString() }
          : n,
      ),
    );
    setSelectedIds([]);
    toast.success(`${selectedIds.length} notifications archived`);
  }, [selectedIds]);

  const handleBulkDelete = useCallback(() => {
    setNotifications((prev) =>
      prev.filter((n) => !selectedIds.includes(n.uuid)),
    );
    setSelectedIds([]);
    toast.success(`${selectedIds.length} notifications deleted`);
  }, [selectedIds]);

  const handleLoadMore = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      page: prev.page + 1,
    }));
  }, []);

  if (loading && pagination.page === 1) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto" />
          <p className="text-text-light mt-4 text-sm">
            Loading notifications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text">Notifications</h1>
            <p className="text-sm text-text-light">
              Stay updated with your latest activities
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={fetchNotifications}
              disabled={loading}
              className="px-3 py-1.5 text-sm"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Bell size={16} />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border  p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <NotificationFilters
              filters={filters}
              onFilterChange={setFilters}
              totalUnread={totalUnread}
            />
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(value: string) => setSearchTerm(value)}
                prefixIcon={<Search size={15} />}
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="bg-primary-5 border border-primary/20  p-3 mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-text">
              {selectedIds.length} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkMarkRead}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded text-sm hover:bg-background transition-colors"
              >
                <CheckCheck size={14} />
                Mark Read
              </button>
              <button
                onClick={handleBulkArchive}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded text-sm hover:bg-background transition-colors"
              >
                <Archive size={14} />
                Archive
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 rounded text-sm hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded text-sm hover:bg-background transition-colors"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Notification List */}
        <div className="bg-card border border-border  overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <EmptyState
              filterApplied={
                searchTerm !== "" ||
                filters.type !== "all" ||
                filters.status !== "all"
              }
            />
          ) : (
            <>
              {/* Select all header */}
              <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-background/30">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === filteredNotifications.length &&
                    filteredNotifications.length > 0
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-xs text-text-light">Select all</span>
                <span className="text-xs text-text-light ml-auto">
                  {filteredNotifications.length} notifications
                </span>
              </div>

              {/* Groups */}
              {groupedNotifications.map((group) => (
                <div key={group.date}>
                  <div className="px-4 py-2 bg-background/20 border-b border-border">
                    <span className="text-xs font-medium text-text-light">
                      {group.date ===
                      formatDate(new Date(), DateFormatEnums.SHORT_DATE)
                        ? "Today"
                        : group.date ===
                            formatDate(
                              new Date(Date.now() - 1000 * 60 * 60 * 24),
                              DateFormatEnums.SHORT_DATE,
                            )
                          ? "Yesterday"
                          : formatDate(
                              new Date(group.date),
                              "EEEE, MMMM d, yyyy",
                            )}
                    </span>
                  </div>
                  {group.notifications.map((notification) => (
                    <div
                      key={notification.uuid}
                      className="flex items-start gap-3 group"
                    >
                      <div className="pl-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(notification.uuid)}
                          onChange={() => {
                            setSelectedIds((prev) =>
                              prev.includes(notification.uuid)
                                ? prev.filter((id) => id !== notification.uuid)
                                : [...prev, notification.uuid],
                            );
                          }}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary mt-2"
                        />
                      </div>
                      <div className="flex-1">
                        <NotificationItem
                          notification={notification}
                          onMarkRead={handleMarkRead}
                          onMarkUnread={handleMarkUnread}
                          onArchive={handleArchive}
                          onDelete={handleDelete}
                          onClick={handleClick}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Load More */}
              {notifications.length < pagination.total &&
                pagination.page < pagination.totalPages && (
                  <div className="p-4 text-center border-t border-border">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="text-sm text-primary hover:underline"
                    >
                      {loading ? (
                        <Loader2
                          size={16}
                          className="animate-spin inline mr-2"
                        />
                      ) : null}
                      Load more notifications
                    </button>
                  </div>
                )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-between items-center text-xs text-text-light">
          <span>
            {filteredNotifications.length} notifications
            {totalUnread > 0 && ` • ${totalUnread} unread`}
            {totalArchived > 0 && ` • ${totalArchived} archived`}
          </span>
          <span>
            Showing {notifications.length} of {pagination.total}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
