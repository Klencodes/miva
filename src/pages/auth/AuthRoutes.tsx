import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const Login = React.lazy(() => import('./Login'));
const ForgotPassword = React.lazy(() => import('./ForgotPassword'));
const CreateOrganisation = React.lazy(() => import('./CreateOrganisation'));
const Verify = React.lazy(() => import('./Verify'));

const AuthRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root /account path redirects to login */}
      <Route path="/" element={<Navigate to="/account/login" replace />} />
      
      {/* Individual auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/create-organisation" element={<CreateOrganisation />} />
      
      {/* Catch all for auth - redirect to login */}
      <Route path="*" element={<Navigate to="/account/login" replace />} />
    </Routes>
  );
};

export default AuthRoutes;