<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const email = ref('');
const password = ref('');
const isSubmitting = ref(false);

const route = useRoute();
const router = useRouter();
const { signIn, isAuthenticated } = useAuth();

const navigateAfterAuth = () => {
  const redirect = route.query.redirect;
  const planQuery = route.query.plan;

  if (typeof redirect === 'string') {
    const plan =
      typeof planQuery === 'string'
        ? planQuery
        : Array.isArray(planQuery) && planQuery.length > 0
        ? planQuery[0]
        : undefined;

    router.push({
      path: redirect,
      query: plan ? { plan } : undefined,
    });
    return;
  }

  router.push('/');
};

const handleSubmit = () => {
  if (isSubmitting.value) {
    return;
  }
  isSubmitting.value = true;

  // Simulated authentication; integrate real API here.
  signIn(`${email.value || 'member'}-${Date.now()}`);
  isSubmitting.value = false;

  navigateAfterAuth();
};
</script>

<template>
  <section class="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-16 text-slate-100">
    <div class="w-full max-w-md rounded-3xl border border-slate-900/80 bg-slate-900/70 p-8 shadow-2xl">
      <header class="text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300">Account access</p>
        <h1 class="mt-3 text-3xl font-semibold text-white">Sign in to continue</h1>
        <p class="mt-3 text-sm text-slate-400">
          Use your account to continue ordering. Your session unlocks checkout flows and saved information.
        </p>
      </header>

      <form class="mt-8 space-y-5" @submit.prevent="handleSubmit">
        <label class="flex flex-col gap-2 text-sm font-medium text-slate-200">
          Email
          <input
            v-model="email"
            type="email"
            placeholder="you@example.com"
            class="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            required
          />
        </label>
        <label class="flex flex-col gap-2 text-sm font-medium text-slate-200">
          Password
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            required
          />
        </label>
        <button
          type="submit"
          class="w-full rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <p v-if="isAuthenticated" class="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-200">
        You are already signed in. <button type="button" class="underline transition hover:text-white" @click="navigateAfterAuth">Continue</button>
      </p>
    </div>
  </section>
</template>
