import React from 'react';
import { Routes, Route } from 'react-router-dom';

const Store = React.lazy(() => import('./Store'));

const StoreRoutes: React.FC = () => {
  return (
    <Routes>      
      {/* Users routes */}
      <Route path="/" element={<Store />} />
    </Routes>
  );
};

export default StoreRoutes;