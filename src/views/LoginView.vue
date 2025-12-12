<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useTurnstile } from '../composables/useTurnstile';
import { requestPasswordToken, fetchUserProfile } from '../services/authService';

const email = ref('');
const password = ref('');
const isSubmitting = ref(false);
const authError = ref<string | null>(null);
const turnstileElement = ref<HTMLElement | null>(null);

const { signIn, isAuthenticated, rememberAccount, recentAccounts } = useAuth();
const route = useRoute();
const router = useRouter();
const { token: turnstileToken, render: renderTurnstile, reset: resetTurnstile, error: turnstileError } = useTurnstile();

if (recentAccounts.value.length > 0) {
  email.value = recentAccounts.value[0] ?? '';
}

watch(
  recentAccounts,
  (accounts) => {
    if (!email.value && accounts.length > 0) {
      email.value = accounts[0] ?? '';
    }
  },
  { immediate: false },
);

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

const handleSubmit = async () => {
  if (isSubmitting.value) {
    return;
  }
  isSubmitting.value = true;
  authError.value = null;

  const captchaToken = turnstileToken.value;
  if (!captchaToken) {
    authError.value = 'Please complete the CAPTCHA before signing in.';
    isSubmitting.value = false;
    return;
  }

  try {
    const username = email.value.trim();
    const userPassword = password.value;
    const tokenResponse = await requestPasswordToken(username, userPassword, { turnstileToken: captchaToken });
    const profile = await fetchUserProfile(tokenResponse.access_token);

    const expiresAt =
      typeof tokenResponse.expires_in === 'number' && Number.isFinite(tokenResponse.expires_in)
        ? Date.now() + tokenResponse.expires_in * 1000
        : null;

    signIn({
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token ?? null,
      tokenType: tokenResponse.token_type ?? 'Bearer',
      scope: tokenResponse.scope ?? null,
      expiresAt,
      receivedAt: Date.now(),
      user: profile,
      raw: {
        token: tokenResponse,
        profile,
      },
    });

    rememberAccount(username);
    password.value = '';

    navigateAfterAuth();
  } catch (error) {
    authError.value =
      error instanceof Error ? error.message : 'Unable to sign in. Please try again.';
  } finally {
    resetTurnstile();
    isSubmitting.value = false;
  }
};

onMounted(() => {
  if (turnstileElement.value) {
    void renderTurnstile(turnstileElement.value);
  }
});
</script>


<template>
  <section class="flex min-h-screen items-center justify-center bg-white px-4 py-16 text-slate-900">
    <div class="w-full max-w-md rounded-3xl border border-slate-900/80 bg-white/70 p-8 shadow-2xl">
      <header class="text-center">
        <p class="text-xs font-semibold uppercase  text-[#0c86c3]">Account access</p>
        <h1 class="mt-3 text-3xl font-semibold text-slate-900">Sign in to continue</h1>
        <p class="mt-3 text-sm text-slate-900">
          Use your account to continue ordering. Your session unlocks checkout flows and saved information.
        </p>
      </header>

      <form class="mt-8 space-y-5" @submit.prevent="handleSubmit">
        <label class="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Email
          <input
            v-model="email"
            type="email"
            placeholder="you@example.com"
            class="rounded-xl border border-slate-800 bg-white/70 px-4 py-3 text-slate-900 placeholder:text-slate-900 focus:border-[#0c86c3] focus:outline-none focus:ring-2 focus:ring-[#0c86c3]/40"
            required
          />
        </label>
        <label class="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Password
          <input
            v-model="password"
            type="password"
            placeholder="********"
            class="rounded-xl border border-slate-800 bg-white/70 px-4 py-3 text-slate-900 placeholder:text-slate-900 focus:border-[#0c86c3] focus:outline-none focus:ring-2 focus:ring-[#0c86c3]/40"
            required
          />
        </label>
        <div class="mt-3">
          <div ref="turnstileElement" class="min-h-[72px]" />
          <p v-if="turnstileError" class="mt-2 text-xs font-medium text-red-600">{{ turnstileError }}</p>
        </div>
        <button
          type="submit"
          class="w-full rounded-full bg-[#0c86c3] px-5 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#0fa6ef] disabled:cursor-not-allowed disabled:bg-white disabled:text-slate-900"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <p
        v-if="authError"
        class="mt-5 rounded-xl border border-red-400 bg-red-100 px-4 py-3 text-center text-sm font-medium text-red-700"
      >
        {{ authError }}
      </p>

      <p v-if="isAuthenticated" class="mt-6 rounded-xl border border-[#0c86c3]/30 bg-[#0c86c3]/10 px-4 py-3 text-center text-sm text-[#0c86c3]">
        You are already signed in. <button type="button" class="underline transition hover:text-slate-900" @click="navigateAfterAuth">Continue</button>
      </p>
    </div>
  </section>
</template>

