import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App";
import "./index.css";
import { ThemeProvider } from "./core/contexts/ThemeProvider";
import { ErrorBoundary } from "./app/pages/error/ErrorBoundary";
import { LayoutProvider } from "./core/contexts/LayoutProvider";
import { StoreProvider } from "./core/contexts/StoreProvider";
import { ModalProvider } from "./core/hooks/useModal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

// Add modal root if it doesn't exist
if (!document.getElementById('modal-root')) {
  const modalRoot = document.createElement('div');
  modalRoot.id = 'modal-root';
  document.body.appendChild(modalRoot);
}

declare global {
  interface Window {
    electronAPI?: {
      getAppInfo: () => Promise<any>;
    };
  }
}

// Detect if running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI;

declare global {
  interface Window {
    electronAPI?: {
      getAppInfo: () => Promise<any>;
    };
  }
}

if (typeof window !== 'undefined' && window.electronAPI) {
  // Running in Electron
  window.electronAPI.getAppInfo().then(info => {
    console.log('Running in Electron:', info);
    // You can set this in your state/context
  });
}

// Choose the right router based on environment
const Router = isElectron ? HashRouter : BrowserRouter;

// For BrowserRouter, only set basename if it's not '.' and not empty
const basename = !isElectron && process.env.PUBLIC_URL && process.env.PUBLIC_URL !== '.' 
  ? process.env.PUBLIC_URL 
  : undefined;

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Router basename={basename}>
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <StoreProvider>
                <LayoutProvider>
                  <ModalProvider>
                    <App />
                  </ModalProvider>
                </LayoutProvider>
              </StoreProvider>
            </ThemeProvider>
        </QueryClientProvider>
      </Router>
    </ErrorBoundary>
  </React.StrictMode>
);