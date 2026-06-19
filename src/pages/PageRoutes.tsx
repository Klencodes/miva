import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';


// Lazy load page components
const Dashboard = React.lazy(() => import('./dashboard/Dashboard'));
const Suppliers = React.lazy(() => import('./suppliers/Suppliers'));
const Inventory = React.lazy(() => import('./inventory/Inventory'));
const Invoicing = React.lazy(() => import('./invoicing/Invoicing'));
const CreateInvoice = React.lazy(() => import('./invoicing/CreateInvoice'));
const SettingsPage = React.lazy(() => import('./settings/Settings'));
const InvoiceDetails = React.lazy(() => import('./invoicing/InvoiceDetails'));

export const PagesRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root path redirects to store */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/suppliers" element={<Suppliers/>} />
      <Route path="/inventory" element={<Inventory/>} />
      <Route path="/invoices" element={<Invoicing/>} />
      <Route path="/invoices/create" element={<CreateInvoice />} />
      <Route path="/invoices/:id" element={<InvoiceDetails />} />
      <Route path="/invoices/edit/:id" element={<CreateInvoice />} /> 


      <Route path="/settings" element={<SettingsPage />} />
      {/* Catch all route for protected pages */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default PagesRoutes;