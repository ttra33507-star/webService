<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { isAxiosError } from 'axios';
import Swal from 'sweetalert2';
import { useAuth } from '../composables/useAuth';
import { fetchCategoryById, fetchServiceCatalog } from '../services/catalogService';
import type { CategoryRecord, ServiceRecord } from '../types/service';
import { createOrder, fetchRecentOrders } from '../services/orderService';
import { getPortalBaseUrl } from '../services/authService';

type RouteParam = string | string[] | number | undefined;

const route = useRoute();
const router = useRouter();
const { isAuthenticated, signOut, authState } = useAuth();
const portalBaseUrl = (getPortalBaseUrl() || 'https://apps.c4techhub.com').replace(/\/+$/, '');

const isLoading = ref(true);
const loadError = ref<string | null>(null);
const service = ref<ServiceRecord | null>(null);
const categoryInfo = ref<CategoryRecord | null>(null);
const quantity = ref<number>(1);
const link = ref('');
const quantityError = ref<string | null>(null);
const linkError = ref<string | null>(null);
const submitError = ref<string | null>(null);
const submitSuccess = ref<string | null>(null);
const submitting = ref(false);
let redirectTimer: ReturnType<typeof setTimeout> | null = null;

const parseNumericId = (value: RouteParam): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (Array.isArray(value) && value.length > 0) {
    return parseNumericId(value[0]);
  }
  return null;
};

const serviceId = computed<number | null>(() => parseNumericId(route.params.serviceId as RouteParam));

const categoryIsTool = computed<boolean>(() => {
  if (categoryInfo.value) {
    return Boolean(categoryInfo.value.isTool);
  }
  return Boolean(service.value?.isTool);
});

const requiresLink = computed<boolean>(() => !categoryIsTool.value);

const normalizedQuantity = computed<number>(() => {
  const raw = Number(quantity.value);
  if (!Number.isFinite(raw) || raw < 1) {
    return 1;
  }
  return Math.round(raw);
});

const unitPriceValue = computed<number | null>(() => {
  if (!service.value) {
    return null;
  }
  const amount = Number(service.value.price.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }
  return amount;
});

const estimateTotal = computed<number | null>(() => {
  if (unitPriceValue.value === null) {
    return null;
  }
  const total = unitPriceValue.value * normalizedQuantity.value;
  return Number(total.toFixed(2));
});

const formatCurrency = (amount: number | null): string => {
  if (amount === null) {
    return '--';
  }
  const symbol = service.value?.price.symbol ?? '';
  const currency = service.value?.price.currency ?? 'USD';
  const formatted = amount.toFixed(2);
  return symbol ? `${symbol}${formatted}` : `${formatted} ${currency}`;
};

const totalDisplay = computed(() => formatCurrency(estimateTotal.value));

const sanitizeIdentifier = (value: string) => value.replace(/[^\w-]/g, '');

