<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { locale, t } = useI18n({ useScope: 'global' });
const { isAuthenticated, signOut, authState } = useAuth();

const accountName = computed(() => authState.value?.user?.name ?? t('account.placeholders.memberName'));
const accountEmail = computed(() => authState.value?.user?.email ?? 'user@c4techhub.com');

// Date formatting helper removed — not currently used in this view.

// NOTE: join/last-login fields intentionally omitted from the view for now.

const expiresAtLabel = computed(() => {
  void locale.value;
  const expiresAt = authState.value?.expiresAt ?? null;
  if (!expiresAt) {
    return t('account.sessionStatus.active');
  }
  if (expiresAt <= Date.now()) {
    return t('account.sessionStatus.expired');
  }
  try {
    const localeCode = locale.value === 'km' ? 'km-KH' : 'en-US';
    return new Intl.DateTimeFormat(localeCode, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(expiresAt));
  } catch {
    return t('account.sessionStatus.active');
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
      <h1 class="mt-4 text-3xl font-black text-slate-700">{{ t('account.title') }}</h1>
    </header>

	    <div
	      v-if="isAuthenticated"
	      data-aos="fade-up"
	      class="rounded-[10px] border border-slate-800 bg-white/60 p-10 text-slate-700 shadow-lg"
	    >
	      <div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
	        <div class="space-y-2">
	          <p class="text-xs font-medium uppercase  text-[#23bdee]">{{ t('account.labels.name') }}</p>
	          <p class="text-2xl font-black text-slate-700">{{ accountName }}</p>
	        </div>
	        <button
	          type="button"
	          class="inline-flex items-center justify-center rounded-full  bg-red-500 px-6 py-3 text-xs font-black uppercase  text-white transition hover:border-red-300 "
	          @click="handleSignOut"
	        >
	          {{ t('account.actions.signOut') }}
	        </button>
	      </div>

	      <div class="mt-8 grid gap-4">
	        <div data-aos="fade-up" data-aos-delay="80" class="grid gap-2 rounded-2xl border border-slate-800/60 bg-white/70 p-5 sm:grid-cols-[160px_1fr]">
	          <p class="text-xs font-medium uppercase  text-slate-600">{{ t('account.labels.email') }}</p>
	          <p class="text-sm font-medium text-slate-700">{{ accountEmail }}</p>
	        </div>
	        <div data-aos="fade-up" data-aos-delay="140" class="grid gap-2 rounded-2xl border border-slate-800/60 bg-white/70 p-5 sm:grid-cols-[160px_1fr]">
	          <p class="text-xs font-medium uppercase  text-slate-600">{{ t('account.labels.session') }}</p>
	          <p class="text-sm font-medium text-slate-700">{{ expiresAtLabel }}</p>
	        </div>
	        <div data-aos="fade-up" data-aos-delay="200" class="grid gap-2 rounded-2xl border border-slate-800/60 bg-white/70 p-5 sm:grid-cols-[160px_1fr]">
	          <p class="text-xs font-medium uppercase  text-slate-600">{{ t('account.labels.support') }}</p>
	          <div class="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700">
	            <a
	              href="https://t.me/c4techhub"
	              target="_blank"
	              rel="noopener noreferrer"
	              class="text-[#0c86c3] underline transition hover:text-[#23bdee]"
	            >
	              {{ t('account.support.telegram') }}
	            </a>
	            <RouterLink to="/faq" class="text-[#0c86c3] underline transition hover:text-[#23bdee]">{{ t('account.support.faq') }}</RouterLink>
	          </div>
	        </div>
	      </div>
	    </div>

    <div
      v-else
      data-aos="fade-up"
	      class="rounded-[2.5rem] border border-slate-800 bg-white/60 p-10 text-center text-slate-700 shadow-[0_30px_90px_rgba(5,14,32,0.65)]"
	    >
	      <p class="text-sm font-medium">
	        {{ t('account.signInPrompt.prefix') }}
	        <RouterLink to="/signin" class="text-[#23bdee] underline transition hover:text-[#67d1ff]">
	          {{ t('account.signInPrompt.link') }}
	        </RouterLink>
	        {{ t('account.signInPrompt.suffix') }}
	      </p>
	    </div>
	  </section>
</template>

