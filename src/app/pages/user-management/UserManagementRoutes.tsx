import React from 'react';
import { Routes, Route } from 'react-router-dom';

const Users = React.lazy(() => import('./Users'));

const UserRoutes: React.FC = () => {
  return (
    <Routes>      
      {/* Users routes */}
      <Route path="/" element={<Users />} />
    </Routes>
  );
};

export default UserRoutes;