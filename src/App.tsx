import { useState, useEffect } from "react"; 
import { useLocation } from "react-router-dom";
import { useTheme } from "./core/contexts/ThemeProvider";
import { useStore } from "./core/contexts/StoreProvider";
import IRoutes from "./routes";
import { Loader } from "./components/common";
import { toast, Toaster } from "sonner";
import { APP_NAME } from "./core/enums/roles";

function App() {
  const location = useLocation();
  const { initializeTheme, isThemeReady } = useTheme();
  const { checkAuthStatus, initializationComplete } = useStore();
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const { isDark } = useTheme();
  

  // Single initialization effect
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await Promise.all([
          initializeTheme(),
          checkAuthStatus()
        ]);
        setIsAppInitialized(true); 
      } catch (error) {
        toast.error("Initialization Error", { 
          description: "Failed to load application data." 
        });
        setIsAppInitialized(true); 
      }
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.title = APP_NAME;
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <>
      <Toaster 
        richColors 
        position="top-right" 
        theme={isDark ? "dark" : "light"}
      />

      {(!isAppInitialized || !initializationComplete || !isThemeReady) ? (
        <Loader />
      ) : (
        <IRoutes />
      )}
    </>
  );
}

export default App;