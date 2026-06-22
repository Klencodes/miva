import React, { useState, useMemo, useRef, useEffect, JSX } from "react";
import { Link } from "react-router-dom";
import {
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Copy,
  Plus,
  Minus,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { SearchFilter } from "./SearchFilter";
import { SelectOption } from "./Input";
import Button from "./Button";
import { Roles } from "../../core/enums/roles";
import { useTheme } from "../../core/contexts/ThemeProvider";
import { formatDate } from "../../core/utils/date-format";

// ─── Internal sort types ──────────────────────────────────────────────────────

type SortDir = "asc" | "desc";

interface InternalSortState {
  field: string | null;
  dir: SortDir;
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

const SortIcon: React.FC<{ field: string; sort: InternalSortState }> = ({
  field,
  sort,
}) => {
  const active = sort.field === field;
  return (
    <span className="inline-flex flex-col ml-1 leading-none select-none">
      <ChevronUp
        size={12}
        className={`mb-[1px] transition-colors ${
          active && sort.dir === "asc" ? "text-amber-600" : "text-text-light"
        }`}
      />
      <ChevronDown
        size={12}
        className={`transition-colors ${
          active && sort.dir === "desc" ? "text-amber-600" : "text-text-light"
        }`}
      />
    </span>
  );
};

// ─── Sortable header ──────────────────────────────────────────────────────────

const SortableHeader: React.FC<{
  label: string;
  field: string;
  sort: InternalSortState;
  onSort: (field: string) => void;
}> = ({ label, field, sort, onSort }) => (
  <button
    type="button"
    onClick={() => onSort(field)}
    className="inline-flex items-center gap-0.5 font-semibold text-text hover:text-amber-700 transition-colors cursor-pointer select-none whitespace-nowrap"
  >
    {label}
    <SortIcon field={field} sort={sort} />
  </button>
);

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination: React.FC<any> = ({ page, limit, count, onPageChange }) => {
  const totalPages = Math.ceil(count / limit);
  const totalLimit = limit || 10;

  if (count === 0) return null;

  const getPages = (): number[] => {
    const current = page;
    let start = Math.max(current - 1, 1);
    let end = Math.min(start + 2, totalPages);
    if (end - start < 2) start = Math.max(end - 2, 1);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const startItem = (page - 1) * totalLimit + 1;
  const endItem = Math.min(page * totalLimit, count);

  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) onPageChange(newPage);
  };

  return (
    <nav className="flex justify-between items-center mt-4 p-4 border-t border-border">
      <div className="text-text-light text-sm">
        Showing {startItem}–{endItem} of {count} items
      </div>
      <ul className="inline-flex items-center space-x-1">
        <li>
          <button
            onClick={() => changePage(page - 1)}
            disabled={page === 1}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              page === 1
                ? "text-text-light cursor-not-allowed"
                : "text-text hover:bg-background"
            }`}
          >
            &laquo;
          </button>
        </li>
        {getPages().map((pageNum) => (
          <li key={pageNum}>
            <button
              onClick={() => changePage(pageNum)}
              className={`px-3.5 py-1.5 rounded-md text-sm transition-colors ${
                pageNum === page
                  ? "bg-primary text-white"
                  : "text-text hover:bg-background"
              }`}
            >
              {pageNum}
            </button>
          </li>
        ))}
        <li>
          <button
            onClick={() => changePage(page + 1)}
            disabled={page === totalPages}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              page === totalPages
                ? "text-text-light cursor-not-allowed"
                : "text-text hover:bg-background"
            }`}
          >
            &raquo;
          </button>
        </li>
      </ul>
    </nav>
  );
};

// ─── Column definition ────────────────────────────────────────────────────────

export interface ColumnDef {
  header: string;
  value: (item: any) => any;
  type?: "column" | "status" | "date" | "image";
  bold?: boolean;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  sortField?: string;
  link?: (item: any) => string | string[];
  onClick?: (item: any) => void;
  statusClasses?: (item: any) => string;
  showSyncBadge?: boolean;
  format?: string;
  imageConfig?: {
    size?: "xs" | "sm" | "md" | "lg";
    altText?: (item: any) => string;
    className?: string;
  };
}

// ─── DataTable props ──────────────────────────────────────────────────────────