const formatMinutesToDuration = (minutes: number): string => {
  const rounded = Math.max(1, Math.round(minutes));
  const hours = Math.floor(rounded / 60);
  const remaining = rounded % 60;
  if (hours && remaining) {
    return `${hours} hr${hours > 1 ? 's' : ''} ${remaining} min`;
  }
  if (hours) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${rounded} min`;
};

const averageTimeDisplay = computed<string | null>(() => {
  const record = service.value;
  if (!record) {
    return null;
  }
  const text = record.averageTime?.trim();
  if (text) {
    return text;
  }
  const minutes = record.averageTimeMinutes;
  if (typeof minutes === 'number' && Number.isFinite(minutes) && minutes > 0) {
    return formatMinutesToDuration(minutes);
  }
  return null;
});

const readNumericField = (source: Record<string, unknown> | null | undefined, keys: string[]): number | null => {
  if (!source) {
    return null;
  }
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const numeric = Number(value.replace?.(/,/g, '') ?? value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
  }
  return null;
};

const userBalance = computed<number | null>(() => {
  const user = authState.value?.user ?? null;
  if (!user || typeof user !== 'object') {
    return null;
  }

  const fields = [
    'balance',
    'wallet_balance',
    'walletBalance',
    'available_balance',
    'availableBalance',
    'credits',
    'credit',
    'funds',
    'amount',
  ];

  const value = readNumericField(user as Record<string, unknown>, fields);
  if (value == null) {
    return null;
  }
  const rounded = Number(value.toFixed(2));
  return Number.isFinite(rounded) ? rounded : null;
});

const hasPositiveBalance = computed(() => (userBalance.value ?? 0) > 0);

const normalizeDescriptionLine = (input: string): string => {
  const collapsed = input.replace(/\s+/g, ' ').trim();
  if (!collapsed) {
    return '';
  }
  return collapsed.replace(/\s*:\s*/g, ': ').trim();
};

const parsedDescription = computed(() => {
  const raw = service.value?.description ?? '';
  if (!raw.trim()) {
    return {
      bullets: [] as string[],
      notes: [] as string[],
    };
  }

  const lines = raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => normalizeDescriptionLine(line))
    .filter(Boolean);

  const bullets: string[] = [];
  const notes: string[] = [];
  let inNotesSection = false;

  lines.forEach((line) => {
    const detectionTarget = line.replace(/^[^\p{L}\p{N}]+/u, '').toLowerCase();
    if (!inNotesSection && /^notes?\b/.test(detectionTarget)) {
      inNotesSection = true;
      return;
    }
    if (inNotesSection) {
      notes.push(line);
    } else {
      bullets.push(line);
    }
  });

  return { bullets, notes };
});

const extractOrderPathFromUrl = (value: string): string | null => {
  try {
    const parsed = new URL(value);
    const hasOrderSegment = /\/orders\/[A-Za-z0-9-_]+/i;
    if (hasOrderSegment.test(parsed.pathname)) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/orders';
    }
  } catch {
    // ignore
  }
  const inlineMatch = value.match(/\/?orders\/[A-Za-z0-9-_]+(?:[/?#][^\s]*)?/i);
  if (inlineMatch?.[0]) {
    const candidate = inlineMatch[0];
    return candidate.startsWith('/') ? candidate : `/${candidate}`;
  }
  return null;
};

const tryExtractFromUrl = (value: string): string | null => {
  try {
    const { pathname, hash } = new URL(value);
    const pathMatch = pathname.match(/\/orders\/([A-Za-z0-9-_]+)/);
    if (pathMatch?.[1]) {
      return sanitizeIdentifier(pathMatch[1]);
    }
    if (hash) {
      const hashMatch = hash.match(/\/orders\/([A-Za-z0-9-_]+)/);
      if (hashMatch?.[1]) {
        return sanitizeIdentifier(hashMatch[1]);
      }
    }
  } catch {
    // ignore, not a URL
  }
  const inlineMatch = value.match(/orders\/([A-Za-z0-9-_]+)/i);
  if (inlineMatch?.[1]) {
    return sanitizeIdentifier(inlineMatch[1]);
  }
  return null;
};

const stringifyPayload = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value;
  }
  if (value == null) {
    return null;
  }
  try {
    return JSON.stringify(value);
  } catch {
    try {
      return String(value);
    } catch {
      return null;
    }
  }
};

const delay = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms);
});

const keywordPattern = /(?:order|reference|ref|ticket|code|id)[\s_]*(?:number|no\.?|code|id|#)?[\s_:/-]*([A-Za-z0-9-_]+)/i;

const extractIdentifierFromString = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const fromUrl = tryExtractFromUrl(trimmed);
  if (fromUrl) {
    return fromUrl;
  }

  const withoutHashPrefix = trimmed.replace(/^#+/, '').trim();
  if (withoutHashPrefix && !/\s/.test(withoutHashPrefix)) {
    return sanitizeIdentifier(withoutHashPrefix);
  }

  const hashMatch = trimmed.match(/#\s*([A-Za-z0-9-_]+)/);
  if (hashMatch?.[1]) {
    return sanitizeIdentifier(hashMatch[1]);
  }

  const keywordMatch = trimmed.match(keywordPattern);
  if (keywordMatch?.[1]) {
    return sanitizeIdentifier(keywordMatch[1].replace(/^#+/, ''));
  }

  return null;
};

const normalizeOrderDetailPath = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const fromUrl = extractOrderPathFromUrl(trimmed);
  if (fromUrl) {
    return fromUrl;
  }
  if (trimmed.startsWith('/orders/')) {
    return trimmed;
  }
  if (trimmed.startsWith('orders/')) {
    return `/${trimmed}`;
  }
  return null;
};

const normaliseOrderIdentifier = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  if (typeof value === 'string') {
    return extractIdentifierFromString(value);
  }
  return null;
};

const IDENTIFIER_KEY_HINTS = ['order', 'id', 'reference', 'ref', 'ticket', 'code', 'number'];
const DETAIL_KEY_HINTS = ['url', 'link', 'path', 'href', 'detail', 'portal'];
const LINK_KEY_HINTS = ['link', 'username', 'profile', 'url', 'account'];
const QUANTITY_KEY_HINTS = ['quantity', 'qty', 'count', 'amount', 'remaining'];

const hasKeyHint = (key: string, hints: string[]) => {
  const normalized = key.toLowerCase();
  return hints.some((hint) => normalized.includes(hint));
};

const extractOrderIdentifier = (payload: unknown): string | null => {
  const visited = new WeakSet<object>();
  const preferredKeys = [
    'order_id',
    'orderId',
    'id',
    'order_no',
    'orderNo',
    'order_number',
    'orderNumber',
    'order_code',
    'orderCode',
    'order_uuid',
    'orderUUID',
    'uuid',
    'uuid_v4',
    'uuidV4',
    'number',
    'reference',
    'reference_id',
    'code',
  ];

  const walk = (candidate: unknown): string | null => {
    if (!candidate) {
      return null;
    }
    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        const result = walk(item);
        if (result) {
          return result;
        }
      }
      return null;
    }
    if (typeof candidate === 'string' || typeof candidate === 'number') {
      return normaliseOrderIdentifier(candidate);
    }
    if (typeof candidate !== 'object') {
      return null;
    }
    if (visited.has(candidate as object)) {
      return null;
    }
    visited.add(candidate as object);

    const record = candidate as Record<string, unknown>;
    for (const key of preferredKeys) {
      if (key in record) {
        const resolved = normaliseOrderIdentifier(record[key]);
        if (resolved) {
          return resolved;
        }
      }
    }

    for (const [key, value] of Object.entries(record)) {
      if (!hasKeyHint(key, IDENTIFIER_KEY_HINTS)) {
        continue;
      }
      const resolved = normaliseOrderIdentifier(value);
      if (resolved) {
        return resolved;
      }
    }

    for (const value of Object.values(record)) {
      const nested = walk(value);
      if (nested) {
        return nested;
      }
    }

    return null;
  };

  const direct = walk(payload);
  if (direct) {
    return direct;
  }

  const serialized = stringifyPayload(payload);
  if (serialized) {
    return extractIdentifierFromString(serialized);
  }

  return null;
};

const extractOrderDetailPath = (payload: unknown): string | null => {
  const visited = new WeakSet<object>();
  const preferredKeys = [
    'order_url',
    'orderUrl',
    'detail_url',
    'detailUrl',
    'detail_link',
    'detailLink',
    'detail_path',
    'detailPath',
    'url',
    'order_link',
    'orderLink',
    'order_detail_url',
    'orderDetailUrl',
    'order_detail_path',
    'orderDetailPath',
    'order_path',
    'orderPath',
    'path',
    'link',
    'href',
    'portal_url',
    'portalUrl',
  ];

  const walk = (candidate: unknown): string | null => {
    if (!candidate) {
      return null;
    }
    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        const result = walk(item);
        if (result) {
          return result;
        }
      }
      return null;
    }
    if (typeof candidate === 'string') {
      return normalizeOrderDetailPath(candidate);
    }
    if (typeof candidate !== 'object') {
      return null;
    }
    if (visited.has(candidate as object)) {
      return null;
    }
    visited.add(candidate as object);

    const record = candidate as Record<string, unknown>;
    for (const key of preferredKeys) {
      if (key in record) {
        const resolved = normalizeOrderDetailPath(record[key] as string | null | undefined);
        if (resolved) {
          return resolved;
        }
      }
    }

    for (const [key, value] of Object.entries(record)) {
      if (!hasKeyHint(key, DETAIL_KEY_HINTS)) {
        continue;
      }
      const resolved = normalizeOrderDetailPath(value as string | null | undefined);
      if (resolved) {
        return resolved;
      }
    }

    for (const value of Object.values(record)) {
      const nested = walk(value);
      if (nested) {
        return nested;
      }
    }

    return null;
  };

  const direct = walk(payload);
  if (direct) {
    return direct;
  }

  const serialized = stringifyPayload(payload);
  if (serialized) {
    return extractOrderPathFromUrl(serialized);
  }

  return null;
};

const normaliseComparableLink = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.toString().trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/\/+$/, '').toLowerCase();
};

const normaliseComparableQuantity = (value: unknown): number | null => {
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value.replace(/,/g, ''))
        : Number.NaN;
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.max(0, Math.round(numeric));
};

const extractRecordValueByHints = <T>(
  candidate: unknown,
  hints: string[],
  parser: (value: unknown) => T | null,
  visited = new WeakSet<object>(),
): T | null => {
  if (!candidate) {
    return null;
  }
  if (Array.isArray(candidate)) {
    for (const item of candidate) {
      const result = extractRecordValueByHints(item, hints, parser, visited);
      if (result !== null && result !== undefined) {
        return result;
      }
    }
    return null;
  }
  if (typeof candidate !== 'object') {
    return null;
  }
  if (visited.has(candidate as object)) {
    return null;
  }
  visited.add(candidate as object);

  const record = candidate as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (!hasKeyHint(key, hints)) {
      continue;
    }
    const parsed = parser(value);
    if (parsed !== null && parsed !== undefined) {
      return parsed;
    }
  }

  for (const value of Object.values(record)) {
    if (typeof value === 'object' && value !== null) {
      const nested = extractRecordValueByHints(value, hints, parser, visited);
      if (nested !== null && nested !== undefined) {
        return nested;
      }
    }
  }

  return null;
};

const extractOrderLinkFromRecord = (record: Record<string, unknown>): string | null =>
  extractRecordValueByHints(record, LINK_KEY_HINTS, (value) =>
    typeof value === 'string' ? normaliseComparableLink(value) : null,
  );

const extractOrderQuantityFromRecord = (record: Record<string, unknown>): number | null =>
  extractRecordValueByHints(record, QUANTITY_KEY_HINTS, (value) => normaliseComparableQuantity(value));

interface OrderMetadataResolutionOptions {
  attempts?: number;
  initialDelay?: number;
  perPage?: number;
  expectedLink?: string | null;
  expectedQuantity?: number | null;
}

const resolveLatestOrderMetadata = async (options?: OrderMetadataResolutionOptions) => {
  const attempts = Math.max(1, options?.attempts ?? 4);
  const initialDelay = Math.max(50, options?.initialDelay ?? 350);
  const perPage = Math.max(1, options?.perPage ?? 5);
  const normalizedExpectedLink = normaliseComparableLink(options?.expectedLink ?? null);
  const expectedQuantity =
    typeof options?.expectedQuantity === 'number' && Number.isFinite(options.expectedQuantity)
      ? Math.max(0, Math.round(options.expectedQuantity))
      : null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const recentRecords = await fetchRecentOrders({ perPage });
    let matchedRecord: Record<string, unknown> | null = null;

    if (normalizedExpectedLink) {
      for (const record of recentRecords) {
        const recordLink = extractOrderLinkFromRecord(record);
        if (recordLink && recordLink === normalizedExpectedLink) {
          matchedRecord = record;
          break;
        }
      }
    }

    if (!matchedRecord && expectedQuantity !== null) {
      for (const record of recentRecords) {
        const recordQuantity = extractOrderQuantityFromRecord(record);
        if (recordQuantity !== null && recordQuantity === expectedQuantity) {
          matchedRecord = record;
          break;
        }
      }
    }

    if (!matchedRecord) {
      matchedRecord = recentRecords[0] ?? null;
    }

    if (matchedRecord) {
      const identifier = extractOrderIdentifier(matchedRecord);
      const detailPath = extractOrderDetailPath(matchedRecord);
      if (identifier || detailPath) {
        return { identifier, detailPath };
      }
    }

    if (attempt < attempts - 1) {
      const waitDuration = initialDelay * (attempt + 1);
      await delay(waitDuration);
    }
  }

  return { identifier: null, detailPath: null };
};

const resolveOrderDetailPath = (orderIdentifier: string | null, explicitPath?: string | null) => {
  const normalizedExplicit = normalizeOrderDetailPath(explicitPath);
  if (normalizedExplicit) {
    return normalizedExplicit;
  }
  if (orderIdentifier) {
    return `/orders/${encodeURIComponent(orderIdentifier)}`;
  }
  return null;
};

const buildPortalUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${portalBaseUrl}${normalizedPath}`;
};

