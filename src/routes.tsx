import { lazy, Suspense, useMemo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import CommonLayout from "./app/layouts/CommonLayout";
import FullLayout from "./app/layouts/FullLayout";
import { getStoredItem, PENDING_ENTITY_KEY, useStore } from "./core/hooks/useStore";
import Loader from "./ui/components/Loader";

const AuthRoutes = lazy(() => import("./app/pages/auth/AuthRoutes"));
const PagesRoutes = lazy(() => import("./app/pages/PageRoutes"));

const AppRoutes = () => {
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

  if (!initializationComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader />
      </div>
    );
  }

  const currentAuthState = isAuthenticatedRef.current;

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    // If not authenticated, redirect to login
    if (!userRef.current && !currentAuthState) {
      return (
        <Navigate to="/account/login" state={{ from: location }} replace />
      );
    }

    // If there's a required route and we're not on it, redirect
    if (requiredRoute && requiredRoute !== location.pathname) {
      return <Navigate to={requiredRoute} replace />;
    }

    return <>{children}</>;
  };

  const hasPendingEntity = !!getStoredItem(PENDING_ENTITY_KEY, null);
  const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    // If authenticated and no special requirements, go to dashboard
    if (currentAuthState && !requiredRoute && !hasPendingEntity ) {
      return <Navigate to="/dashboard" replace />;
    }

    // If authenticated but has requirements, allow the required route logic to handle it
    if (
      currentAuthState &&
      requiredRoute &&
      requiredRoute !== location.pathname
    ) {
      return <Navigate to={requiredRoute} replace />;
    }

    return <>{children}</>;
  };

  // Define routes that should use Public Route
  const publicRoutes = [
    "/account/login",
    "/account/register",
    "/account/forgot-password",
    "/account/verify",
    "/account/create-business",
    "/account/pending-entity-approval",
  ];

  const isPublicRoutes = publicRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route
          path="/account/*"
          element={
            <PublicRoute>
              <FullLayout>
                <AuthRoutes />
              </FullLayout>
            </PublicRoute>
          }
        />

        <Route
          path="/*"
          element={
            isPublicRoutes ? (
              <CommonLayout>
                <PagesRoutes />
              </CommonLayout>
            ) : (
              <ProtectedRoute>
                <CommonLayout>
                  <PagesRoutes />
                </CommonLayout>
              </ProtectedRoute>
            )
          }
        />
      </Routes>
    </Suspense>
  );
};
export default AppRoutes;
