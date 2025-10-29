import QRCode from 'qrcode';
import { isAxiosError } from 'axios';
import { BakongKHQR, khqrData, IndividualInfo, MerchantInfo } from 'bakong-khqr';
import httpClient from '../api/httpClient';

// Bakong API configuration
const phoneNumber = (import.meta.env.VITE_PHONE_NUMBER ?? '').toString().trim();
const bakongAccountId = ((import.meta.env.VITE_BAKONG_ACCOUNT_ID ?? '').toString().trim()) || phoneNumber;
const merchantName = (import.meta.env.VITE_MERCHANT_NAME ?? 'C4 TECH HUB').toString().trim();
const merchantCity = import.meta.env.VITE_MERCHANT_CITY ?? 'Phnom Penh';
const merchantCategoryCode = import.meta.env.VITE_MERCHANT_CATEGORY_CODE ?? '5999';
const merchantId = (import.meta.env.VITE_MERCHANT_ID ?? '').toString().trim();
const acquiringBank = (import.meta.env.VITE_ACQUIRING_BANK ?? '').toString().trim();
const khqrAccountType = ((import.meta.env.VITE_KHQR_ACCOUNT_TYPE ?? 'individual').toString().trim().toLowerCase() || 'individual') as 'individual' | 'merchant';
const configuredExpiryMinutes = Number.parseInt(
  (import.meta.env.VITE_KHQR_EXPIRY_MINUTES ?? '2').toString().trim(),
  10,
);
const khqrExpiryMinutes =
  Number.isFinite(configuredExpiryMinutes) && configuredExpiryMinutes > 0
    ? configuredExpiryMinutes
    : 2;
const khqrClient = new BakongKHQR();

interface CheckoutParams {
  planId?: string;
  amount?: number;
  currency?: string;
}

interface KhqrGenerationResult {
  payload: string;
  md5?: string;
  creationTimestamp: number;
  expirationTimestamp: number;
}

interface BackendPaymentStatusResponse {
  status?: PaymentStatus;
  responseCode?: number;
  errorCode?: number | null;
  data?: Record<string, unknown> | null;
  raw?: unknown;
  checkedAt?: number;
  message?: string;
}

const getKhqrCurrency = (code: string) => {
  const normalized = code.trim().toUpperCase();
  console.log('Converting currency code:', normalized);

  let currencyCode;
  switch (normalized) {
    case 'USD':
      currencyCode = khqrData.currency.usd;
      break;
    case 'KHR':
      currencyCode = khqrData.currency.khr;
      break;
    default:
      currencyCode = undefined;
  }

  console.log('Mapped currency code:', currencyCode);
  return currencyCode;
};

const KHQR_LIMITS = {
  billNumber: 25,
  mobileNumber: 25,
  storeLabel: 25,
  terminalLabel: 25,
  purposeOfTransaction: 25,
  merchantCategoryCode: 4,
} as const;

const sanitizeOptionalField = (value: unknown, maxLength: number, fieldName: string): string | undefined => {
  if (value == null) {
    return undefined;
  }

  const stringValue = value.toString().trim();
  if (!stringValue) {
    return undefined;
  }

  if (stringValue.length <= maxLength) {
    return stringValue;
  }

  const truncated = stringValue.slice(0, maxLength);
  console.warn(`Truncating KHQR ${fieldName} to ${maxLength} characters.`, {
    original: stringValue,
    truncated,
  });
  return truncated;
};

const readStringCandidate = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (value == null) {
    return undefined;
  }

  if (value instanceof String) {
    const primitive = value.valueOf().trim();
    return primitive || undefined;
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    const numeric = String(value);
    return numeric ? numeric : undefined;
  }

  if (typeof (value as { toString?: () => string }).toString === 'function') {
    const textual = (value as { toString: () => string }).toString().trim();
    if (textual && textual !== '[object Object]') {
      return textual;
    }
  }

  return undefined;
};