const redirectToPortalBalance = async () => {
  const balancePath = '/balance';
  const balanceUrl = buildPortalUrl(balancePath);

  if (typeof window === 'undefined') {
    try {
      await router.push(balancePath);
    } catch (error) {
      console.warn('[Order] Unable to navigate to balance page without window context', error);
    }
    return;
  }

  window.location.href = balanceUrl;
};

const redirectToPortalOrders = async (orderIdentifier: string | null, explicitPath?: string | null) => {
  const detailPath = resolveOrderDetailPath(orderIdentifier, explicitPath);
  const baseOrdersPath = '/orders';
  const redirectPath = detailPath ?? baseOrdersPath;
  const targetUrl = buildPortalUrl(redirectPath);

  if (typeof window === 'undefined') {
    try {
      await router.push(redirectPath);
    } catch (error) {
      console.warn('[Order] Unable to navigate to orders without window context', error);
    }
    return;
  }

  window.location.href = targetUrl;
};

const redirectToLogin = () => {
  const redirectTarget = route.fullPath || route.path || '/';
  router.replace({
    name: 'login',
    query: { redirect: redirectTarget },
  });
};

const ensureAuthenticated = (options?: { forceRedirect?: boolean }): boolean => {
  if (!isAuthenticated.value || options?.forceRedirect) {
    if (options?.forceRedirect) {
      signOut();
    }
    redirectToLogin();
    return false;
  }
  return true;
};

