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
