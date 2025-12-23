// src/index.tsx
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

// Register service worker in production on Vercel
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
  if (publicUrl.origin === window.location.origin) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
      
      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          console.log('✅ Service Worker registered on Vercel:', registration);
          
          // Check for updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('New content is available; please refresh.');
                    // Show update notification to user
                    if (window.confirm('New version available! Reload to update?')) {
                      window.location.reload();
                    }
                  } else {
                    console.log('Content is cached for offline use.');
                  }
                }
              };
            }
          };
        })
        .catch(error => {
          console.error('❌ Service Worker registration failed on Vercel:', error);
        });
    });
  }
}

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