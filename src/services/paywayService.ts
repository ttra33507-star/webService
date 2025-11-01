import axios, { isAxiosError } from 'axios';
import QRCode from 'qrcode';
import httpClient from '../api/httpClient';

const DEFAULT_STATUS_BASE_URL = 'https://api.c4techhub.com';
const DEFAULT_EXPIRY_MINUTES = (() => {
  const raw = (import.meta.env.VITE_KHQR_EXPIRY_MINUTES ?? '15').toString().trim();
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
})();
const DEFAULT_EXPIRY_SECONDS = DEFAULT_EXPIRY_MINUTES * 60;

const sanitizeBaseUrl = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.replace(/\/+$/, '');
};

const resolveStatusBaseUrl = () => {
  const configured = sanitizeBaseUrl(import.meta.env.VITE_KHQR_STATUS_BASE_URL);
  if (configured) {
    return configured;
  }
  return DEFAULT_STATUS_BASE_URL;
};

const sanitizeString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const DEFAULT_BAKONG_STATUS_BASE_URL = 'https://api-bakong.nbc.gov.kh';

const resolveBakongStatusBaseUrl = () => {
  const configured = sanitizeBaseUrl(import.meta.env.VITE_BAKONG_STATUS_BASE_URL);
  if (configured) {
    return configured;
  }
  return DEFAULT_BAKONG_STATUS_BASE_URL;
};

const BAKONG_STATUS_API_BASE = `${resolveBakongStatusBaseUrl()}/local/v1`;
const BAKONG_STATUS_STATIC_TOKEN = sanitizeString(import.meta.env.VITE_BAKONG_STATUS_TOKEN);
const BAKONG_STATUS_USERNAME = sanitizeString(import.meta.env.VITE_BAKONG_STATUS_USERNAME);
const BAKONG_STATUS_PASSWORD = sanitizeString(import.meta.env.VITE_BAKONG_STATUS_PASSWORD);

const bakongStatusClient = axios.create({
  baseURL: BAKONG_STATUS_API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const setBakongStatusAuthHeader = (token: string | null) => {
  if (token) {
    bakongStatusClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete bakongStatusClient.defaults.headers.common.Authorization;
  }
};

if (BAKONG_STATUS_STATIC_TOKEN) {
  setBakongStatusAuthHeader(BAKONG_STATUS_STATIC_TOKEN);
}

interface BakongStatusToken {
  value: string;
  expiresAt: number | null;
}

let bakongStatusToken: BakongStatusToken | null = BAKONG_STATUS_STATIC_TOKEN
  ? { value: BAKONG_STATUS_STATIC_TOKEN, expiresAt: null }
  : null;

let bakongLoginPromise: Promise<string | null> | null = null;

const shouldUseBakongFallback = () =>
  Boolean(BAKONG_STATUS_STATIC_TOKEN || (BAKONG_STATUS_USERNAME && BAKONG_STATUS_PASSWORD));

const toRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const getNestedValue = (source: Record<string, unknown> | null, path: string) => {
  if (!source) {
    return undefined;
  }
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
};

const readStringField = (source: Record<string, unknown> | null, fields: string[]): string | null => {
  for (const field of fields) {
    const value = getNestedValue(source, field);
    if (value == null) {
      continue;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
      continue;
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }
    const stringified = String(value).trim();
    if (stringified) {
      return stringified;
    }
  }
  return null;
};

const readNumberField = (source: Record<string, unknown> | null, fields: string[]): number | null => {
  for (const field of fields) {
    const value = getNestedValue(source, field);
    if (value == null) {
      continue;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const sanitized = value.replace?.(/,/g, '') ?? value;
      const parsed = Number(sanitized);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
};

const parseTimestamp = (value: unknown): number | null => {
  if (value == null) {
    return null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getTime();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 1e12) {
      return value;
    }
    if (value > 1e9) {
      return value * 1000;
    }
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return parseTimestamp(numeric);
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }
  return null;
};

const resolveBakongTokenExpiry = (value: unknown): number | null => {
  const parsed = parseTimestamp(value);
  if (parsed == null) {
    return null;
  }
  if (parsed < 1e12) {
    // Treat small values as durations in seconds
    return Date.now() + parsed * 1000;
  }
  return parsed;
};

const updateBakongStatusToken = (token: string, expiresAt: number | null) => {
  bakongStatusToken = { value: token, expiresAt };
  setBakongStatusAuthHeader(token);
};

const clearBakongStatusToken = () => {
  if (BAKONG_STATUS_STATIC_TOKEN) {
    bakongStatusToken = { value: BAKONG_STATUS_STATIC_TOKEN, expiresAt: null };
    setBakongStatusAuthHeader(BAKONG_STATUS_STATIC_TOKEN);
    return;
  }
  bakongStatusToken = null;
  setBakongStatusAuthHeader(null);
};

const ensureDataUrl = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (/^data:/i.test(trimmed) || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const base64Candidate = trimmed.replace(/\s+/g, '');
  if (!base64Candidate) {
    return null;
  }
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(base64Candidate);
  if (!isBase64) {
    return null;
  }
  return `data:image/png;base64,${base64Candidate}`;
};

const normaliseCurrency = (value: unknown, fallback: string): string => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed.toUpperCase();
    }
  }
  return fallback.toUpperCase();
};

