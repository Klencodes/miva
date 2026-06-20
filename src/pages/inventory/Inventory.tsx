import React, { useState, useMemo, useEffect } from 'react';
import { DataTable } from '../../components/common';
import { InventoryItem, IUser } from '../../core/types';
import { DUMMY_USERS, getPermissions } from '../../core/constants/permissions';
import { ColumnDef } from '../../components/common/Datatable';

// ─── Component ────────────────────────────────────────────────────────────────

interface InventoryProps {
  currentUser?: IUser;
}

const Inventory: React.FC<InventoryProps> = ({ currentUser }) => {
  const activeUser: IUser = currentUser ?? DUMMY_USERS[0];

  // ── State ──────────────────────────────────────────────────────────────────
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>(activeUser.uuid);
  const [demoUser, setDemoUser] = useState<IUser>(activeUser);

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setInventory();
      setLoading(false);
    }, 500);
  }, []);

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
    let filtered = inventory;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.specs?.sae?.toLowerCase().includes(q) ||
          item.specs?.thread_type?.toLowerCase().includes(q) ||
          item.supplier?.toLowerCase().includes(q)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((item) => item.type === filterType);
    }

    return filtered;
  }, [inventory, searchQuery, filterType]);

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
        else if (field === 'description')
          cmp = (a.description ?? '').localeCompare(b.description ?? '');
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
  const updateInventory = (id: string, newQuantity: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.uuid === id
          ? { ...item, quantity: Math.max(0, newQuantity), lastUpdated: new Date() }
          : item
      )
    );
  };

  const deleteInventoryItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.uuid !== id));
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
      value: (item: InventoryItem) => item.quantity,
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
    {
      header: 'description',
      sortable: true,
      sortField: 'description',
      value: (item: InventoryItem) => item.description || '—',
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
      handler: () => updateInventory(item.uuid, item.quantity - 1),
    });

    if (activePermissions.can_edit_inventory) {
      actions.push({
        title: 'Edit',
        icon: 'edit',
        classes: 'text-blue-600 hover:text-blue-800',
        handler: () => console.log('Edit item:', item.uuid),
      });
    }

    if (activePermissions.can_delete_inventory) {
      actions.push({
        title: 'Delete',
        icon: 'delete',
        classes: 'text-red-600 hover:text-red-800',
        handler: () => {
          if (window.confirm(`Delete "${item.name}"?`)) deleteInventoryItem(item.uuid);
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

      </div>

      {/* Stock Status Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-light">Total Items</span>
            <span className="text-2xl font-bold text-text">{stockStatus.total}</span>
          </div>
        </div>
        <div className="bg-card shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-light">Healthy Stock</span>
            <span className="text-2xl font-bold text-emerald-600">{stockStatus.healthy}</span>
          </div>
        </div>
        <div className="bg-card shadow-sm p-4 border border-gray-200">
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
        page={1}
        limit={10}
        count={filteredInventory.length}
        filterOptions={filterOptions}
        customActions={getCustomActions}
        onSearch={setSearchQuery}
        onFilter={setFilterType}
        onSort={handleSort}
        onPageChange={(page) => console.log('Page changed:', page)}
        onAdd={() => console.log('Add product clicked')}
      />
    </div>
  );
};

export default Inventory;