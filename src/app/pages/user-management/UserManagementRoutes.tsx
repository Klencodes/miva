import React from 'react';
import { Routes, Route } from 'react-router-dom';

const Staffs = React.lazy(() => import('./Users'));

const UserRoutes: React.FC = () => {
  return (
    <Routes>      
      {/* Users routes */}
      <Route path="/" element={<Staffs />} />
    </Routes>
  );
};

export default UserRoutes;