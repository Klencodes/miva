// src/IRoutes.tsx
import { lazy, Suspense, useMemo } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import CommonLayout from "./components/layouts/CommonLayout";
import FullLayout from "./components/layouts/FullLayout";
import Loader from "./components/common/Loader";
import { useStore } from "./core/contexts/StoreProvider";


const AuthRoutes = lazy(() => import("./pages/auth/AuthRoutes"));
const PagesRoutes = lazy(() => import("./pages/PageRoutes"));
const CreateAdmin = lazy(() => import("./pages/auth/CreateAdmin"));

const ScreenLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0F172A]">
    <Loader />
  </div>
);

// ─── AdminGuard ────────────────────────────────────────────────────────────────
const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { adminExists, checkingAdmin, initializationComplete } = useStore();
  const location = useLocation();

  if (!initializationComplete || checkingAdmin) return <ScreenLoader />;

  // Admin already exists — send away from the create-admin page
  if (adminExists) {
    return <Navigate to="/account/login" state={{ from: location }} replace />;
  }

  return <FullLayout>{children}</FullLayout>;
};

// ─── ProtectedRoute ────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { userRef, isAuthenticatedRef, initializationComplete, adminExists, checkingAdmin, } = useStore();
  const location = useLocation();

  // ✅ All hooks before any early return
  const requiredRoute = useMemo(() => {
    if (!initializationComplete) return null;
  }, [initializationComplete]);

  if (checkingAdmin || !initializationComplete) return <ScreenLoader />;

  if (!adminExists) {
    return <Navigate to="/account/create-admin" replace />;
  }

  if (!userRef.current && !isAuthenticatedRef.current) {
    return <Navigate to="/account/login" state={{ from: location }} replace />;
  }
  
  if (requiredRoute && requiredRoute !== location.pathname) {
    return <Navigate to={requiredRoute} replace />;
  }

  return <CommonLayout>{children}</CommonLayout>;
};

// ─── PublicRoute ──────────────────────────────────────────────────────────────
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticatedRef, initializationComplete, adminExists, checkingAdmin, userRef, } = useStore();
  const location = useLocation();

  const requiredRoute = useMemo(() => {
    if (!initializationComplete) return null;
  }, [initializationComplete]);

  const currentAuthState = isAuthenticatedRef.current;
  const verified = userRef.current?.verified;
  const hasNoEntities = (userRef.current?.entities?.length ?? 0) <= 0;

  if (!initializationComplete || checkingAdmin) return <ScreenLoader />;

  if (!adminExists && location.pathname !== "/account/create-admin") {
    return <Navigate to="/account/create-admin" replace />;
  }

  if (currentAuthState) {
    // Step 1: Must verify first
    if (!verified && location.pathname !== "/account/verify") {
      return <Navigate to="/account/verify" replace />;
    }

    // Step 2: Verified but no entities — create organisation
    if (verified && hasNoEntities && location.pathname !== "/account/create-organisation") {
      return <Navigate to="/account/create-organisation" replace />;
    }

    // Step 3: Fully set up — go to required route
    if (verified && !hasNoEntities && requiredRoute && requiredRoute !== location.pathname) {
      return <Navigate to={requiredRoute} replace />;
    }
  }

  return <FullLayout>{children}</FullLayout>;
};

// ─── AppRoutes ────────────────────────────────────────────────────────────────
const IRoutes = () => {
  const { initializationComplete, checkingAdmin } = useStore();

  if (!initializationComplete || checkingAdmin) return <ScreenLoader />;

  return (
    <Suspense fallback={<ScreenLoader />}>
      <Routes>
        <Route
          path="/account/create-admin"
          element={
            <AdminGuard>
              <CreateAdmin />
            </AdminGuard>
          }
        />
        <Route
          path="/account/*"
          element={
            <PublicRoute>
              <AuthRoutes />
            </PublicRoute>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <PagesRoutes />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
};

export default IRoutes;