const extractStringField = (response: unknown, candidateKeys: string[]): string | undefined => {
  const visited = new Set<unknown>();

  const normalise = (candidate: unknown): string | undefined => {
    const direct = readStringCandidate(candidate);
    if (direct) {
      return direct;
    }

    if (candidate == null || typeof candidate !== 'object') {
      return undefined;
    }

    if (visited.has(candidate)) {
      return undefined;
    }
    visited.add(candidate);

    const record = candidate as Record<string, unknown> & { getData?: () => unknown };

    for (const key of candidateKeys) {
      if (key === 'getData' && typeof record.getData === 'function') {
        const result = record.getData();
        const extracted = normalise(result);
        if (extracted) {
          return extracted;
        }
        continue;
      }

      if (Object.prototype.hasOwnProperty.call(record, key)) {
        const value = record[key];
        const extracted = normalise(value);
        if (extracted) {
          return extracted;
        }
      }
    }

    return undefined;
  };

  const value = normalise(response);
  if (value) {
    return value;
  }

  try {
    console.error(`Unable to extract ${candidateKeys.join('/') ?? 'value'} from response:`, JSON.stringify(response, null, 2));
  } catch {
    console.error(`Unable to extract ${candidateKeys.join('/') ?? 'value'} from response:`, response);
  }
  return undefined;
};

const extractKhqrValue = (response: unknown): string | undefined =>
  extractStringField(response, ['qr', 'qrString', 'payload', 'data', 'getData']);

const extractKhqrMd5 = (response: unknown): string | undefined =>
  extractStringField(response, ['md5', 'data', 'getData']);

