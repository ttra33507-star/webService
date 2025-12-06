import { ref, onBeforeUnmount } from 'vue';

const SCRIPT_ID = 'c4th-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

let scriptLoadPromise: Promise<void> | null = null;

const ensureScriptLoaded = (): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('CAPTCHA can only be loaded in the browser.'));
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  const loadPromise = new Promise<void>((resolve, reject) => {
    const handleLoad = () => resolve();
    const handleError = () => reject(new Error('Unable to load the CAPTCHA widget.'));

    if (existing) {
      existing.addEventListener('load', handleLoad, { once: true });
      existing.addEventListener('error', handleError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    document.head.appendChild(script);
  });

  scriptLoadPromise = loadPromise.catch((error) => {
    scriptLoadPromise = null;
    throw error;
  });

  return scriptLoadPromise;
};

export const useTurnstile = () => {
  const token = ref<string | null>(null);
  const error = ref<string | null>(null);
  const isReady = ref(false);
  const widgetId = ref<number | null>(null);

  const siteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '').toString().trim();

  const handleSuccess = (value?: string | null) => {
    token.value = value && value.trim() ? value : null;
    if (token.value) {
      error.value = null;
    }
  };

  const handleExpired = () => {
    token.value = null;
  };

  const handleError = () => {
    error.value = 'CAPTCHA validation failed. Please retry.';
  };

  const render = async (target: HTMLElement | string | null) => {
    if (!siteKey) {
      error.value = 'CAPTCHA is not configured.';
      return;
    }

    if (!target) {
      error.value = 'CAPTCHA container is unavailable.';
      return;
    }

    try {
      await ensureScriptLoaded();

      const container =
        typeof target === 'string' ? document.getElementById(target) : target;

      if (!container) {
        error.value = 'CAPTCHA container is unavailable.';
        return;
      }

      if (!window.turnstile) {
        error.value = 'CAPTCHA failed to initialize.';
        return;
      }

      token.value = null;
      error.value = null;

      widgetId.value = window.turnstile.render(container, {
        sitekey: siteKey,
        theme: 'light',
        'error-callback': handleError,
        'expired-callback': handleExpired,
        callback: handleSuccess,
      });

      isReady.value = true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to load CAPTCHA.';
    }
  };

  const reset = () => {
    if (widgetId.value !== null && window.turnstile) {
      window.turnstile.reset(widgetId.value);
    }
    token.value = null;
  };

  onBeforeUnmount(() => {
    reset();
  });

  return {
    token,
    error,
    isReady,
    render,
    reset,
  };
};
