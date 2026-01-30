import React, { useState, useMemo, useRef, useEffect, JSX } from "react";
import { Link } from "react-router-dom";
import { SearchFilter } from "./SearchFilter";
import { SelectOption } from "./Input";
import { dateUtils } from "../../core/utils/date-format";
import { PaginationProps, TableColumn, CustomAction, ImageConfig } from "../../core/interfaces/table";
import Button from "./Button";

// --- Pagination Component ---
const Pagination: React.FC<PaginationProps> = ({
  page,
  limit,
  count,
  onPageChange,
}) => {
  const totalPages = Math.ceil(count / limit);
  const totalLimit = limit || 10; // Ensure limit is defined for calculation

  const getPages = (): number[] => {
    const current = page;
    let start = Math.max(current - 1, 1);
    let end = Math.min(start + 2, totalPages);

    if (end - start < 2) {
      start = Math.max(end - 2, 1);
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const startItem = (page - 1) * totalLimit + 1;
  const endItem = Math.min(page * totalLimit, count);

  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="flex justify-between items-center mt-1">
      <div className="text-text-light text-sm">
        Page {page} of {totalPages} &nbsp;|&nbsp; Showing {startItem}–{endItem}{" "}
        of {count} results
      </div>

      <ul className="inline-flex items-center space-x-1">
        <li>
          <Button
            onClick={() => changePage(page - 1)}
            disabled={page === 1}
            variant="ghost"
            size="sm"
            className="px-3 py-2"
          >
            &laquo;
          </Button>
        </li>

        {getPages().map((pageNum) => (
          <li key={pageNum}>
            <Button
              onClick={() => changePage(pageNum)}
              variant={pageNum === page ? "primary" : "ghost"}
              size="sm"
              className={`px-3 py-2 ${
                pageNum === page
                  ? "bg-primary text-white hover:bg-primary"
                  : "text-text hover:bg-background"
              }`}
            >
              {pageNum}
            </Button>
          </li>
        ))}

        <li>
          <Button
            onClick={() => changePage(page + 1)}
            disabled={page === totalPages}
            variant="ghost"
            size="sm"
            className="px-3 py-2"
          >
            &raquo;
          </Button>
        </li>
      </ul>
    </nav>
  );
};

// --- Interfaces (omitted for brevity, assume imported correctly) ---

interface DataTableProps {
  columns: TableColumn[];
  sortOptions?: SelectOption[];
  filterOptions?: SelectOption[];
  data: any[] | null;
  placeholder?: string;
  searchLabel?: string;
  loading?: boolean;
  noDataMessage?: string;
  addButtonText?: string;

  page?: number;
  limit?: number;
  count?: number;

  customActions?: CustomAction[] | ((item: any) => CustomAction[]);
  currentDateRange?: { start_date: string; end_date: string } | null;
  onSearch?: (term: string) => void;
  onFilter?: (filter: string) => void;
  onSort?: (sort: string) => void;
  onPageChange?: (page: number) => void;
  onAdd?: () => void;
  onDateRangeChange?: (
    dateRange: { start_date: string; end_date: string } | any
  ) => void;
}

// --- Table Skeleton Loader Component ---
const TableSkeletonLoader: React.FC<{ columnsCount: number; rows: number; showActions: boolean }> = ({
  columnsCount,
  rows,
  showActions,
}) => {
  const skeletonRows = Array(rows).fill(0);
  const totalColumns = columnsCount + (showActions ? 1 : 0);
  
  // Calculate the index of the last column (the actions column, if present)
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
                  {/* Simulated Image/Icon for first column (optional) */}
                  {!isActionsCol && colIndex === 0 && (
                    <div className="w-8 h-8 rounded-full bg-background mr-3 hidden sm:block"></div>
                  )}
                  {/* Simulated Text Line */}
                  <div
                    className={`h-4 bg-background rounded ${
                      isActionsCol
                        ? "w-4 h-4 rounded-full" // Actions button dot
                        : colIndex === 0
                        ? "w-2/3 max-w-[75%]" // Wider line for main column
                        : "w-full max-w-full"
                    }`}
                  ></div>
                </div>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
};

// --- DataTable Component ---
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

  page = 1,
  limit = 10, // Use limit here to define skeleton rows
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

  const handleSearch = (term: string) => {
    onSearch?.(term);
  };

  const handleFilter = (filter: string) => {
    onFilter?.(filter);
  };

  const handleSort = (sort: string) => {
    onSort?.(sort);
  };

  const handlePageChange = (newPage: number) => {
    onPageChange?.(newPage);
  };

  const handleDateRangeChange = ( dateRange: { start_date: string; end_date: string } | null) => {
    onDateRangeChange?.(dateRange);
  };

  const toggleActionMenu = (itemId: string) => {
    setOpenedActionMenu(openedActionMenu === itemId ? null : itemId);
  };

  const closeMenu = () => {
    setOpenedActionMenu(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openedActionMenu === null) return;

      const currentMenuRef = actionMenuRefs.current[openedActionMenu];
      const target = event.target as Node;

      if (currentMenuRef && !currentMenuRef.contains(target)) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openedActionMenu]);

  const showActionsColumn = useMemo(() => {
    // If customActions is a function, we must render the column header, even if data is empty.
    if (typeof customActions === "function") {
      return true;
    }
    // If it's an array, only render if actions exist.
    return customActions.length > 0;
  }, [customActions]);

  const showSearchFeature = !!onSearch;
  const showFiltersFeature = !!onFilter && (filterOptions?.length || 0) > 0;
  const showSortFeature = !!onSort && (sortOptions?.length || 0) > 0;
  const showPaginationFeature = !!onPageChange && count > limit;
  const showAddButtonFeature = !!onAdd;

  const useActionDropdowns = showActionsColumn;

  const getImageSizeClasses = (size?: ImageConfig["size"]) => {
    switch (size) {
      case "xs":
        return "w-6 h-6";
      case "sm":
        return "w-8 h-8";
      case "lg":
        return "w-16 h-16";
      case "md":
      default:
        return "w-10 h-10";
    }
  };

  const renderCellContent = (item: any, column: TableColumn) => {
    const value = column.value(item);
    const hasLink = !!column.link;
    const hasClick = !!column.onClick;
    const shouldBeBold = !!column.bold || hasLink || hasClick;
    const boldClass = shouldBeBold ? "font-bold" : "";

    const renderArrayStructure = (val: any, isBold: boolean) => {
      const primary = Array.isArray(val) ? val[0] : val;
      const secondary = Array.isArray(val) && val[1] ? val[1] : null;

      const primaryClass = isBold ? "font-bold" : "font-medium";

      return (
        <div className="flex flex-col">
          <div className={`${primaryClass} text-text leading-tight`}>{primary}</div>
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
            className={`block hover:underline whitespace-nowrap ${
              column.type === "column" ? "hover:no-underline" : ""
            } ${boldClass}`}
          >
            {content}
          </Link>
        );
      } else if (hasClick) {
        return (
          <button
            onClick={() => column.onClick!(item)}
            className={`text-left cursor-pointer hover:underline focus:outline-none whitespace-nowrap ${boldClass}`}
          >
            {content}
          </button>
        );
      }
      return content;
    };

    switch (column.type) {
      case "column":
        const content = renderArrayStructure(value, shouldBeBold);
        return clickableWrapper(content);

      case "status":
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

      case "date":
        return (
          <span className={`whitespace-nowrap ${boldClass}`}>
            {dateUtils.formatDate(value, column.format)}
          </span>
        );

      case "image":
        const imgConfig = column.imageConfig || {};
        const sizeClasses = getImageSizeClasses(imgConfig.size);
        const altText = imgConfig.altText
          ? imgConfig.altText(item)
          : "Table image";

        const imageElement = (
          <div className="flex items-center justify-start py-0.5">
            <img
              src={value}
              alt={altText}
              className={`rounded-full object-cover ${sizeClasses} ${
                imgConfig.className || ""
              }`}
            />
          </div>
        );
        return clickableWrapper(imageElement);

      default:
        return clickableWrapper(
          <span className={`whitespace-nowrap ${boldClass}`}>{value}</span>
        );
    }
  };

  return (
    <div className="card overflow-hidden relative h-full flex flex-col">
      {showSearchFeature && (
        <SearchFilter
          placeholder={placeholder}
          searchLabel={searchLabel}
          showSort={showSortFeature}
          showFilters={showFiltersFeature}
          sortOptions={sortOptions}
          filterOptions={filterOptions}
          onSearchChange={handleSearch}
          onSortChange={handleSort}
          onFilterChange={handleFilter}
          currentDateRange={currentDateRange}
          onDateRangeChange={handleDateRangeChange}
        />
      )}

      <div className="overflow-x-auto flex-1 overflow-y-auto">
        <table className="min-w-full text-sm text-left text-text">
          <thead className="bg-background text-xs uppercase text-text-light sticky top-0 z-[5]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  className={`px-6 py-4 ${
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {column.header}
                </th>
              ))}
              {showActionsColumn && (
                <th className="px-6 py-4 text-right">Actions</th>
              )}
            </tr>
          </thead>

          <tbody>
            {/* 1. SKELETON LOADER STATE */}
            {loading && (
              <TableSkeletonLoader
                columnsCount={columns.length}
                rows={limit} // Use the limit prop for the number of skeleton rows
                showActions={showActionsColumn}
              />
            )}

            {/* 2. NO DATA STATE */}
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
                        <i className="ri-add-line"></i>
                        {addButtonText}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* 3. DATA DISPLAY STATE */}
            {!loading && data?.map((item) => {
              const rowCustomActions: CustomAction[] =
                typeof customActions === "function"
                  ? customActions(item)
                  : customActions;

              // Only show actions for this row if the customActions function/array returned something
              const showActionsForThisRow = rowCustomActions.length > 0; 
              
              // Only render the actions cell if the actions column is generally enabled
              if (showActionsColumn && !showActionsForThisRow) {
                // We ensure showActionsForThisRow is used to check if actions are available for this specific item, 
                // but the cell still renders if showActionsColumn is true.
              }

              return (
                <tr
                  key={item.id}
                  className="border-b border-border hover:bg-primary-30 transition-colors"
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

                  {/* Render the Actions cell if the column header was rendered */}
                  {showActionsColumn && (
                    <td className="px-4 py-3 align-middle">
                      {showActionsForThisRow && (
                      <div className="flex justify-end items-center space-x-1">
                        {!useActionDropdowns && (
                          <div className="flex items-center space-x-1 ">
                            {rowCustomActions.map((action) => (
                              <Button
                                key={action.title}
                                onClick={() => {
                                  action.handler(item);
                                }}
                                className={action.classes}
                                variant="transparent"
                                size="sm"
                                title={action.title}
                              >
                                <i className={`ri-${action.icon} text-sm`}></i>
                              </Button>
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
                            <Button
                              onClick={(e: { stopPropagation: () => void; }) => {
                                e.stopPropagation();
                                toggleActionMenu(item.id);
                              }}
                              variant="transparent"
                              size="sm"
                            >
                              <i className="ri-more-2-fill text-lg text-text-light"></i>
                            </Button>

                            {openedActionMenu === item.id && (
                              <div
                                className="origin-top-right absolute right-0 mt-1 w-fit bg-card p-2 rounded-sm shadow-card border border-border z-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="py-1 flex flex-col space-y-1">
                                  {rowCustomActions.map((action) => (
                                    <Button
                                      key={action.title}
                                      onClick={() => {
                                        action.handler(item);
                                        closeMenu();
                                      }}
                                      variant="transparent"
                                      size="sm"
                                      className={`justify-start ${
                                        action.classes || ""
                                      }`}
                                    >
                                      <i
                                        className={`ri-${action.icon} mr-3 text-base`}
                                      ></i>
                                      <span className="text-sm whitespace-nowrap">
                                        {action.title}
                                      </span>
                                    </Button>
                                  ))}
                                </div>
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
        <div className="p-3 flex-shrink-0">
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
};
export default DataTable;