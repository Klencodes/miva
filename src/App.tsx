import { useState, useEffect, useRef } from "react"; 
import { useLocation } from "react-router-dom";
import { useTheme } from "./core/contexts/ThemeProvider";
import { useStore } from "./core/hooks/useStore";
import AppRoutes from "./routes";
import { Loader } from "./ui";
import { toast, Toaster } from "sonner";

function App() {
  const appTitle = "GodDid Mart";
  const location = useLocation();
  const { initializeTheme, isThemeReady } = useTheme();
  const { checkAuthStatus, initializationComplete } = useStore();
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const { isDark } = useTheme();
  
  // State for fullscreen prompt
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const hasShownFullscreenPrompt = useRef(false);

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

  // Show fullscreen prompt after app is initialized
  useEffect(() => {
    if (isAppInitialized && initializationComplete && isThemeReady) {
      // Check if we've already shown the prompt or user has dismissed it
      const hasDismissedPrompt = localStorage.getItem('fullscreenPromptDismissed');
      const isAlreadyFullscreen = !!document.fullscreenElement;
      
      if (!isAlreadyFullscreen && !hasDismissedPrompt && !hasShownFullscreenPrompt.current) {
        // Small delay to ensure UI is rendered
        setTimeout(() => {
          setShowFullscreenPrompt(true);
          hasShownFullscreenPrompt.current = true;
        }, 500);
      }
    }
  }, [isAppInitialized, initializationComplete, isThemeReady]);

  // Function to enter fullscreen
  const enterFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => {
          setShowFullscreenPrompt(false);
        })
        .catch((err) => {
          console.error('Fullscreen error:', err);
          toast.warning("Fullscreen blocked", {
            description: "Please allow fullscreen in your browser settings",
            duration: 3000,
          });
        });
    }
  };

  // Handle dismissing the prompt
  const dismissFullscreenPrompt = () => {
    setShowFullscreenPrompt(false);
    localStorage.setItem('fullscreenPromptDismissed', 'true');
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // User exited fullscreen - show prompt again next time
        localStorage.removeItem('fullscreenPromptDismissed');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard shortcut for fullscreen (F11)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        enterFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

      {/* Fullscreen Prompt Overlay */}
      {showFullscreenPrompt && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg max-w-md text-center shadow-2xl animate-fadeIn">
            <div className="mb-6">
              <i className="ri-fullscreen-line text-5xl text-primary mb-4"></i>
              <h2 className="text-2xl font-bold mb-2">Fullscreen Experience</h2>
              <p className="text-text-light">
                For the best experience, we recommend using fullscreen mode.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={enterFullscreen}
                className="w-full bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-fullscreen-line"></i>
                Enter Fullscreen Mode
              </button>
              
              <button
                onClick={dismissFullscreenPrompt}
                className="w-full bg-transparent border border-border text-text px-6 py-3 rounded-lg font-medium hover:bg-background transition-colors"
              >
                Continue without fullscreen
              </button>
              
              <div className="text-xs text-text-light pt-3">
                <p>Tip: You can also press <kbd className="px-2 py-1 bg-background rounded border border-border">F11</kbd> anytime</p>
              </div>
            </div>
          </div>
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