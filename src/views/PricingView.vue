<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import {
  generateCheckoutDetails,
  checkBakongPaymentStatus,
  type CheckoutDetails,
  type PaymentStatus,
  type PaymentStatusResult,
} from '../services/paywayService';
import Swal from 'sweetalert2';

const merchantName = import.meta.env.VITE_MERCHANT_NAME ?? 'C4 TECH HUB';

type AudienceKey = 'local' | 'foreigner';

interface Plan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  cadence: string;
  tagline?: string;
  features: string[];
  highlight?: boolean;
}

const plansByAudience: Record<AudienceKey, Plan[]> = {
  local: [
    {
      id: 'local-1m',
      name: '1 Month',
      amount: 0.01,
      currency: 'USD',
      cadence: '/month',
      features: [
        '2 Time Change Key',
        'Bulk Upload Features',
        'Function Schedule',
        'Unlimited Real Devices Support',
        'Unlimited LDPlayer Support',
        'Unlimited Facebook Accounts',
      ],
    },
    {
      id: 'local-3m',
      name: '3 Months',
      amount: 29.99,
      currency: 'USD',
      cadence: '/3 months',
      tagline: '+15 Days Free',
      features: [
        '10 Time Change Key',
        'Bulk Upload Features',
        'Unlimited Real Devices Support',
        'Unlimited LDPlayer Support',
        'Unlimited Facebook Accounts',
      ],
      highlight: true,
    },
    {
      id: 'local-12m',
      name: '12 Months',
      amount: 119.99,
      currency: 'USD',
      cadence: '/year',
      tagline: '+30 Days Free',
      features: [
        '100 Time Change Key',
        'Everything in 3 Months plan',
        'Register Accounts (only cambodia)',
        'Verify Account Novary',
        'Custom Features (Paid)',
      ],
    },
  ],
  foreigner: [
    {
      id: 'international-1m',
      name: '1 Month',
      amount: 14.99,
      currency: 'USD',
      cadence: '/month',
      features: [
        '3 Time Change Key',
        'Bulk Upload Features',
        'Function Schedule',
        'Unlimited Real Devices Support',
        'Unlimited LDPlayer Support',
      ],
    },
    {
      id: 'international-3m',
      name: '3 Months',
      amount: 44.99,
      currency: 'USD',
      cadence: '/3 months',
      tagline: '+20 Days Free',
      features: [
        'Unlimited Time Change Key',
        'Priority Support',
        'Bulk Upload Features',
        'Unlimited Real Devices Support',
        'Unlimited LDPlayer Support',
      ],
      highlight: true,
    },
    {
      id: 'international-12m',
      name: '12 Months',
      amount: 169.99,
      currency: 'USD',
      cadence: '/year',
      tagline: '+45 Days Free',
      features: [
        'Unlimited Time Change Key',
        'Dedicated Success Manager',
        'Everything in 3 Months plan',
        'Custom Feature Requests',
      ],
    },
  ],
};

const formatPrice = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);

const route = useRoute();
const router = useRouter();
const { isAuthenticated } = useAuth();

const planAudienceMap = new Map<string, AudienceKey>();
const planMap = new Map<string, Plan>();
Object.entries(plansByAudience).forEach(([audienceKey, plans]) => {
  plans.forEach((plan) => {
    planAudienceMap.set(plan.id, audienceKey as AudienceKey);
    planMap.set(plan.id, plan);
  });
});

const audience = ref<AudienceKey>('local');
const activePlans = computed(() => plansByAudience[audience.value]);

const planIdFromQuery = computed(() => {
  const value = route.query.plan;
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }
  return null;
});

const selectedPlanId = ref<string | null>(null);
const isPaymentModalOpen = ref(false);
const isQrModalOpen = ref(false);
const isGeneratingCheckout = ref(false);
const paymentError = ref<string | null>(null);
const checkoutDetails = ref<CheckoutDetails | null>(null);

