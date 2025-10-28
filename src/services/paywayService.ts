import QRCode from 'qrcode';
import { BakongKHQR, khqrData, IndividualInfo, MerchantInfo } from 'bakong-khqr';

const paywayBaseUrl = import.meta.env.VITE_PAYWAY_URL ?? 'https://payway.ababank.com/payments';
// Trim environment values and treat empty strings as unset so fallbacks work correctly.
const bakongToken = (import.meta.env.VITE_BAKONG_TOKEN ?? '').toString().trim();
const phoneNumber = (import.meta.env.VITE_PHONE_NUMBER ?? '').toString().trim();
// If VITE_BAKONG_ACCOUNT_ID is empty string, fall back to phoneNumber.
const bakongAccountId = ((import.meta.env.VITE_BAKONG_ACCOUNT_ID ?? '').toString().trim()) || phoneNumber;
const merchantName = (import.meta.env.VITE_MERCHANT_NAME ?? '').toString().trim();
const merchantCity = import.meta.env.VITE_MERCHANT_CITY ?? 'Phnom Penh';
const merchantCategoryCode = import.meta.env.VITE_MERCHANT_CATEGORY_CODE ?? '';
const khqrAccountType = (import.meta.env.VITE_KHQR_ACCOUNT_TYPE ?? 'individual').toLowerCase();
const merchantId = import.meta.env.VITE_MERCHANT_ID ?? '';
const acquiringBank = import.meta.env.VITE_ACQUIRING_BANK ?? '';
const khqrExpiryMinutes = Number.parseInt(import.meta.env.VITE_KHQR_EXPIRY_MINUTES ?? '15', 10);

const khqrClient = new BakongKHQR();

interface CheckoutParams {
  planId?: string;
  amount?: number;
  currency?: string;
}

const getKhqrCurrency = (code: string) => {
  switch (code.toUpperCase()) {
    case 'USD':
      return khqrData.currency.usd;
    case 'KHR':
      return khqrData.currency.khr;
    default:
      return undefined;
  }
};

const buildKhqrPayload = ({ planId, amount = 0, currency = 'USD' }: Required<CheckoutParams>) => {
  if (!bakongAccountId) {
    throw new Error('Payment configuration missing. Please set VITE_BAKONG_ACCOUNT_ID or VITE_PHONE_NUMBER.');
  }

  if (!merchantName) {
    throw new Error('Payment configuration missing. Please set VITE_MERCHANT_NAME.');
  }

  const mappedCurrency = getKhqrCurrency(currency);

  if (!mappedCurrency) {
    throw new Error(`Unsupported currency "${currency}" for KHQR generation.`);
  }

  const optional = {
    amount,
    currency: mappedCurrency,
    billNumber: planId,
    merchantCategoryCode: merchantCategoryCode || undefined,
    mobileNumber: phoneNumber || undefined,
    expirationTimestamp:
      amount > 0 && !Number.isNaN(khqrExpiryMinutes) && khqrExpiryMinutes > 0
        ? Date.now() + khqrExpiryMinutes * 60_000
        : undefined,
  };

  if (khqrAccountType === 'merchant') {
    if (!merchantId || !acquiringBank) {
      throw new Error('Merchant KHQR requires VITE_MERCHANT_ID and VITE_ACQUIRING_BANK.');
    }

    const merchantInfo = new MerchantInfo(
      bakongAccountId,
      merchantName,
      merchantCity,
      merchantId,
      acquiringBank,
      optional,
    );

    const result = khqrClient.generateMerchant(merchantInfo);

    if (result.status.code !== 0) {
      throw new Error(result.status.message ?? 'Unable to generate merchant KHQR payload.');
    }

    return result.data.qr;
  }

  const individualInfo = new IndividualInfo(bakongAccountId, merchantName, merchantCity, optional);
  const result = khqrClient.generateIndividual(individualInfo);

  if (result.status.code !== 0) {
    throw new Error(result.status.message ?? 'Unable to generate KHQR payload.');
  }

  return result.data.qr;
};

const buildCheckoutUrl = ({ planId, amount, currency }: CheckoutParams = {}) => {
  const url = new URL(paywayBaseUrl);

  if (bakongToken) {
    url.searchParams.set('token', bakongToken);
  }

  if (phoneNumber) {
    url.searchParams.set('phone', phoneNumber);
  }

  if (planId) {
    url.searchParams.set('plan', planId);
  }

  if (typeof amount === 'number') {
    url.searchParams.set('amount', amount.toFixed(2));
  }

  if (currency) {
    url.searchParams.set('currency', currency);
  }

  return url.toString();
};

export const startCheckout = (planId?: string) => {
  const url = buildCheckoutUrl({ planId });

  if (!bakongToken || !phoneNumber) {
    // eslint-disable-next-line no-alert
    alert('Payment details are not configured. Please set VITE_BAKONG_TOKEN and VITE_PHONE_NUMBER.');
    return;
  }

  window.location.href = url;
};

export const generateCheckoutDetails = async (params: Required<CheckoutParams>) => {
  if (!bakongToken || !phoneNumber) {
    throw new Error('Payment configuration missing. Please check VITE_BAKONG_TOKEN and VITE_PHONE_NUMBER.');
  }

  const url = buildCheckoutUrl(params);
  const khqrPayload = buildKhqrPayload(params);
  const qrCode = await QRCode.toDataURL(khqrPayload, {
    margin: 1,
    width: 320,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  return {
    url,
    khqrPayload,
    qrCode,
  };
};

export type CheckoutDetails = Awaited<ReturnType<typeof generateCheckoutDetails>>;
