import React from 'react';
import { useTheme } from '../../core/contexts/ThemeProvider';

interface FullLayoutProps {
  children: React.ReactNode;
}

const LOGO_PATH = '/icons/logo-full.png';

const FullLayout: React.FC<FullLayoutProps> = ({ children }) => {
  const { theme } = useTheme();

  return (
    <div 
      className={`
        full-layout min-h-screen bg-background transition-colors duration-300
        flex flex-col items-center justify-center p-4 
        ${theme === 'dark' ? 'dark' : 'light'}
      `}
      data-theme={theme}
    >
      
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-6 text-center">
          <img 
            src={LOGO_PATH} 
            alt="Company Logo" 
            className="h-16 w-auto mx-auto" 
          />
        </div>
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
};
export default FullLayout;