const requestPaymentStatus = async (md5: string): Promise<BackendPaymentStatusResponse> => {
  try {
    const { data } = await httpClient.post<BackendPaymentStatusResponse>('/bakong/status', { md5 });
    return data;
  } catch (error) {
    if (isAxiosError<BackendPaymentStatusResponse>(error)) {
      const message =
        typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : error.message;
      throw new Error(message || 'Unable to check Bakong payment status.');
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Unable to check Bakong payment status.');
  }
};

const buildKhqrPayload = ({ planId, amount = 0, currency = 'USD' }: Required<CheckoutParams>): KhqrGenerationResult => {
  if (!bakongAccountId) {
    console.error('Bakong Account ID missing');
    throw new Error('Payment configuration missing. Please set VITE_BAKONG_ACCOUNT_ID or VITE_PHONE_NUMBER.');
  }

  if (!merchantName) {
    console.error('Merchant Name missing');
    throw new Error('Payment configuration missing. Please set VITE_MERCHANT_NAME.');
  }

  if (amount <= 0) {
    console.error('Invalid amount:', amount);
    throw new Error('Invalid payment amount. Amount must be greater than 0.');
  }

  const mappedCurrency = getKhqrCurrency(currency);
  if (!mappedCurrency) {
    throw new Error(`Unsupported currency "${currency}" for KHQR generation.`);
  }

  if (khqrAccountType === 'merchant' && (!merchantId || !acquiringBank)) {
    console.error('Merchant configuration missing', { merchantId, acquiringBank });
    throw new Error('Payment configuration missing. Please set VITE_MERCHANT_ID and VITE_ACQUIRING_BANK for merchant KHQR.');
  }

  const now = new Date();
  const creationTimestamp = now.getTime();
  const expiryDate = new Date(creationTimestamp + (khqrExpiryMinutes * 60 * 1000));
  const expirationTimestamp = expiryDate.getTime();

  if (`${expirationTimestamp}`.length !== 13) {
    console.warn('Unexpected expiration timestamp length detected.', expirationTimestamp);
  }

  const fallbackMobileNumber = phoneNumber
    ? phoneNumber.replace(/^\+?855/, '0')
    : undefined;

  const amountString =
    mappedCurrency === khqrData.currency.khr
      ? Math.round(amount).toString()
      : amount.toFixed(2);
  const sanitizedBillNumber = sanitizeOptionalField(planId, KHQR_LIMITS.billNumber, 'billNumber');
  const sanitizedMobileNumber = fallbackMobileNumber
    ? sanitizeOptionalField(fallbackMobileNumber, KHQR_LIMITS.mobileNumber, 'mobileNumber')
    : undefined;
  const sanitizedStoreLabel = sanitizeOptionalField(merchantName, KHQR_LIMITS.storeLabel, 'storeLabel');
  const sanitizedTerminalLabel = sanitizeOptionalField(merchantName, KHQR_LIMITS.terminalLabel, 'terminalLabel');
  const sanitizedPurpose = planId
    ? sanitizeOptionalField(`Plan ${planId}`, KHQR_LIMITS.purposeOfTransaction, 'purposeOfTransaction')
    : undefined;
  const sanitizedMerchantCategoryCodeRaw = sanitizeOptionalField(
    merchantCategoryCode,
    KHQR_LIMITS.merchantCategoryCode,
    'merchantCategoryCode'
  );
  const effectiveMerchantCategoryCode =
    sanitizedMerchantCategoryCodeRaw && sanitizedMerchantCategoryCodeRaw.length === KHQR_LIMITS.merchantCategoryCode
      ? sanitizedMerchantCategoryCodeRaw
      : '5999';
  if (
    sanitizedMerchantCategoryCodeRaw &&
    sanitizedMerchantCategoryCodeRaw.length !== KHQR_LIMITS.merchantCategoryCode
  ) {
    console.warn('Merchant category code must be 4 characters; using fallback 5999.', {
      original: merchantCategoryCode,
      sanitised: sanitizedMerchantCategoryCodeRaw,
    });
  }

  const optionalFields = {
    amount: amountString,
    currency: mappedCurrency,
    billNumber: sanitizedBillNumber,
    merchantCategoryCode: effectiveMerchantCategoryCode,
    mobileNumber: sanitizedMobileNumber,
    creationTimestamp,
    expirationTimestamp,
    // Additional optional fields for better display in Bakong app
    terminalLabel: sanitizedTerminalLabel,
    storeLabel: sanitizedStoreLabel,
    purposeOfTransaction: sanitizedPurpose,
  };

  // Create Bakong KHQR info with required fields
  const khqrInfo = khqrAccountType === 'merchant'
    ? new MerchantInfo(
        bakongAccountId,
        merchantName,
        merchantCity,
        merchantId,
        acquiringBank,
        optionalFields
      )
    : new IndividualInfo(
        bakongAccountId,
        merchantName,
        merchantCity,
        optionalFields
      );

  try {
    console.log('Generating KHQR with:', khqrInfo);
    const result = khqrAccountType === 'merchant'
      ? khqrClient.generateMerchant(khqrInfo)
      : khqrClient.generateIndividual(khqrInfo);
    console.log('KHQR Generation Result:', result);

    if (result.status.code !== 0) {
      throw new Error(result.status.message ?? 'Unable to generate KHQR payload.');
    }

    const qrValue = extractKhqrValue(result);
    if (!qrValue) {
      throw new Error('Generated KHQR payload is empty.');
    }

    const md5Value = extractKhqrMd5(result);

    return {
      payload: qrValue,
      md5: md5Value,
      creationTimestamp,
      expirationTimestamp,
    };
  } catch (error) {
    console.error('Error generating KHQR:', error);
    throw error;
  }
};

export const generateCheckoutDetails = async (params: Required<CheckoutParams>) => {
  const khqrGeneration = buildKhqrPayload(params);
  const { payload: khqrPayload, md5, creationTimestamp, expirationTimestamp } = khqrGeneration;
  if (!khqrPayload) {
    throw new Error('Unable to generate payment QR code. Please check your configuration.');
  }

  let qrCode: string;
  try {
    qrCode = await QRCode.toDataURL(khqrPayload, {
      margin: 4,
      width: 512,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H' // Highest error correction for better scanning
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate KHQR image.';
    throw new Error(message);
  }

  return {
    khqrPayload,
    qrCode,
    md5,
    creationTimestamp,
    expirationTimestamp,
  };
};

export type CheckoutDetails = Awaited<ReturnType<typeof generateCheckoutDetails>>;

export type PaymentStatus = 'PAID' | 'UNPAID';

export interface PaymentStatusResult<T = Record<string, unknown>> {
  status: PaymentStatus;
  responseCode: number;
  errorCode?: number | null;
  data?: T | null;
  checkedAt: number;
  raw: unknown;
}

export const checkBakongPaymentStatus = async (md5: string): Promise<PaymentStatusResult> => {
  const trimmed = (md5 ?? '').toString().trim();
  if (!trimmed) {
    throw new Error('MD5 hash is required to check Bakong payment status.');
  }

  const backend = await requestPaymentStatus(trimmed);

  const responseCode = typeof backend.responseCode === 'number' ? backend.responseCode : -1;
  const errorCode = backend.errorCode ?? null;
  const data = backend.data ?? null;

  let status: PaymentStatus;
  if (backend.status === 'PAID') {
    status = 'PAID';
  } else if (backend.status === 'UNPAID') {
    status = 'UNPAID';
  } else {
    status = responseCode === 0 ? 'PAID' : 'UNPAID';
  }

  return {
    status,
    responseCode,
    errorCode,
    data,
    checkedAt: typeof backend.checkedAt === 'number' ? backend.checkedAt : Date.now(),
    raw: backend.raw ?? backend,
  };
};
