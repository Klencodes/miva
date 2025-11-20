import React from "react";
import { Routes, Route } from "react-router-dom";

const PayoutsList = React.lazy(() => import('./PayoutsList'));


function PayoutRoutes() {
  return (
    <Routes>
      <Route path="/list" element={<PayoutsList />} />
    </Routes>
  );
}

export default PayoutRoutes;