const normaliseAmount = (value: unknown, fallback: number): number => {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }
  return fallback;
};

export type PaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'UNKNOWN';

const normalisePaymentStatus = (value: unknown): PaymentStatus | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  if (!normalized) {
    return null;
  }
  switch (normalized) {
    case 'PAID':
    case 'SUCCESS':
    case 'SUCCESSFUL':
    case 'COMPLETED':
    case 'SETTLED':
      return 'PAID';
    case 'UNPAID':
    case 'NOT_PAID':
      return 'UNPAID';
    case 'PENDING':
    case 'WAITING':
    case 'IN_PROGRESS':
    case 'INPROGRESS':
    case 'CREATED':
    case 'QUEUE':
    case 'INIT':
    case 'INITIAL':
      return 'PENDING';
    case 'PROCESSING':
    case 'IN_PROCESS':
      return 'PROCESSING';
    case 'FAILED':
    case 'FAIL':
    case 'DECLINED':
    case 'REJECTED':
    case 'ERROR':
      return 'FAILED';
    case 'EXPIRED':
    case 'TIMEOUT':
      return 'EXPIRED';
    case 'CANCELLED':
    case 'CANCELED':
    case 'VOID':
      return 'CANCELLED';
    default:
      return 'UNKNOWN';
  }
};

const detectPaymentEvidence = (data: Record<string, unknown> | null): boolean => {
  if (!data) {
    return false;
  }

  const paidTimestamp =
    parseTimestamp(
      readNumberField(data, [
        'paidTimestamp',
        'paid_at_timestamp',
        'paid_at',
        'paidAt',
        'paidTime',
        'paymentTimestamp',
        'paymentTime',
        'payment_time',
      ]) ??
        readStringField(data, [
          'paidTimestamp',
          'paid_at_timestamp',
          'paid_at',
          'paidAt',
          'paidTime',
          'paymentTimestamp',
          'paymentTime',
          'payment_time',
          'transactionDateTime',
          'transactionDate',
        ]),
    ) ?? null;

  if (paidTimestamp != null) {
    return true;
  }

  const paidAmount =
    readNumberField(data, [
      'order_paid_amount',
      'paidAmount',
      'paid_amount',
      'totalPaidAmount',
      'total_paid_amount',
      'paymentAmount',
    ]) ?? null;

  if (paidAmount != null && paidAmount > 0) {
    return true;
  }

  const outstandingAmount =
    readNumberField(data, ['order_outstanding_amount', 'outstandingAmount', 'outstanding_amount', 'balance']) ?? null;

  if (outstandingAmount != null && outstandingAmount <= 0 && (paidAmount ?? 0) >= 0) {
    return true;
  }

  const altStatusRaw = readStringField(data, [
    'transactionStatus',
    'orderStatus',
    'paymentResult',
    'paywayStatus',
    'order_status',
  ]);

  if (altStatusRaw) {
    const normalizedAltStatus = normalisePaymentStatus(altStatusRaw);
    if (normalizedAltStatus === 'PAID') {
      const altStatusUpper = altStatusRaw.trim().toUpperCase();
      if (
        altStatusUpper === 'PAID' ||
        altStatusUpper === 'SETTLED' ||
        altStatusUpper === 'COMPLETED' ||
        altStatusUpper.includes('PAID')
      ) {
        return true;
      }
    }
  }

  return false;
};

