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