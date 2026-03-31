import React from 'react';
import { Routes, Route } from 'react-router-dom';

const TermsConditions = React.lazy(() => import('./TermsConditions'));
const InputExamples = React.lazy(() => import('../../../ui/components/InputExamples'));

const GeneralRoutes: React.FC = () => {
  return (
    <Routes>      
      {/* Users routes */}
      <Route path="/terms-conditions" element={<TermsConditions />} />
      <Route path="/inputs" element={<InputExamples />} />
    </Routes>
  );
};

export default GeneralRoutes;