import { onMounted, watchEffect, type Ref } from 'vue';

export type PageMetaOptions = {
  title?: string;
  description?: string;
  keywords?: string | string[];
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
};

const SITE_NAME = 'C4 Tech Hub';
const DEFAULT_DESCRIPTION =
  'C4 Tech Hub delivers automation, managed services, and growth tools for Facebook, Telegram, TikTok, and more.';
const DEFAULT_KEYWORDS =
  'C4 Tech Hub, automation services, Facebook automation, Telegram automation, TikTok tools, digital growth, managed services';

const ensureMeta = (selector: string, attributes: Record<string, string>) => {
  let tag = document.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    document.head.appendChild(tag);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    tag?.setAttribute(key, value);
  });
};

const ensureLink = (rel: string, href: string) => {
  let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
};

const resolveAbsoluteUrl = (value?: string | null) => {
  if (!value) return window.location.href;
  try {
    return new URL(value, window.location.origin).toString();
  } catch {
    return window.location.href;
  }
};

export const applyPageMeta = (meta: PageMetaOptions) => {
  if (typeof document === 'undefined') return;

  const titlePrefix = meta.title?.trim() || 'Automation & Growth Services';
  const fullTitle = `${titlePrefix} | ${SITE_NAME}`;
  const description = meta.description?.trim() || DEFAULT_DESCRIPTION;
  const keywords = Array.isArray(meta.keywords)
    ? meta.keywords.join(', ')
    : meta.keywords?.trim() || DEFAULT_KEYWORDS;
  const canonical = resolveAbsoluteUrl(meta.canonical);
  const ogImage = resolveAbsoluteUrl(meta.ogImage || '/images/C4-FB-Station.png');

  document.title = fullTitle;
  ensureMeta('meta[name="description"]', { name: 'description', content: description });
  ensureMeta('meta[name="keywords"]', { name: 'keywords', content: keywords });
  ensureMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
  ensureMeta('meta[property="og:description"]', { property: 'og:description', content: description });
  ensureMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
  ensureMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
  ensureMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
  ensureMeta('meta[property="og:image"]', { property: 'og:image', content: ogImage });
  ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
  ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle });
  ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
  ensureMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: ogImage });
  ensureMeta('meta[name="robots"]', { name: 'robots', content: meta.noIndex ? 'noindex,nofollow' : 'index,follow' });
  ensureLink('canonical', canonical);
};

export const usePageMeta = (meta: PageMetaOptions | Ref<PageMetaOptions>) => {
  if (typeof document === 'undefined') return;
  onMounted(() => {
    watchEffect(() => applyPageMeta(typeof meta === 'object' && 'value' in meta ? meta.value : meta));
  });
};
