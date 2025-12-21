export interface UrlConfig {
  API_BASE_URL: string;
  SECRET: string;
  NODE_ENV: string;
}

const getEnvConfig = (): UrlConfig => {
  const env: UrlConfig = {
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || "",
    SECRET: process.env.REACT_APP_SECRET || "",
    NODE_ENV: process.env.REACT_APP_ENV || "development", 
  };
  return env;
};

export const urlConfig = getEnvConfig();