import axios, { isAxiosError } from 'axios';

const DEFAULT_AUTH_BASE_URL = 'https://api.c4techhub.com';
const DEFAULT_CLIENT_ID = '019a33e5-4f58-72d7-9d25-d8862a503dc1';
const DEFAULT_CLIENT_SECRET = 'En4Kv1y04uZIjt8liBbgw4UaHLV4gp8EY85kw8k8';
const DEFAULT_SCOPE = '*';
const DEFAULT_PORTAL_BASE_URL = (() => {
  const fallback = (import.meta.env.VITE_DEFAULT_PORTAL_BASE_URL ?? import.meta.env.VITE_PORTAL_BASE_URL ?? '')
    .toString()
    .trim();

  if (!fallback) {
    return 'https://apps.c4techhub.com';
  }

  if (/^https?:\/\//i.test(fallback)) {
    return fallback.replace(/\/+$/, '');
  }

  return `https://${fallback.replace(/\/+$/, '')}`;
})();
const DEFAULT_LOCAL_API_BASE_URL = 'http://127.0.0.1:8000';

const normaliseBaseUrl = (value: string): string => value.replace(/\/+$/, '');

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

const resolveAuthBaseUrl = () => {
  const devOverride = (import.meta.env.VITE_DEV_API_BASE_URL ?? '').toString().trim();
  const configured = (import.meta.env.VITE_AUTH_BASE_URL ?? '').toString().trim();

  if (isLocalLikeEnv()) {
    if (devOverride) {
      return normaliseBaseUrl(devOverride.startsWith('http') ? devOverride : `http://${devOverride}`);
    }
    if (configured) {
      return normaliseBaseUrl(configured.startsWith('http') ? configured : `http://${configured}`);
    }
    return DEFAULT_LOCAL_API_BASE_URL;
  }

  if (configured) {
    return normaliseBaseUrl(configured.startsWith('http') ? configured : `https://${configured}`);
  }

  return DEFAULT_AUTH_BASE_URL;
};

const authClient = axios.create({
  baseURL: resolveAuthBaseUrl(),
  timeout: 20000,
  headers: {
    Accept: 'application/json',
  },
});

export interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  [key: string]: unknown;
}

export interface UserProfile {
  id?: number | string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

export interface SsoTicketResponse {
  ticket: string;
  expires_in?: number;
  redirect_to?: string | null;
  state?: string | null;
}

const getClientCredentials = () => {
  const rawClientId = (import.meta.env.VITE_OAUTH_CLIENT_ID ?? '').toString().trim();
  const rawClientSecret = (import.meta.env.VITE_OAUTH_CLIENT_SECRET ?? '').toString().trim();
  const rawScope = (import.meta.env.VITE_OAUTH_SCOPE ?? '').toString().trim();

  const clientId = rawClientId || DEFAULT_CLIENT_ID;
  const clientSecret = rawClientSecret || DEFAULT_CLIENT_SECRET;
  const scope = rawScope || DEFAULT_SCOPE;

  if (!clientId || !clientSecret) {
    throw new Error('OAuth client credentials are not configured. Please set VITE_OAUTH_CLIENT_ID and VITE_OAUTH_CLIENT_SECRET.');
  }

  if (!rawClientId || !rawClientSecret) {
    console.warn('[Auth] Falling back to bundled OAuth client credentials. Configure VITE_OAUTH_CLIENT_ID and VITE_OAUTH_CLIENT_SECRET to override.');
  }

  return { clientId, clientSecret, scope };
};

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const responseData = error.response?.data;
    if (responseData) {
      if (typeof responseData === 'string' && responseData.trim()) {
        return responseData;
      }
      if (typeof responseData === 'object') {
        const label =
          (responseData as { error_description?: string }).error_description ??
          (responseData as { message?: string }).message ??
          (responseData as { error?: string }).error;
        if (typeof label === 'string' && label.trim()) {
          return label;
        }
      }
    }

    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }
  } else if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

export const requestPasswordToken = async (username: string, password: string): Promise<TokenResponse> => {
  const { clientId, clientSecret, scope } = getClientCredentials();

  try {
    const form = new URLSearchParams();
    form.append('grant_type', 'password');
    form.append('client_id', clientId);
    form.append('client_secret', clientSecret);
    form.append('username', username);
    form.append('password', password);
    form.append('scope', scope);

    const { data } = await authClient.post<TokenResponse>('/oauth/token', form, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!data || typeof data.access_token !== 'string' || !data.access_token.trim()) {
      throw new Error('Authentication response did not include an access token.');
    }

    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to sign in with the provided credentials.'));
  }
};