const loadServiceDetails = async () => {
  if (!ensureAuthenticated()) {
    return;
  }

  isLoading.value = true;
  loadError.value = null;
  service.value = null;
  categoryInfo.value = null;

  const id = serviceId.value;
  if (!id) {
    loadError.value = 'Service not found.';
    isLoading.value = false;
    return;
  }

  try {
    const list = await fetchServiceCatalog();
    let match = list.find((item) => item.id === id) ?? null;

    if (!match) {
      const refreshed = await fetchServiceCatalog({ force: true });
      match = refreshed.find((item) => item.id === id) ?? null;
    }

    if (!match) {
      loadError.value = 'The selected service is no longer available.';
      return;
    }

    service.value = match;
    quantity.value =
      Number.isFinite(match.defaultQuantity) && match.defaultQuantity > 0
        ? Math.round(match.defaultQuantity)
        : 1;

    try {
      categoryInfo.value = await fetchCategoryById(match.category.id);
    } catch (error) {
      console.warn('[Order] Failed to fetch category metadata', error);
      categoryInfo.value = null;
    }
  } catch (error) {
    console.error('[Order] Failed to load service details', error);
    loadError.value = 'Unable to load service details right now. Please try again later.';
  } finally {
    isLoading.value = false;
  }
};

const resetStatusMessages = () => {
  submitError.value = null;
  submitSuccess.value = null;
};

