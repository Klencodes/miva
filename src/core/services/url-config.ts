export interface UrlConfig {
  API_BASE_URL: string;
  SECRET: string;
  NODE_ENV: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isElectron: boolean;
}

const getEnvConfig = (): UrlConfig => {
  // Detect if running in Electron
  const isElectron =
    typeof window !== "undefined" && (window as any).electron !== undefined;

  // Detect development mode
  const isDevelopment =
    process.env.REACT_APP_ENV === "development" ||
    process.env.NODE_ENV === "development" ||
    (!isElectron &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"));

  // Set API URL
  let API_BASE_URL = "";

  if (isElectron) {
    // In Electron, use IPC to get config from main process
    API_BASE_URL =
      (window as any).electron?.getApiUrl?.() ||
      process.env.REACT_APP_API_BASE_URL ||
      "";
  }

  // Fallback to environment variables
  if (!API_BASE_URL) {
    API_BASE_URL = isDevelopment
      ? process.env.REACT_APP_DEV_API_BASE_URL || "http://localhost:4000/"
      : process.env.REACT_APP_PROD_API_BASE_URL ||
        "https://god-did-server.vercel.app/";
  }

  return {
    API_BASE_URL,
    SECRET: process.env.REACT_APP_SECRET || "",
    NODE_ENV: process.env.REACT_APP_ENV || process.env.NODE_ENV || "development",
    isDevelopment,
    isProduction: !isDevelopment,
    isElectron,
  };
};

export const urlConfig = getEnvConfig();

// Log config for debugging (only in development)
if (urlConfig.isDevelopment) {
  console.log("🔧 Environment Config:", {
    API_BASE_URL: urlConfig.API_BASE_URL,
    NODE_ENV: urlConfig.NODE_ENV,
    isDevelopment: urlConfig.isDevelopment,
    isElectron: urlConfig.isElectron,
  });
}