const performBakongStatusLogin = async (): Promise<string | null> => {
  if (!BAKONG_STATUS_USERNAME || !BAKONG_STATUS_PASSWORD) {
    return null;
  }

  try {
    const { data: response } = await bakongStatusClient.post('/login', {
      username: BAKONG_STATUS_USERNAME,
      password: BAKONG_STATUS_PASSWORD,
    });

    const root = toRecord(response);
    const dataRecord = toRecord(root?.data ?? null) ?? root;
    const token =
      readStringField(dataRecord, ['token', 'accessToken']) ?? readStringField(root, ['token', 'accessToken']);

    if (!token) {
      return null;
    }

    const expiryCandidate =
      readStringField(dataRecord, ['expireIn', 'expiresIn', 'expiredAt', 'expires_at']) ??
      readNumberField(dataRecord, ['expireIn', 'expiresIn', 'expiredAt', 'expires_at']);

    const expiresAt = resolveBakongTokenExpiry(expiryCandidate);
    updateBakongStatusToken(token, expiresAt);

    return token;
  } catch (error) {
    clearBakongStatusToken();
    if (import.meta.env.DEV) {
      console.warn('[Bakong] Unable to sign in to status API', error);
    }
    return null;
  }
};

const ensureBakongStatusAuth = async (): Promise<string | null> => {
  if (!shouldUseBakongFallback()) {
    return null;
  }

  if (BAKONG_STATUS_STATIC_TOKEN) {
    return BAKONG_STATUS_STATIC_TOKEN;
  }

  const now = Date.now();
  if (bakongStatusToken?.value) {
    if (bakongStatusToken.expiresAt == null || bakongStatusToken.expiresAt - now > 5000) {
      return bakongStatusToken.value;
    }
  }

  if (!bakongLoginPromise) {
    bakongLoginPromise = performBakongStatusLogin().finally(() => {
      bakongLoginPromise = null;
    });
  }

  return bakongLoginPromise;
};

const extractAxiosMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    const responseData = error.response?.data;
    if (typeof responseData === 'string' && responseData.trim()) {
      return responseData.trim();
    }
    const responseRecord = toRecord(responseData);
    if (responseRecord) {
      const messageFields = [
        'message',
        'error_description',
        'error',
        'statusMessage',
        'status_message',
        'responseMessage',
        'response_message',
        'responseDescription',
        'response_description',
        'description',
        'statusDescription',
        'status_description',
        'remark',
        'note',
      ];
      const message =
        readStringField(responseRecord, messageFields) ??
        readStringField(toRecord(responseRecord.data ?? null), [...messageFields, 'error']);
      if (message) {
        return message;
      }
    }
    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message.trim();
    }
  } else if (error instanceof Error && typeof error.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }
  return fallback;
};

const QR_RENDER_OPTIONS: QRCode.QRCodeToDataURLOptions = {
  margin: 1,
  width: 320,
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
};

export interface GenerateCheckoutParams {
  planId: string;
  amount: number;
  currency: string;
  orderId: string;
}

export interface CheckoutDetails {
  orderId: string;
  amount: number;
  currency: string;
  khqrPayload: string;
  qrCode: string;
  md5: string | null;
  creationTimestamp: number;
  expirationTimestamp: number;
  expiresInSeconds: number;
  data: Record<string, unknown> | null;
  raw: Record<string, unknown> | null;
}

export interface PaymentStatusResult {
  status: PaymentStatus;
  md5: string | null;
  data: Record<string, unknown> | null;
  raw: Record<string, unknown> | null;
  message: string | null;
  checkedAt: number;
}

const checkBakongStatusByMd5 = async (md5: string): Promise<PaymentStatusResult | null> => {
  if (!shouldUseBakongFallback()) {
    return null;
  }

  const token = await ensureBakongStatusAuth();
  if (!token) {
    return null;
  }

  try {
    const { data: response } = await bakongStatusClient.post('/check_transaction_by_md5', { md5 });
    const root = toRecord(response);
    const dataRecord = toRecord(root?.data ?? null) ?? root;

    if (!dataRecord) {
      return null;
    }

    const statusRaw =
      readStringField(root, ['status', 'responseMessage', 'paymentStatus', 'payment_status']) ??
      readStringField(dataRecord, ['status', 'paymentStatus', 'transactionStatus', 'orderStatus', 'result']);

    const fallbackStatus = normalisePaymentStatus(statusRaw);
    const evidenceDetected = detectPaymentEvidence(dataRecord);
    const statusRawUpper = typeof statusRaw === 'string' ? statusRaw.trim().toUpperCase() : '';
    const fallbackStatusExplicitlyPaid =
      statusRawUpper === 'PAID' ||
      statusRawUpper === 'SETTLED' ||
      statusRawUpper === 'COMPLETED' ||
      statusRawUpper.includes('PAID');

    const message =
      readStringField(root, ['responseMessage', 'message', 'statusMessage']) ??
      readStringField(dataRecord, ['message', 'statusMessage', 'note']) ??
      null;

    const resolvedMd5 =
      readStringField(dataRecord, ['md5', 'qr_md5', 'hash']) ??
      readStringField(root, ['md5', 'qr_md5', 'hash']) ??
      md5;

    let status: PaymentStatus;
    if (fallbackStatus === 'PAID') {
      status = fallbackStatusExplicitlyPaid || evidenceDetected ? 'PAID' : 'PENDING';
    } else if (fallbackStatus) {
      status = fallbackStatus;
    } else if (evidenceDetected) {
      status = 'PAID';
    } else {
      status = 'PENDING';
    }

    const result: PaymentStatusResult = {
      status,
      md5: resolvedMd5 ?? md5,
      data: dataRecord,
      raw: root,
      message,
      checkedAt: Date.now(),
    };

    const messageSuggestsPaid = (() => {
      if (!message) {
        return false;
      }
      const lower = message.trim().toLowerCase();
      if (!lower) {
        return false;
      }
      if (['paid', 'paid successfully', 'payment successful'].includes(lower)) {
        return true;
      }
      return (
        lower.includes('paid') ||
        lower.includes('payment success') ||
        lower.includes('payment successful') ||
        lower.includes('already paid') ||
        lower.includes('already been paid')
      );
    })();

    if (messageSuggestsPaid && result.status !== 'PAID') {
      result.status = 'PAID';
    }

    if (result.status !== 'PAID' && evidenceDetected) {
      result.status = 'PAID';
    }

    return result;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      clearBakongStatusToken();
    }
    if (import.meta.env.DEV) {
      console.warn('[Bakong] Unable to fetch status from Bakong fallback API', error);
    }
    return null;
  }
};

