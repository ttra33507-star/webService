<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuth } from '../../composables/useAuth';
import { buildPortalCallbackUrl, fetchUserProfile, getPortalBaseUrl, requestPasswordToken, requestSsoTicket } from '../../services/authService';
import TurnstileWidget from '../common/TurnstileWidget.vue';
import HomeStatsCards from '../home/HomeStatsCards.vue';

const email = ref('');
const password = ref('');
const rememberMe = ref(true);
const isSubmitting = ref(false);
const isPortalRedirecting = ref(false);
const authError = ref<string | null>(null);
const turnstileToken = ref<string | null>(null);
const turnstileLoadError = ref(false);

const turnstileSiteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '').toString().trim();
const router = useRouter();
const { t } = useI18n({ useScope: 'global' });
const { authState, signIn, isAuthenticated, rememberAccount, recentAccounts } = useAuth();

const portalBaseUrl = (getPortalBaseUrl() || 'https://apps.c4techhub.com').replace(/\/+$/, '');
const DEFAULT_PORTAL_REDIRECT_PATH = '/new-order';

const appendPath = (base: string, path: string) => {
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const resetPasswordUrl = appendPath(portalBaseUrl, '/reset-password');

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

const navigateAfterAuth = async () => {
  if (isPortalRedirecting.value) {
    return;
  }
  isPortalRedirecting.value = true;

  const redirectPath = DEFAULT_PORTAL_REDIRECT_PATH;
  const fallback = appendPath(portalBaseUrl, redirectPath);

  if (typeof window === 'undefined') {
    isPortalRedirecting.value = false;
    router.push('/');
    return;
  }

  try {
    const user = authState.value?.user ?? null;
    const username = email.value.trim();

    const ticket = await requestSsoTicket({
      userId: typeof user?.id === 'number' || typeof user?.id === 'string' ? user.id : undefined,
      email: typeof user?.email === 'string' && user.email.trim() ? user.email : username || undefined,
      redirectTo: redirectPath,
      state: redirectPath,
    });

    const persistenceMode = rememberMe.value ? 'persistent' : 'session';
    const targetUrl = buildPortalCallbackUrl(ticket.ticket, redirectPath, persistenceMode);
    window.location.href = targetUrl;
  } catch (error: unknown) {
    console.error('[SSO] Unable to redirect to portal', error);
    window.location.href = fallback;
  }
};

watch(
  isAuthenticated,
  (value) => {
    if (value) {
      void navigateAfterAuth();
    }
  },
  { immediate: true },
);

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

    if (rememberMe.value) {
      rememberAccount(username);
    }
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

onMounted(() => {
  // ensure stale token doesn't linger between mounts
  turnstileToken.value = null;
  turnstileLoadError.value = false;
});
</script>

<template>
  <section class="relative min-h-screen overflow-hidden bg-slate-100 px-4 py-16 text-slate-900">
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(241,245,249,0.6)_55%,_rgba(226,232,240,0.9))]" />
      <div class="absolute inset-0 opacity-20 [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:18px_18px]" />
    </div>

    <div class="relative mx-auto w-full max-w-5xl">
      <header class="mx-auto max-w-4xl text-center">
        <h1 class="text-5xl font-black tracking-tight text-slate-900 sm:text-7xl">
          <span class="text-slate-900">#1 </span>
          <span class="text-slate-900">Best </span>
          <span class="text-[#0c86c3]">SMM</span>
          <span class="text-slate-900"> Panel</span>
        </h1>
        <p class="mt-6 text-base font-semibold leading-relaxed text-slate-800 sm:text-lg">
          <span class="font-black">{{ t('auth.signIn.title') }}</span>
          <span class="font-medium"> — {{ t('auth.signIn.subtitle') }}</span>
        </p>
      </header>

      <div class="mt-10 flex justify-center">
        <div
          data-aos="zoom-in"
          class="w-full max-w-4xl rounded-2xl border border-[#0c86c3]/60 bg-white/80 p-8 shadow-[0_30px_80px_-40px_rgba(2,6,23,0.55)] backdrop-blur"
        >
          <template v-if="!isAuthenticated">
            <form class="space-y-6" @submit.prevent="handleSubmit">
              <div class="grid gap-6 md:grid-cols-2">
                <label class="flex flex-col gap-2 text-sm font-semibold text-slate-900">
                  {{ t('auth.signIn.email') }}
                  <input
                    v-model="email"
                    type="email"
                    placeholder="you@example.com"
                    class="h-12 rounded border border-slate-300 bg-slate-50/70 px-4 text-slate-900 placeholder:text-slate-400 focus:border-[#0c86c3] focus:outline-none focus:ring-2 focus:ring-[#0c86c3]/30"
                    required
                  />
                </label>

                <label class="flex flex-col gap-2 text-sm font-semibold text-slate-900">
                  {{ t('auth.signIn.password') }}
                  <input
                    v-model="password"
                    type="password"
                    placeholder="********"
                    class="h-12 rounded border border-slate-300 bg-slate-50/70 px-4 text-slate-900 placeholder:text-slate-400 focus:border-[#0c86c3] focus:outline-none focus:ring-2 focus:ring-[#0c86c3]/30"
                    required
                  />
                </label>
              </div>

              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <label class="inline-flex items-center gap-3 text-sm font-medium text-slate-900">
                  <input
                    v-model="rememberMe"
                    type="checkbox"
                    class="h-5 w-5 rounded border-slate-300 text-[#0c86c3] focus:ring-[#0c86c3]/30"
                  />
                  <span>{{ t('auth.signIn.rememberMe') }}</span>
                </label>

                <a
                  :href="resetPasswordUrl"
                  class="text-sm font-semibold text-[#0c86c3] transition hover:text-[#096b9f] hover:underline"
                >
                  {{ t('auth.signIn.forgotPassword') }}
                </a>
              </div>

              <div v-if="turnstileSiteKey" class="flex justify-center">
                <TurnstileWidget
                  :site-key="turnstileSiteKey"
                  @token="handleTurnstileToken"
                  @expired="handleTurnstileExpired"
                  @error="handleTurnstileError"
                />
              </div>
              <p v-else class="text-center text-xs font-medium text-amber-700">
                {{ t('auth.signIn.securityCheck.notConfigured') }}
              </p>
              <p v-if="turnstileLoadError" class="text-center text-xs font-medium text-red-600">
                {{ t('auth.signIn.securityCheck.loadError') }}
              </p>

              <button
                type="submit"
                class="w-full rounded bg-[#0c86c3] px-5 py-4 text-base font-bold text-white transition hover:bg-[#0fa6ef] disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? t('auth.signIn.ctaLoading') : t('auth.signIn.cta') }}
              </button>
            </form>

            <p
              v-if="authError"
              class="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700"
            >
              {{ authError }}
            </p>

            <p class="mt-8 text-center text-sm font-medium text-slate-700">
              {{ t('auth.signIn.noAccountPrompt') }}
              <RouterLink to="/signup" class="ml-1 font-bold text-[#0c86c3] hover:underline">{{
                t('auth.signIn.noAccountAction')
              }}</RouterLink>
            </p>
          </template>

          <p
            v-else
            class="rounded border border-[#0c86c3]/30 bg-[#0c86c3]/10 px-4 py-3 text-center text-sm font-semibold text-[#0c86c3]"
          >
            {{ t('auth.signIn.alreadySignedIn.message') }}
            <button type="button" class="underline transition hover:text-slate-900" @click="navigateAfterAuth">
              {{ t('auth.signIn.alreadySignedIn.continue') }}
            </button>
          </p>
        </div>
      </div>

      <div v-if="!isAuthenticated" class="mt-14">
        <HomeStatsCards />
      </div>
    </div>
  </section>
</template>