const POLL_INTERVAL_MS = 3000;
const paymentStatus = ref<PaymentStatus>('UNPAID');
const hasShownPaidAlert = ref(false);
const lastStatusResult = ref<PaymentStatusResult | null>(null);
const statusCheckError = ref<string | null>(null);
const isPollingStatus = ref(false);
const remainingSeconds = ref(0);
const pollingTimerId = ref<ReturnType<typeof setInterval> | null>(null);
const countdownTimerId = ref<ReturnType<typeof setInterval> | null>(null);

const stopPolling = () => {
  if (pollingTimerId.value !== null) {
    clearInterval(pollingTimerId.value);
    pollingTimerId.value = null;
  }
};

const stopCountdown = () => {
  if (countdownTimerId.value !== null) {
    clearInterval(countdownTimerId.value);
    countdownTimerId.value = null;
  }
};

const resetPaymentTracking = () => {
  stopPolling();
  stopCountdown();
  paymentStatus.value = 'UNPAID';
  hasShownPaidAlert.value = false;
  remainingSeconds.value = 0;
  statusCheckError.value = null;
  isPollingStatus.value = false;
  lastStatusResult.value = null;
};

const startPaymentTracking = (details: CheckoutDetails) => {
  resetPaymentTracking();

  const expirationTimestamp = details.expirationTimestamp;
  const md5 = details.md5?.trim();

  const updateRemainingSeconds = () => {
    const secondsLeft = Math.max(0, Math.round((expirationTimestamp - Date.now()) / 1000));
    remainingSeconds.value = secondsLeft;

    if (secondsLeft <= 0) {
      stopCountdown();
      if (paymentStatus.value !== 'PAID') {
        stopPolling();
      }
    }
  };

  updateRemainingSeconds();
  if (remainingSeconds.value > 0) {
    countdownTimerId.value = setInterval(updateRemainingSeconds, 1000);
  }

  if (!md5) {
    statusCheckError.value = 'Unable to monitor payment status (missing transaction hash).';
    return;
  }

  const poll = async () => {
    if (paymentStatus.value === 'PAID') {
      return;
    }

    if (remainingSeconds.value <= 0) {
      stopPolling();
      return;
    }

    isPollingStatus.value = true;
    try {
      const result = await checkBakongPaymentStatus(md5);
      lastStatusResult.value = result;
      statusCheckError.value = null;
      paymentStatus.value = result.status;

      if (result.status === 'PAID') {
        updateRemainingSeconds();
        stopPolling();
        stopCountdown();
      }
    } catch (error) {
      statusCheckError.value =
        error instanceof Error ? error.message : 'Unable to check Bakong payment status. Please try again.';
    } finally {
      isPollingStatus.value = false;
    }
  };

  void poll();
  pollingTimerId.value = setInterval(() => {
    void poll();
  }, POLL_INTERVAL_MS);
};

const isQrExpired = computed(() => remainingSeconds.value <= 0 && !!checkoutDetails.value);

const countdownLabel = computed(() => {
  if (!checkoutDetails.value) {
    return 'Preparing payment...';
  }

  if (remainingSeconds.value <= 0) {
    return 'QR expired';
  }

  const minutes = Math.floor(remainingSeconds.value / 60);
  const seconds = remainingSeconds.value % 60;
  return `QR valid for ${minutes}:${seconds.toString().padStart(2, '0')}`;
});

const statusLabelClass = computed(() => {
  if (paymentStatus.value === 'PAID') {
    return 'text-emerald-600';
  }
  if (isQrExpired.value) {
    return 'text-red-500';
  }
  if (statusCheckError.value) {
    return 'text-amber-500';
  }
  return 'text-slate-600';
});

const statusLabel = computed(() => {
  if (paymentStatus.value === 'PAID') {
    return 'Payment received.';
  }
  if (isQrExpired.value) {
    return 'QR expired';
  }
  if (statusCheckError.value) {
    return statusCheckError.value;
  }
  if (isPollingStatus.value) {
    return 'Checking payment status...';
  }
  return 'Waiting for payment...';
});