const showSubmitErrorAlert = async (message: string) => {
  const messageStr = message?.toString().trim();
  if (!messageStr) {
    return;
  }

  try {
    if (messageStr.toLowerCase().includes('not enough balance')) {
      if (categoryIsTool.value && hasPositiveBalance.value) {
        const viewResult = await Swal.fire({
          icon: 'info',
          title: 'Review order details',
          text: 'You have balance available. View your order details to continue with payment.',
          showCancelButton: true,
          confirmButtonText: 'View details',
          cancelButtonText: 'Top up',
          reverseButtons: true,
        });

        if (viewResult?.isConfirmed) {
          await redirectToPortalOrders(null);
        } else if (viewResult?.dismiss === Swal.DismissReason.cancel) {
          await redirectToPortalBalance();
        }
        return;
      }

      const result = await Swal.fire({
        icon: 'error',
        title: 'Not enough balance',
        text: messageStr,
        showCancelButton: true,
        confirmButtonText: 'Top up balance',
        cancelButtonText: 'Cancel',
      });

      if (result?.isConfirmed) {
        await redirectToPortalBalance();
      }
      return;
    }

    await Swal.fire({
      icon: 'error',
      title: 'Order failed',
      text: messageStr,
    });
  } catch (error) {
    console.warn('[Order] Unable to display SweetAlert notification', error);
  }
};