interface DataTableProps {
  columns: ColumnDef[];
  sortOptions?: SelectOption[];
  filterOptions?: SelectOption[];
  data: any[] | null;
  placeholder?: string;
  searchLabel?: string;
  loading?: boolean;
  noDataMessage?: string;
  addButtonText?: string;
  userRole?: Roles;

  page?: number;
  limit?: number;
  count?: number;

  customActions?: any[] | ((item: any) => any[]);
  currentDateRange?: { start_date: string; end_date: string } | null;
  onSearch?: (term: string) => void;
  onFilter?: (filter: string) => void;
  onSort?: (sort: string) => void;
  onPageChange?: (page: number) => void;
  onAdd?: () => void;
  onDateRangeChange?: (
    dateRange: { start_date: string; end_date: string } | any,
  ) => void;
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

const TableSkeletonLoader: React.FC<{
  columnsCount: number;
  rows: number;
  showActions: boolean;
}> = ({ columnsCount, rows, showActions }) => {
  const skeletonRows = Array(rows).fill(0);
  const totalColumns = columnsCount + (showActions ? 1 : 0);
  const actionsColIndex = totalColumns - 1;

  return (
    <>
      {skeletonRows.map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-border animate-pulse">
          {Array(totalColumns)
            .fill(0)
            .map((_, colIndex) => {
              const isActionsCol = showActions && colIndex === actionsColIndex;
              return (
                <td key={colIndex} className="px-4 py-3 align-middle">
                  <div
                    className={`flex items-center ${isActionsCol ? "justify-end" : ""}`}
                  >
                    <div
                      className={`h-4 bg-background rounded ${
                        isActionsCol
                          ? "w-4 h-4 rounded-full"
                          : colIndex === 0
                            ? "w-2/3 max-w-[75%]"
                            : "w-full max-w-full"
                      }`}
                    />
                  </div>
                </td>
              );
            })}
        </tr>
      ))}
    </>
  );
};

// ─── Pending sync badge ───────────────────────────────────────────────────────

const PendingSyncBadge: React.FC = () => (
  <span
    title="Not yet synced to server"
    className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600 border border-border whitespace-nowrap align-middle"
  >
    <RefreshCw
      size={12}
      className="animate-spin"
      style={{ animationDuration: "2s" }}
    />
    Pending
  </span>
);

// ─── Action dropdown menu (fixed-positioned to escape overflow containers) ────

interface DropdownMenuProps {
  anchorRef: React.RefObject<HTMLButtonElement>;
  open: boolean;
  actions: any[];
  onAction: (action: any) => void;
  onClose: () => void;
}

