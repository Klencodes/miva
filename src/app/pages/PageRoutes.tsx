import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Lazy load page components
const Dashboard = React.lazy(() => import('./dashboard/Index'));
const SettingsRoutes = React.lazy(() => import('./settings/SettingsRoutes'));
const PayoutRoutes = React.lazy(() => import('./payouts/PayoutRoutes'));
const UserManagementRoutes = React.lazy(() => import('./user-management/UserManagementRoutes'));
const StoreRoutes = React.lazy(() => import('./store/StoreRoutes'));
const OrdersRoutes = React.lazy(() => import('./orders/OrdersRoutes'));
const ProductsRoutes = React.lazy(() => import('./products/ProductsRoutes'));

export const PagesRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root path redirects to dashboard */}
      <Route path="/" element={<Navigate to="/store" replace />} />
      
      {/* Individual pages */}
      <Route path="/store" element={<StoreRoutes />} />
      <Route path="/orders" element={<OrdersRoutes />} />
      <Route path="/products" element={<ProductsRoutes />} />
      <Route path="/reports" element={<Dashboard />} />
      
      {/* Modules with nested routes */}
      <Route path="/settings/*" element={<SettingsRoutes />} />
      <Route path="/payouts/*" element={<PayoutRoutes />} />
      <Route path="/accounts/*" element={<UserManagementRoutes />} />

      {/* Catch all route for protected pages */}
      <Route path="*" element={<Navigate to="/store" replace />} />
    </Routes>
  );
};

export default PagesRoutes;