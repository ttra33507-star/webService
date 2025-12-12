interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
  tabindex?: number;
  action?: string;
}

interface Turnstile {
  render: (element: HTMLElement | string, options: TurnstileRenderOptions) => number;
  reset: (widgetId?: number) => void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export {};
