import React, { useState } from 'react';
import DataTable from '../components/Datatable';
import { TableColumn, CustomAction } from '../../core/interfaces/table';
import { SelectOption } from '../components/Input';
import { Roles } from '../../core/enums/roles';

// ============================================
// MOCK DATA
// ============================================

// Sample user data
const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    createdAt: '2024-01-15T10:30:00Z',
    lastLogin: '2024-03-20T14:45:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Manager',
    status: 'active',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    createdAt: '2024-02-10T09:15:00Z',
    lastLogin: '2024-03-19T11:20:00Z',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'User',
    status: 'inactive',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    createdAt: '2024-01-05T08:00:00Z',
    lastLogin: '2024-02-28T16:30:00Z',
  },
  {
    id: '4',
    name: 'Alice Williams',
    email: 'alice@example.com',
    role: 'Admin',
    status: 'active',
    avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
    createdAt: '2024-03-01T12:00:00Z',
    lastLogin: '2024-03-21T09:00:00Z',
  },
  {
    id: '5',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    role: 'User',
    status: 'pending',
    avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
    createdAt: '2024-03-10T14:20:00Z',
    lastLogin: '2024-03-15T10:45:00Z',
  },
];

// Sample product data
const mockProducts = [
  {
    id: '101',
    name: 'Laptop Pro',
    category: 'Electronics',
    price: 1299.99,
    stock: 45,
    status: 'in_stock',
    image: 'https://picsum.photos/id/0/100/100',
  },
  {
    id: '102',
    name: 'Wireless Mouse',
    category: 'Accessories',
    price: 29.99,
    stock: 120,
    status: 'in_stock',
    image: 'https://picsum.photos/id/1/100/100',
  },
  {
    id: '103',
    name: 'Keyboard',
    category: 'Accessories',
    price: 79.99,
    stock: 0,
    status: 'out_of_stock',
    image: 'https://picsum.photos/id/2/100/100',
  },
  {
    id: '104',
    name: 'Monitor 4K',
    category: 'Electronics',
    price: 499.99,
    stock: 15,
    status: 'in_stock',
    image: 'https://picsum.photos/id/3/100/100',
  },
  {
    id: '105',
    name: 'USB-C Cable',
    category: 'Accessories',
    price: 12.99,
    stock: 200,
    status: 'in_stock',
    image: 'https://picsum.photos/id/4/100/100',
  },
];

// Sample order data with nested arrays
const mockOrders = [
  {
    id: 'ORD-001',
    customer: ['John Doe', 'john@example.com'],
    amount: 1249.98,
    items: 3,
    status: 'delivered',
    orderDate: '2024-03-15T08:00:00Z',
  },
  {
    id: 'ORD-002',
    customer: ['Jane Smith', 'jane@example.com'],
    amount: 79.99,
    items: 1,
    status: 'shipped',
    orderDate: '2024-03-18T10:30:00Z',
  },
  {
    id: 'ORD-003',
    customer: ['Bob Johnson', 'bob@example.com'],
    amount: 529.98,
    items: 2,
    status: 'processing',
    orderDate: '2024-03-20T14:15:00Z',
  },
];

// ============================================
// COLUMN DEFINITIONS
// ============================================

