import React from "react";
import { Routes, Route } from "react-router-dom";


const RevenueInsights = React.lazy(() => import("./RevenueInsights"));

function InsightsRoutes() {
  return (
    <Routes>
      <Route path="revenue" element={<RevenueInsights />} />
    </Routes>
  );
}

export default InsightsRoutes;