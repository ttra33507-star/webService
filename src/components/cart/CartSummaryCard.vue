<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CartSummary } from '../../services/cartService';

const { locale, t } = useI18n({ useScope: 'global' });

const props = defineProps<{
  summary: CartSummary;
}>();

const formatCurrency = (value: number) =>
  new Intl.NumberFormat(locale.value === 'km' ? 'km-KH' : 'en-US', {
    style: 'currency',
    currency: props.summary.currency,
    minimumFractionDigits: 2,
  }).format(value);

const rows = computed(() => {
  void locale.value;
  return [
    { id: 'subtotal', label: t('cart.summary.subtotal'), value: props.summary.subtotal },
    { id: 'discount', label: t('cart.summary.discount'), value: -Math.abs(props.summary.discount) },
    { id: 'tax', label: t('cart.summary.tax'), value: props.summary.tax },
  ];
});
</script>

<template>
  <div data-aos="fade-left" class="rounded-2xl border border-emerald-500/30 bg-white/80 p-6 shadow-emerald-500/10 shadow-xl">
    <h2 class="text-lg font-semibold text-slate-800">{{ t('cart.summary.title') }}</h2>
    <dl class="mt-4 space-y-3 text-sm text-slate-600">
      <div v-for="row in rows" :key="row.id" class="flex items-center justify-between">
        <dt>{{ row.label }}</dt>
        <dd :class="row.value < 0 ? 'text-emerald-300' : undefined">
          {{ formatCurrency(row.value) }}
        </dd>
      </div>
      <div class="flex items-center justify-between border-t border-emerald-500/30 pt-4 text-base font-semibold text-slate-800">
        <dt>{{ t('cart.summary.total') }}</dt>
        <dd>{{ formatCurrency(summary.total) }}</dd>
      </div>
    </dl>
    <button
      type="button"
      class="mt-6 w-full rounded-full bg-emerald-500 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-emerald-400"
    >
      {{ t('cart.summary.proceed') }}
    </button>
  </div>
</template>
