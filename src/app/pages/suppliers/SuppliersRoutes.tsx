import React from 'react';
import { Routes, Route } from 'react-router-dom';

const Suppliers = React.lazy(() => import('./Suppliers'));

const SupplierRoutes: React.FC = () => {
  return (
    <Routes>      
      {/* Suppliers routes */}
      <Route path="/" element={<Suppliers />} />
    </Routes>
  );
};

export default SupplierRoutes;