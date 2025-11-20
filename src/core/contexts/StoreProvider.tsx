import React, { createContext, useContext, ReactNode, Dispatch, SetStateAction } from 'react';
import { useStore } from '../hooks/useStore';
import { IUser } from '../interfaces/IUser';

interface UseStoreReturnType {
  user: IUser | null;
  setUser: Dispatch<SetStateAction<IUser | null>>;
  logout: () => void;
}


const StoreContext = createContext<UseStoreReturnType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const store = useStore() as UseStoreReturnType; 
  
  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStoreContext = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStoreContext must be used within an StoreProvider');
  }
  return context;
};