export const fetchUserProfile = async (accessToken: string): Promise<UserProfile> => {
  const token = accessToken.trim();
  if (!token) {
    throw new Error('Access token is required to fetch the account profile.');
  }

  try {
    const { data } = await authClient.get<UserProfile>('/api/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to load account information.'));
  }
};

export const getAuthorizationHeader = (token: string | null | undefined): string | null => {
  if (!token) {
    return null;
  }

  const trimmed = token.trim();
  if (!trimmed) {
    return null;
  }

  return `Bearer ${trimmed}`;
};

const resolvePortalBaseUrl = () => {
  const appEnv = resolveAppEnv();
  const configured = (import.meta.env.VITE_PORTAL_BASE_URL ?? '').toString().trim();
  const devOverride = (import.meta.env.VITE_DEV_PORTAL_BASE_URL ?? '').toString().trim();

  if (appEnv === 'local') {
    if (devOverride) {
      return normaliseBaseUrl(devOverride.startsWith('http') ? devOverride : `http://${devOverride}`);
    }
    if (configured) {
      return normaliseBaseUrl(configured.startsWith('http') ? configured : `https://${configured}`);
    }
    return 'http://localhost:5173';
  }

  if (configured) {
    return normaliseBaseUrl(configured.startsWith('http') ? configured : `https://${configured}`);
  }

  if (devOverride) {
    return normaliseBaseUrl(devOverride.startsWith('http') ? devOverride : `https://${devOverride}`);
  }

  return DEFAULT_PORTAL_BASE_URL;
};

const resolveSsoSecret = () => {
  const raw = (import.meta.env.VITE_SSO_SHARED_SECRET ?? '').toString().trim();
  if (raw) {
    return raw;
  }
  const bridgeSecret = (import.meta.env.VITE_SSO_BRIDGE_SECRET ?? '').toString().trim();
  if (bridgeSecret) {
    return bridgeSecret;
  }
  throw new Error('Missing SSO shared secret. Set VITE_SSO_SHARED_SECRET.');
};

export const getPortalBaseUrl = () => resolvePortalBaseUrl();

const normaliseRedirectPath = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith('//')) {
    return null;
  }
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  try {
    const candidate = new URL(trimmed);
    const portalBase = resolvePortalBaseUrl();
    if (!portalBase) {
      return null;
    }
    const portalOrigin = new URL(portalBase).origin;
    if (candidate.origin !== portalOrigin) {
      return null;
    }
    const next = `${candidate.pathname}${candidate.search}${candidate.hash}`;
    return next || '/';
  } catch {
    return null;
  }
};

export interface RequestSsoTicketOptions {
  userId?: number | string | null;
  email?: string | null;
  redirectTo?: string | null;
  state?: string | null;
}

export const requestSsoTicket = async (options: RequestSsoTicketOptions): Promise<SsoTicketResponse> => {
  const secret = resolveSsoSecret();
  const payload: Record<string, unknown> = {};

  if (options.userId !== null && options.userId !== undefined) {
    payload.user_id = options.userId;
  }

  if (options.email && options.email.trim()) {
    payload.email = options.email.trim();
  }

  const redirect = normaliseRedirectPath(options.redirectTo);
  if (redirect) {
    payload.redirect_to = redirect;
  }

  const state = options.state && typeof options.state === 'string' ? options.state.trim() : '';
  if (state) {
    payload.state = state;
  }

  try {
    const { data } = await authClient.post<SsoTicketResponse>('/api/sso/tickets', payload, {
      headers: {
        'X-SSO-Secret': secret,
      },
    });

    if (!data || typeof data.ticket !== 'string' || !data.ticket.trim()) {
      throw new Error('SSO ticket response was invalid.');
    }

    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Unable to prepare single sign-on ticket.'));
  }
};

export const buildPortalCallbackUrl = (ticket: string, redirectPath: string | null, persistenceMode: 'persistent' | 'session') => {
  const base = resolvePortalBaseUrl();
  if (!base) {
    throw new Error('Portal base URL is not configured.');
  }

  const url = (() => {
    try {
      return new URL('/sso/callback', base.startsWith('http') ? base : `https://${base}`);
    } catch {
      const fallback = base.startsWith('http') ? base : `https://${base}`;
      return new URL('/sso/callback', fallback);
    }
  })();

  url.searchParams.set('ticket', ticket);
  if (redirectPath && redirectPath.trim()) {
    url.searchParams.set('redirect', redirectPath.trim());
  }
  url.searchParams.set('mode', persistenceMode === 'session' ? 'session' : 'persistent');

  return url.toString();
};
