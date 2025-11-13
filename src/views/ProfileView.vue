<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { isAuthenticated, signOut, authState } = useAuth();

const accountName = computed(() => authState.value?.user?.name ?? 'C4 Teach Hub Member');
const accountEmail = computed(() => authState.value?.user?.email ?? 'user@c4techhub.com');

const expiresAtLabel = computed(() => {
  const expiresAt = authState.value?.expiresAt ?? null;
  if (!expiresAt) {
    return 'Session active';
  }
  if (expiresAt <= Date.now()) {
    return 'Session expired';
  }
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(expiresAt));
  } catch {
    return 'Session active';
  }
});

const handleSignOut = () => {
  signOut();
  router.replace({ name: 'login' });
};

watch(
  isAuthenticated,
  (authed) => {
    if (!authed) {
      router.replace({ name: 'login', query: { redirect: '/account' } });
    }
  },
  { immediate: true },
);
</script>

<template>
  <section class="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-16">
    <header class="text-center">
      <p class="text-xs font-semibold uppercase text-[#23bdee]">Accounts</p>
      <h1 class="mt-4 text-3xl font-bold text-slate-900">Accounts Overview</h1>
      <p class="mt-3 text-sm text-slate-500">
        Manage your C4 Teach Hub subscription details and keep your payment preferences up to date.
      </p>
    </header>

    <div
      v-if="isAuthenticated"
      class="rounded-[2.5rem] border border-slate-800 bg-white/60 p-10 text-slate-900 shadow-[0_30px_90px_rgba(5,14,32,0.65)]"
    >
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#23bdee]">Signed in as</p>
          <p class="mt-3 text-xl font-semibold text-slate-900">{{ accountName }}</p>
          <p class="mt-1 text-sm text-slate-500">{{ accountEmail }}</p>
          <p class="mt-2 text-xs uppercase tracking-[0.3em] text-slate-900">
            Session expires: <span class="text-slate-600">{{ expiresAtLabel }}</span>
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-full border border-red-400/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-red-200 transition hover:border-red-300 hover:text-slate-900"
          @click="handleSignOut"
        >
          Sign out
        </button>
      </div>

      <div class="mt-10 grid gap-6 sm:grid-cols-2">
        <article class="rounded-3xl border border-slate-800 bg-white/70 p-6">
          <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#0c86c3]">Manage Plan</p>
          <h2 class="mt-4 text-lg font-semibold text-slate-900">Upgrade or renew your subscription</h2>
          <p class="mt-3 text-sm text-slate-500">
            Explore available plans, complete payments, and renew access to premium tools.
          </p>
          <RouterLink
            to="/plans"
            class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0c86c3] transition hover:text-[#0fa6ef]"
          >
            Go to plans
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7" />
            </svg>
          </RouterLink>
        </article>

        <article class="rounded-3xl border border-slate-800 bg-white/70 p-6">
          <p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-600">Support</p>
          <h2 class="mt-4 text-lg font-semibold text-slate-900">Need help with your account?</h2>
          <p class="mt-3 text-sm text-slate-500">
            Contact our team for assistance with billing, device registrations, or feature requests.
          </p>
          <a
            href="/contact"
            class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#23bdee] transition hover:text-[#71d5ff]"
          >
            Contact support
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </article>
      </div>
    </div>

    <div
      v-else
      class="rounded-[2.5rem] border border-slate-800 bg-white/60 p-10 text-center text-slate-700 shadow-[0_30px_90px_rgba(5,14,32,0.65)]"
    >
      <p class="text-sm">
        You need to sign in to view your account. Please
        <RouterLink to="/login" class="text-[#23bdee] underline transition hover:text-[#67d1ff]">
          continue to login
        </RouterLink>
        first.
      </p>
    </div>
  </section>
</template>

