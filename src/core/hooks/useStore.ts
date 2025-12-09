import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { IEntityItem } from "../interfaces/IEntity";
import { IUser } from "../interfaces/IUser";
import * as CryptoJS from "crypto-js";
import { urlConfig } from "../services/url-config";

export const USER_KEY = "USER";
export const ENTITY_KEY = "ENTITY";
export const NO_ENTITY_KEY = "PENDING_ENTITY";

const SECRET_KEY = urlConfig.SECRET;

export const getStoredItem = <T>(key: string, defaultValue: T): T => {
  try {
    const encryptedItem = localStorage.getItem(key);

    if (!encryptedItem) {
      return defaultValue;
    }

    const bytes = CryptoJS.AES.decrypt(encryptedItem, SECRET_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedData) {
      return defaultValue;
    }

    const parsedItem = JSON.parse(decryptedData);

    return parsedItem;
  } catch (error) {
    console.error(
      `Error reading or decrypting ${key} from localStorage:`,
      error
    );
    return defaultValue;
  }
};

export const setStoredItem = <T>(key: string, value: T): void => {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      const jsonString = JSON.stringify(value);

      const encryptedData = CryptoJS.AES.encrypt(
        jsonString,
        SECRET_KEY
      ).toString();

      localStorage.setItem(key, encryptedData);
    }
  } catch (error) {
    console.error(`Error encrypting or writing ${key} to localStorage:`, error);
  }
};

export const removeStoredItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
};

// Create a stable reference for empty array/object to prevent unnecessary re-renders
const EMPTY_ARRAY: IEntityItem[] = [];