const FixedDropdownMenu: React.FC<DropdownMenuProps> = ({
  anchorRef,
  open,
  actions,
  onAction,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(
    null,
  );

  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose, anchorRef]);

  if (!open || !coords) return null;

  const getActionIcon = (icon: string) => {
    switch (icon) {
      case "edit":
        return <Edit size={16} />;
      case "delete":
        return <Trash2 size={16} />;
      case "view":
        return <Eye size={16} />;
      case "copy":
        return <Copy size={16} />;
      case "add":
        return <Plus size={16} />;
      case "remove":
        return <Minus size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: coords.top,
        right: coords.right,
        zIndex: 9999,
      }}
      className="w-40 bg-card rounded-md shadow-lg border border-border py-1"
      onClick={(e) => e.stopPropagation()}
    >
      {actions.map((action) => (
        <button
          key={action.title}
          onClick={() => onAction(action)}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-primary-5 transition-colors flex items-center gap-2 ${action.classes || ""}`}
        >
          <span className="w-4 h-4 flex items-center justify-center">
            {getActionIcon(action.icon)}
          </span>
          <span>{action.title}</span>
        </button>
      ))}
    </div>
  );
};

// ─── Per-row action trigger ───────────────────────────────────────────────────

const RowActionButton: React.FC<{
  item: any;
  actions: any[];
  onAction: (action: any, item: any) => void;
}> = ({ item, actions, onAction }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null!);

  return (
    <>
      <button
        ref={btnRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="p-1.5 rounded-md hover:bg-primary-10 transition-colors text-text-light hover:text-text"
      >
        <MoreVertical size={20} />
      </button>

      <FixedDropdownMenu
        anchorRef={btnRef}
        open={open}
        actions={actions}
        onAction={(action) => {
          onAction(action, item);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

// ─── DataTable ────────────────────────────────────────────────────────────────

const DataTable: React.FC<DataTableProps> = ({
  columns = [],
  sortOptions = [],
  filterOptions = [],
  data = null,
  placeholder = "Search...",
  searchLabel = "Search",
  loading = false,
  noDataMessage = "No data found.",
  addButtonText = "Add New",
  userRole = Roles.SALES,
  page = 1,
  limit = 10,
  count = 0,
  customActions = [],
  currentDateRange = null,
  onSearch,
  onFilter,
  onSort,
  onPageChange,
  onAdd,
  onDateRangeChange,
}) => {
  const { isDark } = useTheme();

  // ── Internal sort state ────────────────────────────────────────────────────
  const [internalSort, setInternalSort] = useState<InternalSortState>({
    field: null,
    dir: "asc",
  });

  const handleInternalSort = (field: string) => {
    const dir =
      internalSort.field === field && internalSort.dir === "asc"
        ? "desc"
        : "asc";
    setInternalSort({ field, dir });
    onSort?.(`${field}_${dir}`);
  };

  // ── Derived flags ──────────────────────────────────────────────────────────
  const showActionsColumn = useMemo(() => {
    if (typeof customActions === "function") return true;
    return (customActions as any[]).length > 0;
  }, [customActions]);

  const showSearchFeature = !!onSearch;
  const showFiltersFeature = !!onFilter && (filterOptions?.length || 0) > 0;
  const showSortFeature = !!onSort && (sortOptions?.length || 0) > 0;
  const showPaginationFeature = !!onPageChange && count > limit;
  const showAddButtonFeature = !!onAdd;

  // ── Cell renderer ──────────────────────────────────────────────────────────
  const renderCellContent = (item: any, column: ColumnDef) => {
    const value = column.value(item);
    const hasLink = !!column.link;
    const hasClick = !!column.onClick;
    const shouldBeBold = !!column.bold || hasLink || hasClick;
    const boldClass = shouldBeBold ? "font-medium" : "";

    const isPending = item.status === "pending";
    const showPendingBadge = isPending && column.showSyncBadge;

    const renderArrayStructure = (val: any, isBold: boolean) => {
      const primary = Array.isArray(val) ? val[0] : val;
      const secondary = Array.isArray(val) && val[1] ? val[1] : null;
      const primaryClass = isBold ? "font-medium" : "";
      return (
        <div className="flex flex-col">
          <div
            className={`${primaryClass} text-text leading-tight flex items-center flex-wrap gap-x-1`}
          >
            <span>{primary}</span>
            {showPendingBadge && <PendingSyncBadge />}
          </div>
          {secondary && (
            <div className="text-text-light text-xs mt-0.5">{secondary}</div>
          )}
        </div>
      );
    };

    const clickableWrapper = (content: JSX.Element | string) => {
      if (hasLink) {
        const link = column.link!(item);
        return (
          <Link
            to={Array.isArray(link) ? link.join("/") : link}
            className={`block hover:text-primary transition-colors ${boldClass}`}
          >
            {content}
          </Link>
        );
      } else if (hasClick) {
        return (
          <button
            onClick={() => column.onClick!(item)}
            className={`text-left cursor-pointer hover:text-primary transition-colors focus:outline-none ${boldClass}`}
          >
            {content}
          </button>
        );
      }
      return content;
    };

    switch (column.type) {
      case "column":
        return clickableWrapper(renderArrayStructure(value, shouldBeBold));

      case "status": {
        const statusClasses = column.statusClasses
          ? column.statusClasses(item)
          : "";
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 text-xs rounded-full whitespace-nowrap ${statusClasses} ${boldClass}`}
          >
            {typeof value === "string"
              ? value.charAt(0).toUpperCase() + value.slice(1)
              : value}
          </span>
        );
      }

      case "date":
        return (
          <span className={`whitespace-nowrap ${boldClass}`}>
            {formatDate(value, column.format)}
          </span>
        );

      case "image": {
        const imgConfig = column.imageConfig || {};
        const sizeClasses =
          imgConfig.size === "xs"
            ? "w-6 h-6"
            : imgConfig.size === "sm"
              ? "w-8 h-8"
              : imgConfig.size === "lg"
                ? "w-16 h-16"
                : "w-10 h-10";
        const altText = imgConfig.altText
          ? imgConfig.altText(item)
          : "Table image";
        const imageElement = (
          <div className="flex items-center justify-start py-0.5">
            <img
              src={value}
              alt={altText}
              className={`rounded-full object-cover ${sizeClasses} ${imgConfig.className || ""}`}
            />
          </div>
        );
        return clickableWrapper(imageElement);
      }

      default:
        return clickableWrapper(
          <span className={`whitespace-nowrap ${boldClass}`}>{value}</span>,
        );
    }
  };

  // ── Render header cell ─────────────────────────────────────────────────────
  const renderHeaderCell = (column: ColumnDef) => {
    if (column.sortable) {
      return (
        <SortableHeader
          label={column.header}
          field={column.sortField ?? column.header}
          sort={internalSort}
          onSort={handleInternalSort}
        />
      );
    }
    return column.header;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-card shadow-sm overflow-hidden">
      {showSearchFeature && (
        <SearchFilter
          placeholder={placeholder}
          searchLabel={searchLabel}
          showSort={showSortFeature}
          showFilters={showFiltersFeature}
          sortOptions={sortOptions}
          filterOptions={filterOptions}
          onSearchChange={onSearch!}
          onSortChange={onSort!}
          onFilterChange={onFilter!}
          currentDateRange={currentDateRange}
          onDateRangeChange={onDateRangeChange ?? (() => {})}
          userRole={userRole}
        />
      )}

      {/* overflow-x-auto removed from this wrapper so fixed dropdowns aren't clipped */}
      <div className="w-full mt-2">
        <table className="w-full text-sm text-left text-text">
          <thead className="bg-card text-xs uppercase text-text border-b border-border">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  className={`px-4 py-3.5 font-semibold text-text ${
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                        ? "text-center"
                        : "text-left"
                  }`}
                >
                  {renderHeaderCell(column)}
                </th>
              ))}
              {showActionsColumn && (
                <th className="px-4 py-3.5 text-right font-semibold text-text-light">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y">
            {/* 1. SKELETON LOADER */}
            {loading && (
              <TableSkeletonLoader
                columnsCount={columns.length}
                rows={limit}
                showActions={showActionsColumn}
              />
            )}

            {/* 2. EMPTY STATE */}
            {!loading && (!data || data.length === 0) && (
              <tr>
                <td
                  colSpan={columns.length + (showActionsColumn ? 1 : 0)}
                  className="py-20 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="text-text-light">{noDataMessage}</div>
                    {showAddButtonFeature && (
                      <Button onClick={onAdd}>
                        <Plus size={16} className="mr-1" />
                        {addButtonText}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* 3. DATA ROWS */}
            {!loading &&
              data?.map((item, index) => {
                const rowCustomActions: any[] =
                  typeof customActions === "function"
                    ? customActions(item)
                    : customActions;
                const showActionsForThisRow = rowCustomActions.length > 0;

                return (
                  <tr
                    key={item.id || index}
                    className={`${"border-t border-border"} ${
                      isDark ? "hover:bg-gray-900" : "hover:bg-gray-50"
                    } transition-colors`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.header}
                        className={`px-4 py-3 align-middle ${
                          column.align === "right"
                            ? "text-right"
                            : column.align === "center"
                              ? "text-center"
                              : "text-left"
                        }`}
                      >
                        {renderCellContent(item, column)}
                      </td>
                    ))}

                    {showActionsColumn && (
                      <td className="px-4 py-3 align-middle">
                        {showActionsForThisRow && (
                          <div className="flex justify-end items-center">
                            <RowActionButton
                              item={item}
                              actions={rowCustomActions}
                              onAction={(action, it) => {
                                action.handler(it);
                              }}
                            />
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {showPaginationFeature && (
        <div className="pt-3 bg-card">
          <Pagination
            page={page}
            limit={limit}
            count={count}
            onPageChange={(newPage: number) => onPageChange?.(newPage)}
          />
        </div>
      )}
    </div>
  );
};

export { DataTable };
export default DataTable;
