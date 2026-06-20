// src/core/context/StoreContext.tsx
import { createContext, useContext, ReactNode } from "react";
import { StoreShape } from "../types";
import { useStoreInternal } from "../hooks/useStore";

// Create the context
export const StoreContext = createContext<StoreShape | null>(null);

// Main hook to use the store
export const useStore = (): StoreShape => {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used inside <StoreProvider>");
  }
  return ctx;
};

// Selective hooks for specific parts of the store
export const useUser = () => {
  const { user, setUser, logout, userRef, isAuthenticatedRef } = useStore();
  return {
    user,
    setUser,
    logout,
    userRef,
    isAuthenticatedRef,
  };
};

export const useEntity = () => {
  const { entity, setEntity, storeEntities, setStoreEntities, entityRef } = useStore();
  return {
    entity,
    setEntity,
    storeEntities,
    setStoreEntities,
    entityRef,
  };
};

export const useAuth = () => {
  const {
    isAuthenticated,
    checkAuthStatus,
    getRequiredRoute,
    initializationComplete,
    adminExists,
    checkingAdmin,
    getInitialRoute,
    checkAdminExists,
  } = useStore();
  return {
    isAuthenticated,
    checkAuthStatus,
    getRequiredRoute,
    initializationComplete,
    adminExists,
    checkingAdmin,
    getInitialRoute,
    checkAdminExists,
  };
};

// Provider component
export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const store = useStoreInternal();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};