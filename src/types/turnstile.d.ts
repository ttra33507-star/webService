type TurnstileWidgetId = string | number;

interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  appearance?: 'always' | 'interaction-only' | 'execute';
  tabindex?: number;
  action?: string;
  cData?: string;
  retry?: 'auto' | 'never';
  retryInterval?: number;
}

interface Turnstile {
  render: (element: HTMLElement | string, options: TurnstileRenderOptions) => TurnstileWidgetId;
  reset: (widgetId?: TurnstileWidgetId) => void;
  remove: (widgetId?: TurnstileWidgetId) => void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export {};
