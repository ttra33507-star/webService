import httpClient from '../api/httpClient';

export interface CartItem {
  id: string | number;
  name: string;
  quantity: number;
  price: number;
  currency?: string;
  sku?: string;
  imageUrl?: string;
  description?: string;
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
}

export interface CartData {
  items: CartItem[];
  summary: CartSummary;
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normaliseCartResponse = (payload: unknown): CartData => {
  const raw = payload as Record<string, unknown> | unknown[];

  const rawItems =
    Array.isArray(raw) ? raw : (raw?.items as unknown[]) ?? (raw?.data as unknown[]) ?? (raw?.cart as unknown[]) ?? [];

  const items: CartItem[] = Array.isArray(rawItems)
    ? rawItems.map((item, index) => {
        const entry = item as Record<string, unknown>;
        const quantity = toNumber(entry.quantity ?? entry.qty);
        const price = toNumber(entry.price ?? entry.unitPrice ?? entry.amount);

        return {
          id: (entry.id ?? entry.productId ?? entry.sku ?? index) as string | number,
          name: String(entry.name ?? entry.title ?? entry.productName ?? 'Untitled item'),
          quantity,
          price,
          currency: (entry.currency ?? (raw as Record<string, unknown>)?.currency) as string | undefined,
          sku: entry.sku ? String(entry.sku) : undefined,
          imageUrl: entry.imageUrl
            ? String(entry.imageUrl)
            : entry.image
            ? String(entry.image)
            : entry.thumbnail
            ? String(entry.thumbnail)
            : undefined,
          description: entry.description ? String(entry.description) : undefined,
        };
      })
    : [];

  const inferredCurrency =
    items.find((item) => item.currency)?.currency ??
    (Array.isArray(raw) ? undefined : (raw?.currency as string | undefined)) ??
    'USD';

  const subtotalFromItems = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const summarySource = Array.isArray(raw)
    ? {}
    : (raw?.summary as Record<string, unknown>) ?? raw ?? {};

  const subtotal = toNumber(summarySource.subtotal ?? summarySource.subTotal ?? subtotalFromItems);
  const discount = toNumber(summarySource.discount ?? summarySource.discountTotal ?? summarySource.discountAmount);
  const tax = toNumber(summarySource.tax ?? summarySource.taxAmount);

  const listedTotal = toNumber(summarySource.total ?? summarySource.grandTotal ?? summarySource.amountDue);
  const total =
    listedTotal > 0
      ? listedTotal
      : Math.max(0, subtotal - discount + tax);

  return {
    items,
    summary: {
      subtotal: subtotal || subtotalFromItems,
      discount,
      tax,
      total: total || Math.max(0, subtotalFromItems - discount + tax),
      currency: inferredCurrency,
    },
  };
};

export const fetchCart = async (): Promise<CartData> => {
  const response = await httpClient.get('/cart');
  return normaliseCartResponse(response.data);
};
