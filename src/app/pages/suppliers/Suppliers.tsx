import { useCallback, useEffect, useState } from "react";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { Breadcrumb, DataTable } from "../../../ui";
import { CustomAction, TableColumn } from "../../../core/interfaces/table";
import { DateFormatEnums } from "../../../core/utils/date-format";
import { useModal } from "../../../core/hooks/useModal";
import { useDebounce } from "../../../core/hooks/useDebounce";

import AddSupplierModal from "./AddSupplierModal";
import { Roles } from "../../../core/enums/roles";
import { useStore } from "../../../core/hooks/useStore";
import { eventService } from "../../../core/services/events";
import {
  IBreadcrumbAction,
  IBreadcrumbItem,
} from "../../../ui/components/Breadcrumb";
import { ISupplier } from "../../../core/interfaces/ISupplier";
import { authService } from "../../../core/services/auth";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { openModal } = useModal();
  const { user } = useStore();
  usePageTitle("Suppliers");

  const breadcrumbs: IBreadcrumbItem[] = [
    { label: "Store", url: "/store" },
    { label: "Suppliers", url: "/suppliers", isActive: true },
  ];

  const actions: IBreadcrumbAction[] = [
    {
      label: "Add New Supplier",
      action: () => openAddModal(),
      icon: "add",
      size: "sm",
      variant: "primary",
    },
  ];

  const columns: TableColumn[] = [
    {
      header: "Supplier",
      value: (item: ISupplier) => [`${item?.name}`, item?.address],
      type: "column",
    },
    {
      header: "Contact",
      value: (item: ISupplier) => [item.email, `${item.phone_code}${item.phone_number}`],
      type: "column",
    },
    {
      header: "Secondary Contact",
      value: (item: ISupplier) => `${item.secondary_code}${item.secondary_number}`,
      type: "column",
    },

    {
      header: "Created At",
      value: (item: ISupplier) => item.created_at,
      type: "date",
      format: DateFormatEnums.DATE_TIME_SHORT,
    },
  ];

  const getSuppliers = useCallback(
    async (page: number, search: string): Promise<void> => {
      setLoading(true);
      try {
        const res = await authService.getSuppliers(page, search);

        if (res.success) {
          setSuppliers(res.results);
          setTotalCount(res.count!);
        }
      } catch (err: any) {
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    getSuppliers(currentPage, debouncedSearchTerm);
  }, [getSuppliers, currentPage, debouncedSearchTerm]);

  useEffect(() => {
    const handleRefresh = () => {
      getSuppliers(currentPage, debouncedSearchTerm);
    };
    eventService.onRefresh(handleRefresh);

    return () => {
      eventService.offRefresh(handleRefresh);
    };
  }, [getSuppliers, currentPage, debouncedSearchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const openAddModal = async (item?: ISupplier) => {
    const result = await openModal(AddSupplierModal, {
      data: item,
      size: "xl",
      side: "right",
      backdropClose: false,
    });
    if (result?.success) {
      getSuppliers(currentPage, debouncedSearchTerm);
    }
  };

  const handleDelete = async (item: any) => {};

  const getCustomActions = (item: ISupplier): CustomAction[] => {
    const actions: CustomAction[] = [
      {
        title: "Edit Supplier",
        handler: () => openAddModal(item),
        icon: "edit-line",
        classes: "",
      },
      // {
      //   title: "View Supplier",
      //   handler: () => onView(item),
      //   icon: "eye-line",
      //   classes: "",
      // },
    ];

    if (user?.role === Roles.SUPER_ADMIN) {
      actions.push({
        title: "Delete",
        handler: () => handleDelete(item),
        icon: "forbid-line",
        classes: "text-danger hover:bg-danger-50",
      });
    }

    return actions;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="rounded-sm shadow-sm overflow-hidden flex-1 flex flex-col">
        <Breadcrumb
          breadcrumbs={breadcrumbs}
          pageTitle="Suppliers"
          pageSubtitle="Manage Suppliers and their profiles"
          actions={actions}
        />
        <div className="overflow-y-auto flex-1">
          <DataTable
            columns={columns}
            data={suppliers}
            loading={loading}
            customActions={getCustomActions}
            noDataMessage="No suppliers found matching your criteria."
            page={currentPage}
            count={totalCount}
            userRole={user?.role}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
          />
        </div>
      </div>
    </div>
  );
};

export default Suppliers;
