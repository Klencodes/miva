import React, { useState, useMemo, useRef, useEffect, JSX } from "react";
import { Link } from "react-router-dom";
import { SearchFilter } from "./SearchFilter";
import { SelectOption } from "./Input";
// import { dateUtils } from "../../core/utils/date-format";
import Button from "./Button";
import { Roles } from "../../core/enums/roles";
import { useTheme } from "../../core/contexts/ThemeProvider";
import { formatDate } from "../../core/utils/date-format";

// ─── Internal sort types ──────────────────────────────────────────────────────

type _SortDir = 'asc' | 'desc';

interface _InternalSortState {
  field: string | null;
  dir: _SortDir;
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

const _SortIcon: React.FC<{ field: string; sort: _InternalSortState }> = ({ field, sort }) => {
  const active = sort.field === field;
  return (
    <span className="inline-flex flex-col ml-1 leading-none select-none">
      <svg
        width="8" height="5" viewBox="0 0 8 5"
        className={`mb-[1px] transition-colors ${active && sort.dir === 'asc' ? 'text-amber-600' : 'text-text-light'}`}
        fill="currentColor"
      >
        <path d="M4 0L8 5H0L4 0Z" />
      </svg>
      <svg
        width="8" height="5" viewBox="0 0 8 5"
        className={`transition-colors ${active && sort.dir === 'desc' ? 'text-amber-600' : 'text-text-light'}`}
        fill="currentColor"
      >
        <path d="M4 5L0 0H8L4 5Z" />
      </svg>
    </span>
  );
};

// ─── Sortable header ──────────────────────────────────────────────────────────

const _SortableHeader: React.FC<{
  label: string;
  field: string;
  sort: _InternalSortState;
  onSort: (field: string) => void;
}> = ({ label, field, sort, onSort }) => (
  <button
    type="button"
    onClick={() => onSort(field)}
    className="inline-flex items-center gap-0.5 font-semibold text-text hover:text-amber-700 transition-colors cursor-pointer select-none whitespace-nowrap"
  >
    {label}
    <_SortIcon field={field} sort={sort} />
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
    <nav className="flex justify-between items-center mt-4 pt-3 border-t border-border">
      <div className="text-text-light text-sm">
        Showing {startItem}–{endItem} of {count} items
      </div>
      <ul className="inline-flex items-center space-x-1">
        <li>
          <button
            onClick={() => changePage(page - 1)}
            disabled={page === 1}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              page === 1 ? 'text-text-light cursor-not-allowed' : 'text-text hover:bg-background'
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
                pageNum === page ? 'bg-primary text-white' : 'text-text hover:bg-background'
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
              page === totalPages ? 'text-text-light cursor-not-allowed' : 'text-text hover:bg-background'
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
  type?: 'column' | 'status' | 'date' | 'image';
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;       // if true, DataTable renders a sortable header button
  sortField?: string;       // key passed to onSort; defaults to column.header
  link?: (item: any) => string | string[];
  onClick?: (item: any) => void;
  statusClasses?: (item: any) => string;
  showSyncBadge?: boolean;
  format?: string;
  imageConfig?: {
    size?: 'xs' | 'sm' | 'md' | 'lg';
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
  onDateRangeChange?: (dateRange: { start_date: string; end_date: string } | any) => void;
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
          {Array(totalColumns).fill(0).map((_, colIndex) => {
            const isActionsCol = showActions && colIndex === actionsColIndex;
            return (
              <td key={colIndex} className="px-4 py-3 align-middle">
                <div className={`flex items-center ${isActionsCol ? 'justify-end' : ''}`}>
                  <div
                    className={`h-4 bg-background rounded ${
                      isActionsCol
                        ? 'w-4 h-4 rounded-full'
                        : colIndex === 0
                        ? 'w-2/3 max-w-[75%]'
                        : 'w-full max-w-full'
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
    className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-200 whitespace-nowrap align-middle"
  >
    <svg
      className="w-3 h-3 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
      style={{ animationDuration: '2s' }}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    Pending
  </span>
);

// ─── DataTable ────────────────────────────────────────────────────────────────

const DataTable: React.FC<DataTableProps> = ({
  columns = [],
  sortOptions = [],
  filterOptions = [],
  data = null,
  placeholder = 'Search...',
  searchLabel = 'Search',
  loading = false,
  noDataMessage = 'No data found.',
  addButtonText = 'Add New',
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
  const [openedActionMenu, setOpenedActionMenu] = useState<string | null>(null);
  const actionMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { isDark } = useTheme();

  // ── Internal sort state (used when column.sortable === true) ───────────────
  const [internalSort, setInternalSort] = useState<_InternalSortState>({
    field: null,
    dir: 'asc',
  });

  const handleInternalSort = (field: string) => {
    const dir = internalSort.field === field && internalSort.dir === 'asc' ? 'desc' : 'asc';
    setInternalSort({ field, dir });
    onSort?.(`${field}_${dir}`);
  };

  // ── Action menu ────────────────────────────────────────────────────────────
  const toggleActionMenu = (itemId: string) =>
    setOpenedActionMenu((prev) => (prev === itemId ? null : itemId));
  const closeMenu = () => setOpenedActionMenu(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openedActionMenu === null) return;
      const currentMenuRef = actionMenuRefs.current[openedActionMenu];
      if (currentMenuRef && !currentMenuRef.contains(event.target as Node)) closeMenu();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openedActionMenu]);

  // ── Derived flags ──────────────────────────────────────────────────────────
  const showActionsColumn = useMemo(() => {
    if (typeof customActions === 'function') return true;
    return customActions.length > 0;
  }, [customActions]);

  const showSearchFeature = !!onSearch;
  const showFiltersFeature = !!onFilter && (filterOptions?.length || 0) > 0;
  const showSortFeature = !!onSort && (sortOptions?.length || 0) > 0;
  const showPaginationFeature = !!onPageChange && count > limit;
  const showAddButtonFeature = !!onAdd;
  const useActionDropdowns = showActionsColumn;

  // ── Cell renderer ──────────────────────────────────────────────────────────
  const renderCellContent = (item: any, column: ColumnDef) => {
    const value = column.value(item);
    const hasLink = !!column.link;
    const hasClick = !!column.onClick;
    const shouldBeBold = !!column.bold || hasLink || hasClick;
    const boldClass = shouldBeBold ? 'font-medium' : '';

    const isPending = item.status === 'pending';
    const showPendingBadge = isPending && column.showSyncBadge;

    const renderArrayStructure = (val: any, isBold: boolean) => {
      const primary = Array.isArray(val) ? val[0] : val;
      const secondary = Array.isArray(val) && val[1] ? val[1] : null;
      const primaryClass = isBold ? 'font-medium' : '';
      return (
        <div className="flex flex-col">
          <div className={`${primaryClass} text-text leading-tight flex items-center flex-wrap gap-x-1`}>
            <span>{primary}</span>
            {showPendingBadge && <PendingSyncBadge />}
          </div>
          {secondary && <div className="text-text-light text-xs mt-0.5">{secondary}</div>}
        </div>
      );
    };

    const clickableWrapper = (content: JSX.Element | string) => {
      if (hasLink) {
        const link = column.link!(item);
        return (
          <Link
            to={Array.isArray(link) ? link.join('/') : link}
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
      case 'column':
        return clickableWrapper(renderArrayStructure(value, shouldBeBold));

      case 'status': {
        const statusClasses = column.statusClasses ? column.statusClasses(item) : '';
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 text-xs rounded-full whitespace-nowrap ${statusClasses} ${boldClass}`}
          >
            {typeof value === 'string'
              ? value.charAt(0).toUpperCase() + value.slice(1)
              : value}
          </span>
        );
      }

      case 'date':
        return (
          <span className={`whitespace-nowrap ${boldClass}`}>
            {formatDate(value, column.format)}
          </span>
        );

      case 'image': {
        const imgConfig = column.imageConfig || {};
        const sizeClasses =
          imgConfig.size === 'xs' ? 'w-6 h-6' :
          imgConfig.size === 'sm' ? 'w-8 h-8' :
          imgConfig.size === 'lg' ? 'w-16 h-16' : 'w-10 h-10';
        const altText = imgConfig.altText ? imgConfig.altText(item) : 'Table image';
        const imageElement = (
          <div className="flex items-center justify-start py-0.5">
            <img
              src={value}
              alt={altText}
              className={`rounded-full object-cover ${sizeClasses} ${imgConfig.className || ''}`}
            />
          </div>
        );
        return clickableWrapper(imageElement);
      }

      default:
        return clickableWrapper(
          <span className={`whitespace-nowrap ${boldClass}`}>{value}</span>
        );
    }
  };

  // ── Render header cell ─────────────────────────────────────────────────────
  const renderHeaderCell = (column: ColumnDef) => {
    if (column.sortable) {
      return (
        <_SortableHeader
          label={column.header}
          field={column.sortField ?? column.header}
          sort={internalSort}
          onSort={handleInternalSort}
        />
      );
    }
    return column.header;
  };

  // ── SVG paths for action icons ─────────────────────────────────────────────
  const actionIconPath = (icon: string) => {
    switch (icon) {
      case 'edit':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />;
      case 'delete':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />;
      case 'view':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />;
      case 'copy':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />;
      case 'add':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />;
      case 'remove':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />;
      default:
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-card shadow-sm overflow-hidden">
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

      <div className="overflow-x-auto mt-2">
        <table className="min-w-full text-sm text-left text-text">
          <thead className="bg-card text-xs uppercase text-text border-b border-border">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  className={`px-4 py-3.5 font-semibold text-text ${
                    column.align === 'right'
                      ? 'text-right'
                      : column.align === 'center'
                      ? 'text-center'
                      : 'text-left'
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

          <tbody className="divide-y divide-border">
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
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {addButtonText}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* 3. DATA ROWS */}
            {!loading &&
              data?.map((item) => {
                const rowCustomActions: any[] =
                  typeof customActions === 'function'
                    ? customActions(item)
                    : customActions;
                const showActionsForThisRow = rowCustomActions.length > 0;

                return (
                  <tr
                    key={item.id}
                    className={`${isDark ? 'hover:bg-gray-900' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.header}
                        className={`px-4 py-3 align-middle ${
                          column.align === 'right'
                            ? 'text-right'
                            : column.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        }`}
                      >
                        {renderCellContent(item, column)}
                      </td>
                    ))}

                    {showActionsColumn && (
                      <td className="px-4 py-3 align-middle">
                        {showActionsForThisRow && (
                          <div className="flex justify-end items-center space-x-1">
                            {!useActionDropdowns && (
                              <div className="flex items-center space-x-1">
                                {rowCustomActions.map((action) => (
                                  <button
                                    key={action.title}
                                    onClick={() => action.handler(item)}
                                    className={`p-1.5 rounded-md hover:bg-primary-10 transition-colors text-text-light hover:text-text ${action.classes || ''}`}
                                    title={action.title}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      {actionIconPath(action.icon)}
                                    </svg>
                                  </button>
                                ))}
                              </div>
                            )}

                            {useActionDropdowns && (
                              <div
                                className="relative inline-block text-left"
                                ref={(el: HTMLDivElement | null) => {
                                  actionMenuRefs.current[item.id] = el;
                                }}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleActionMenu(item.id);
                                  }}
                                  className="p-1.5 rounded-md hover:bg-primary-10 transition-colors text-text-light hover:text-text"
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="5" r="2" />
                                    <circle cx="12" cy="12" r="2" />
                                    <circle cx="12" cy="19" r="2" />
                                  </svg>
                                </button>

                                {openedActionMenu === item.id && (
                                  <div
                                    className="origin-top-right absolute right-0 mt-1 w-40 bg-card rounded-md shadow-lg border border-border py-1 z-50"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {rowCustomActions.map((action) => (
                                      <button
                                        key={action.title}
                                        onClick={() => {
                                          action.handler(item);
                                          closeMenu();
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-primary-5 transition-colors flex items-center gap-2 ${action.classes || ''}`}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          {actionIconPath(action.icon)}
                                        </svg>
                                        <span>{action.title}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
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
        <div className="px-4 py-3 bg-card border-t border-border">
          <Pagination
            page={page}
            limit={limit}
            count={count}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );

  function handlePageChange(newPage: number) {
    onPageChange?.(newPage);
  }
};

export { DataTable };
export default DataTable;