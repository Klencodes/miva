import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button, DataTable } from '../../components/common';
import { InventoryItem } from '../../core/types';
import { ColumnDef } from '../../components/common/Datatable';
import { useStore } from '../../core/contexts/StoreProvider';
import { useModal } from '../../core/hooks/useModal';
import { eventService } from '../../core/services/events';
import InventoryService from '../../core/services/inventory';
import AddEditInventory from './AddEditInventory';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

const Inventory = () => {
  const { user } = useStore();
  const { openModal } = useModal();

  // ── State ──────────────────────────────────────────────────────────────────
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // ── Load data ──────────────────────────────────────────────────────────────
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (filterType !== 'all') {
        params.type = filterType;
      }

      const response = await InventoryService.getItems(params);
      
      if (response.success) {
        setInventory(response.results?.items || []);
        setPagination(response.results?.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        });
      }
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      toast.error('Error', { description: error.message || 'Failed to load inventory' });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterType, pagination.page, pagination.limit]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      setRefreshKey(prev => prev + 1);
      fetchInventory();
    };

    eventService.onRefresh(handleRefresh);

    return () => {
      eventService.offRefresh(handleRefresh);
    };
  }, [fetchInventory]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory, refreshKey]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredInventory = useMemo(() => {
    return inventory;
  }, [inventory]);

  // ── onSort handler ─────────────────────────────────────────────────────────
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
      size: "2xl",
      side: "right",
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
      link: (item: InventoryItem) => `/inventory/${item.uuid}`,
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
      value: (item: InventoryItem) => `GHS ${item.cost.toFixed(2)}`,
      type: 'column',
    },
    {
      header: 'PRICE',
      sortable: true,
      sortField: 'price',
      value: (item: InventoryItem) => `GHS ${item.price.toFixed(2)}`,
      type: 'column',
      bold: true,
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Inventory Management</h2>
          <p className="text-text-light text-sm">Manage and track all your hydraulic components</p>
        </div>
        <Button onClick={()=>handleAddEditItem()}>
          <Plus className="w-5 h-5" />
          Add Item
        </Button>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredInventory}
        loading={loading}
        placeholder="Search by name, part number, supplier..."
        searchLabel="Search Inventory"
        noDataMessage={
          searchQuery || filterType !== 'all'
            ? 'No items match your filters'
            : 'No inventory items found'
        }
        addButtonText="Add Product"
        page={pagination.page}
        limit={pagination.limit}
        count={pagination.total}
        filterOptions={filterOptions}
        sortOptions={sortOptions}
        customActions={getCustomActions}
        onSearch={setSearchQuery}
        onFilter={setFilterType}
        onSort={handleSort}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onAdd={()=>handleAddEditItem()}
      />
    </div>
  );
};

export default Inventory;