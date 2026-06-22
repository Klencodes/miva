import { useState, useEffect } from "react"; 
import { useLocation } from "react-router-dom";
import { useTheme } from "./core/contexts/ThemeProvider";
import { useStore } from "./core/contexts/StoreProvider";
import IRoutes from "./routes";
import { Loader } from "./components/common";
import { toast, Toaster } from "sonner";

function App() {
  const appTitle = "MIVA - HMS";
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
    document.title = appTitle;
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    const handleOnline = () => {
      toast.success("Connection restored", {
        description: "You are back online", 
        duration: 5000,
      })
    };

    const handleOffline = () => {
      toast.error("Connection Error", {
        description: "No internet connection detected", 
        duration: 5000,
      })
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []); 

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