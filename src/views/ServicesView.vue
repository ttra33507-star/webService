<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { fetchServiceCatalog, groupServicesByMainCategory } from '../services/catalogService';
import type { ServiceCategoryGroup, ServiceRecord } from '../types/service';

const services = ref<ServiceRecord[]>([]);
const isLoading = ref(true);
const isRefreshing = ref(false);
const errorMessage = ref<string | null>(null);
const lastFetchedAt = ref<number | null>(null);

const route = useRoute();
const fallbackIcon = '/images/logo-C4-HUB.png';
const fallbackServiceIcon = '/images/logo-C4-HUB.png';
const highlightedServiceId = ref<number | null>(null);

const extractHighlightId = (value: unknown): number | null => {
  if (Array.isArray(value)) {
    return extractHighlightId(value[0]);
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const syncHighlightFromRoute = () => {
  highlightedServiceId.value = extractHighlightId(route.query.highlight ?? null);
};

const scrollToHighlightedCard = () => {
  if (!highlightedServiceId.value) {
    return;
  }
  nextTick(() => {
    const target = document.getElementById(`service-${highlightedServiceId.value}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
};

const loadServices = async (force = false) => {
  errorMessage.value = null;
  try {
    const data = await fetchServiceCatalog({ force });
    services.value = data;
    lastFetchedAt.value = Date.now();
  } catch (error) {
    console.error('[Services] Failed to load catalog', error);
    errorMessage.value = 'Unable to load services right now. Please try again in a moment.';
  } finally {
    isLoading.value = false;
    isRefreshing.value = false;
  }
};

const handleRefresh = () => {
  isRefreshing.value = true;
  return loadServices(true);
};

const handleRetry = () => {
  if (services.value.length) {
    return handleRefresh();
  }
  isLoading.value = true;
  return loadServices(true);
};

const categoryGroups = computed<ServiceCategoryGroup[]>(() => groupServicesByMainCategory(services.value));
const totalServices = computed(() => services.value.length);
const totalCategories = computed(() => categoryGroups.value.length);

const lastUpdatedDisplay = computed(() => {
  if (!lastFetchedAt.value) {
    return 'Awaiting sync';
  }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(lastFetchedAt.value);
});

const getIconForGroup = (group: ServiceCategoryGroup) => group.icon || fallbackIcon;
const getIconForService = (service: ServiceRecord) =>
  service.iconUrl || service.mainCategory.icon || fallbackServiceIcon;
const getServiceInitial = (service: ServiceRecord) => {
  const source = service.label || service.name || service.mainCategory.label;
  return source.trim().slice(0, 2).toUpperCase();
};

watch(
  () => route.query.highlight,
  () => {
    syncHighlightFromRoute();
    scrollToHighlightedCard();
  },
  { immediate: true },
);

watch(services, () => {
  if (highlightedServiceId.value) {
    scrollToHighlightedCard();
  }
});

onMounted(() => {
  loadServices();
});
</script>

<template>
  <div class="bg-slate-950 text-slate-100">
    <section class="border-b border-slate-900/80 bg-gradient-to-b from-slate-950 via-slate-950/80 to-[#050b1b]">
      <div class="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <div class="flex-1 space-y-6">
          <p class="text-xs font-semibold uppercase tracking-[0.55em] text-emerald-300">Services Catalog</p>
          <div>
            <h1 class="font-display text-4xl font-semibold text-white sm:text-5xl">Automation services built for scale.</h1>
            <p class="mt-4 text-lg text-slate-300 sm:text-xl">
              Browse every ready-to-deploy module spanning Facebook, Telegram, TikTok, and more. Pricing is transparent and every offer can be bundled into your next checkout.
            </p>
          </div>
          <div class="flex flex-wrap gap-4">
            <RouterLink
              to="/plans"
              class="inline-flex items-center justify-center rounded-full border border-emerald-400/50 px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-200 transition hover:border-emerald-300 hover:text-white"
            >
              View subscription plans
            </RouterLink>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full border border-slate-800/80 px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-slate-300 transition hover:border-slate-600 hover:text-white"
              :disabled="isRefreshing"
              @click="handleRefresh"
            >
              <span v-if="!isRefreshing">Sync catalog</span>
              <span v-else class="inline-flex items-center gap-2">
                <svg class="h-4 w-4 animate-spin text-emerald-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Refreshing
              </span>
            </button>
          </div>
        </div>
        <div class="flex w-full flex-1 flex-col gap-4 rounded-[2.5rem] border border-slate-800/70 bg-[#050d22] p-6 shadow-[0_45px_120px_rgba(4,12,32,0.85)]">
          <div class="flex items-center justify-between rounded-3xl border border-slate-800/80 bg-slate-900/60 p-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.45em] text-slate-400">Services</p>
              <p class="mt-2 text-3xl font-semibold text-white">{{ totalServices }}</p>
            </div>
            <div class="text-right">
              <p class="text-xs font-semibold uppercase tracking-[0.45em] text-slate-400">Categories</p>
              <p class="mt-2 text-3xl font-semibold text-white">{{ totalCategories }}</p>
            </div>
          </div>
          <div class="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-5 text-emerald-100">
            <p class="text-xs font-semibold uppercase tracking-[0.45em] text-emerald-300">Last synced</p>
            <p class="mt-2 text-lg font-semibold text-white">{{ lastUpdatedDisplay }}</p>
            <p class="mt-1 text-sm text-emerald-200/70">Powered by api.c4techhub.com/services</p>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div v-if="errorMessage" class="rounded-[2.5rem] border border-red-400/30 bg-red-500/10 p-6 text-red-100">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-lg font-semibold text-white">We hit a snag syncing services.</p>
            <p class="text-sm text-red-100/80">{{ errorMessage }}</p>
          </div>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-red-400/40 px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-red-100 transition hover:border-red-300 hover:text-white"
            @click="handleRetry"
          >
            Try again
          </button>
        </div>
      </div>

      <div v-else>
        <div v-if="isLoading" class="grid gap-6 sm:grid-cols-2">
          <div v-for="index in 4" :key="`skeleton-${index}`" class="animate-pulse rounded-3xl border border-slate-900/80 bg-slate-900/40 p-6">
            <div class="flex items-center gap-4">
              <div class="h-12 w-12 rounded-2xl bg-slate-800"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 w-1/2 rounded bg-slate-800"></div>
                <div class="h-3 w-2/3 rounded bg-slate-800/70"></div>
              </div>
            </div>
            <div class="mt-6 space-y-2">
              <div class="h-3 w-full rounded bg-slate-800/70"></div>
              <div class="h-3 w-3/4 rounded bg-slate-800/60"></div>
              <div class="h-3 w-2/3 rounded bg-slate-800/60"></div>
            </div>
            <div class="mt-6 h-10 w-1/3 rounded-full bg-slate-800"></div>
          </div>
        </div>

        <div v-else-if="!categoryGroups.length" class="rounded-[2.5rem] border border-slate-900/80 bg-slate-900/30 p-10 text-center">
          <p class="text-lg font-semibold text-white">No services available yet.</p>
          <p class="mt-2 text-sm text-slate-400">Once catalog data is published, it will appear here automatically.</p>
        </div>

        <div v-else class="space-y-16">
          <section v-for="group in categoryGroups" :key="group.id" aria-live="polite">
            <header class="flex flex-wrap items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <span class="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/80 p-2">
                  <img :src="getIconForGroup(group)" :alt="`${group.label} icon`" class="h-full w-full object-contain" />
                </span>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Main category</p>
                  <h2 class="text-2xl font-semibold text-white">{{ group.label }}</h2>
                  <p class="text-sm text-slate-400">{{ group.services.length }} active services</p>
                </div>
              </div>
            </header>
            <div class="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <article
                v-for="service in group.services"
                :key="service.id"
                :id="`service-${service.id}`"
                class="group flex h-full flex-col rounded-[2.25rem] border border-slate-900/70 bg-gradient-to-br from-slate-950/80 via-slate-950/60 to-slate-950/40 p-6 shadow-lg transition hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-glow"
                :class="highlightedServiceId === service.id ? 'border-emerald-400/70 shadow-glow' : ''"
              >
                <div class="flex items-start gap-4">
                  <div class="relative">
                    <span
                      class="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800/60 bg-gradient-to-br from-emerald-500/15 via-slate-950/80 to-slate-950 text-lg font-semibold text-white shadow-inner shadow-emerald-500/10"
                    >
                      <img
                        v-if="service.iconUrl"
                        :src="getIconForService(service)"
                        :alt="`${service.label} icon`"
                        class="h-full w-full rounded-2xl object-cover"
                      />
                      <span v-else class="tracking-[0.3em]">{{ getServiceInitial(service) }}</span>
                    </span>
                    <span
                      class="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-[10px] font-semibold text-emerald-300 shadow"
                    >
                      {{ service.category.label.split(' ')[0] }}
                    </span>
                  </div>
                  <div class="space-y-1">
                    <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-200">{{ service.category.label }}</p>
                    <h3 class="text-xl font-semibold leading-snug text-white">{{ service.label }}</h3>
                    <p class="text-xs text-slate-400">{{ service.name }}</p>
                  </div>
                  <div class="ml-auto text-right">
                    <p class="text-[11px] uppercase tracking-[0.3em] text-slate-400">From</p>
                    <p class="text-2xl font-semibold text-white">{{ service.price.formatted }}</p>
                    <p class="text-[11px] text-slate-500">Qty {{ service.defaultQuantity }}</p>
                  </div>
                </div>
                <div class="mt-5 rounded-2xl border border-slate-900/70 bg-slate-950/50 p-4 text-sm text-slate-300 shadow-inner">
                  <p>{{ service.name }}</p>
                </div>
                <div class="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-200">
                  <span class="rounded-full border border-slate-800/80 px-3 py-1">Instant</span>
                  <span class="rounded-full border border-slate-800/80 px-3 py-1">API ready</span>
                  <span class="rounded-full border border-slate-800/80 px-3 py-1">24/7 ops</span>
                </div>
                <RouterLink
                  class="mt-6 inline-flex items-center justify-center rounded-full border border-emerald-400/40 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-200 transition hover:border-emerald-300 hover:text-white"
                  :to="{ name: 'plans', query: { service: service.id.toString() } }"
                >
                  Order now
                </RouterLink>
              </article>
            </div>
          </section>
        </div>
      </div>
    </section>
  </div>
</template>
