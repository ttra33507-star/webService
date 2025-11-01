import axios, { isAxiosError } from 'axios';

const DEFAULT_AUTH_BASE_URL = 'https://api.c4techhub.com';
const DEFAULT_CLIENT_ID = '019a33e5-4f58-72d7-9d25-d8862a503dc1';
const DEFAULT_CLIENT_SECRET = 'En4Kv1y04uZIjt8liBbgw4UaHLV4gp8EY85kw8k8';
const DEFAULT_SCOPE = '*';

const resolveAuthBaseUrl = () => {
  const configured = (import.meta.env.VITE_AUTH_BASE_URL ?? '').toString().trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  if (import.meta.env.DEV) {
    return DEFAULT_AUTH_BASE_URL;
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