const handleSubmit = async () => {
  if (!service.value) {
    return;
  }

  resetStatusMessages();
  quantityError.value = null;
  linkError.value = null;

  const currentQuantity = normalizedQuantity.value;
  const trimmedLink = link.value.trim();

  if (requiresLink.value && !trimmedLink) {
    linkError.value = 'Link or username is required for this service.';
    return;
  }

  if (unitPriceValue.value === null) {
    submitError.value = 'This service does not have pricing configured yet.';
    return;
  }

  const unitPrice = Number(unitPriceValue.value.toFixed(4));
  const totalPrice = Number((unitPrice * currentQuantity).toFixed(4));
  const estimateCost = Number((unitPrice * currentQuantity).toFixed(2));

  const metadata = categoryIsTool.value ? { category_is_tool: true } : null;

  const items = [
    {
      service_id: service.value.id,
      service_name: service.value.label,
      service_code: String(service.value.id),
      quantity: currentQuantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      currency: service.value.price.currency,
      metadata,
    },
  ];

  submitting.value = true;

  try {
    const orderResponse = await createOrder<Record<string, unknown>>({
      platform: service.value.mainCategory.label,
      mainCategory: String(service.value.mainCategory.id),
      category: service.value.category.label,
      category_is_tool: categoryIsTool.value,
      service: service.value.label,
      link: trimmedLink || null,
      quantity: currentQuantity,
      remaining_quanity: currentQuantity,
      service_price: unitPrice,
      estimate_cost: estimateCost,
      currency: service.value.price.currency,
      items,
    });
    let orderIdentifier = extractOrderIdentifier(orderResponse);
    let orderDetailPath = extractOrderDetailPath(orderResponse);

    if (!orderIdentifier || !orderDetailPath) {
      try {
        const latestMetadata = await resolveLatestOrderMetadata({
          attempts: 6,
          initialDelay: 350,
          perPage: 6,
          expectedLink: trimmedLink || null,
          expectedQuantity: currentQuantity,
        });
        if (!orderIdentifier) {
          orderIdentifier = latestMetadata.identifier;
        }
        if (!orderDetailPath) {
          orderDetailPath = latestMetadata.detailPath;
        }
      } catch (latestError) {
        console.warn('[Order] Unable to resolve latest order record', latestError);
      }
    }

    submitSuccess.value = orderIdentifier
      ? `Order #${orderIdentifier} placed successfully. Redirecting to your order details...`
      : 'Order placed successfully. Redirecting to your orders dashboard...';
    if (redirectTimer) {
      clearTimeout(redirectTimer);
    }
    redirectTimer = setTimeout(() => {
      void redirectToPortalOrders(orderIdentifier, orderDetailPath);
    }, 1500);
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response?.status === 401) {
        submitError.value = 'Your session has expired. Please sign in again.';
        ensureAuthenticated({ forceRedirect: true });
        submitting.value = false;
        return;
      }

      if (error.response?.status === 422) {
        const responseData = error.response.data as {
          message?: unknown;
          errors?: Record<string, unknown>;
        } | undefined;

        const errors = responseData?.errors ?? {};
        const extractMessage = (input: unknown): string | null => {
          if (Array.isArray(input)) {
            const first = input.find((item) => typeof item === 'string' && item.trim().length > 0);
            return typeof first === 'string' ? first : null;
          }
          if (typeof input === 'string' && input.trim()) {
            return input.trim();
          }
          return null;
        };

        const quantityMessage =
          extractMessage(errors.quantity) ||
          extractMessage((errors as Record<string, unknown>)['items.0.quantity']) ||
          extractMessage((errors as Record<string, unknown>)['items.quantity']);
        if (quantityMessage) {
          quantityError.value = quantityMessage;
        }

        const linkMessage = extractMessage(errors.link);
        if (linkMessage) {
          linkError.value = linkMessage;
        }

        const firstErrorValue = Object.values(errors)[0];
        const topMessage =
          extractMessage(firstErrorValue) ||
          (typeof responseData?.message === 'string' ? responseData.message : null);

        submitError.value = topMessage || 'We could not place your order. Please review the form and try again.';
        submitting.value = false;
        return;
      }

      const fallback =
        (typeof error.response?.data === 'object' &&
          error.response?.data !== null &&
          typeof (error.response.data as { message?: unknown }).message === 'string' &&
          ((error.response.data as { message?: string }).message ?? '').trim()) ||
        error.message ||
        'Unable to place your order at this time.';
      submitError.value = fallback as string;
      submitting.value = false;
      return;
    }

    submitError.value = 'Unable to place your order at this time.';
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  if (!ensureAuthenticated()) {
    return;
  }
  loadServiceDetails();
});

