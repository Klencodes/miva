import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { IEntityItem } from "../interfaces/IEntity";
import { IUser } from "../interfaces/IUser";
import * as CryptoJS from "crypto-js";
import { urlConfig } from "../services/url-config";

export const USER_KEY = "USER";
export const ENTITY_KEY = "ENTITY";
export const PENDING_ENTITY_KEY = "PENDING_ENTITY";

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

  // --- INITIALIZATION EFFECT (Reads from storage once) ---
  useEffect(() => {
    const initialUser = getStoredItem<IUser | null>(USER_KEY, null);
    const initialEntity = getStoredItem<IEntityItem | null>(ENTITY_KEY, null);

    // Initial state setup (this runs only once on mount)
    setUserState(initialUser);
    setEntityState(initialEntity);
    setStoreEntitiesState(null);
    userRef.current = initialUser;
    isAuthenticatedRef.current = !!initialUser?.auth_token;
    setInitializationComplete(true);
  }, []);

  // --- DERIVED MEMOIZED VALUES ---
  const isAuthenticated = useMemo(() => !!user?.auth_token, [user?.auth_token]);
  const hasStoreEntities = useMemo(() => !!entity, [entity]);

  // --- STORAGE SYNC EFFECTS (Run AFTER initialization is complete) ---

  useEffect(() => {
    if (initializationComplete) {
      setStoredItem(USER_KEY, user);
      userRef.current = user;
      isAuthenticatedRef.current = isAuthenticated;
    }
  }, [user, isAuthenticated, initializationComplete]);

  useEffect(() => {
    if (initializationComplete) {
      setStoredItem(ENTITY_KEY, entity);
    }
  }, [entity, initializationComplete]);

  // --- ACTIONS ---

  const setUser = useCallback((userData: IUser | null) => {
    setUserState(userData);
  }, []);

  const setEntity = useCallback((newEntity: IEntityItem | null) => {
    setEntityState(newEntity);
  }, []);

  // FIXED: Remove storeEntities from dependencies since it's not used in the function
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
    const isValid = isAuthenticated;
    return { isValid };
  }, [isAuthenticated]);

  const logout = useCallback(() => {
    setUserState(null);
    setEntityState(null);
    setStoreEntitiesState(null);
    // Clear all storage
    [USER_KEY, ENTITY_KEY, PENDING_ENTITY_KEY].forEach((key) => {
      removeStoredItem(key);
    });

    window.location.href = "/account/login";
  }, []);

  const getRequiredRoute = useCallback(
    (): string | null => {
      const needsVerification = user && !user.verified;

      if (needsVerification) return "/account/verify";
      // if (hasPendingEntities) return '/account/pending-entity-approval';
      // if (needsSetup) return '/account/create-business';
      if (!isAuthenticated) return "/account/login";

      return null;
    },
    // eslint-disable-next-line
    [isAuthenticated, user, hasStoreEntities]
  );

  return {
    // State
    user,
    entity,
    storeEntities,
    initializationComplete,
    
    // Derived values
    isAuthenticated,
    isAuthenticatedRef,
    userRef,
    hasStoreEntities,

    // Actions
    setUser,
    logout,
    setEntity,
    setStoreEntities,
    checkAuthStatus,
    getRequiredRoute,
  };
};
