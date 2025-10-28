<script setup lang="ts">
import { computed } from 'vue';
import type { CartSummary } from '../../services/cartService';

const props = defineProps<{
  summary: CartSummary;
}>();

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: props.summary.currency,
    minimumFractionDigits: 2,
  }).format(value);

const rows = computed(() => [
  { label: 'Subtotal', value: props.summary.subtotal },
  { label: 'Discount', value: -Math.abs(props.summary.discount) },
  { label: 'Tax', value: props.summary.tax },
]);
</script>

<template>
  <div class="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-6 shadow-emerald-500/10 shadow-xl">
    <h2 class="text-lg font-semibold text-white">Order summary</h2>
    <dl class="mt-4 space-y-3 text-sm text-slate-300">
      <div v-for="row in rows" :key="row.label" class="flex items-center justify-between">
        <dt>{{ row.label }}</dt>
        <dd :class="row.value < 0 ? 'text-emerald-300' : undefined">
          {{ formatCurrency(row.value) }}
        </dd>
      </div>
      <div class="flex items-center justify-between border-t border-emerald-500/30 pt-4 text-base font-semibold text-white">
        <dt>Total</dt>
        <dd>{{ formatCurrency(summary.total) }}</dd>
      </div>
    </dl>
    <button
      type="button"
      class="mt-6 w-full rounded-full bg-emerald-500 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-emerald-400"
    >
      Proceed to checkout
    </button>
  </div>
</template>