export const generateCheckoutDetails = async ({
  planId,
  amount,
  currency,
  orderId,
}: GenerateCheckoutParams): Promise<CheckoutDetails> => {
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error('A payment amount greater than 0 is required.');
  }

  const payload = {
    planId,
    plan_id: planId,
    orderId,
    order_id: orderId,
    amount: normalizedAmount,
    currency,
  };

  try {
    const { data: response } = await httpClient.post('/api/payway/generate-kqhr', payload);
    const root = toRecord(response);
    const payloadRecord = toRecord(root?.data ?? null) ?? root;

    if (!payloadRecord) {
      throw new Error('Payment service returned an empty response.');
    }

    const khqrPayload =
      readStringField(payloadRecord, [
        'khqrPayload',
        'khqr_string',
        'khqrString',
        'khqr',
        'payload',
        'qr',
        'qrString',
        'qr_string',
        'data.khqr',
      ]) ?? null;

    if (!khqrPayload) {
      throw new Error('Payment service did not return a KHQR payload.');
    }

    const md5 =
      readStringField(payloadRecord, ['md5', 'transactionMd5', 'transaction_hash', 'hash']) ??
      readStringField(root, ['md5', 'transactionMd5', 'transaction_hash', 'hash']);

    const amountValue =
      normaliseAmount(readNumberField(payloadRecord, ['amount', 'total', 'price']), normalizedAmount) ??
      normalizedAmount;
    const currencyValue = normaliseCurrency(
      readStringField(payloadRecord, ['currency', 'currencyCode']) ?? currency,
      currency,
    );

    const creationTimestamp =
      parseTimestamp(
        readNumberField(payloadRecord, ['createdAt', 'created_at', 'creationTimestamp']) ??
          readStringField(payloadRecord, ['createdAt', 'created_at', 'creationTimestamp']),
      ) ?? Date.now();

    const expiresInSeconds =
      readNumberField(payloadRecord, ['expiresIn', 'expires_in', 'expirySeconds', 'expiredInSeconds']) ??
      readNumberField(root, ['expiresIn', 'expires_in']) ??
      DEFAULT_EXPIRY_SECONDS;

    const expirationTimestamp =
      parseTimestamp(
        readNumberField(payloadRecord, ['expiredAt', 'expired_at', 'expirationTimestamp', 'expiresAt']) ??
          readStringField(payloadRecord, ['expiredAt', 'expired_at', 'expirationTimestamp', 'expiresAt']),
      ) ??
      (Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
        ? creationTimestamp + expiresInSeconds * 1000
        : creationTimestamp + DEFAULT_EXPIRY_SECONDS * 1000);

    const qrImage =
      ensureDataUrl(
        readStringField(payloadRecord, [
          'qrCode',
          'qr_code',
          'qrImage',
          'qr_image',
          'qrDataUrl',
          'qrUrl',
          'qr',
          'qrBase64',
        ]),
      ) ?? ensureDataUrl(readStringField(root, ['qrCode', 'qr_image', 'qrDataUrl', 'qrUrl']));

    const qrCode = qrImage ?? (await QRCode.toDataURL(khqrPayload, QR_RENDER_OPTIONS));

    return {
      orderId,
      amount: amountValue,
      currency: currencyValue,
      khqrPayload,
      qrCode,
      md5: md5 ?? null,
      creationTimestamp,
      expirationTimestamp,
      expiresInSeconds: Number.isFinite(expiresInSeconds) ? Math.max(1, Number(expiresInSeconds)) : DEFAULT_EXPIRY_SECONDS,
      data: payloadRecord,
      raw: root,
    };
  } catch (error) {
    throw new Error(extractAxiosMessage(error, 'Unable to prepare Bakong checkout at the moment. Please try again.'));
  }
};

