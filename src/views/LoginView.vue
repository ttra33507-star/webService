<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuth } from '../composables/useAuth';
import { requestPasswordToken, fetchUserProfile } from '../services/authService';
import TurnstileWidget from '../components/common/TurnstileWidget.vue';

const email = ref('');
const password = ref('');
const isSubmitting = ref(false);
const authError = ref<string | null>(null);
const turnstileToken = ref<string | null>(null);
const turnstileLoadError = ref(false);

const turnstileSiteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '').toString().trim();
const route = useRoute();
const router = useRouter();
const { t } = useI18n({ useScope: 'global' });
const { signIn, isAuthenticated, rememberAccount, recentAccounts } = useAuth();

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

const normalizeAuthError = (message: string) => {
  const normalized = message.trim();
  if (!normalized) return t('auth.errors.genericSignIn');

  if (normalized === 'The turnstile token field is required.') {
    return turnstileSiteKey ? t('auth.errors.turnstileRequired') : t('auth.errors.turnstileNotConfigured');
  }

  return normalized;
};

const handleSubmit = async () => {
  if (isSubmitting.value) {
    return;
  }
  isSubmitting.value = true;
  authError.value = null;

  if (turnstileSiteKey && (!turnstileToken.value || !turnstileToken.value.trim())) {
    authError.value = t('auth.signIn.securityCheck.required');
    isSubmitting.value = false;
    return;
  }

  try {
    const username = email.value.trim();
    const userPassword = password.value;
    const tokenResponse = await requestPasswordToken(username, userPassword, { turnstileToken: turnstileToken.value });
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
    authError.value = error instanceof Error ? normalizeAuthError(error.message) : t('auth.errors.genericSignIn');
  } finally {
    isSubmitting.value = false;
  }
};

const handleTurnstileToken = (token: string) => {
  turnstileToken.value = token;
  turnstileLoadError.value = false;
};

const handleTurnstileExpired = () => {
  turnstileToken.value = null;
};

const handleTurnstileError = () => {
  turnstileToken.value = null;
  turnstileLoadError.value = true;
};
</script>


<template>
  <section class="flex min-h-screen items-center justify-center bg-white px-4 py-16 text-slate-900">
    <div data-aos="zoom-in" class="w-full max-w-md rounded-3xl border border-slate-900/80 bg-white/70 p-8 shadow-2xl">
      <header class="text-center">
        <p class="text-xs font-semibold uppercase  text-[#0c86c3]">{{ t('auth.signIn.badge') }}</p>
        <h1 class="mt-3 text-3xl font-semibold text-slate-900">{{ t('auth.signIn.title') }}</h1>
        <p class="mt-3 text-sm text-slate-900">
          {{ t('auth.signIn.subtitle') }}
        </p>
      </header>

      <form class="mt-8 space-y-5" @submit.prevent="handleSubmit">
        <label class="flex flex-col gap-2 text-sm font-medium text-slate-700">
          {{ t('auth.signIn.email') }}
          <input
            v-model="email"
            type="email"
            placeholder="you@example.com"
            class="rounded-xl border border-slate-800 bg-white/70 px-4 py-3 text-slate-900 placeholder:text-slate-900 focus:border-[#0c86c3] focus:outline-none focus:ring-2 focus:ring-[#0c86c3]/40"
            required
          />
        </label>
        <label class="flex flex-col gap-2 text-sm font-medium text-slate-700">
          {{ t('auth.signIn.password') }}
          <input
            v-model="password"
            type="password"
            placeholder="********"
            class="rounded-xl border border-slate-800 bg-white/70 px-4 py-3 text-slate-900 placeholder:text-slate-900 focus:border-[#0c86c3] focus:outline-none focus:ring-2 focus:ring-[#0c86c3]/40"
            required
          />
        </label>

        <div v-if="turnstileSiteKey" class="flex justify-center">
          <TurnstileWidget
            :site-key="turnstileSiteKey"
            @token="handleTurnstileToken"
            @expired="handleTurnstileExpired"
            @error="handleTurnstileError"
          />
        </div>
        <p v-else class="text-xs font-medium text-amber-700">
          {{ t('auth.signIn.securityCheck.notConfigured') }}
        </p>
        <p v-if="turnstileLoadError" class="text-xs font-medium text-red-600">
          {{ t('auth.signIn.securityCheck.loadError') }}
        </p>

        <button
          type="submit"
          class="w-full rounded-full bg-[#0c86c3] px-5 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#0fa6ef] disabled:cursor-not-allowed disabled:bg-white disabled:text-slate-900"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? t('auth.signIn.ctaLoading') : t('auth.signIn.cta') }}
        </button>
      </form>

      <p
        v-if="authError"
        class="mt-5 rounded-xl border border-red-400 bg-red-100 px-4 py-3 text-center text-sm font-medium text-red-700"
      >
        {{ authError }}
      </p>

      <p v-if="isAuthenticated" class="mt-6 rounded-xl border border-[#0c86c3]/30 bg-[#0c86c3]/10 px-4 py-3 text-center text-sm text-[#0c86c3]">
        {{ t('auth.signIn.alreadySignedIn.message') }}
        <button type="button" class="underline transition hover:text-slate-900" @click="navigateAfterAuth">
          {{ t('auth.signIn.alreadySignedIn.continue') }}
        </button>
      </p>
    </div>
  </section>
</template>

