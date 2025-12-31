import { createI18n } from 'vue-i18n';
import en from './locales/en';
import km from './locales/km';

export const SUPPORTED_LOCALES = ['en', 'km'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_STORAGE_KEY = 'app:locale';
export const LOCALE_USER_SET_KEY = 'app:locale:user-set';

const normalizeLocale = (input: unknown): AppLocale | null => {
  if (typeof input !== 'string') return null;
  const value = input.toLowerCase();
  if (value === 'kh') return 'km';
  if (value.startsWith('km')) return 'km';
  if (value.startsWith('en')) return 'en';
  return null;
};

const detectInitialLocale = (): AppLocale => {
  if (typeof window === 'undefined') return 'km';

  try {
    const userSet = window.localStorage.getItem(LOCALE_USER_SET_KEY) === '1';
    const stored = normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));

    if (userSet && stored) {
      return stored;
    }

    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'km');
  } catch {
    // ignore storage errors (private mode, blocked storage, etc.)
  }

  return 'km';
};

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectInitialLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    km,
  },
});

try {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = i18n.global.locale.value;
  }
} catch {
  // ignore
}
