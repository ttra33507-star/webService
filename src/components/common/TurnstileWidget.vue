<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

type TurnstileTheme = 'light' | 'dark' | 'auto';
type TurnstileSize = 'normal' | 'compact';
type TurnstileAppearance = 'always' | 'interaction-only';

type TurnstileRenderOptions = {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: TurnstileTheme;
  size?: TurnstileSize;
  appearance?: TurnstileAppearance;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const props = withDefaults(
  defineProps<{
    siteKey: string;
    theme?: TurnstileTheme;
    size?: TurnstileSize;
    appearance?: TurnstileAppearance;
  }>(),
  {
    theme: 'auto',
    size: 'normal',
    appearance: 'always',
  },
);

const emit = defineEmits<{
  (event: 'token', token: string): void;
  (event: 'error'): void;
  (event: 'expired'): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
let widgetId: string | null = null;

const TURNSTILE_SCRIPT_ID = 'turnstile-api';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const loadTurnstileScript = () =>
  new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Turnstile can only load in the browser.'));
      return;
    }

    if (window.turnstile) {
      resolve();
      return;
    }

    const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Turnstile script.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Turnstile script.'));
    document.head.appendChild(script);
  });

const renderWidget = () => {
  const container = containerRef.value;
  if (!container || !window.turnstile) return;

  if (widgetId) {
    try {
      window.turnstile.remove(widgetId);
    } catch {
      // ignore
    }
    widgetId = null;
  }

  container.innerHTML = '';
  widgetId = window.turnstile.render(container, {
    sitekey: props.siteKey,
    theme: props.theme,
    size: props.size,
    appearance: props.appearance,
    callback: (token) => emit('token', token),
    'error-callback': () => emit('error'),
    'expired-callback': () => emit('expired'),
  });
};

onMounted(async () => {
  try {
    await loadTurnstileScript();
    renderWidget();
  } catch (error) {
    console.error('[Turnstile] Failed to initialize', error);
    emit('error');
  }
});

onBeforeUnmount(() => {
  if (typeof window === 'undefined' || !window.turnstile || !widgetId) return;
  try {
    window.turnstile.remove(widgetId);
  } catch {
    // ignore
  } finally {
    widgetId = null;
  }
});
</script>

<template>
  <div ref="containerRef" />
</template>
