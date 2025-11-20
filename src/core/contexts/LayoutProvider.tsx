import React, { createContext, useContext, ReactNode } from 'react';
import { useLayout } from '../hooks/useLayout';

const LayoutContext = createContext<ReturnType<typeof useLayout> | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const layout = useLayout();
  
  return (
    <LayoutContext.Provider value={layout}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }
  return context;
};