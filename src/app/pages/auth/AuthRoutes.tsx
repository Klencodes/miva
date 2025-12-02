import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const Login = React.lazy(() => import('./Login'));
const Register = React.lazy(() => import('./Register'));
const ForgotPassword = React.lazy(() => import('./ForgotPassword'));
const CreateBusiness = React.lazy(() => import('./CreateBusiness'));
const Verify = React.lazy(() => import('./Verify'));
const AccessDenied = React.lazy(() => import('./AccessDenied'));

const AuthRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root /account path redirects to login */}
      <Route path="/" element={<Navigate to="/account/login" replace />} />
      
      {/* Individual auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/create-business" element={<CreateBusiness />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/access-denied" element={<AccessDenied />} />
      
      {/* Catch all for auth - redirect to login */}
      <Route path="*" element={<Navigate to="/account/login" replace />} />
    </Routes>
  );
};

export default AuthRoutes;