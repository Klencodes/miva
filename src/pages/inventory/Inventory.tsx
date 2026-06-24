import { Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button, DataTable } from "../../components/common";
import { ColumnDef } from "../../components/common/Datatable";
import { useStore } from "../../core/contexts/StoreProvider";
import { useModal } from "../../core/hooks/useModal";
import { eventService } from "../../core/services/events";
import InventoryService from "../../core/services/inventory";
import { InventoryItem } from "../../core/types";
import AddEditInventory from "./AddEditInventory";

const Inventory = () => {
  const { user } = useStore();
  const { openModal } = useModal();

  // ── State ──────────────────────────────────────────────────────────────────
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const LIMIT = 10;

  // ── Refs to always have latest values without re-creating fetch ────────────
  const searchRef = useRef(searchQuery);
  const filterRef = useRef(filterType);
  const pageRef = useRef(page);

  useEffect(() => { searchRef.current = searchQuery; }, [searchQuery]);
  useEffect(() => { filterRef.current = filterType; }, [filterType]);
  useEffect(() => { pageRef.current = page; }, [page]);

  // ── Fetch (stable, never recreated) ───────────────────────────────────────
  const fetchInventory = useRef(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pageRef.current,
        limit: LIMIT,
      };

      if (searchRef.current) {
        params.search = searchRef.current;
      }

      if (filterRef.current !== 'all') {
        params.type = filterRef.current;
      }

      const response = await InventoryService.getItems(params);

      if (response.success) {
        setInventory(response.results || []);
        setCount(response.count || 0);
      } else {
        toast.error('Error', { description: response.message || 'Failed to load inventory' });
      }
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      toast.error('Error', { description: error.message || 'Failed to load inventory' });
    } finally {
      setLoading(false);
    }
  }).current;

  // ── Trigger fetch when page / search / filter / refreshKey change ──────────
  useEffect(() => {
    fetchInventory();
    //eslint-disable-next-line
  }, [page, searchQuery, filterType, refreshKey]);

  // ── Listen for refresh events ──────────────────────────────────────────────
  useEffect(() => {
    const handleRefresh = () => setRefreshKey(prev => prev + 1);
    eventService.onRefresh(handleRefresh);
    return () => eventService.offRefresh(handleRefresh);
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
const handleSearch = (query: string) => {
  searchRef.current = query;  
  pageRef.current = 1;       
  setSearchQuery(query);    
};

const handleFilter = (filter: string) => {
  filterRef.current = filter; 
  pageRef.current = 1;        
  setFilterType(filter);      
  setPage(1);
};

  const handleSort = (sortValue: string) => {
    if (!sortValue) return;
    const lastUnderscore = sortValue.lastIndexOf('_');
    const field = sortValue.slice(0, lastUnderscore) as keyof InventoryItem;
    const dir = sortValue.slice(lastUnderscore + 1) as 'asc' | 'desc';

    setInventory((prev) =>
      [...prev].sort((a, b) => {
        let cmp = 0;
        if (field === 'name') cmp = a.name.localeCompare(b.name);
        else if (field === 'part_number') cmp = (a.part_number || '').localeCompare(b.part_number || '');
        else if (field === 'type') cmp = a.type.localeCompare(b.type);
        else if (field === 'unit') cmp = (a.unit ?? '').localeCompare(b.unit ?? '');
        else if (field === 'quantity') cmp = a.quantity - b.quantity;
        else if (field === 'cost') cmp = a.cost - b.cost;
        else if (field === 'price') cmp = a.price - b.price;
        return dir === 'asc' ? cmp : -cmp;
      })
    );
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  const updateInventory = async (id: string, newQuantity: number) => {
    try {
      const response = await InventoryService.adjustStock(id, {
        quantity: newQuantity,
        type: 'set',
        reason: 'Manual adjustment',
      });

      if (response.success) {
        toast.success('Success', { description: 'Stock updated successfully' });
        fetchInventory();
      }
    } catch (error: any) {
      toast.error('Error', { description: error.message || 'Failed to update stock' });
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      const response = await InventoryService.deleteItem(id);

      if (response.success) {
        toast.success('Success', { description: 'Item deleted successfully' });
        fetchInventory();
      }
    } catch (error: any) {
      toast.error('Error', { description: error.message || 'Failed to delete item' });
    }
  };

  const handleAddEditItem = async (item?: InventoryItem) => {
    const result = await openModal(AddEditInventory, {
      data: { item },
      size: '2xl',
      side: 'right',
    });

    if (result?.success) {
      fetchInventory();
    }
  };

  // ── Column definitions ─────────────────────────────────────────────────────
  const columns: ColumnDef[] = [
    {
      header: 'PRODUCT',
      sortable: true,
      sortField: 'name',
      value: (item: InventoryItem) => {
        const parts = [item.name];
        if (item.part_number) parts.push(`${item.part_number}`);
        if (item.supplier) parts.push(item.supplier);
        return parts;
      },
      type: 'column',
      bold: true,
      onClick: (item: InventoryItem) => handleAddEditItem(item),
    },
    {
      header: 'PART #',
      sortable: true,
      sortField: 'part_number',
      value: (item: InventoryItem) => item.part_number || '—',
      type: 'column',
    },
    {
      header: 'TYPE',
      sortable: true,
      sortField: 'type',
      value: (item: InventoryItem) => item.type,
      type: 'column',
      statusClasses: (item: InventoryItem) => {
        const classes: Record<string, string> = {
          hose: 'bg-primary-10 text-primary',
          fitting: 'bg-emerald-100 text-emerald-700',
          ferrule: 'bg-amber-100 text-amber-700',
          adapter: 'bg-purple-100 text-purple-700',
          coupling: 'bg-pink-100 text-pink-700',
          other: 'bg-gray-100 text-text',
        };
        return classes[item.type] ?? classes.other;
      },
    },
    {
      header: 'UNIT',
      sortable: true,
      sortField: 'unit',
      value: (item: InventoryItem) => item.unit,
      type: 'column',
    },
    {
      header: 'QUANTITY',
      sortable: true,
      sortField: 'quantity',
      value: (item: InventoryItem) => {
        const isLow = item.quantity <= item.reorder_threshold;
        return (
          <span className={isLow && item.quantity > 0 ? 'text-amber-600 font-bold' :
            item.quantity === 0 ? 'text-red-600 font-bold' : ''}>
            {item.quantity}
            {isLow && item.quantity > 0 && <span className="ml-1 text-xs">⚠️</span>}
          </span>
        );
      },
      type: 'column',
      bold: true,
    },
    {
      header: 'COST',
      sortable: true,
      sortField: 'cost',
      value: (item: InventoryItem) => `GHS ${item.cost?.toFixed(2) || '0.00'}`,
      type: 'column',
    },
    {
      header: 'PRICE',
      sortable: true,
      sortField: 'price',
      value: (item: InventoryItem) => `GHS ${item.price?.toFixed(2) || '0.00'}`,
      type: 'column',
      bold: true,
    },
    {
      header: 'STOCK STATUS',
      value: (item: InventoryItem) => {
        const status = item.stock_status || 'unknown';
        const statusMap: Record<string, { label: string; className: string }> = {
          in_stock: { label: 'In Stock', className: 'bg-emerald-100 text-emerald-700' },
          low_stock: { label: 'Low Stock', className: 'bg-amber-100 text-amber-700' },
          out_of_stock: { label: 'Out of Stock', className: 'bg-red-100 text-red-700' },
        };
        const statusInfo = statusMap[status] || { label: 'Unknown', className: 'bg-gray-100 text-gray-700' };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        );
      },
      type: 'column',
    },
    {
      header: 'METADATA',
      value: (item: InventoryItem) => {
        if (!item.metadata || Object.keys(item.metadata).length === 0) return '—';
        const entries = Object.entries(item.metadata).slice(0, 3);
        return entries.map(([key, value]) => `${key}: ${value}`).join(' • ');
      },
      type: 'column',
    },
  ];

  // ── Row actions ────────────────────────────────────────────────────────────
  const getCustomActions = (item: InventoryItem) => {
    const actions = [];

    actions.push({
      title: 'Add Stock',
      icon: 'add',
      classes: 'text-emerald-600 hover:text-emerald-800',
      handler: () => updateInventory(item.uuid, item.quantity + 1),
    });

    actions.push({
      title: 'Remove Stock',
      icon: 'remove',
      classes: 'text-red-600 hover:text-red-800',
      handler: () => {
        if (item.quantity > 0) {
          updateInventory(item.uuid, item.quantity - 1);
        } else {
          toast.warning('Warning', { description: 'Cannot remove stock from zero quantity' });
        }
      },
    });

    if (user?.permissions?.can_edit_inventory) {
      actions.push({
        title: 'Edit',
        icon: 'edit',
        classes: 'text-blue-600 hover:text-blue-800',
        handler: () => handleAddEditItem(item),
      });
    }

    if (user?.permissions?.can_delete_inventory) {
      actions.push({
        title: 'Delete',
        icon: 'delete',
        classes: 'text-red-600 hover:text-red-800',
        handler: () => {
          if (window.confirm(`Delete "${item.name}"? This action cannot be undone.`)) {
            deleteInventoryItem(item.uuid);
          }
        },
      });
    }

    return actions;
  };

  // ── Filter / sort option lists ─────────────────────────────────────────────
  const filterOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'hose', label: 'Hoses' },
    { value: 'fitting', label: 'Fittings' },
    { value: 'ferrule', label: 'Ferrules' },
    { value: 'adapter', label: 'Adapters' },
    { value: 'coupling', label: 'Couplings' },
    { value: 'other', label: 'Other' },
  ];

  const sortOptions = [
    { value: 'name_asc', label: 'Name A-Z' },
    { value: 'name_desc', label: 'Name Z-A' },
    { value: 'part_number_asc', label: 'Part # A-Z' },
    { value: 'part_number_desc', label: 'Part # Z-A' },
    { value: 'quantity_asc', label: 'Quantity Low-High' },
    { value: 'quantity_desc', label: 'Quantity High-Low' },
    { value: 'price_asc', label: 'Price Low-High' },
    { value: 'price_desc', label: 'Price High-Low' },
    { value: 'cost_asc', label: 'Cost Low-High' },
    { value: 'cost_desc', label: 'Cost High-Low' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="">
      <div className="flex justify-between items-center pb-4">
        <div>
          <h2 className="text-2xl font-bold text-text">Inventory Management</h2>
          <p className="text-text-light text-sm">Manage and track all your hydraulic components</p>
        </div>
        <Button onClick={() => handleAddEditItem()}>
          <Plus className="w-5 h-5" />
          Add Item
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={inventory}
        loading={loading}
        placeholder="Search by name, part number, supplier..."
        searchLabel="Search Inventory"
        noDataMessage={
          searchQuery || filterType !== 'all'
            ? 'No items match your filters'
            : 'No inventory items found'
        }
        addButtonText="Add Product"
        page={page}
        limit={LIMIT}
        count={count}
        filterOptions={filterOptions}
        sortOptions={sortOptions}
        customActions={getCustomActions}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onAdd={() => handleAddEditItem()}
      />
    </div>
  );
};

export default Inventory;