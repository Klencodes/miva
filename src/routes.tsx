import { lazy, Suspense, useMemo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import CommonLayout from "./components/layouts/CommonLayout";
import FullLayout from "./components/layouts/FullLayout";
import { getStoredItem, NO_ENTITY_KEY, useStore } from "./core/hooks/useStore";
import Loader from "./components/common/Loader";

// ─── Lazy page routes ─────────────────────────────────────────────────────────
const AuthRoutes = lazy(() => import("./pages/auth/AuthRoutes"));
const PagesRoutes = lazy(() => import("./pages/PageRoutes"));

// ─── Full-screen loader fallback ──────────────────────────────────────────────
const ScreenLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0F172A]">
    <Loader />
  </div>
);

// ─── ProtectedRoute ───────────────────────────────────────────────────────────
// Wraps authenticated pages in CommonLayout (Header + Sidebar + Footer).
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const {
    userRef,
    getRequiredRoute,
    isAuthenticatedRef,
    initializationComplete,
  } = useStore();
  const location = useLocation();

  const requiredRoute = useMemo(() => {
    if (!initializationComplete) return null;
    return getRequiredRoute();
  }, [initializationComplete, getRequiredRoute]);

  const currentAuthState = isAuthenticatedRef.current;

  // Not authenticated — send to login, preserving the attempted location
  if (!userRef.current && !currentAuthState && initializationComplete) {
    return <Navigate to="/account/login" state={{ from: location }} replace />;
  }

  // Store requires a specific route (e.g. setup, verify email)
  if (requiredRoute && requiredRoute !== location.pathname) {
    return <Navigate to={requiredRoute} replace />;
  }

  // Authenticated — render inside the full app shell
  return <CommonLayout>{children}</CommonLayout>;
};

// ─── PublicRoute ──────────────────────────────────────────────────────────────
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { getRequiredRoute, isAuthenticatedRef, initializationComplete } =
    useStore();
  const location = useLocation();

  const requiredRoute = useMemo(() => {
    if (!initializationComplete) return null;
    return getRequiredRoute();
  }, [initializationComplete, getRequiredRoute]);

  const currentAuthState = isAuthenticatedRef.current;
  const hasPendingEntity = !!getStoredItem(NO_ENTITY_KEY, null);

  // Authenticated with no pending actions → go to main app
  if (currentAuthState && !requiredRoute && !hasPendingEntity) {
    return <Navigate to="/store" replace />;
  }

  // Authenticated but with a required redirect (e.g. forced setup step)
  if (
    currentAuthState &&
    requiredRoute &&
    requiredRoute !== location.pathname
  ) {
    return <Navigate to={requiredRoute} replace />;
  }

  // Unauthenticated — render as full-screen public page
  return <FullLayout>{children}</FullLayout>;
};

// ─── AppRoutes ────────────────────────────────────────────────────────────────
const AppRoutes = () => {
  const { initializationComplete } = useStore();

  // Hold rendering until auth state is resolved
  if (!initializationComplete) {
    return <ScreenLoader />;
  }

  return (
    <Suspense fallback={<ScreenLoader />}>
      <Routes>
        {/* Public routes — auth pages, landing, etc. */}
        <Route
          path="/account/*"
          element={
            <PublicRoute>
              <AuthRoutes />
            </PublicRoute>
          }
        />

        {/* Protected routes — main app */}
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

export default AppRoutes;
