<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import CartItemsTable from '../components/cart/CartItemsTable.vue';
import CartSummaryCard from '../components/cart/CartSummaryCard.vue';
import { fetchCart, type CartData } from '../services/cartService';

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
      errorMessage.value = 'Unable to load the cart right now. Please try again shortly.';
    }
  } finally {
    isLoading.value = false;
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
  <section class="border-y border-slate-900/80 bg-slate-950/60">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span class="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200">
            Manage orders
          </span>
          <h1 class="mt-4 text-3xl font-semibold text-white sm:text-4xl font-display">
            Cart overview
          </h1>
          <p class="mt-3 max-w-xl text-sm text-slate-400">
            Review every item currently queued for checkout. Connected directly to the live API so you can monitor quantities, pricing, and order totals in real time.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400/60 hover:text-white"
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
          {{ isLoading ? 'Refreshing...' : 'Refresh cart' }}
        </button>
      </div>

      <div v-if="isLoading" class="flex flex-col gap-6">
        <div class="h-64 animate-pulse rounded-2xl bg-slate-900/50"></div>
        <div class="h-48 animate-pulse rounded-2xl bg-slate-900/50 lg:w-80"></div>
      </div>

      <div v-else-if="errorMessage" class="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-5 text-sm text-red-200">
        {{ errorMessage }}
      </div>

      <div v-else-if="hasItems" class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <CartItemsTable :items="cart!.items" :currency="cart!.summary.currency" />
        <CartSummaryCard :summary="cart!.summary" />
      </div>

      <div v-else class="rounded-2xl border border-slate-900/80 bg-slate-900/40 px-6 py-12 text-center text-sm text-slate-300">
        <p>No items are currently in the cart.</p>
        <p class="mt-2">
          Head back to the <a href="/" class="text-emerald-300 underline hover:text-emerald-200">home page</a> to add products.
        </p>
      </div>
    </div>
  </section>
</template>