export const checkBakongPaymentStatus = async (md5: string): Promise<PaymentStatusResult> => {
  const hash = typeof md5 === 'string' ? md5.trim() : '';
  if (!hash) {
    throw new Error('Transaction hash is required to check payment status.');
  }

  try {
    const { data: response } = await httpClient.post(
      '/api/payway/check-transaction-by-md5',
      { md5: hash },
      { baseURL: resolveStatusBaseUrl() },
    );

    const root = toRecord(response);
    const dataRecord = toRecord(root?.data ?? null) ?? root;

    const statusRaw =
      readStringField(root, ['status', 'paymentStatus', 'payment_status']) ??
      readStringField(dataRecord, ['status', 'paymentStatus', 'payment_status']);

    const normalizedStatus = normalisePaymentStatus(statusRaw);
    const paymentEvidence = detectPaymentEvidence(dataRecord);
    const statusRawUpper = typeof statusRaw === 'string' ? statusRaw.trim().toUpperCase() : '';
    const statusExplicitlyPaid =
      statusRawUpper === 'PAID' ||
      statusRawUpper === 'SETTLED' ||
      statusRawUpper === 'COMPLETED' ||
      statusRawUpper.includes('PAID');

    let status: PaymentStatus;
    if (normalizedStatus === 'PAID') {
      status = statusExplicitlyPaid || paymentEvidence ? 'PAID' : 'PENDING';
    } else if (normalizedStatus) {
      status = normalizedStatus;
    } else if (paymentEvidence) {
      status = 'PAID';
    } else {
      status = 'PENDING';
    }

    const messageFields = [
      'message',
      'statusMessage',
      'status_message',
      'responseMessage',
      'response_message',
      'responseDescription',
      'response_description',
      'statusDescription',
      'status_description',
      'description',
      'remark',
      'note',
    ];

    const message =
      readStringField(root, messageFields) ?? readStringField(dataRecord, messageFields) ?? null;

    const resolvedMd5 =
      readStringField(dataRecord, ['md5', 'transactionMd5', 'transaction_hash', 'hash']) ??
      readStringField(root, ['md5', 'transactionMd5', 'transaction_hash', 'hash']) ??
      hash;

    const result: PaymentStatusResult = {
      status,
      md5: resolvedMd5 ?? hash,
      data: dataRecord,
      raw: root,
      message,
      checkedAt: Date.now(),
    };

    const messageSuggestsPaid = (() => {
      if (!message) {
        return false;
      }
      const lower = message.trim().toLowerCase();
      if (!lower) {
        return false;
      }
      if (['paid', 'paid successfully', 'payment successful'].includes(lower)) {
        return true;
      }
      return (
        lower.includes('paid') ||
        lower.includes('payment success') ||
        lower.includes('payment successful') ||
        lower.includes('already paid') ||
        lower.includes('already been paid')
      );
    })();

    if (messageSuggestsPaid && result.status !== 'PAID') {
      result.status = 'PAID';
    }

    if (result.status === 'PAID') {
      return result;
    }

    const fallbackResult = await checkBakongStatusByMd5(hash);
    if (fallbackResult) {
      if (fallbackResult.status === 'PAID') {
        return fallbackResult;
      }

      if (fallbackResult.status !== 'UNKNOWN' && result.status !== fallbackResult.status) {
        result.status = fallbackResult.status;
      }
      if (!result.message && fallbackResult.message) {
        result.message = fallbackResult.message;
      }
      if (!result.data && fallbackResult.data) {
        result.data = fallbackResult.data;
      }
      if (!result.raw && fallbackResult.raw) {
        result.raw = fallbackResult.raw;
      }
      if (!result.md5 && fallbackResult.md5) {
        result.md5 = fallbackResult.md5;
      }
    }

    return result;
  } catch (error) {
    throw new Error(
      extractAxiosMessage(error, 'Unable to check Bakong payment status right now. Please try again shortly.'),
    );
  }
};
