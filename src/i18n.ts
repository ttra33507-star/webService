import { createI18n } from 'vue-i18n';
import en from './locales/en';
import km from './locales/km';

export const SUPPORTED_LOCALES = ['en', 'km'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_STORAGE_KEY = 'app:locale';

const normalizeLocale = (input: unknown): AppLocale | null => {
  if (typeof input !== 'string') return null;
  const value = input.toLowerCase();
  if (value === 'kh') return 'km';
  if (value.startsWith('km')) return 'km';
  if (value.startsWith('en')) return 'en';
  return null;
};

const detectInitialLocale = (): AppLocale => {
  if (typeof window === 'undefined') return 'en';

  const stored = normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
  if (stored) return stored;

  const browser =
    normalizeLocale(window.navigator.language) || normalizeLocale(window.navigator.languages?.[0]);
  return browser ?? 'en';
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
