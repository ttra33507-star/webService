<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { startCheckout } from '../services/paywayService';

type AudienceKey = 'local' | 'foreigner';

interface Plan {
  id: string;
  name: string;
  priceLabel: string;
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
      priceLabel: '$9.99',
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
      priceLabel: '$29.99',
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
      priceLabel: '$119.99',
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
      priceLabel: '$14.99',
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
      priceLabel: '$44.99',
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
      priceLabel: '$169.99',
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

const route = useRoute();
const router = useRouter();
const { isAuthenticated } = useAuth();

const planAudienceMap = new Map<string, AudienceKey>();
Object.entries(plansByAudience).forEach(([aud, plans]) => {
  plans.forEach((plan) => {
    planAudienceMap.set(plan.id, aud as AudienceKey);
  });
});

const audience = ref<AudienceKey>('local');

const activePlans = computed(() => plansByAudience[audience.value]);

const selectedPlanId = computed(() => {
  const value = route.query.plan;
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }
  return null;
});

watchEffect(() => {
  const targetPlan = selectedPlanId.value;
  if (!targetPlan) {
    return;
  }
  const matchedAudience = planAudienceMap.get(targetPlan);
  if (matchedAudience && audience.value !== matchedAudience) {
    audience.value = matchedAudience;
  }
});

const selectAudience = (value: AudienceKey) => {
  audience.value = value;
};

const handleGetStarted = (planId: string) => {
  if (!isAuthenticated.value) {
    router.push({ name: 'login', query: { redirect: '/plans', plan: planId } });
    return;
  }
  startCheckout(planId);
};
</script>

<template>
  <section class="relative overflow-hidden bg-black text-slate-100">
    <div class="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.25),_transparent_55%),radial-gradient(circle_at_center,_rgba(21,128,61,0.25),_transparent_60%)]"></div>
    <div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
      <header class="text-center">
        <p class="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">Pricing</p>
        <h1 class="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
          Choose Your Perfect Plan
        </h1>
        <p class="mx-auto mt-4 max-w-2xl text-base text-slate-300">
          Select the ideal package that fits your automation needs and scale your success. Local and international teams get tailored bundles with generous freebies and dedicated support.
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
          class="group relative flex flex-col overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-slate-900/40 p-8 shadow-[0_30px_80px_rgba(16,185,129,0.18)] transition hover:border-emerald-400/40 hover:shadow-[0_40px_120px_rgba(16,185,129,0.25)]"
          :class="[
            plan.highlight ? 'border-emerald-500/60 bg-emerald-500/10 backdrop-blur' : '',
            selectedPlanId === plan.id ? 'ring-2 ring-emerald-400' : '',
          ]"
        >
          <div v-if="plan.highlight" class="absolute left-1/2 top-6 -translate-x-1/2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">
            Most Popular
          </div>
          <div class="mt-6 flex flex-col gap-4 text-center">
            <h2 class="text-2xl font-semibold text-white">{{ plan.name }}</h2>
            <div class="text-4xl font-bold text-white">
              {{ plan.priceLabel }}
              <span class="text-base font-medium text-slate-300">{{ plan.cadence }}</span>
            </div>
            <p v-if="plan.tagline" class="text-sm font-medium text-emerald-300">
              {{ plan.tagline }}
            </p>
          </div>
          <ul class="mt-8 flex-1 space-y-3 text-sm text-slate-200">
            <li
              v-for="feature in plan.features"
              :key="feature"
              class="flex items-start gap-3 rounded-xl bg-slate-900/40 px-3 py-2 text-left transition group-hover:bg-slate-900/60"
            >
              <span class="mt-1 h-4 w-4 flex-shrink-0 rounded-full bg-emerald-500/40 text-emerald-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l3 3 7-7" />
                </svg>
              </span>
              <span>{{ feature }}</span>
            </li>
          </ul>
          <button
            type="button"
            class="mt-10 w-full rounded-full bg-slate-950/80 px-5 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-slate-200 transition hover:bg-slate-950"
            :class="plan.highlight ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' : ''"
            @click="handleGetStarted(plan.id)"
          >
            Get Started
          </button>
        </article>
      </div>
    </div>
  </section>
</template>
