<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { fetchServiceCatalog, groupServicesByMainCategory } from '../services/catalogService';
import type { ServiceCategoryGroup, ServiceRecord } from '../types/service';

const services = ref<ServiceRecord[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const lastFetchedAt = ref<number | null>(null);

const route = useRoute();
const fallbackIcon = '/images/logo C4 TECH HUB 1.png';
const fallbackServiceIcon = '/images/logo C4 TECH HUB 1.png';
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
  }
};

const handleRetry = () => {
  if (!services.value.length) {
    isLoading.value = true;
  }
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
  <div class="bg-white text-slate-900">
    <section class="border-b border-white bg-white from-slate-950 via-slate-950/80 to-[#050b1b]">
      <div class="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <div class="flex-1 space-y-6">
          <p class="text-xs font-semibold uppercase  text-[#0c86c3]">Services Catalog</p>
          <div>
            <h1 class="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">Automation services built for scale.</h1>
            <p class="mt-4 text-lg text-slate-600 sm:text-xl">
              Browse every ready-to-deploy module spanning Facebook, Telegram, TikTok, and more. Pricing is transparent and every offer can be bundled into your next checkout.
            </p>
          </div>
        </div>
        <div class="flex w-full flex-1 flex-col gap-4 rounded-[2.5rem] border border-slate-800/70 bg-white p-6 shadow-[0_45px_120px_rgba(4,12,32,0.85)]">
          <div class="flex items-center justify-between rounded-3xl border border-slate-800/80 bg-white/60 p-4">
            <div>
              <p class="text-xs font-semibold uppercase  text-slate-500">Services</p>
              <p class="mt-2 text-3xl font-semibold text-slate-900">{{ totalServices }}</p>
            </div>
            <div class="text-right">
              <p class="text-xs font-semibold uppercase  text-slate-500">Categories</p>
              <p class="mt-2 text-3xl font-semibold text-slate-900">{{ totalCategories }}</p>
            </div>
          </div>
          <div class="rounded-3xl border border-[#096b9f]/25 bg-[#096b9f]/5 p-5 text-[#0c86c3]/80">
            <p class="text-xs font-semibold uppercase  text-[#0c86c3]">Last synced</p>
            <p class="mt-2 text-lg font-semibold text-slate-900">{{ lastUpdatedDisplay }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div v-if="errorMessage" class="rounded-[2.5rem] border border-red-400/30 bg-red-500/10 p-6 text-red-100">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-lg font-semibold text-slate-900">We hit a snag syncing services.</p>
            <p class="text-sm text-red-100/80">{{ errorMessage }}</p>
          </div>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-red-400/40 px-6 py-3 text-sm font-semibold uppercase  text-red-100 transition hover:border-red-300 hover:text-slate-900"
            @click="handleRetry"
          >
            Try again
          </button>
        </div>
      </div>

      <div v-else>
        <div v-if="isLoading" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="index in 4" :key="`skeleton-${index}`" class="animate-pulse rounded-3xl border border-slate-900/80 bg-white/40 p-6">
            <div class="flex items-center gap-4">
              <div class="h-12 w-12 rounded-2xl bg-white"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 w-1/2 rounded bg-white"></div>
                <div class="h-3 w-2/3 rounded bg-white/70"></div>
              </div>
            </div>
            <div class="mt-6 space-y-2">
              <div class="h-3 w-full rounded bg-white/70"></div>
              <div class="h-3 w-3/4 rounded bg-white/60"></div>
              <div class="h-3 w-2/3 rounded bg-white/60"></div>
            </div>
            <div class="mt-6 h-10 w-1/3 rounded-full bg-white"></div>
          </div>
        </div>

        <div v-else-if="!categoryGroups.length" class="rounded-[2.5rem] border border-slate-900/80 bg-white/30 p-10 text-center">
          <p class="text-lg font-semibold text-slate-900">No services available yet.</p>
          <p class="mt-2 text-sm text-slate-500">Once catalog data is published, it will appear here automatically.</p>
        </div>

        <div v-else class="space-y-16">
          <section v-for="group in categoryGroups" :key="group.id" aria-live="polite">
            <header class="flex flex-wrap items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <span class="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800/80 bg-white/80 p-2">
                  <img :src="getIconForGroup(group)" :alt="`${group.label} icon`" class="h-full w-full object-contain" />
                </span>
                <div>
                  <h2 class="text-2xl font-semibold text-slate-900">{{ group.label }}</h2>
                </div>
              </div>
            </header>
            <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <article
                v-for="service in group.services"
                :key="service.id"
                :id="`service-${service.id}`"
                tabindex="0"
                class="group relative overflow-hidden rounded-2xl border border-slate-900/80 bg-white/50 shadow-lg transition hover:border-[#096b9f]/40 hover:shadow-glow focus:border-[#096b9f]/40 focus:shadow-glow focus:outline-none"
                :class="highlightedServiceId === service.id ? 'border-[#0c86c3]/60 shadow-glow' : ''"
              >
                <div class="relative h-48 overflow-hidden">
                  <img
                    :src="getIconForService(service)"
                    :alt="`${service.label} visual`"
                    class="h-full w-full object-cover transition duration-500 group-hover:scale-110 group-focus-within:scale-110"
                  />
                  <div class="absolute inset-0 bg-white from-slate-950 via-slate-950/40 to-transparent opacity-70 transition duration-300 group-hover:opacity-60 group-focus-within:opacity-60" />
                </div>
                <div class="relative space-y-4 p-6 transition duration-300 group-hover:translate-y-4 group-hover:opacity-0 group-focus-within:translate-y-4 group-focus-within:opacity-0">
                  <div>
                    <h3 class="text-lg font-semibold text-slate-900">{{ service.label }}</h3>
                    <p class="mt-2 text-sm text-slate-900">
                      {{ service.mainCategory.label }} at {{ service.category.label }}
                    </p>
                  </div>
                  <div class="flex items-center justify-between text-sm text-slate-600">
                    <p>Default qty {{ service.defaultQuantity }} · {{ service.price.formatted }}</p>
                  </div>
                </div>
                <div
                  class="pointer-events-none absolute inset-4 flex flex-col gap-4 rounded-2xl border border-[#096b9f]/25 bg-white/95 px-6 py-8 text-center opacity-0 shadow-glow transition-all duration-300 ease-out backdrop-blur-md group-hover:pointer-events-auto group-hover:-translate-y-1 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:-translate-y-1 group-focus-within:opacity-100"
                >
                  <span class="self-center rounded-full border border-[#096b9f]/35 bg-[#096b9f]/10 px-3 py-1 text-[11px] font-semibold uppercase text-[#096b9f]">
                    Quick view
                  </span>
                  <div class="space-y-2">
                    <h3 class="text-xl font-semibold text-slate-900">{{ service.label }}</h3>
                    <p class="text-sm leading-relaxed text-slate-600">
                      {{ service.description || service.name }}
                    </p>
                    <p class="text-sm font-semibold text-[#0c86c3]">{{ service.price.formatted }}</p>
                  </div>
                  <RouterLink
                    :to="{ name: 'service-order', params: { serviceId: service.id } }"
                    class="btn-order-glow"
                  >
                    Order Now
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </RouterLink>
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </section>
  </div>
</template>

