<script setup lang="ts">
import AOS from 'aos';
import { computed, nextTick, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import CartItemsTable from '../components/cart/CartItemsTable.vue';
import CartSummaryCard from '../components/cart/CartSummaryCard.vue';
import { fetchCart, type CartData } from '../services/cartService';

const { t } = useI18n({ useScope: 'global' });

const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const cart = ref<CartData | null>(null);

const hasItems = computed(() => (cart.value?.items.length ?? 0) > 0);

const loadCart = async () => {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    cart.value = await fetchCart();
  } catch (error) {
    if (error instanceof Error) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = t('cart.errors.loadFailed');
    }
  } finally {
    isLoading.value = false;
    await nextTick();
    try {
      AOS.refreshHard();
    } catch {
      // ignore if AOS not initialized (e.g. reduced motion)
    }
  }
};

const refresh = () => {
  if (!isLoading.value) {
    loadCart();
  }
};

onMounted(() => {
  loadCart();
});
</script>

<template>
  <section class="border-y border-slate-900/80 bg-white/60">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span class="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase  text-emerald-200">
            {{ t('cart.badge') }}
          </span>
          <h1 class="mt-4 text-3xl font-semibold text-slate-800 sm:text-4xl font-display">
            {{ t('cart.title') }}
          </h1>
          <p class="mt-3 max-w-xl text-sm text-slate-800">
            {{ t('cart.description') }}
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-white/70 px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-emerald-400/60 hover:text-slate-800"
          :disabled="isLoading"
          @click="refresh"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9M20 20v-5h-.581m-15.357-2a8.003 8.003 0 0015.357 2" />
          </svg>
          {{ isLoading ? t('cart.refreshing') : t('cart.refresh') }}
        </button>
      </div>

      <div v-if="isLoading" class="flex flex-col gap-6">
        <div class="h-64 animate-pulse rounded-2xl bg-white/50"></div>
        <div class="h-48 animate-pulse rounded-2xl bg-white/50 lg:w-80"></div>
      </div>

      <div v-else-if="errorMessage" data-aos="fade-up" class="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-5 text-sm text-red-200">
        {{ errorMessage }}
      </div>

      <div v-else-if="hasItems" class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <CartItemsTable :items="cart!.items" :currency="cart!.summary.currency" />
        <CartSummaryCard :summary="cart!.summary" />
      </div>

      <div v-else data-aos="fade-up" class="rounded-2xl border border-slate-900/80 bg-white/40 px-6 py-12 text-center text-sm text-slate-600">
        <p>{{ t('cart.empty.title') }}</p>
        <p class="mt-2">
          {{ t('cart.empty.ctaPrefix') }}
          <RouterLink to="/" class="text-emerald-300 underline hover:text-emerald-200">
            {{ t('cart.empty.homeLink') }}
          </RouterLink>
          {{ t('cart.empty.ctaSuffix') }}
        </p>
      </div>
    </div>
  </section>
</template>
