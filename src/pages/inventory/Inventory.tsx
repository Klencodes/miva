import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DataTable } from '../../components/common';
import { InventoryItem, IUser } from '../../core/types';
import { DUMMY_USERS, getPermissions } from '../../core/constants/permissions';
import { ColumnDef } from '../../components/common/Datatable';
import { useStore } from '../../core/contexts/StoreProvider';
import { useModal } from '../../core/hooks/useModal';
import { eventService } from '../../core/services/events';
import InventoryService from '../../core/services/inventory';
import AddEditInventory from './AddEditInventory';
import { toast } from 'sonner';

// ─── Component ────────────────────────────────────────────────────────────────

interface InventoryProps {
  currentUser?: IUser;
}

const Inventory: React.FC<InventoryProps> = ({ currentUser }) => {
  const { user } = useStore();
  const { openModal } = useModal();
  const activeUser: IUser = currentUser ?? user ?? DUMMY_USERS[0];

  // ── State ──────────────────────────────────────────────────────────────────
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>(activeUser.uuid);
  const [demoUser, setDemoUser] = useState<IUser>(activeUser);
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

  // ── Demo user switcher ─────────────────────────────────────────────────────
  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const user = DUMMY_USERS.find((u) => u.uuid === e.target.value);
    if (user) {
      setSelectedUserId(user.uuid);
      setDemoUser(user);
    }
  };

  const activePermissions = getPermissions(demoUser.role);

  // ── Filter (sort is delegated to DataTable via onSort) ─────────────────────
  const filteredInventory = useMemo(() => {
    return inventory;
  }, [inventory]);

  // ── onSort handler (DataTable emits "field_dir") ───────────────────────────
  const handleSort = (sortValue: string) => {
    if (!sortValue) return;
    const lastUnderscore = sortValue.lastIndexOf('_');
    const field = sortValue.slice(0, lastUnderscore) as keyof InventoryItem;
    const dir = sortValue.slice(lastUnderscore + 1) as 'asc' | 'desc';

    setInventory((prev) =>
      [...prev].sort((a, b) => {
        let cmp = 0;
        if (field === 'name') cmp = a.name.localeCompare(b.name);
        else if (field === 'type') cmp = a.type.localeCompare(b.type);
        else if (field === 'unit') cmp = (a.unit ?? '').localeCompare(b.unit ?? '');
        else if (field === 'quantity') cmp = a.quantity - b.quantity;
        else if (field === 'cost') cmp = a.cost - b.cost;
        else if (field === 'price') cmp = a.price - b.price;
        return dir === 'asc' ? cmp : -cmp;
      })
    );
  };

  // ── Stock summary ──────────────────────────────────────────────────────────
  const stockStatus = useMemo(() => {
    const total = inventory.length;
    const low = inventory.filter((item) => item.quantity <= item.reorder_threshold).length;
    return { total, low, healthy: total - low };
  }, [inventory]);

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

  // ── Add/Edit modal handlers ────────────────────────────────────────────────
  const handleAddItem = async () => {
    const result = await openModal(AddEditInventory, {
      data: { item: null },
      size: "xl",
      side: "right",
    });

    if (result?.success) {
      fetchInventory();
    }
  };

  const handleEditItem = async (item: InventoryItem) => {
    const result = await openModal(AddEditInventory, {
      data: { item },
      size: "xl",
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
      value: (item: InventoryItem) => [item.name, item.supplier || ''],
      type: 'column',
      bold: true,
      link: (item: InventoryItem) => `/inventory/${item.uuid}`,
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
      header: 'SPECS',
      value: (item: InventoryItem) => {
        const specs: string[] = [];
        if (item.specs?.sae) specs.push(`SAE ${item.specs.sae}`);
        if (item.specs?.thread_type) specs.push(item.specs.thread_type);
        if (item.specs?.pressure) specs.push(`${item.specs.pressure} bar`);
        if (item.specs?.diameter) specs.push(`${item.specs.diameter}"`);
        if (item.specs?.material) specs.push(item.specs.material);
        if (item.specs?.angle) specs.push(`${item.specs.angle}°`);
        if (item.specs?.part_number) specs.push(item.specs.part_number);
        return specs.slice(0, 3).join(' • ');
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

    if (activePermissions.can_edit_inventory) {
      actions.push({
        title: 'Edit',
        icon: 'edit',
        classes: 'text-blue-600 hover:text-blue-800',
        handler: () => handleEditItem(item),
      });
    }

    if (activePermissions.can_delete_inventory) {
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
    { value: 'quantity_asc', label: 'Quantity Low-High' },
    { value: 'quantity_desc', label: 'Quantity High-Low' },
    { value: 'price_asc', label: 'Price Low-High' },
    { value: 'price_desc', label: 'Price High-Low' },
    { value: 'cost_asc', label: 'Cost Low-High' },
    { value: 'cost_desc', label: 'Cost High-Low' },
  ];

  // ── Role badge colours ─────────────────────────────────────────────────────
  const roleBadgeColor: Record<string, string> = {
    super_admin: 'bg-red-100 text-red-700 border-red-200',
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    technician: 'bg-blue-100 text-blue-700 border-blue-200',
    sales: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    viewer: 'bg-gray-100 text-text-light border-gray-200',
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-bold text-text flex items-center gap-3">
            Inventory Management
          </h2>
          <p className="text-text-light text-sm mt-1">
            Track and manage your hydraulic components
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Demo User Switcher */}
          <select
            value={selectedUserId}
            onChange={handleUserChange}
            className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary"
          >
            {DUMMY_USERS.map((u) => (
              <option key={u.uuid} value={u.uuid}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${roleBadgeColor[demoUser.role]}`}>
            {demoUser.role}
          </span>
        </div>
      </div>

      {/* Stock Status Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card shadow-sm p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-light">Total Items</span>
            <span className="text-2xl font-bold text-text">{stockStatus.total}</span>
          </div>
        </div>
        <div className="bg-card shadow-sm p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-light">Healthy Stock</span>
            <span className="text-2xl font-bold text-emerald-600">{stockStatus.healthy}</span>
          </div>
        </div>
        <div className="bg-card shadow-sm p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-light">Low Stock</span>
            <span
              className={`text-2xl font-bold ${
                stockStatus.low > 0 ? 'text-red-600' : 'text-text'
              }`}
            >
              {stockStatus.low}
              {stockStatus.low > 0 && <span className="text-sm ml-1">⚠️</span>}
            </span>
          </div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredInventory}
        loading={loading}
        placeholder="Search by name, SAE, thread type..."
        searchLabel="Search Inventory"
        noDataMessage={
          searchQuery || filterType !== 'all'
            ? 'No items match your filters'
            : 'No inventory items found'
        }
        addButtonText="Add Product"
        userRole={demoUser.role as any}
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
        onAdd={handleAddItem}
      />
    </div>
  );
};

export default Inventory;