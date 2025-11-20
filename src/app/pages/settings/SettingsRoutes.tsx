import React from "react";
import { Routes, Route } from "react-router-dom";

const SystemPreferences = React.lazy(() => import('./SystemPreferences'));
const CompanyInfo = React.lazy(() => import('./CompanyInfo'));


function SettingsRoutes() {
  return (
    <Routes>
      <Route path="company-info" element={<CompanyInfo />} />
      <Route path="preference" element={<SystemPreferences />} />
      <Route path="" element={<CompanyInfo />} />
    </Routes>
  );
}

export default SettingsRoutes;
