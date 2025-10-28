const paywayBaseUrl = import.meta.env.VITE_PAYWAY_URL ?? 'https://payway.ababank.com/payments';
const bakongToken = import.meta.env.VITE_BAKONG_TOKEN ?? '';
const phoneNumber = import.meta.env.VITE_PHONE_NUMBER ?? '';

const buildCheckoutUrl = (planId?: string) => {
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

  return url.toString();
};

export const startCheckout = (planId?: string) => {
  const url = buildCheckoutUrl(planId);

  if (!bakongToken || !phoneNumber) {
    // eslint-disable-next-line no-alert
    alert('Payment details are not configured. Please set VITE_BAKONG_TOKEN and VITE_PHONE_NUMBER.');
    return;
  }

  window.location.href = url;
};
