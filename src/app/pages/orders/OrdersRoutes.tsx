import React from 'react';
import { Routes, Route } from 'react-router-dom';

const Orders = React.lazy(() => import('./Orders'));

const OrdersRoutes: React.FC = () => {
  return (
    <Routes>      
      {/* Users routes */}
      <Route path="/" element={<Orders />} />
    </Routes>
  );
};

export default OrdersRoutes;