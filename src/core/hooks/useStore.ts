import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import * as CryptoJS from "crypto-js";
import { Entity, IUser, StoreShape } from "../types";
import AuthService from "../services/auth";

export const USER_KEY = "USER";
export const ENTITY_KEY = "ENTITY";
export const NO_ENTITY_KEY = "PENDING_ENTITY";
export const ADMIN_EXISTS_KEY = "ADMIN_EXISTS";
export const ADMIN_CHECK_TIMESTAMP = "ADMIN_CHECK_TIMESTAMP";

const SECRET_KEY = "djhskbfniushbrubwqinrunwuyr8w9u5938u529852";
const CACHE_DURATION = 5 * 60 * 1000;
const EMPTY_ARRAY: Entity[] = [];

// Storage helpers (unchanged)
export const getStoredItem = <T>(key: string, defaultValue: T): T => {
  try {
    const encryptedItem = localStorage.getItem(key);
    if (!encryptedItem) return defaultValue;
    const bytes = CryptoJS.AES.decrypt(encryptedItem, SECRET_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedData) return defaultValue;
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error(`Error reading or decrypting ${key} from localStorage:`, error);
    return defaultValue;
  }
};

export const setStoredItem = <T>(key: string, value: T): void => {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      const encryptedData = CryptoJS.AES.encrypt(
        JSON.stringify(value),
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

// The actual store hook
export const useStoreInternal = (): StoreShape => {
  const [user, setUserState] = useState<IUser | null>(null);
  const [entity, setEntityState] = useState<Entity | null>(null);
  const [storeEntities, setStoreEntitiesState] = useState<Entity[]>([]);
  const [initializationComplete, setInitializationComplete] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState<boolean>(true);

  const userRef = useRef<IUser | null>(null);
  const isAuthenticatedRef = useRef<boolean>(false);
  const entityRef = useRef<Entity | null>(null);

  // checkAdminExists function (unchanged)
  const checkAdminExists = useCallback(async (forceCheck = false): Promise<boolean> => {
    try {
      if (!forceCheck) {
        const cachedExists = getStoredItem<boolean | null>(ADMIN_EXISTS_KEY, null);
        const cachedTimestamp = getStoredItem<number | null>(ADMIN_CHECK_TIMESTAMP, null);
        if (cachedExists !== null && cachedTimestamp !== null) {
          const isExpired = Date.now() - cachedTimestamp > CACHE_DURATION;
          if (!isExpired) {
            setAdminExists(cachedExists);
            return cachedExists;
          }
        }
      }
      const response = await AuthService.checkUsers();
      const exists = response.results.exists;
      setStoredItem(ADMIN_EXISTS_KEY, exists);
      setStoredItem(ADMIN_CHECK_TIMESTAMP, Date.now());
      setAdminExists(exists);
      return exists;
    } catch (error) {
      console.error("Error checking admin existence:", error);
      setAdminExists(false);
      return false;
    } finally {
      setCheckingAdmin(false);
    }
  }, []);

  // Initialization effect (unchanged)
  useEffect(() => {
    const initialUser = getStoredItem<IUser | null>(USER_KEY, null);
    const initialEntity = getStoredItem<Entity | null>(ENTITY_KEY, null);

    setUserState(initialUser);
    setEntityState(initialEntity);
    setStoreEntitiesState([]);
    userRef.current = initialUser;
    entityRef.current = initialEntity;
    isAuthenticatedRef.current = !!initialUser?.auth_token;

    setInitializationComplete(true);

    checkAdminExists().catch((error) => {
      console.error("Admin check failed:", error);
      setAdminExists(false);
    }).finally(() => {
      setCheckingAdmin(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync effects (unchanged)
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

  // Actions (unchanged)
  const setUser = useCallback((userData: IUser | null) => {
    setUserState(userData);
  }, []);

  const setEntity = useCallback((newEntity: Entity | null) => {
    setEntityState(newEntity);
  }, []);

  const setStoreEntities = useCallback((newEntities: Entity[] | null) => {
  const safeEntities = Array.isArray(newEntities) ? newEntities : [];
  setStoreEntitiesState(safeEntities);
  setEntityState((currentEntity) => {
    if (currentEntity) return currentEntity;
    const storedEntity = getStoredItem<Entity | null>(ENTITY_KEY, null);
    if (storedEntity) return storedEntity;
    if (safeEntities.length > 0) return safeEntities[0];
    return null;
  });
}, []);

  const checkAuthStatus = useCallback(async () => {
    return { isValid: !!userRef.current?.auth_token };
  }, []);

  const logout = useCallback(async () => {
    await AuthService.logout();
    setUserState(null);
    setEntityState(null);
    setStoreEntitiesState([]);
    userRef.current = null;
    entityRef.current = null;
    isAuthenticatedRef.current = false;
    [USER_KEY, ENTITY_KEY, NO_ENTITY_KEY].forEach(removeStoredItem);
    window.location.href = "/account/login";
  }, []);

  // Derived values (unchanged)
  const userDerived = useMemo(() => {
    if (!user) {
      return { isAuthenticated: false, hasStoreEntities: false, userRole: null };
    }
    return {
      isAuthenticated: !!user.auth_token,
      hasStoreEntities: !!entity,
      userRole: user.role,
    };
  }, [user, entity]);

const stableStoreEntities = useMemo(
  () => Array.isArray(storeEntities) ? storeEntities : EMPTY_ARRAY,
  [storeEntities]
);

  return useMemo(
    () => ({
      user,
      entity,
      storeEntities: stableStoreEntities,
      initializationComplete,
      adminExists,
      checkingAdmin,
      userRef,
      isAuthenticatedRef,
      entityRef,
      isAuthenticated: userDerived.isAuthenticated,
      hasStoreEntities: userDerived.hasStoreEntities,
      userRole: userDerived.userRole,
      setUser,
      logout,
      setEntity,
      setStoreEntities,
      checkAuthStatus,
      checkAdminExists,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      user,
      entity,
      stableStoreEntities,
      initializationComplete,
      adminExists,
      checkingAdmin,
      userDerived.isAuthenticated,
      userDerived.hasStoreEntities,
      userDerived.userRole,
      setUser,
      logout,
      setEntity,
      setStoreEntities,
      checkAuthStatus,
      checkAdminExists,
    ]
  );
};