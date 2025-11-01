import { computed, ref, type Ref } from 'vue';
import { setAuthorizationHeader } from '../api/httpClient';

export interface AuthUser {
  id?: number | string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

export interface AuthState {
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string | null;
  scope?: string | null;
  expiresAt?: number | null;
  receivedAt?: number | null;
  user?: AuthUser | null;
  raw?: Record<string, unknown> | null;
}

const AUTH_STORAGE_KEY = 'c4_auth_state';
const ACCOUNTS_STORAGE_KEY = 'c4_auth_accounts';
const MAX_REMEMBERED_ACCOUNTS = 5;

const parseJson = <T>(payload: string | null): T | null => {
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const normaliseAuthState = (candidate: unknown): AuthState | null => {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const record = candidate as Record<string, unknown>;
  if (!isNonEmptyString(record.accessToken)) {
    return null;
  }

  const expiresAtRaw = record.expiresAt;
  const expiresAt =
    typeof expiresAtRaw === 'number' && Number.isFinite(expiresAtRaw) ? expiresAtRaw : null;

  const refreshToken =
    typeof record.refreshToken === 'string' && record.refreshToken ? record.refreshToken : null;
  const tokenType =
    typeof record.tokenType === 'string' && record.tokenType ? record.tokenType : null;
  const scope = typeof record.scope === 'string' && record.scope ? record.scope : null;

  const rawUser = record.user;
  const user =
    rawUser && typeof rawUser === 'object'
      ? (rawUser as AuthUser)
      : null;

  return {
    accessToken: record.accessToken,
    refreshToken,
    tokenType,
    scope,
    expiresAt,
    receivedAt:
      typeof record.receivedAt === 'number' && Number.isFinite(record.receivedAt)
        ? record.receivedAt
        : Date.now(),
    user,
    raw:
      record.raw && typeof record.raw === 'object'
        ? (record.raw as Record<string, unknown>)
        : null,
  };
};

const readStoredAuthState = (): AuthState | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const parsed = normaliseAuthState(parseJson(window.localStorage.getItem(AUTH_STORAGE_KEY)));
  if (!parsed) {
    return null;
  }

  if (parsed.expiresAt && parsed.expiresAt <= Date.now()) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }

  return parsed;
};

const readStoredAccounts = (): string[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const parsed = parseJson<unknown>(window.localStorage.getItem(ACCOUNTS_STORAGE_KEY));
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
};

const authState = ref<AuthState | null>(readStoredAuthState());
const recentAccounts = ref<string[]>(readStoredAccounts());

const resolveAuthorizationHeaderFromState = (state: AuthState | null): string | null => {
  if (!state || !isNonEmptyString(state.accessToken)) {
    return null;
  }
  const token = state.accessToken.trim();
  if (!token) {
    return null;
  }
  const type =
    typeof state.tokenType === 'string' && state.tokenType.trim()
      ? state.tokenType.trim()
      : 'Bearer';
  return `${type} ${token}`;
};

const applyAuthorizationFromState = (state: AuthState | null) => {
  setAuthorizationHeader(resolveAuthorizationHeaderFromState(state));
};

applyAuthorizationFromState(authState.value);

const isAuthenticated = computed<boolean>(() => {
  const state = authState.value;
  if (!state) {
    return false;
  }

  if (!state.accessToken || typeof state.accessToken !== 'string') {
    return false;
  }

  if (state.expiresAt && state.expiresAt <= Date.now()) {
    return false;
  }

  return true;
});

const persistAuthState = (state: AuthState | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!state) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      ...state,
      receivedAt: state.receivedAt ?? Date.now(),
    }),
  );
};

const persistAccounts = (accounts: string[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!accounts.length) {
    window.localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
};

const signIn = (state: AuthState) => {
  const normalised: AuthState = {
    ...state,
    receivedAt: state.receivedAt ?? Date.now(),
  };
  authState.value = normalised;
  persistAuthState(normalised);
  applyAuthorizationFromState(normalised);
};

const signOut = () => {
  authState.value = null;
  persistAuthState(null);
  applyAuthorizationFromState(null);
};

const rememberAccount = (email: string) => {
  const trimmed = email.trim();
  if (!trimmed) {
    return;
  }

  const lower = trimmed.toLowerCase();
  const existing = recentAccounts.value.filter(
    (entry) => entry.toLowerCase() !== lower,
  );
  existing.unshift(trimmed);

  const limited = existing.slice(0, MAX_REMEMBERED_ACCOUNTS);
  recentAccounts.value = limited;
  persistAccounts(limited);
};

const forgetAccount = (email: string) => {
  const trimmed = email.trim();
  if (!trimmed) {
    return;
  }

  const lower = trimmed.toLowerCase();
  const next = recentAccounts.value.filter((entry) => entry.toLowerCase() !== lower);
  recentAccounts.value = next;
  persistAccounts(next);
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === AUTH_STORAGE_KEY) {
      authState.value = normaliseAuthState(parseJson(event.newValue)) ?? null;
      applyAuthorizationFromState(authState.value);
      return;
    }

    if (event.key === ACCOUNTS_STORAGE_KEY) {
      recentAccounts.value = (() => {
        const parsed = parseJson<unknown>(event.newValue);
        if (!Array.isArray(parsed)) {
          return [];
        }
        return parsed
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((item) => item.trim());
      })();
    }
  });
}

export const useAuth = () => ({
  authState: authState as Ref<AuthState | null>,
  isAuthenticated,
  recentAccounts: recentAccounts as Ref<string[]>,
  signIn,
  signOut,
  rememberAccount,
  forgetAccount,
});

export { AUTH_STORAGE_KEY, ACCOUNTS_STORAGE_KEY, isAuthenticated, authState, recentAccounts };
