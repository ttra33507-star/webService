import axios from 'axios';

const DEFAULT_DEV_BASE_URL = 'http://127.0.0.1:8000';
const DEFAULT_PROD_BASE_URL = 'https://api.c4techhub.com';

const resolveEnvString = (value: unknown): string => {
  if (value == null) {
    return '';
  }
  return value.toString().trim();
};

const sanitizeBaseUrl = (value: unknown): string => {
  const candidate = resolveEnvString(value);
  return candidate.replace(/\/+$/, '');
};

const resolveAppEnv = () => {
  const raw = (import.meta.env.VITE_APP_ENV ?? import.meta.env.MODE ?? '').toString().toLowerCase();
  return raw;
};

const isLocalLikeEnv = () => {
  const env = resolveAppEnv();
  if (env === 'local' || env === 'development' || env === 'dev') {
    return true;
  }
  return Boolean(import.meta.env.DEV);
};

const resolveBaseUrl = () => {
  const devConfigured = sanitizeBaseUrl(import.meta.env.VITE_DEV_API_BASE_URL);
  const configured = sanitizeBaseUrl(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_AUTH_BASE_URL);

  if (isLocalLikeEnv()) {
    if (devConfigured) {
      return devConfigured.startsWith('http') ? devConfigured : `http://${devConfigured}`;
    }
    if (configured) {
      return configured.startsWith('http') ? configured : `http://${configured}`;
    }
    return DEFAULT_DEV_BASE_URL;
  }

  if (configured) {
    return configured.startsWith('http') ? configured : `https://${configured}`;
  }

  return DEFAULT_PROD_BASE_URL;
};

const resolveAuthHeader = () => {
  const token = resolveEnvString(import.meta.env.VITE_API_AUTH_TOKEN);
  if (!token) {
    return undefined;
  }

  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
};

const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const authorization = resolveAuthHeader();
let initialAuthorization: string | null = null;

if (authorization) {
  defaultHeaders.Authorization = authorization;

  if (import.meta.env.DEV) {
    console.log('[API] Using authorization token:', authorization);
  }
}

const httpClient = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000,
  headers: defaultHeaders,
});

const axiosHeaders = httpClient.defaults.headers as unknown as {
  get?: (name: string) => string | null | undefined;
  set?: (name: string, value: string) => void;
  delete?: (name: string) => void;
};

if (typeof axiosHeaders.get === 'function') {
  const existing = axiosHeaders.get('Authorization');
  initialAuthorization = typeof existing === 'string' && existing.trim() ? existing.trim() : null;
} else {
  initialAuthorization = authorization ?? null;
}

export const setAuthorizationHeader = (value: string | null | undefined) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized) {
    if (typeof axiosHeaders.set === 'function') {
      axiosHeaders.set('Authorization', normalized);
    } else {
      (httpClient.defaults.headers as Record<string, unknown>).Authorization = normalized;
    }
    return;
  }

  if (initialAuthorization) {
    if (typeof axiosHeaders.set === 'function') {
      axiosHeaders.set('Authorization', initialAuthorization);
    } else {
      (httpClient.defaults.headers as Record<string, unknown>).Authorization = initialAuthorization;
    }
    return;
  }

  if (typeof axiosHeaders.delete === 'function') {
    axiosHeaders.delete('Authorization');
  } else {
    delete (httpClient.defaults.headers as Record<string, unknown>).Authorization;
  }
};

export const getInitialAuthorizationHeader = (): string | null => initialAuthorization;

export default httpClient;
