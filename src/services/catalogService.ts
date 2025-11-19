import httpClient from '../api/httpClient';
import type {
  CategoryRecord,
  RemoteServiceRecord,
  ServiceCategoryGroup,
  ServiceRecord,
} from '../types/service';

const SERVICES_ENDPOINT = '/api/all-services';
const CATEGORIES_ENDPOINT = '/api/categories';

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

const resolveApiBaseUrl = () => {
  const devApi = coerceString(import.meta.env.VITE_DEV_API_BASE_URL);
  const prodApi = coerceString(import.meta.env.VITE_API_BASE_URL);

  if (import.meta.env.DEV && devApi) {
    return devApi.replace(/\/+$/, '');
  }

  if (prodApi) {
    return prodApi.replace(/\/+$/, '');
  }

  const clientBase = coerceString(httpClient.defaults.baseURL);
  if (clientBase) {
    return clientBase.replace(/\/+$/, '');
  }

  return '';
};

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

  const devAsset = coerceString(import.meta.env.VITE_DEV_PUBLIC_ASSET_BASE_URL);
  if (devAsset) {
    return devAsset.replace(/\/+$/, '');
  }

  const apiBase = resolveApiBaseUrl();
  if (apiBase) {
    return apiBase;
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
  const salesCount = coerceNumber(payload.sales_count, 0);
  const description = coerceString(payload.description, '');
  const averageTimeText = coerceString(payload.average_time ?? payload.evage_time ?? '');
  const averageTimeMinutes =
    payload.average_time_minute == null ? null : coerceNumber(payload.average_time_minute, 0);
  const rawIsTool = payload.is_tool;
  const isTool = (() => {
    if (typeof rawIsTool === 'boolean') {
      return rawIsTool;
    }
    if (typeof rawIsTool === 'number') {
      return rawIsTool === 1;
    }
    if (typeof rawIsTool === 'string') {
      const normalized = rawIsTool.trim().toLowerCase();
      return ['1', 'true', 'yes', 'on'].includes(normalized);
    }
    return false;
  })();

  return {
    id: payload.id,
    name: coerceString(payload.name, 'Unnamed Service'),
    label: coerceString(payload.label, payload.name),
    iconUrl,
    description: description || null,
    averageTime: averageTimeText || null,
    averageTimeMinutes,
    isTool,
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
    salesCount: Math.max(0, Math.floor(salesCount)),
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

const sortBestsellers = (left: ServiceRecord, right: ServiceRecord) => {
  if (left.salesCount !== right.salesCount) {
    return right.salesCount - left.salesCount;
  }

  if (left.price.amount !== right.price.amount) {
    return left.price.amount - right.price.amount;
  }

  return left.label.localeCompare(right.label);
};

let cachedServices: ServiceRecord[] | null = null;
let inflightRequest: Promise<ServiceRecord[]> | null = null;
const includeInvisibleServices = String(import.meta.env.VITE_INCLUDE_INVISIBLE_SERVICES ?? '')
  .toLowerCase()
  .trim() === 'true';

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
      const normalized = response.data
        .map(normalizeService)
        .filter((service) => includeInvisibleServices || service.visible);
      normalized.sort(sortServices);
      cachedServices = normalized;
      return normalized;
    })
    .finally(() => {
      inflightRequest = null;
    });

  return inflightRequest;
};

let cachedBestsellers: ServiceRecord[] | null = null;
let bestsellersInflight: Promise<ServiceRecord[]> | null = null;

export const fetchBestsellerServices = async (options?: { force?: boolean }): Promise<ServiceRecord[]> => {
  if (!options?.force && cachedBestsellers) {
    return cachedBestsellers;
  }

  if (!options?.force && bestsellersInflight) {
    return bestsellersInflight;
  }

  const force = options?.force ?? false;

  bestsellersInflight = fetchServiceCatalog({ force })
    .then((catalog) => {
      const sorted = [...catalog].sort(sortBestsellers);
      const withSales = sorted.filter((service) => service.salesCount > 0);
      cachedBestsellers = withSales.length ? withSales : sorted;
      return cachedBestsellers;
    })
    .finally(() => {
      bestsellersInflight = null;
    });

  return bestsellersInflight;
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

interface RemoteCategoryRecord {
  id: number;
  name?: string | null;
  label?: string | null;
  main_category_id?: number | string | null;
  main_category_label?: string | null;
  is_tool?: boolean | number | string | null;
}

const normalizeCategory = (payload: RemoteCategoryRecord): CategoryRecord => {
  const label = coerceString(payload.label ?? payload.name ?? 'Category', 'Category');
  const mainCategoryId = coerceNumber(payload.main_category_id, 0);
  const mainLabel = coerceString(payload.main_category_label, '');
  const rawIsTool = payload.is_tool;
  const isTool = (() => {
    if (typeof rawIsTool === 'boolean') {
      return rawIsTool;
    }
    if (typeof rawIsTool === 'number') {
      return rawIsTool === 1;
    }
    if (typeof rawIsTool === 'string') {
      const normalized = rawIsTool.trim().toLowerCase();
      return ['1', 'true', 'yes', 'on'].includes(normalized);
    }
    return false;
  })();

  return {
    id: payload.id,
    label,
    mainCategoryId,
    mainCategoryLabel: mainLabel || null,
    isTool,
  };
};

let cachedCategories: Map<number, CategoryRecord> | null = null;
let categoriesInflight: Promise<Map<number, CategoryRecord>> | null = null;

const fetchCategoriesInternal = async (force = false): Promise<Map<number, CategoryRecord>> => {
  if (!force && cachedCategories) {
    return cachedCategories;
  }

  if (!force && categoriesInflight) {
    return categoriesInflight;
  }

  categoriesInflight = httpClient
    .get<RemoteCategoryRecord[]>(CATEGORIES_ENDPOINT)
    .then((response) => {
      const map = new Map<number, CategoryRecord>();
      response.data.forEach((record) => {
        if (!record || typeof record.id !== 'number') {
          return;
        }
        map.set(record.id, normalizeCategory(record));
      });
      cachedCategories = map;
      return map;
    })
    .finally(() => {
      categoriesInflight = null;
    });

  return categoriesInflight;
};

export const fetchCategoryById = async (
  categoryId: number,
  options?: { force?: boolean },
): Promise<CategoryRecord | null> => {
  const force = options?.force ?? false;
  const initialMap = await fetchCategoriesInternal(force);
  const existing = initialMap.get(categoryId) ?? null;
  if (existing || force) {
    return existing;
  }

  const refreshed = await fetchCategoriesInternal(true);
  return refreshed.get(categoryId) ?? null;
};

export const getCachedCategory = (categoryId: number): CategoryRecord | null => {
  if (!cachedCategories) {
    return null;
  }
  return cachedCategories.get(categoryId) ?? null;
};

export const listCachedCategories = (): CategoryRecord[] => {
  if (!cachedCategories) {
    return [];
  }
  return Array.from(cachedCategories.values());
};