const transactionHash = computed(() => checkoutDetails.value?.md5 ?? null);

const lastCheckedLabel = computed(() => {
  if (!lastStatusResult.value) {
    return null;
  }

  try {
    const formatted = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(lastStatusResult.value.checkedAt));
    return `Last checked ${formatted}`;
  } catch {
    return null;
  }
});

const highlightedPlanId = computed(() => selectedPlanId.value ?? planIdFromQuery.value ?? null);
const selectedPlan = computed(() => (selectedPlanId.value ? planMap.get(selectedPlanId.value) ?? null : null));

const syncPlanQuery = (planId: string | null) => {
  const current = planIdFromQuery.value;
  if (planId === current) {
    return;
  }
  const newQuery = { ...route.query } as Record<string, string | string[]>;
  if (planId) {
    newQuery.plan = planId;
  } else {
    delete newQuery.plan;
  }
  router.replace({ query: newQuery });
};

const openPaymentModal = (planId: string) => {
  resetPaymentTracking();
  selectedPlanId.value = planId;
  checkoutDetails.value = null;
  paymentError.value = null;
  isPaymentModalOpen.value = true;
  syncPlanQuery(planId);
};

const closeAllModals = () => {
  isPaymentModalOpen.value = false;
  isQrModalOpen.value = false;
  resetPaymentTracking();
  checkoutDetails.value = null;
  paymentError.value = null;
  selectedPlanId.value = null;
  syncPlanQuery(null);
};

const closePaymentModal = () => {
  isPaymentModalOpen.value = false;
  if (!isQrModalOpen.value) {
    closeAllModals();
  }
};

const closeQrModal = () => {
  closeAllModals();
};

watchEffect(() => {
  const targetPlan = planIdFromQuery.value;
  if (!targetPlan) {
    return;
  }

  const matchedAudience = planAudienceMap.get(targetPlan);
  if (matchedAudience && audience.value !== matchedAudience) {
    audience.value = matchedAudience;
  }

  if (isAuthenticated.value && !isPaymentModalOpen.value && !isQrModalOpen.value) {
    openPaymentModal(targetPlan);
  }
});

watch(checkoutDetails, (details) => {
  if (details) {
    startPaymentTracking(details);
  } else {
    resetPaymentTracking();
  }
});

watch(isQrModalOpen, (open) => {
  if (!open) {
    resetPaymentTracking();
  }
});

watch(paymentStatus, (status) => {
  if (status === 'PAID' && !hasShownPaidAlert.value) {
    hasShownPaidAlert.value = true;
    void Swal.fire({
      icon: 'success',
      title: 'Thank you!',
      text: 'We received your payment successfully.',
      confirmButtonText: 'Continue',
    });
  }
});

onBeforeUnmount(() => {
  resetPaymentTracking();
});

const selectAudience = (value: AudienceKey) => {
  audience.value = value;
};

const handleGetStarted = (planId: string) => {
  if (!isAuthenticated.value) {
    router.push({ name: 'login', query: { redirect: '/plans', plan: planId } });
    return;
  }
  openPaymentModal(planId);
};

const requestCheckout = async () => {
  const plan = selectedPlan.value;
  if (!plan) {
    return;
  }

  resetPaymentTracking();
  checkoutDetails.value = null;
  isGeneratingCheckout.value = true;
  paymentError.value = null;

  try {
    checkoutDetails.value = await generateCheckoutDetails({
      planId: plan.id,
      amount: plan.amount,
      currency: plan.currency,
    });
    isPaymentModalOpen.value = false;
    isQrModalOpen.value = true;
  } catch (error) {
    if (error instanceof Error) {
      paymentError.value = error.message;
    } else {
      paymentError.value = 'Unable to prepare payment right now. Please try again.';
    }
  } finally {
    isGeneratingCheckout.value = false;
  }
};