export const useStore = () => {
  // --- STATE DEFINITIONS ---
  const [user, setUserState] = useState<IUser | null>(null);
  const [entity, setEntityState] = useState<IEntityItem | null>(null);
  const [storeEntities, setStoreEntitiesState] = useState<IEntityItem[] | null>(
    null
  );
  const [initializationComplete, setInitializationComplete] = useState(false);

  // --- REFS for immediate/non-reactive access ---
  const userRef = useRef<IUser | null>(null);
  const isAuthenticatedRef = useRef<boolean>(false);
  const entityRef = useRef<IEntityItem | null>(null);

  // --- INITIALIZATION EFFECT (Reads from storage once) ---
  useEffect(() => {
    const initialUser = getStoredItem<IUser | null>(USER_KEY, null);
    const initialEntity = getStoredItem<IEntityItem | null>(ENTITY_KEY, null);

    // Initial state setup (this runs only once on mount)
    setUserState(initialUser);
    setEntityState(initialEntity);
    setStoreEntitiesState(null);
    userRef.current = initialUser;
    entityRef.current = initialEntity;
    isAuthenticatedRef.current = !!initialUser?.auth_token;
    setInitializationComplete(true);
  }, []);

  // --- STORAGE SYNC EFFECTS (Run AFTER initialization is complete) ---
  useEffect(() => {
    if (initializationComplete) {
      setStoredItem(USER_KEY, user);
      userRef.current = user;
      isAuthenticatedRef.current = !!user?.auth_token;
    }
  }, [user, initializationComplete]);

  useEffect(() => {
    if (initializationComplete) {
      setStoredItem(ENTITY_KEY, entity);
      entityRef.current = entity;
    }
  }, [entity, initializationComplete]);

  // --- ACTIONS (Memoized callbacks) ---
  const setUser = useCallback((userData: IUser | null) => {
    setUserState(userData);
  }, []);

  const setEntity = useCallback((newEntity: IEntityItem | null) => {
    setEntityState(newEntity);
  }, []);

  const setStoreEntities = useCallback((newEntities: IEntityItem[] | null) => {
    setStoreEntitiesState(newEntities);
    
    // Only auto-set entity if no entity is currently selected
    setEntityState((currentEntity) => {
      if (currentEntity) {
        return currentEntity;
      }

      const storedEntity = getStoredItem<IEntityItem | null>(ENTITY_KEY, null);
      if (storedEntity) {
        return storedEntity;
      }

      if (newEntities && newEntities.length > 0) {
        return newEntities[0];
      }

      return null;
    });
  }, []);

  const checkAuthStatus = useCallback(async () => {
    return { isValid: !!userRef.current?.auth_token };
  }, []);

  const logout = useCallback(() => {
    setUserState(null);
    setEntityState(null);
    setStoreEntitiesState(null);
    userRef.current = null;
    entityRef.current = null;
    isAuthenticatedRef.current = false;
    
    // Clear all storage
    [USER_KEY, ENTITY_KEY, NO_ENTITY_KEY].forEach((key) => {
      removeStoredItem(key);
    });

    window.location.href = "/account/login";
  }, []);

  const getRequiredRoute = useCallback((): string | null => {
    const currentUser = userRef.current;
    const needsVerification = currentUser && !currentUser.verified;
    const  hasNoEntity = currentUser && getStoredItem(NO_ENTITY_KEY, false);

    if (hasNoEntity) return "/account/access-denied";
    if (needsVerification) return "/account/verify";
    if (!isAuthenticatedRef.current) return "/account/login";

    return null;
  }, []);

  // --- MEMOIZED DERIVED VALUES ---
  
  // Memoize user-related derived values
const userDerived = useMemo(() => {
  if (!user) {
    return {
      isAuthenticated: false,
      hasStoreEntities: false,
      userRole: null,
      isVerified: false,
    };
  }
  
  return {
    isAuthenticated: !!user.auth_token,
    hasStoreEntities: !!entity,
    userRole: user.role,
    isVerified: user.verified,
  };
}, [user, entity]);

  // Memoize store entities with stable reference
  const stableStoreEntities = useMemo(() => {
    return storeEntities || EMPTY_ARRAY;
  }, [storeEntities]);

  // Memoize the entire store object to prevent unnecessary re-renders
  const store = useMemo(() => ({
    // State
    user,
    entity,
    storeEntities: stableStoreEntities,
    initializationComplete,
    
    // Refs (for non-reactive access)
    userRef,
    isAuthenticatedRef,
    entityRef,

    // Derived values
    isAuthenticated: userDerived.isAuthenticated,
    hasStoreEntities: userDerived.hasStoreEntities,
    userRole: userDerived.userRole,

    // Actions
    setUser,
    logout,
    setEntity,
    setStoreEntities,
    checkAuthStatus,
    getRequiredRoute,
  }), 
  // eslint-disable-next-line 
  [
    user,
    entity,
    stableStoreEntities,
    initializationComplete,
    userDerived.isAuthenticated,
    userDerived.hasStoreEntities,
    setUser,
    logout,
    setEntity,
    setStoreEntities,
    checkAuthStatus,
    getRequiredRoute,
  ]);

  return store;
};

// Selective store hooks for optimized performance
export const useUser = () => {
  const { user, setUser, logout, userRef, isAuthenticatedRef } = useStore();
  
  return useMemo(() => ({
    user,
    setUser,
    logout,
    userRef,
    isAuthenticatedRef,
  }), [user, setUser, logout, userRef, isAuthenticatedRef]);
};

export const useEntity = () => {
  const { entity, setEntity, storeEntities, setStoreEntities, entityRef } = useStore();
  
  return useMemo(() => ({
    entity,
    setEntity,
    storeEntities,
    setStoreEntities,
    entityRef,
  }), [entity, setEntity, storeEntities, setStoreEntities, entityRef]);
};

export const useAuth = () => {
  const { isAuthenticated, checkAuthStatus, getRequiredRoute, initializationComplete } = useStore();
  
  return useMemo(() => ({
    isAuthenticated,
    checkAuthStatus,
    getRequiredRoute,
    initializationComplete,
  }), [isAuthenticated, checkAuthStatus, getRequiredRoute, initializationComplete]);
};