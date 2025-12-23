// src/App.tsx
import { useState, useEffect } from "react"; 
import { useLocation } from "react-router-dom";
import { useTheme } from "./core/contexts/ThemeProvider";
import { useStore } from "./core/hooks/useStore";
import AppRoutes from "./routes";
import { Loader } from "./ui";
import { toast, Toaster } from "sonner";
import { indexedDBService } from "./core/services/indexdb";
import { syncService } from "./core/services/sync";

function App() {
  const appTitle = "GodDid Mart";
  const location = useLocation();
  const { initializeTheme, isThemeReady } = useTheme();
  const { checkAuthStatus, initializationComplete } = useStore();
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const { isDark } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [showOfflineUI, setShowOfflineUI] = useState(false);

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
        setDbInitialized(true); // Continue anyway
      }
    };

    initializeDatabase();
  }, []);

  // Single initialization effect
  useEffect(() => {
    const initializeApp = async () => {
      if (!dbInitialized) return;

      try {
        // Check pending sync items
        if (dbInitialized) {
          try {
            const pendingItems = await indexedDBService.getPendingSyncItems();
            setPendingSyncCount(pendingItems.length);
          } catch (syncError) {
            console.warn('Could not check sync queue:', syncError);
          }
        }

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

  // Network status effect
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setShowOfflineUI(false);
      
      toast.success("Connection restored", {
        description: "Syncing offline data...",
        duration: 3000,
      });
      
      // Process sync queue
      setTimeout(async () => {
        if (dbInitialized) {
          try {
            const result = await syncService.processSyncQueue();
            if (result.success > 0) {
              toast.success("Sync Complete", {
                description: `Synced ${result.success} items`,
                duration: 3000,
              });
            }
          } catch (error) {
            console.warn('Sync failed:', error);
          }
        }
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineUI(true);
      
      toast.warning("Offline Mode", {
        description: "Working offline. Changes will sync when connection is restored.",
        duration: 5000,
      });
    };

    const updatePendingCount = async () => {
      if (dbInitialized) {
        try {
          const pendingItems = await indexedDBService.getPendingSyncItems();
          setPendingSyncCount(pendingItems.length);
        } catch (error) {
          console.warn('Could not update pending count:', error);
        }
      }
    };

    const interval = setInterval(updatePendingCount, 30000);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [dbInitialized]);

  // Check for service worker updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.update();
      });
    }
  }, []);

  return (
    <>
      <Toaster 
        richColors 
        position="top-right" 
        theme={isDark ? "dark" : "light"}
      />

      {/* Offline Banner (Non-intrusive) */}
      {showOfflineUI && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 z-50 flex items-center justify-center gap-2">
          <span className="animate-pulse">⚡</span>
          <span>You are offline. Working in offline mode.</span>
          <button 
            onClick={() => setShowOfflineUI(false)}
            className="ml-2 px-2 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Database Loading */}
      {!dbInitialized && (
        <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 z-50">
          🔄 Initializing local storage...
        </div>
      )}

      {/* Pending Sync Indicator */}
      {pendingSyncCount > 0 && isOnline && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-pulse">
          <span>🔄</span>
          <span>{pendingSyncCount} item(s) pending sync</span>
        </div>
      )}

      {/* Offline Mode Modal */}
      {showOfflineUI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🔌</div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Offline Mode
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                You are currently offline. The app will continue to work with local data.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                You can still:
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✓</span>
                  <span>Browse products</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✓</span>
                  <span>Create new orders</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✓</span>
                  <span>View order history</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✓</span>
                  <span>Manage customers</span>
                </li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowOfflineUI(false)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition"
              >
                Continue Offline
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {(!isAppInitialized || !initializationComplete || !isThemeReady || !dbInitialized) ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <Loader />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {!dbInitialized ? "Initializing local storage..." : "Loading GodDid Mart..."}
            </p>
            {!isOnline && (
              <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                ⚠️ You are offline. Loading cached data...
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className={showOfflineUI ? "filter blur-sm" : ""}>
          <AppRoutes />
        </div>
      )}
    </>
  );
}

export default App;