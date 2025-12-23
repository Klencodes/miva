// src/index.tsx - Update the service worker registration
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
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
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

// Add modal root
if (!document.getElementById('modal-root')) {
  const modalRoot = document.createElement('div');
  modalRoot.id = 'modal-root';
  document.body.appendChild(modalRoot);
}

// ✅ FIXED: Service Worker Registration
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Only register in production
    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    } else {
      // In development, unregister any existing service workers
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }
  });
}
}

// Register the service worker
registerServiceWorker();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
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
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);