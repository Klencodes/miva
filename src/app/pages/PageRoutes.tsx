import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import InsightsRoutes from './insights/insightsRoutes';

// Lazy load page components
const SettingsRoutes = React.lazy(() => import('./settings/SettingsRoutes'));
const PayoutRoutes = React.lazy(() => import('./payouts/PayoutRoutes'));
const UserManagementRoutes = React.lazy(() => import('./user-management/UserManagementRoutes'));
const StoreRoutes = React.lazy(() => import('./store/StoreRoutes'));
const OrdersRoutes = React.lazy(() => import('./orders/OrdersRoutes'));
const ProductsRoutes = React.lazy(() => import('./products/ProductsRoutes'));
const GeneralRoutes = React.lazy(() => import('./general/GeneralRoutes'));

export const PagesRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root path redirects to store */}
      <Route path="/" element={<Navigate to="/store" replace />} />
      
      {/* Individual pages */}
      <Route path="/orders/*" element={<OrdersRoutes />} />
      <Route path="/*" element={<GeneralRoutes />} />
      <Route path="/products/*" element={<ProductsRoutes />} />
      <Route path="/store/*" element={<StoreRoutes />} />
      {/* Modules with nested routes */}
      <Route path="/settings/*" element={<SettingsRoutes />} />
      <Route path="/payouts/*" element={<PayoutRoutes />} />
      <Route path="/insights/*" element={<InsightsRoutes />} />
      <Route path="/system-users/*" element={<UserManagementRoutes />} />

      {/* Catch all route for protected pages */}
      <Route path="*" element={<Navigate to="/store" replace />} />
    </Routes>
  );
};

export default PagesRoutes;