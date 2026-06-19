import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const Login = React.lazy(() => import('./Login'));
const ForgotPassword = React.lazy(() => import('./ForgotPassword'));
const CreateBusiness = React.lazy(() => import('./CreateBusiness'));

const AuthRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root /account path redirects to login */}
      <Route path="/" element={<Navigate to="/account/login" replace />} />
      
      {/* Individual auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/create-business" element={<CreateBusiness />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Catch all for auth - redirect to login */}
      <Route path="*" element={<Navigate to="/account/login" replace />} />
    </Routes>
  );
};

export default AuthRoutes;