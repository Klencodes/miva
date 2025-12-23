// App.tsx - Updated
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

  // Single initialization effect
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize IndexedDB
        await indexedDBService.init();
        
        // Clear expired cache
        await indexedDBService.clearExpiredCache();
        
        // Check pending sync items
        const pendingItems = await indexedDBService.getPendingSyncItems();
        setPendingSyncCount(pendingItems.length);

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
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('ServiceWorker registered:', registration);
            
            // Register for background sync
            if ('sync' in registration && registration.sync && typeof (registration.sync as any).register === 'function') {
              (registration.sync as any).register('sync-queue')
                .then(() => console.log('Background sync registered'))
                .catch(console.error);
            }
          })
          .catch(error => {
            console.log('ServiceWorker registration failed:', error);
          });
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.title = appTitle;
    window.scrollTo(0, 0);
  }, [location]);

  // Network status effect
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection restored", {
        description: "Syncing offline data...",
        duration: 5000,
      });
      
      // Process sync queue when coming back online
      setTimeout(() => {
        syncService.processSyncQueue().then(result => {
          if (result.success > 0) {
            toast.success("Sync Complete", {
              description: `Synced ${result.success} items`,
              duration: 3000,
            });
          }
        });
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Connection Error", {
        description: "No internet connection detected",
        duration: 5000,
      });
    };

    const updatePendingCount = async () => {
      const pendingItems = await indexedDBService.getPendingSyncItems();
      setPendingSyncCount(pendingItems.length);
    };

    // Update pending count periodically
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
  }, []);

  // Check for app updates
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

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 z-50">
          ⚠️ You are offline. Working in offline mode.
        </div>
      )}

      {/* Pending Sync Indicator */}
      {pendingSyncCount > 0 && isOnline && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          🔄 {pendingSyncCount} item(s) pending sync
        </div>
      )}

      {(!isAppInitialized || !initializationComplete || !isThemeReady) ? (
        <Loader />
      ) : (
        <AppRoutes />
      )}
    </>
  );
}

export default App;