import httpClient from '../api/httpClient';

export interface OrderStatusResponse {
  charge: string;
  start_count: string;
  status: string;
  remains: string;
  currency: string;
}

export const fetchOrderStatus = async (orderId: number | string): Promise<OrderStatusResponse> => {
  const { data } = await httpClient.post<OrderStatusResponse>('/api/provider/order-status', {
    action: 'status',
    order: orderId,
  });
  return data;
};