const continueToCheckout = () => {
  // No action needed, user should scan the QR code
};
</script>

<template>
  <section class="relative overflow-hidden bg-black text-slate-100">
    <div
      class="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(9,107,159,0.2),_transparent_60%),radial-gradient(circle_at_center,_rgba(9,107,159,0.15),_transparent_55%)]"
    ></div>
    <div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
      <header class="text-center">
        <p class="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">Pricing</p>
        <h1 class="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
          Choose Your Perfect Plan
        </h1>
        <p class="mx-auto mt-4 max-w-2xl text-base text-slate-300">
          Select the ideal package that fits your automation needs and scale your success. Local and international teams
          get tailored bundles with generous freebies and dedicated support.
        </p>
        <div class="mx-auto mt-8 inline-flex rounded-full border border-emerald-400/40 bg-slate-900/60 p-1">
          <button
            type="button"
            class="rounded-full px-6 py-2 text-sm font-semibold transition"
            :class="audience === 'local' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'"
            @click="selectAudience('local')"
          >
            Local
          </button>
          <button
            type="button"
            class="rounded-full px-6 py-2 text-sm font-semibold transition"
            :class="audience === 'foreigner' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'"
            @click="selectAudience('foreigner')"
          >
            Foreigner
          </button>
        </div>
      </header>

      <div class="grid gap-8 md:grid-cols-3">
        <article
          v-for="plan in activePlans"
          :key="plan.id"
          class="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-slate-900/80 bg-slate-900/60 p-8 shadow-[0_35px_90px_rgba(8,47,73,0.35)] transition hover:border-[#096b9f]/50 hover:shadow-[0_45px_130px_rgba(9,107,159,0.35)]"
          :class="[
            plan.highlight ? 'border-[#096b9f] bg-[rgba(9,107,159,0.18)] backdrop-blur' : '',
            highlightedPlanId === plan.id ? 'ring-2 ring-[#23bdee]' : '',
          ]"
        >
          <div
            v-if="plan.highlight"
            class="absolute left-1/2 top-6 -translate-x-1/2 rounded-full border border-[#23bdee]/40 bg-[#23bdee]/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#c6f3ff]"
          >
            Most Popular
          </div>
          <div class="mt-6 flex flex-col gap-4 text-center">
            <h2 class="text-2xl font-semibold text-white">{{ plan.name }}</h2>
            <div class="text-4xl font-bold text-white">
              {{ formatPrice(plan.amount, plan.currency) }}
              <span class="text-base font-medium text-slate-300">{{ plan.cadence }}</span>
            </div>
            <p v-if="plan.tagline" class="text-sm font-medium text-[#6ee7ff]">
              {{ plan.tagline }}
            </p>
          </div>
          <ul class="mt-8 flex-1 space-y-3 text-sm text-slate-200">
            <li
              v-for="feature in plan.features"
              :key="feature"
              class="flex items-start gap-3 rounded-2xl bg-slate-900/60 px-4 py-3 text-left transition group-hover:bg-slate-900/80"
            >
              <span class="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#096b9f]/30 text-[#23bdee]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 20 20">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l3 3 7-7" />
                </svg>
              </span>
              <span>{{ feature }}</span>
            </li>
          </ul>
          <button
            type="button"
            class="mt-10 w-full rounded-full bg-[#096b9f] px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-[#0c86c3]"
            @click="handleGetStarted(plan.id)"
          >
            Get Started
          </button>
        </article>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="isPaymentModalOpen" class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div class="absolute inset-0 bg-slate-950/75 backdrop-blur" @click="closePaymentModal"></div>
        <div
          class="relative w-full max-w-lg rounded-[2.5rem] border border-slate-800 bg-[#081226] px-10 py-12 text-slate-100 shadow-[0_40px_120px_rgba(8,18,38,0.65)]"
        >
          <button
            type="button"
            class="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-400 transition hover:text-white"
            aria-label="Close payment modal"
            @click="closePaymentModal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <header class="text-center">
            <p class="text-xs font-semibold uppercase tracking-[0.4em] text-[#23bdee]">Choose Payment Method</p>
            <h2 class="mt-4 text-2xl font-semibold text-white">Select your preferred payment method to complete the purchase.</h2>
          </header>
          <div
            v-if="selectedPlan"
            class="mt-8 rounded-[1.5rem] border border-[#23bdee]/30 bg-slate-900/70 px-6 py-6 text-center shadow-inner shadow-[#23bdee]/10"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.45em] text-[#23bdee]">{{ selectedPlan.name }}</p>
            <p class="mt-4 text-4xl font-bold text-white">{{ formatPrice(selectedPlan.amount, selectedPlan.currency) }}</p>
            <p class="text-sm text-slate-400">{{ selectedPlan.cadence }}</p>
          </div>
          <p v-if="paymentError" class="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {{ paymentError }}
          </p>
          <button
            type="button"
              class="mt-10 flex w-full items-center justify-center gap-3 rounded-full bg-[#23bdee]/20 px-6 py-4 text-base font-semibold text-[#23bdee] transition hover:bg-[#23bdee]/30 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isGeneratingCheckout"
            @click="requestCheckout"
          >
            <span
              class="inline-flex items-center rounded-full bg-[#23bdee] px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#081226]"
            >
              PAY
            </span>
            {{ isGeneratingCheckout ? 'Preparing payment...' : 'Pay with Bakong KHQR' }}
          </button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="isQrModalOpen && selectedPlan && checkoutDetails"
        class="fixed inset-0 z-50 flex items-center justify-center px-4"
      >
        <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" @click="closeQrModal"></div>
        <div
          class="relative w-full max-w-md rounded-[2.75rem] border border-[#23bdee]/40 bg-white px-8 py-10 text-slate-900 shadow-[0_35px_120px_rgba(8,47,73,0.45)]"
        >
          <button
            type="button"
            class="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:text-slate-600"
            aria-label="Close QR modal"
            @click="closeQrModal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div class="text-center">
            <h2 class="text-4xl font-bold text-red-600 mb-2">KHQR</h2>
            <p class="text-xl font-semibold text-slate-900">{{ formatPrice(selectedPlan.amount, selectedPlan.currency) }}</p>
          </div>
          
          <div class="mt-6 text-center">
            <div class="mx-auto h-16 mb-4 bg-blue-500 text-white flex items-center justify-center rounded-lg">
              KHQR
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-4">{{ merchantName }}</h3>
          </div>

          <div class="mt-4">
            <div class="relative bg-white p-6 rounded-lg shadow-lg">
              <img 
                :src="checkoutDetails.qrCode" 
                alt="Bakong KHQR code" 
                class="mx-auto w-full"
              />
              <div class="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div class="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">$</div>
              </div>
            </div>
          </div>

          <div class="mt-8 text-center">
            <h3 class="text-xl font-bold text-slate-900 mb-2">{{ merchantName }}</h3>
            <p class="text-sm text-slate-500">{{ countdownLabel }}</p>
            <p class="text-sm font-medium mt-2" :class="statusLabelClass">{{ statusLabel }}</p>
            <p v-if="lastCheckedLabel" class="mt-1 text-xs text-slate-400">
              {{ lastCheckedLabel }}
            </p>
            <p v-if="transactionHash" class="mt-2 text-xs text-slate-400 break-all">
              Transaction hash: {{ transactionHash }}
            </p>
          </div>
          <button
            type="button"
            class="mt-8 w-full rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] transition"
            :class="paymentStatus === 'PAID'
              ? 'bg-emerald-500 text-white hover:bg-emerald-400'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'"
            :disabled="paymentStatus !== 'PAID'"
            @click="continueToCheckout"
          >
            {{ paymentStatus === 'PAID' ? 'Continue to this plan checkout' : 'Waiting for payment confirmation' }}
          </button>
        </div>
      </div>
    </Teleport>
  </section>
</template>
