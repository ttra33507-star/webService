import httpClient from '../api/httpClient';
import type { RemoteServiceRecord, ServiceCategoryGroup, ServiceRecord } from '../types/service';

const SERVICES_ENDPOINT = '/api/services';

const coerceNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/,/g, ''));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const coerceString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value == null) {
    return fallback;
  }
  return String(value).trim();
};

const DEFAULT_ASSET_BASE_URL = 'https://apps.c4techhub.com';

const ensureLeadingSlash = (value: string): string => {
  if (!value) {
    return value;
  }
  return value.startsWith('/') ? value : `/${value}`;
};

const resolveAssetBaseUrl = () => {
  const envConfigured = coerceString(import.meta.env.VITE_PUBLIC_ASSET_BASE_URL);
  if (envConfigured) {
    return envConfigured.replace(/\/+$/, '');
  }

  if (DEFAULT_ASSET_BASE_URL) {
    return DEFAULT_ASSET_BASE_URL.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }

  if (typeof globalThis !== 'undefined') {
    const location = (globalThis as typeof globalThis & { location?: { origin?: string } }).location;
    if (location?.origin) {
      return location.origin.replace(/\/+$/, '');
    }
  }

  return '';
};

const assetBaseUrl = resolveAssetBaseUrl();

const resolveAssetUrl = (value: string): string => {
  const trimmed = coerceString(value);
  if (!trimmed) {
    return '';
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (assetBaseUrl) {
    return `${assetBaseUrl}${ensureLeadingSlash(trimmed)}`;
  }

  return ensureLeadingSlash(trimmed);
};

const normalizeService = (payload: RemoteServiceRecord): ServiceRecord => {
  const amount = coerceNumber(payload.price_release, 0);
  const currency = coerceString(payload.currency, 'USD');
  const symbol = coerceString(payload.currency_symbol, currency === 'USD' ? '$' : '');
  const iconUrl = resolveAssetUrl(payload.icon ?? '');

  return {
    id: payload.id,
    name: coerceString(payload.name, 'Unnamed Service'),
    label: coerceString(payload.label, payload.name),
    iconUrl,
    visible: Boolean(payload.visible),
    defaultQuantity: payload.default_quantity ?? 1,
    price: {
      amount,
      formatted: `${symbol || ''}${amount.toFixed(2)}${!symbol ? ` ${currency}` : ''}`.trim(),
      currency,
      symbol,
    },
    category: {
      id: payload.category_id,
      label: coerceString(payload.category_label, 'General'),
    },
    mainCategory: {
      id: payload.main_category_id,
      label: coerceString(payload.main_category_label, 'Services'),
      icon: resolveAssetUrl(payload.main_category_icon),
    },
  };
};

const sortServices = (left: ServiceRecord, right: ServiceRecord) => {
  if (left.mainCategory.label !== right.mainCategory.label) {
    return left.mainCategory.label.localeCompare(right.mainCategory.label);
  }

  if (left.category.label !== right.category.label) {
    return left.category.label.localeCompare(right.category.label);
  }

  if (left.price.amount !== right.price.amount) {
    return left.price.amount - right.price.amount;
  }

  return left.label.localeCompare(right.label);
};

let cachedServices: ServiceRecord[] | null = null;
let inflightRequest: Promise<ServiceRecord[]> | null = null;

export const fetchServiceCatalog = async (options?: { force?: boolean }): Promise<ServiceRecord[]> => {
  if (!options?.force && cachedServices) {
    return cachedServices;
  }

  if (!options?.force && inflightRequest) {
    return inflightRequest;
  }

  inflightRequest = httpClient
    .get<RemoteServiceRecord[]>(SERVICES_ENDPOINT)
    .then((response) => {
      const normalized = response.data.map(normalizeService).filter((service) => service.visible);
      normalized.sort(sortServices);
      cachedServices = normalized;
      return normalized;
    })
    .finally(() => {
      inflightRequest = null;
    });

  return inflightRequest;
};

export const groupServicesByMainCategory = (services: ServiceRecord[]): ServiceCategoryGroup[] => {
  const map = new Map<number, ServiceCategoryGroup>();

  services.forEach((service) => {
    if (!map.has(service.mainCategory.id)) {
      map.set(service.mainCategory.id, {
        id: service.mainCategory.id,
        label: service.mainCategory.label,
        icon: service.mainCategory.icon,
        services: [],
      });
    }
    map.get(service.mainCategory.id)?.services.push(service);
  });

  return Array.from(map.values()).map((group) => ({
    ...group,
    services: [...group.services].sort(sortServices),
  }));
};

export const getFeaturedServices = (services: ServiceRecord[], limit = 3): ServiceRecord[] => {
  if (!services.length) {
    return [];
  }

  const sorted = [...services].sort((a, b) => {
    if (a.price.amount !== b.price.amount) {
      return a.price.amount - b.price.amount;
    }
    return a.label.localeCompare(b.label);
  });

  return sorted.slice(0, limit);
};
