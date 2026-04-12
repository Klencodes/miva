import React from 'react';
import { Routes, Route } from 'react-router-dom';

const TermsConditions = React.lazy(() => import('./TermsConditions'));
const InputUsage = React.lazy(() => import('../../../ui/usage/InputUsage'));
const ButtonUsage = React.lazy(() => import('../../../ui/usage/ButtonUsage'));
const DatatableUsage = React.lazy(() => import('../../../ui/usage/DatatableUsage'));

const GeneralRoutes: React.FC = () => {
  return (
    <Routes>      
      {/* Users routes */}
      <Route path="/terms-conditions" element={<TermsConditions />} />
      <Route path="/ui/inputs" element={<InputUsage />} />
      <Route path="/ui/buttons" element={<ButtonUsage />} />
      <Route path="/ui/datatable" element={<DatatableUsage />} />
    </Routes>
  );
};

export default GeneralRoutes;