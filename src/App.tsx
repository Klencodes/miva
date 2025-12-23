import { useState, useEffect } from "react"; 
import { useLocation } from "react-router-dom";
import { useTheme } from "./core/contexts/ThemeProvider";
import { useStore } from "./core/hooks/useStore";
import AppRoutes from "./routes";
import { Loader } from "./ui";
import { toast, Toaster } from "sonner";
import { indexedDBService } from "./core/services/indexdb";

function App() {
  const appTitle = "GodDid Mart";
  const location = useLocation();
  const { initializeTheme, isThemeReady } = useTheme();
  const { checkAuthStatus, initializationComplete } = useStore();
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const { isDark } = useTheme();
  const [isOnline, setIsOnline] = useState(true); // Start as true
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [showOfflineUI, setShowOfflineUI] = useState(false);
  const [hasNetworkCheckRun, setHasNetworkCheckRun] = useState(false);

  // Initialize database first
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        console.log('🔄 Initializing database...');
        await indexedDBService.init();
        setDbInitialized(true);
        console.log('✅ Database initialized');
      } catch (error) {
        console.error('❌ Database initialization failed:', error);
        setDbInitialized(true);
      }
    };

    initializeDatabase();
  }, []);

  // Single initialization effect
  useEffect(() => {
    const initializeApp = async () => {
      if (!dbInitialized) return;

      try {
        await Promise.all([
          initializeTheme(),
          checkAuthStatus()
        ]);
        
        setIsAppInitialized(true); 
      } catch (error) {
        console.error('App initialization error:', error);
        toast.error("Initialization Error", { 
          description: "Failed to load application data." 
        });
        setIsAppInitialized(true);
      }
    };

    initializeApp();
  }, [dbInitialized]);

  useEffect(() => {
    document.title = appTitle;
    window.scrollTo(0, 0);
  }, [location]);

  // Network status effect - SIMPLIFIED
  useEffect(() => {
    // Only run once
    if (hasNetworkCheckRun) return;
    
    const handleOnline = () => {
      console.log('🌐 Network: Online');
      setIsOnline(true);
      setShowOfflineUI(false);
      
      if (navigator.onLine) {
        toast.success("Connected", {
          description: "You are online",
          duration: 2000,
        });
      }
    };

    const handleOffline = () => {
      console.log('📴 Network: Offline');
      setIsOnline(false);
      setShowOfflineUI(true);
      
      toast.warning("Offline Mode", {
        description: "Working offline. Changes will sync when connection is restored.",
        duration: 5000,
      });
    };

    // Set initial state
    if (!navigator.onLine) {
      handleOffline();
    } else {
      handleOnline();
    }

    setHasNetworkCheckRun(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [hasNetworkCheckRun]);

  // Remove service worker update check for now
  // useEffect(() => {
  //   if ('serviceWorker' in navigator) {
  //     navigator.serviceWorker.ready.then(registration => {
  //       registration.update();
  //     });
  //   }
  // }, []);

  // Loading screen
  if (!isAppInitialized || !initializationComplete || !isThemeReady || !dbInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {!dbInitialized ? "Initializing local storage..." : "Loading GodDid Mart..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster 
        richColors 
        position="top-right" 
        theme={isDark ? "dark" : "light"}
      />

      {/* Simple offline indicator - not modal */}
      {showOfflineUI && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 z-50">
          <div className="flex items-center justify-center gap-2">
            <span>📶</span>
            <span>Offline Mode - Working with local data</span>
            <button 
              onClick={() => setShowOfflineUI(false)}
              className="ml-2 px-2 py-1 bg-white bg-opacity-20 rounded text-sm hover:bg-opacity-30"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Your app content */}
      <div className={showOfflineUI ? "pt-10" : ""}>
        <AppRoutes />
      </div>
    </>
  );
}

export default App;