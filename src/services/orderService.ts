import httpClient from '../api/httpClient';

export interface OrderItemPayload {
  service_id: number | null;
  service_name: string;
  service_code: string;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  currency: string;
  metadata: Record<string, unknown> | null;
}

export interface CreateOrderPayload {
  platform: string;
  mainCategory: string;
  category: string;
  category_is_tool: boolean;
  service: string;
  link: string | null;
  quantity: number;
  remaining_quanity: number;
  service_price: number | null;
  estimate_cost: number | null;
  currency: string;
  items?: OrderItemPayload[];
  recurring_interval?: string | null;
  recurring_custom_months?: number | null;
}

export const createOrder = async <T = unknown>(payload: CreateOrderPayload): Promise<T> => {
  const { data } = await httpClient.post<T>('/api/orders', payload);
  return data;
};

const ORDER_COLLECTION_KEYS = ['data', 'items', 'orders', 'results', 'payload', 'records', 'list'];
const ORDER_RECORD_HINTS = ['order', 'service', 'link', 'quantity', 'status', 'id', 'number'];

const looksLikeOrderRecord = (value: Record<string, unknown>) => {
  const keys = Object.keys(value);
  if (!keys.length) {
    return false;
  }
  return keys.some((key) => ORDER_RECORD_HINTS.some((hint) => key.toLowerCase().includes(hint)));
};

const extractOrderRecords = (payload: unknown): Record<string, unknown>[] => {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object');
  }
  if (typeof payload === 'object') {
    const objectPayload = payload as Record<string, unknown>;
    for (const key of ORDER_COLLECTION_KEYS) {
      if (key in objectPayload) {
        const nested = extractOrderRecords(objectPayload[key]);
        if (nested.length) {
          return nested;
        }
      }
    }
    return looksLikeOrderRecord(objectPayload) ? [objectPayload] : [];
  }
  return [];
};

export const fetchRecentOrders = async (options?: {
  perPage?: number;
  page?: number;
  sort?: 'asc' | 'desc';
}): Promise<Record<string, unknown>[]> => {
  const perPage = options?.perPage && Number.isFinite(options.perPage) ? Number(options.perPage) : 5;
  const page = options?.page && Number.isFinite(options.page) ? Number(options.page) : 1;
  const sort = options?.sort ?? 'desc';
  try {
    const { data } = await httpClient.get('/api/orders', {
      params: {
        per_page: perPage,
        page,
        sort,
      },
    });
    return extractOrderRecords(data);
  } catch (error) {
    console.error('[Order] Failed to fetch recent orders', error);
    return [];
  }
};

export const fetchLatestOrderRecord = async (): Promise<Record<string, unknown> | null> => {
  const recent = await fetchRecentOrders({ perPage: 1, page: 1 });
  return recent[0] ?? null;
};
