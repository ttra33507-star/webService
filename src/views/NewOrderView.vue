<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { isAxiosError } from 'axios';
import { useAuth } from '../composables/useAuth';
import { fetchCategoryById, fetchServiceCatalog } from '../services/catalogService';
import type { CategoryRecord, ServiceRecord } from '../types/service';
import { createOrder } from '../services/orderService';

type RouteParam = string | string[] | number | undefined;

const route = useRoute();
const router = useRouter();
const { isAuthenticated } = useAuth();

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

const requiresLink = computed<boolean>(() => {
  if (!categoryInfo.value) {
    return true;
  }
  return !categoryInfo.value.isTool;
});

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

const unitPriceDisplay = computed(() => formatCurrency(unitPriceValue.value));
const totalDisplay = computed(() => formatCurrency(estimateTotal.value));

const ensureAuthenticated = (): boolean => {
  if (isAuthenticated.value) {
    return true;
  }
  router.replace({
    name: 'login',
    query: { redirect: route.fullPath },
  });
  return false;
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

  const metadata =
    categoryInfo.value?.isTool === true
      ? { category_is_tool: true }
      : null;

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
    await createOrder({
      platform: service.value.mainCategory.label,
      mainCategory: String(service.value.mainCategory.id),
      category: service.value.category.label,
      category_is_tool: Boolean(categoryInfo.value?.isTool),
      service: service.value.label,
      link: trimmedLink || null,
      quantity: currentQuantity,
      remaining_quanity: currentQuantity,
      service_price: unitPrice,
      estimate_cost: estimateCost,
      currency: service.value.price.currency,
      items,
    });

    submitSuccess.value = 'Order placed successfully. Redirecting to your account...';
    if (redirectTimer) {
      clearTimeout(redirectTimer);
    }
    redirectTimer = setTimeout(() => {
      router.push({ name: 'account' });
    }, 1800);
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response?.status === 401) {
        submitError.value = 'Your session has expired. Please sign in again.';
        ensureAuthenticated();
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
    ensureAuthenticated();
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
          class="inline-flex items-center gap-2 text-sm font-semibold text-[#0c86c3] transition hover:text-[#0fa6ef]"
        >
          Back to services
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
          <dl class="mt-6 grid gap-4 sm:grid-cols-3">
            <div class="rounded-2xl border border-slate-800/80 bg-white/60 p-4">
              <dt class="text-[11px] uppercase tracking-[0.35em] text-slate-500">Platform</dt>
              <dd class="mt-2 text-lg font-semibold text-slate-900">{{ service.mainCategory.label }}</dd>
            </div>
            <div class="rounded-2xl border border-slate-800/80 bg-white/60 p-4">
              <dt class="text-[11px] uppercase tracking-[0.35em] text-slate-500">Category</dt>
              <dd class="mt-2 text-lg font-semibold text-slate-900">{{ service.category.label }}</dd>
            </div>
            <div class="rounded-2xl border border-slate-800/80 bg-white/60 p-4">
              <dt class="text-[11px] uppercase tracking-[0.35em] text-slate-500">Unit price</dt>
              <dd class="mt-2 text-lg font-semibold text-slate-900">{{ unitPriceDisplay }}</dd>
            </div>
          </dl>
        </header>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div class="grid gap-6 md:grid-cols-2">
            <label class="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Quantity
              <input
                v-model.number="quantity"
                type="number"
                min="1"
                step="1"
                class="rounded-2xl border border-slate-800 bg-white/70 px-4 py-3 text-slate-900 placeholder:text-slate-900 focus:border-[#0c86c3] focus:outline-none focus:ring-2 focus:ring-[#0c86c3]/40"
              />
              <span class="text-xs text-slate-500">Minimum of 1. Adjust to match the size of your order.</span>
              <span v-if="quantityError" class="text-xs text-red-300">{{ quantityError }}</span>
            </label>

            <label class="flex flex-col gap-2 text-sm font-medium text-slate-700">
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
          </div>

          <div class="rounded-[2rem] border border-[#0c86c3]/30 bg-[#0c86c3]/5 p-6 text-sm text-[#0c86c3]">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p class="text-[11px] uppercase tracking-[0.35em] text-[#0c86c3]">Estimated total</p>
                <p class="mt-2 text-2xl font-semibold text-slate-900">{{ totalDisplay }}</p>
              </div>
              <div>
                <p class="text-[11px] uppercase tracking-[0.35em] text-[#0c86c3]">Quantity</p>
                <p class="mt-2 text-2xl font-semibold text-slate-900">{{ normalizedQuantity }}</p>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <p
              v-if="submitError"
              class="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              {{ submitError }}
            </p>
            <p
              v-if="submitSuccess"
              class="rounded-2xl border border-[#0c86c3]/30 bg-[#0c86c3]/10 px-4 py-3 text-sm text-[#0c86c3]"
            >
              {{ submitSuccess }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              class="inline-flex items-center justify-center rounded-full bg-[#096b9f] px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-[#0fa6ef] disabled:cursor-not-allowed disabled:bg-white disabled:text-slate-500"
              :disabled="submitting"
            >
              {{ submitting ? 'Placing order...' : 'Place order' }}
            </button>
            <RouterLink
              to="/services"
              class="inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
            >
              Cancel
            </RouterLink>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>

