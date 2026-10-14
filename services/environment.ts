// src/config/environment.ts

type EnvConfig = {
  BASE_URL: string;
  SOCKET_URL: string;
};

type AppEnvironment = "local" | "dev" | "prod";

const withTrailingSlash = (value: string): string => {
  const trimmed = value.trim();
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
};

const normalizeApiUrl = (value: string): string => withTrailingSlash(value);

const normalizeSocketUrl = (value: string): string => {
  const trimmed = withTrailingSlash(value);

  if (trimmed.startsWith("https://")) {
    return `wss://${trimmed.slice("https://".length)}`;
  }

  if (trimmed.startsWith("http://")) {
    return `ws://${trimmed.slice("http://".length)}`;
  }

  return trimmed;
};

const environments: Record<AppEnvironment, EnvConfig> = {
  local: {
    BASE_URL: normalizeApiUrl(
      process.env.EXPO_PUBLIC_LOCAL_API_URL || "http://localhost:8000/",
    ),
    SOCKET_URL: normalizeSocketUrl(
      process.env.EXPO_PUBLIC_LOCAL_WS_URL || "ws://localhost:8000/",
    ),
  },
  dev: {
    BASE_URL: normalizeApiUrl(
      process.env.EXPO_PUBLIC_DEV_API_URL ||
        "https://dolphin-app-xosp2.ondigitalocean.app/",
    ),
    SOCKET_URL: normalizeSocketUrl(
      process.env.EXPO_PUBLIC_DEV_WS_URL ||
        "wss://dolphin-app-xosp2.ondigitalocean.app/",
    ),
  },
  prod: {
    BASE_URL: normalizeApiUrl(
      process.env.EXPO_PUBLIC_API_URL ||
        "https://lawneeds-v1-psgwe.ondigitalocean.app/",
    ),
    SOCKET_URL: normalizeSocketUrl(
      process.env.EXPO_PUBLIC_WS_URL ||
        "wss://lawneeds-v1-psgwe.ondigitalocean.app/",
    ),
  },
};

const requestedEnvironment = process.env.EXPO_PUBLIC_APP_ENV?.toLowerCase();
const ENV: AppEnvironment =
  requestedEnvironment === "local"
    ? "local"
    : requestedEnvironment === "dev" || requestedEnvironment === "development"
      ? "dev"
      : requestedEnvironment === "prod" ? "prod" : "local";

export const CONFIG: EnvConfig = environments[ENV];