watch(isAuthenticated, (value) => {
  if (!value) {
    ensureAuthenticated({ forceRedirect: true });
  }
});

watch(
  () => serviceId.value,
  () => {
    if (!isAuthenticated.value) {
      return;
    }
    loadServiceDetails();
  },
);

watch(submitError, (message) => {
  if (message) {
    void showSubmitErrorAlert(message);
  }
});

watch(quantity, () => {
  quantityError.value = null;
  resetStatusMessages();
});

watch(link, () => {
  linkError.value = null;
  resetStatusMessages();
});

onBeforeUnmount(() => {
  if (redirectTimer) {
    clearTimeout(redirectTimer);
  }
});
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900">
    <section class="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="mb-6">
        <RouterLink
          to="/services"
          class="inline-flex border-2 border-[#0c86c3] pt-2 pb-2 pr-2 pl-2 rounded-[10px] items-center gap-2 text-sm font-semibold text-[#0c86c3] transition hover:text-[#0fa6ef]"
        >
          Back 
        </RouterLink>
      </div>

      <div v-if="isLoading" class="rounded-3xl border border-slate-900/70 bg-white/50 p-10 text-center">
        <p class="text-sm text-slate-600">Loading service details...</p>
      </div>

      <div v-else-if="loadError" class="space-y-6">
        <div class="rounded-3xl border border-red-500/40 bg-red-500/10 p-8 text-red-100">
          <h1 class="text-2xl font-semibold text-slate-900">We couldn't load this order form.</h1>
          <p class="mt-2 text-sm text-red-100/80">{{ loadError }}</p>
        </div>
      </div>

      <div v-else-if="service" class="space-y-8">
        <header class="rounded-[2.5rem] border border-slate-900/80 bg-white/60 p-8 shadow-[0_40px_120px_rgba(5,15,35,0.65)]">
          <p class="text-xs font-semibold uppercase tracking-[0.45em] text-[#0c86c3]">Prepare order</p>
          <h1 class="mt-3 text-3xl font-semibold text-slate-900">{{ service.label }}</h1>
          <p class="mt-4 text-sm text-slate-600">{{ service.name }}</p>
          <dl class="mt-6 grid gap-4 sm:grid-cols-2">
            <div class="rounded-2xl border border-slate-800/80 bg-white/60 p-4">
              <dt class="text-[11px] uppercase  text-slate-500">Platform</dt>
              <dd class="mt-2 text-lg font-semibold text-slate-900">{{ service.mainCategory.label }}</dd>
            </div>
            <div class="rounded-2xl border border-slate-800/80 bg-white/60 p-4">
              <dt class="text-[11px] uppercase  text-slate-500">Category</dt>
              <dd class="mt-2 text-lg font-semibold text-slate-900">{{ service.category.label }}</dd>
            </div>
          </dl>
        </header>

        <section
          v-if="parsedDescription.bullets.length || parsedDescription.notes.length"
          class="rounded-[2.5rem] border border-slate-900/60 bg-slate-50/80 p-8 text-sm text-slate-700 shadow-inner shadow-white/40"
        >
          <div v-if="parsedDescription.bullets.length">
            <p class="text-xs font-semibold uppercase  text-slate-500">Description</p>
            <ul class="mt-4 space-y-2 leading-relaxed">
              <li
                v-for="(line, index) in parsedDescription.bullets"
                :key="`desc-line-${index}`"
                class="flex items-start gap-2"
              >
                <span class="mt-1 h-1.5 w-1.5 rounded-full bg-[#0c86c3]" aria-hidden="true"></span>
                <span>{{ line }}</span>
              </li>
            </ul>
          </div>
          <div v-if="parsedDescription.notes.length" class="mt-6 border-t border-white/40 pt-6">
            <p class="text-xs font-semibold uppercase  text-slate-500">Notes</p>
            <ul class="mt-4 space-y-2 leading-relaxed">
              <li
                v-for="(line, index) in parsedDescription.notes"
                :key="`desc-note-${index}`"
                class="flex items-start gap-2"
              >
                <span class="text-base leading-tight text-[#0c86c3]">•</span>
                <span>{{ line }}</span>
              </li>
            </ul>
          </div>
        </section>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div class="grid gap-6 md:grid-cols-1 ">
            <label v-if="requiresLink" class="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Link / Username
              <input
                v-model="link"
                type="text"
                :placeholder="requiresLink ? 'https://example.com/handle' : 'Optional for tool-based services'"
                class="rounded-2xl border border-slate-800 bg-white/70 px-4 py-3 text-slate-900 placeholder:text-slate-900 focus:border-[#0c86c3] focus:outline-none focus:ring-2 focus:ring-[#0c86c3]/40"
              />
              <span class="text-xs text-slate-500">
                {{ requiresLink ? 'Provide the profile or content URL we should process.' : 'Optional input for software tools.' }}
              </span>
              <span v-if="linkError" class="text-xs text-red-300">{{ linkError }}</span>
            </label>

            <label v-if="!categoryIsTool" class="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Quantity
                <input
                  v-model.number="quantity"
                  type="number"
                  min="1"
                  step="1"
                  class="rounded-2xl border border-slate-800 bg-white/70 px-4 py-3 text-slate-900 placeholder:text-slate-900 focus:border-[#0c86c3] focus:outline-none focus:ring-2 focus:ring-[#0c86c3]/40"
                />
                <span class="text-xs text-slate-500">Minimum of 1. Adjust to match the size of your order.</span>
                <div v-if="averageTimeDisplay" class="mt-3 flex flex-col gap-2">
                  <span class="text-xs font-semibold uppercase text-slate-900">Average time</span>
                  <div class="relative">
                    <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0c86c3]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="9.25" />
                        <path d="M12 7.25v4.75l3 2" />
                      </svg>
                    </span>
                    <input
                      :value="averageTimeDisplay"
                      type="text"
                      readonly
                      class="w-full cursor-default rounded-2xl border border-black  py-3 pl-10 pr-3 text-sm font-semibold text-[#0c86c3] placeholder:text-[#0c86c3]/70 focus:outline-none"
                      aria-label="Average time"
                    />
                  </div>
                </div>
                <span v-if="quantityError" class="text-xs text-red-300">{{ quantityError }}</span>
              </label>
          </div>


          <div
            v-if="!categoryIsTool"
            class="rounded-[2rem] border border-[#0c86c3]/30 bg-[#0c86c3]/5 p-6 text-sm text-[#0c86c3] "
          >
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p class="text-[11px] uppercase  text-[#0c86c3]">Estimated total</p>
                <p class="mt-2 text-2xl font-semibold text-slate-900">{{ totalDisplay }}</p>
              </div>
              <div >
                <p class="text-[11px] uppercase  text-[#0c86c3]">Quantity</p>
                <p class="mt-2 text-2xl font-semibold text-slate-900">{{ normalizedQuantity }}</p>
                <!-- <div
                  v-if="averageTimeDisplay"
                  class="mt-2 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#0c86c3]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="8.5" />
                    <path d="M12 8v4l2.5 1.5" />
                  </svg>
                  <span>Avg {{ averageTimeDisplay }}</span>
                </div> -->
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <p
              v-if="submitSuccess"
              class="rounded-2xl border border-[#0c86c3]/30 bg-[#0c86c3]/10 px-4 py-3 text-sm text-[#0c86c3]"
            >
              {{ submitSuccess }}
            </p>
          </div>

          <div class="flex flex-wrap  gap-4 md:justify-start  justify-center ">
            <button
              type="submit"
              class=" items-center justify-center rounded-full bg-[#096b9f] px-6 py-3 text-sm font-semibold uppercase tracking-[3px]  text-white transition hover:bg-[#0fa6ef] disabled:cursor-not-allowed disabled:bg-white disabled:text-slate-500"
              :disabled="submitting"
            >
              {{ submitting ? 'Placing order...' : 'Place order' }}
            </button>
            <RouterLink
              to="/services"
              class=" items-center justify-center rounded-full border border-red-500 bg-red-400 px-6 py-3 text-sm font-semibold uppercase  tracking-[3px] text-white transition"
            >
              Cancel
            </RouterLink>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>
