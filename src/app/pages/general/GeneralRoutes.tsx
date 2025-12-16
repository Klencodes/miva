import React from 'react';
import { Routes, Route } from 'react-router-dom';

const TermsConditions = React.lazy(() => import('./TermsConditions'));

const GeneralRoutes: React.FC = () => {
  return (
    <Routes>      
      {/* Users routes */}
      <Route path="/terms-conditions" element={<TermsConditions />} />
    </Routes>
  );
};

export default GeneralRoutes;