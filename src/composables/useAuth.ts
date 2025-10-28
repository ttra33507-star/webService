import { ref } from 'vue';

const AUTH_STORAGE_KEY = 'c4_auth_token';

const readInitialState = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY));
};

const isAuthenticated = ref(readInitialState());

const updateState = () => {
  if (typeof window === 'undefined') {
    return;
  }
  isAuthenticated.value = Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY));
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === AUTH_STORAGE_KEY) {
      isAuthenticated.value = Boolean(event.newValue);
    }
  });
}

const generateToken = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const useAuth = () => {
  const signIn = (token = generateToken()) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(AUTH_STORAGE_KEY, token);
    updateState();
  };

  const signOut = () => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    updateState();
  };

  return {
    isAuthenticated,
    signIn,
    signOut,
  };
};

export { AUTH_STORAGE_KEY, isAuthenticated };
