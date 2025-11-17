<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { isAuthenticated, signOut, authState } = useAuth();

const accountName = computed(() => authState.value?.user?.name ?? 'C4 Teach Hub Member');
const accountEmail = computed(() => authState.value?.user?.email ?? 'user@c4techhub.com');

const formatDate = (value: unknown): string | null => {
  if (!value) {
    return null;
  }
  const dateValue =
    typeof value === 'number' && Number.isFinite(value)
      ? value
      : typeof value === 'string' && value.trim()
        ? Date.parse(value)
        : null;
  if (!dateValue || Number.isNaN(dateValue)) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(dateValue),
    );
  } catch {
    return null;
  }
};

const joinDateLabel = computed(() => {
  const user = authState.value?.user ?? {};
  return (
    formatDate((user as Record<string, unknown>).joinedAt) ||
    formatDate((user as Record<string, unknown>).joinDate) ||
    formatDate((user as Record<string, unknown>).createdAt) ||
    'Not provided'
  );
});

const lastLoginLabel = computed(() => {
  const user = authState.value?.user ?? {};
  return (
    formatDate((user as Record<string, unknown>).lastLogin) ||
    formatDate((user as Record<string, unknown>).lastActive) ||
    formatDate((user as Record<string, unknown>).lastSeen) ||
    'Not provided'
  );
});

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
      <h1 class="mt-4 text-3xl font-black text-slate-900">Account Overview</h1>
    </header>

    <div
      v-if="isAuthenticated"
      class="rounded-[10px] border border-slate-800 bg-white/60 p-10 text-slate-900 shadow-lg"
    >
      <div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-medium uppercase  text-[#23bdee]">Name</p>
          <p class="text-2xl font-black text-slate-900">{{ accountName }}</p>
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-full  bg-red-500 px-6 py-3 text-xs font-black uppercase  text-white transition hover:border-red-300 "
          @click="handleSignOut"
        >
          Sign out
        </button>
      </div>

      <div class="mt-8 grid gap-4">
        <div class="grid gap-2 rounded-2xl border border-slate-800/60 bg-white/70 p-5 sm:grid-cols-[160px_1fr]">
          <p class="text-xs font-medium uppercase  text-slate-600">Email</p>
          <p class="text-sm font-medium text-slate-900">{{ accountEmail }}</p>
        </div>
        <div class="grid gap-2 rounded-2xl border border-slate-800/60 bg-white/70 p-5 sm:grid-cols-[160px_1fr]">
          <p class="text-xs font-medium uppercase  text-slate-600">Joined</p>
          <p class="text-sm font-medium text-slate-900">{{ joinDateLabel }}</p>
        </div>
        <div class="grid gap-2 rounded-2xl border border-slate-800/60 bg-white/70 p-5 sm:grid-cols-[160px_1fr]">
          <p class="text-xs font-medium uppercase  text-slate-600">Last login</p>
          <p class="text-sm font-medium text-slate-900">{{ lastLoginLabel }}</p>
        </div>
        <div class="grid gap-2 rounded-2xl border border-slate-800/60 bg-white/70 p-5 sm:grid-cols-[160px_1fr]">
          <p class="text-xs font-medium uppercase  text-slate-600">Session</p>
          <p class="text-sm font-medium text-slate-900">{{ expiresAtLabel }}</p>
        </div>
        <div class="grid gap-2 rounded-2xl border border-slate-800/60 bg-white/70 p-5 sm:grid-cols-[160px_1fr]">
          <p class="text-xs font-medium uppercase  text-slate-600">Support</p>
          <div class="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-900">
            <a
              href="https://t.me/c4techhub"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[#0c86c3] underline transition hover:text-[#23bdee]"
            >
              Telegram
            </a>
            <RouterLink to="/faq" class="text-[#0c86c3] underline transition hover:text-[#23bdee]">FAQ</RouterLink>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="rounded-[2.5rem] border border-slate-800 bg-white/60 p-10 text-center text-slate-700 shadow-[0_30px_90px_rgba(5,14,32,0.65)]"
    >
      <p class="text-sm font-medium">
        You need to sign in to view your account. Please
        <RouterLink to="/signin" class="text-[#23bdee] underline transition hover:text-[#67d1ff]">
          continue to login
        </RouterLink>
        first.
      </p>
    </div>
  </section>
</template>