// Basic columns for user table
const userColumns: TableColumn[] = [
  {
    header: 'User',
    type: 'image',
    value: (item) => item.avatar,
    link: (item) => `/users/${item.id}`,
    imageConfig: {
      size: 'md',
      altText: (item) => `${item.name}'s avatar`,
    },
  },
  {
    header: 'Name',
    type: 'column',
    value: (item) => item.name,
    link: (item) => `/users/${item.id}`,
    bold: true,
  },
  {
    header: 'Email',
    type: 'column',
    value: (item) => item.email,
  },
  {
    header: 'Role',
    type: 'column',
    value: (item) => item.role,
  },
  {
    header: 'Status',
    type: 'status',
    value: (item) => item.status,
    statusClasses: (item) => {
      switch (item.status) {
        case 'active':
          return 'bg-green-100 text-green-800';
        case 'inactive':
          return 'bg-gray-100 text-gray-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    },
  },
  {
    header: 'Created',
    type: 'date',
    value: (item) => item.createdAt,
    format: 'MMM DD, YYYY',
  },
];

// Product columns with click handlers
const productColumns: TableColumn[] = [
  {
    header: 'Product',
    type: 'image',
    value: (item) => item.image,
    imageConfig: {
      size: 'sm',
      className: 'rounded-md',
    },
  },
  {
    header: 'Name',
    type: 'column',
    value: (item) => item.name,
    bold: true,
    onClick: (item) => alert(`Viewing product: ${item.name}`),
  },
  {
    header: 'Category',
    type: 'column',
    value: (item) => item.category,
  },
  {
    header: 'Price',
    type: 'column',
    value: (item) => `$${item.price.toFixed(2)}`,
    align: 'right',
  },
  {
    header: 'Stock',
    type: 'column',
    value: (item) => item.stock,
    align: 'center',
  },
  {
    header: 'Status',
    type: 'status',
    value: (item) => item.status,
    statusClasses: (item) => {
      switch (item.status) {
        case 'in_stock':
          return 'bg-green-100 text-green-800';
        case 'out_of_stock':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    },
  },
];

// Order columns with array structure
const orderColumns: TableColumn[] = [
  {
    header: 'Order ID',
    type: 'column',
    value: (item) => item.id,
    bold: true,
    link: (item) => `/orders/${item.id}`,
  },
  {
    header: 'Customer',
    type: 'column',
    value: (item) => item.customer, // Array structure: [name, email]
  },
  {
    header: 'Items',
    type: 'column',
    value: (item) => item.items,
    align: 'center',
  },
  {
    header: 'Amount',
    type: 'column',
    value: (item) => `$${item.amount.toFixed(2)}`,
    align: 'right',
  },
  {
    header: 'Status',
    type: 'status',
    value: (item) => item.status,
    statusClasses: (item) => {
      switch (item.status) {
        case 'delivered':
          return 'bg-green-100 text-green-800';
        case 'shipped':
          return 'bg-blue-100 text-blue-800';
        case 'processing':
          return 'bg-yellow-100 text-yellow-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    },
  },
  {
    header: 'Order Date',
    type: 'date',
    value: (item) => item.orderDate,
    format: 'MMM DD, YYYY',
  },
];

// ============================================
// OPTIONS FOR SEARCH/FILTER/SORT
// ============================================

const sortOptions: SelectOption[] = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'date_asc', label: 'Date (Oldest first)' },
  { value: 'date_desc', label: 'Date (Newest first)' },
];

const filterOptions: SelectOption[] = [
  { value: 'all', label: 'All Users' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
];

const roleFilterOptions: SelectOption[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Manager', label: 'Manager' },
  { value: 'User', label: 'User' },
];

const productFilterOptions: SelectOption[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Accessories', label: 'Accessories' },
];

const productSortOptions: SelectOption[] = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'price_asc', label: 'Price (Low to High)' },
  { value: 'price_desc', label: 'Price (High to Low)' },
  { value: 'stock_asc', label: 'Stock (Low to High)' },
  { value: 'stock_desc', label: 'Stock (High to Low)' },
];

// ============================================
// MAIN USAGE COMPONENT
// ============================================

const DataTableUsage: React.FC = () => {
  // State for different table examples
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [userSort, setUserSort] = useState('name_asc');

  const [productPage, setProductPage] = useState(1);
  const [productSearch, setProductSearch] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [productSort, setProductSort] = useState('name_asc');

  const [orderPage, setOrderPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ start_date: string; end_date: string } | null>(null);

  // Mock filtered data (in real app, this would be API calls)
  const getFilteredUsers = () => {
    let filtered = [...mockUsers];
    
    if (userSearch) {
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
      );
    }
    
    if (userFilter !== 'all') {
      filtered = filtered.filter(u => u.status === userFilter);
    }
    
    // Simple sort (in real app, this would be backend sorting)
    switch (userSort) {
      case 'name_asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'date_asc':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'date_desc':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    
    return filtered;
  };

  const getFilteredProducts = () => {
    let filtered = [...mockProducts];
    
    if (productSearch) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase())
      );
    }
    
    if (productFilter !== 'all') {
      filtered = filtered.filter(p => p.category === productFilter);
    }
    
    switch (productSort) {
      case 'name_asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'stock_asc':
        filtered.sort((a, b) => a.stock - b.stock);
        break;
      case 'stock_desc':
        filtered.sort((a, b) => b.stock - a.stock);
        break;
    }
    
    return filtered;
  };

  const filteredUsers = getFilteredUsers();
  const filteredProducts = getFilteredProducts();
  const paginatedUsers = filteredUsers.slice((userPage - 1) * 5, userPage * 5);
  const paginatedProducts = filteredProducts.slice((productPage - 1) * 5, productPage * 5);
  const paginatedOrders = mockOrders.slice((orderPage - 1) * 3, orderPage * 3);

  // Custom actions for user table
  const userCustomActions = (item: any): CustomAction[] => [
    {
      title: 'Edit User',
      icon: 'edit-line',
      handler: (user) => alert(`Editing user: ${user.name}`),
      classes: 'text-primary',
    },
    {
      title: 'View Details',
      icon: 'eye-line',
      handler: (user) => alert(`Viewing user: ${user.name}`),
      classes: 'text-info',
    },
    {
      title: 'Delete User',
      icon: 'delete-bin-line',
      handler: (user) => alert(`Deleting user: ${user.name}`),
      classes: 'text-danger',
    },
  ];

  // Custom actions for product table (different actions)
  const productCustomActions = (item: any): CustomAction[] => {
    const actions: CustomAction[] = [
      {
        title: 'Edit Product',
        icon: 'edit-line',
        handler: (product) => alert(`Editing product: ${product.name}`),
        classes: 'text-primary',
      },
    ];
    
    if (item.stock === 0) {
      actions.push({
        title: 'Restock',
        icon: 'refresh-line',
        handler: (product) => alert(`Restocking product: ${product.name}`),
        classes: 'text-warning',
      });
    } else {
      actions.push({
        title: 'View Stock',
        icon: 'stock-line',
        handler: (product) => alert(`${product.name} has ${product.stock} units in stock`),
        classes: 'text-info',
      });
    }
    
    actions.push({
      title: 'Delete',
      icon: 'delete-bin-line',
      handler: (product) => alert(`Deleting product: ${product.name}`),
      classes: 'text-danger',
    });
    
    return actions;
  };

  // Custom actions for order table (static array, not function)
  const orderCustomActions: CustomAction[] = [
    {
      title: 'View Order',
      icon: 'eye-line',
      handler: (order) => alert(`Viewing order: ${order.id}`),
      classes: 'text-info',
    },
    {
      title: 'Update Status',
      icon: 'refresh-line',
      handler: (order) => alert(`Updating status for order: ${order.id}`),
      classes: 'text-primary',
    },
    {
      title: 'Print Invoice',
      icon: 'printer-line',
      handler: (order) => alert(`Printing invoice for order: ${order.id}`),
      classes: 'text-secondary',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <h1 className="text-2xl font-bold mb-6">DataTable Component Usage Examples</h1>

      {/* ============================================ */}
      {/* EXAMPLE 1: Basic User Table with All Features */}
      {/* ============================================ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">1. User Management Table</h2>
        <p className="text-text-light text-sm">
          Full-featured table with search, filters, sorting, pagination, custom actions, and date range picker.
        </p>
        
        <DataTable
          columns={userColumns}
          data={paginatedUsers}
          sortOptions={sortOptions}
          filterOptions={filterOptions}
          placeholder="Search users by name or email..."
          searchLabel="Users"
          loading={false}
          noDataMessage="No users found matching your criteria."
          addButtonText="Add New User"
          userRole={Roles.ADMIN}
          page={userPage}
          limit={5}
          count={filteredUsers.length}
          customActions={userCustomActions}
          currentDateRange={dateRange}
          onSearch={setUserSearch}
          onFilter={setUserFilter}
          onSort={setUserSort}
          onPageChange={setUserPage}
          onAdd={() => alert('Opening add user form...')}
          onDateRangeChange={setDateRange}
        />
      </section>

      {/* ============================================ */}
      {/* EXAMPLE 2: Product Table with Click Handlers */}
      {/* ============================================ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">2. Product Catalog Table</h2>
        <p className="text-text-light text-sm">
          Features clickable product names, conditional actions based on product state, and custom sorting.
        </p>
        
        <DataTable
          columns={productColumns}
          data={paginatedProducts}
          sortOptions={productSortOptions}
          filterOptions={productFilterOptions}
          placeholder="Search products..."
          searchLabel="Products"
          loading={false}
          noDataMessage="No products found."
          addButtonText="Add Product"
          page={productPage}
          limit={5}
          count={filteredProducts.length}
          customActions={productCustomActions}
          onSearch={setProductSearch}
          onFilter={setProductFilter}
          onSort={setProductSort}
          onPageChange={setProductPage}
          onAdd={() => alert('Opening add product form...')}
        />
      </section>

      {/* ============================================ */}
      {/* EXAMPLE 3: Orders Table with Array Data */}
      {/* ============================================ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">3. Orders Table</h2>
        <p className="text-text-light text-sm">
          Demonstrates array structure for customer column (primary/secondary text) and static custom actions.
        </p>
        
        <DataTable
          columns={orderColumns}
          data={paginatedOrders}
          sortOptions={sortOptions}
          filterOptions={roleFilterOptions}
          placeholder="Search orders..."
          searchLabel="Orders"
          loading={false}
          noDataMessage="No orders found."
          page={orderPage}
          limit={3}
          count={mockOrders.length}
          customActions={orderCustomActions}
          onSearch={() => {}}
          onFilter={() => {}}
          onSort={() => {}}
          onPageChange={setOrderPage}
        />
      </section>

      {/* ============================================ */}
      {/* EXAMPLE 4: Loading State */}
      {/* ============================================ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">4. Loading State</h2>
        <p className="text-text-light text-sm">
          Shows skeleton loaders while data is being fetched.
        </p>
        
        <DataTable
          columns={userColumns.slice(0, 4)}
          data={null}
          loading={true}
          noDataMessage="Loading users..."
          page={1}
          limit={5}
          count={0}
          customActions={userCustomActions}
        />
      </section>

      {/* ============================================ */}
      {/* EXAMPLE 5: Empty State with Add Button */}
      {/* ============================================ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">5. Empty State</h2>
        <p className="text-text-light text-sm">
          Shows empty state message with an "Add New" button when no data exists.
        </p>
        
        <DataTable
          columns={userColumns.slice(0, 4)}
          data={[]}
          loading={false}
          noDataMessage="No users have been created yet."
          addButtonText="Create First User"
          onAdd={() => alert('Opening user creation form...')}
          page={1}
          limit={5}
          count={0}
        />
      </section>

      {/* ============================================ */}
      {/* EXAMPLE 6: Minimal Table (No Search/Filter/Sort) */}
      {/* ============================================ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">6. Minimal Table</h2>
        <p className="text-text-light text-sm">
          Simple table without search, filters, sorting, or pagination.
        </p>
        
        <DataTable
          columns={userColumns.slice(0, 3)}
          data={mockUsers.slice(0, 3)}
          loading={false}
          noDataMessage="No data"
          page={1}
          limit={5}
          count={3}
        />
      </section>

      {/* ============================================ */}
      {/* EXAMPLE 7: Table with Link Navigation */}
      {/* ============================================ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">7. Link Navigation</h2>
        <p className="text-text-light text-sm">
          User names and avatars are clickable links that navigate to user detail pages.
        </p>
        
        <DataTable
          columns={userColumns.slice(0, 3)}
          data={mockUsers.slice(0, 3)}
          loading={false}
          noDataMessage="No data"
          page={1}
          limit={5}
          count={3}
        />
        <div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-800">
          <strong>Note:</strong> In a real application with React Router, the links would navigate to actual routes like /users/1, /users/2, etc.
        </div>
      </section>

      {/* ============================================ */}
      {/* EXAMPLE 8: Dropdown vs Inline Actions */}
      {/* ============================================ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">8. Action Menu Types</h2>
        <p className="text-text-light text-sm">
          By default, when customActions are provided, they appear as inline buttons. When there are many actions, they can be configured to use a dropdown menu (the current implementation uses inline for this example, but the component supports dropdowns via the `useActionDropdowns` internal logic).
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inline Actions Example */}
          <div>
            <h3 className="font-medium mb-2">Inline Actions</h3>
            <DataTable
              columns={userColumns.slice(0, 2)}
              data={mockUsers.slice(0, 2)}
              customActions={[
                { title: 'Edit', icon: 'edit-line', handler: () => alert('Edit') },
                { title: 'Delete', icon: 'delete-bin-line', handler: () => alert('Delete') },
              ]}
              page={1}
              limit={5}
              count={2}
            />
          </div>
          
          {/* Multiple Actions Example */}
          <div>
            <h3 className="font-medium mb-2">Multiple Actions</h3>
            <DataTable
              columns={userColumns.slice(0, 2)}
              data={mockUsers.slice(0, 2)}
              customActions={[
                { title: 'View', icon: 'eye-line', handler: () => alert('View') },
                { title: 'Edit', icon: 'edit-line', handler: () => alert('Edit') },
                { title: 'Duplicate', icon: 'file-copy-line', handler: () => alert('Duplicate') },
                { title: 'Archive', icon: 'archive-line', handler: () => alert('Archive') },
                { title: 'Delete', icon: 'delete-bin-line', handler: () => alert('Delete') },
              ]}
              page={1}
              limit={5}
              count={2}
            />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* EXAMPLE 9: Different User Roles */}
      {/* ============================================ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">9. User Role Integration</h2>
        <p className="text-text-light text-sm">
          The component accepts a userRole prop which can be used to conditionally show/hide features based on permissions.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2 text-green-600">Admin View</h3>
            <DataTable
              columns={userColumns.slice(0, 3)}
              data={mockUsers.slice(0, 2)}
              userRole={Roles.ADMIN}
              addButtonText="Add User (Admin Only)"
              onAdd={() => alert('Admin: Adding user')}
              page={1}
              limit={5}
              count={2}
            />
          </div>
          
          <div>
            <h3 className="font-medium mb-2 text-yellow-600">Sales View</h3>
            <DataTable
              columns={userColumns.slice(0, 3)}
              data={mockUsers.slice(0, 2)}
              userRole={Roles.SALES}
              addButtonText="Add User"
              onAdd={() => alert('Sales: Cannot add user - permission denied')}
              page={1}
              limit={5}
              count={2}
            />
            <p className="text-xs text-text-light mt-2">
              Note: The add button may be conditionally hidden based on user role in your implementation.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* EXAMPLE 10: Responsive Behavior Info */}
      {/* ============================================ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">10. Responsive Features</h2>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Responsive Design Notes</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
            <li>The table is horizontally scrollable on mobile devices (overflow-x-auto)</li>
            <li>Pagination adapts to show fewer page buttons on smaller screens</li>
            <li>Search and filter inputs stack vertically on mobile</li>
            <li>Action buttons become a dropdown menu when space is limited</li>
            <li>Image avatars are hidden on very small screens (hidden sm:block)</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default DataTableUsage;