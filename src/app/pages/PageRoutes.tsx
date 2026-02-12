import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Lazy load page components
const SettingsRoutes = React.lazy(() => import('./settings/SettingsRoutes'));
const PayoutRoutes = React.lazy(() => import('./payouts/PayoutRoutes'));
const UserManagementRoutes = React.lazy(() => import('./user-management/UserManagementRoutes'));
const StoreRoutes = React.lazy(() => import('./store/StoreRoutes'));
const OrdersRoutes = React.lazy(() => import('./orders/OrdersRoutes'));
const ProductsRoutes = React.lazy(() => import('./products/ProductsRoutes'));
const GeneralRoutes = React.lazy(() => import('./general/GeneralRoutes'));
const SupplierRoutes = React.lazy(() => import('./suppliers/SuppliersRoutes'));
const InsightRoutes = React.lazy(() => import('./insights/InsightRoutes'));

export const PagesRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root path redirects to store */}
      <Route path="/" element={<Navigate to="/store" replace />} />
      
      <Route path="/orders/*" element={<OrdersRoutes />} />
      <Route path="/*" element={<GeneralRoutes />} />
      <Route path="/products/*" element={<ProductsRoutes />} />
      <Route path="/store/*" element={<StoreRoutes />} />
      <Route path="/settings/*" element={<SettingsRoutes />} />
      <Route path="/payouts/*" element={<PayoutRoutes />} />
      <Route path="/insights/*" element={<InsightRoutes />} />
      <Route path="/suppliers/*" element={<SupplierRoutes />} />
      <Route path="/system-users/*" element={<UserManagementRoutes />} />

      {/* Catch all route for protected pages */}
      <Route path="*" element={<Navigate to="/store" replace />} />
    </Routes>
  );
};

export default PagesRoutes;