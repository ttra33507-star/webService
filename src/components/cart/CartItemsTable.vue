<script setup lang="ts">
import { computed } from 'vue';
import type { CartItem } from '../../services/cartService';

const props = defineProps<{
  items: CartItem[];
  currency?: string;
}>();

const currency = computed(
  () => props.currency ?? props.items.find((item) => item.currency)?.currency ?? 'USD',
);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.value,
    minimumFractionDigits: 2,
  }).format(value);

const rows = computed(() =>
  props.items.map((item) => ({
    ...item,
    lineTotal: item.price * item.quantity,
  })),
);
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-slate-900/80 bg-white/50 shadow-lg">
    <table class="min-w-full divide-y divide-slate-800">
      <thead class="bg-white/70 text-left text-xs font-semibold uppercase tracking-[0.35em] text-slate-900">
        <tr>
          <th scope="col" class="px-6 py-4">Product</th>
          <th scope="col" class="px-6 py-4">Quantity</th>
          <th scope="col" class="px-6 py-4 text-right">Unit price</th>
          <th scope="col" class="px-6 py-4 text-right">Line total</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-900/80 text-sm text-slate-700">
        <tr
          v-for="item in rows"
          :key="item.id"
          class="transition hover:bg-white/60"
        >
          <td class="px-6 py-5">
            <div class="flex items-start gap-4">
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                :alt="item.name"
                class="h-14 w-14 flex-shrink-0 rounded-xl border border-slate-800/70 object-cover"
              />
              <div>
                <p class="font-medium text-slate-900">{{ item.name }}</p>
                <p v-if="item.description" class="mt-1 text-xs text-slate-500">
                  {{ item.description }}
                </p>
                <p v-if="item.sku" class="mt-1 text-xs uppercase tracking-wider text-slate-900">
                  SKU: {{ item.sku }}
                </p>
              </div>
            </div>
          </td>
          <td class="px-6 py-5 align-top">
            <span class="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
              {{ item.quantity }}
            </span>
          </td>
          <td class="px-6 py-5 text-right align-top">
            <span>{{ formatCurrency(item.price) }}</span>
          </td>
          <td class="px-6 py-5 text-right align-top text-slate-900 font-semibold">
            {{ formatCurrency(item.lineTotal) }}
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="rows.length === 0" class="px-6 py-12 text-center text-sm text-slate-500">
      No items in the cart yet.
    </div>
  </div>
</template>

