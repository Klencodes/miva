import React from 'react';
import { Routes, Route } from 'react-router-dom';

const Products = React.lazy(() => import('./Products'));

const ProductsRoutes: React.FC = () => {
  return (
    <Routes>      
      {/* Users routes */}
      <Route path="/" element={<Products />} />
    </Routes>
  );
};

export default ProductsRoutes;