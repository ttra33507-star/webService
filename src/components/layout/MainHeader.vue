<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useAuth } from '../../composables/useAuth';

type NavLink =
  | { label: string; target: 'route'; to: string }
  | { label: string; target: 'anchor'; href: string };

const route = useRoute();

const navLinks: NavLink[] = [
  { label: 'Home', target: 'route', to: '/' },
  { label: 'Plans', target: 'route', to: '/plans' },
  { label: 'Services', target: 'anchor', href: '/services' },
  { label: 'Contact', target: 'anchor', href: '/contact' },
  { label: 'Cart', target: 'route', to: '/cart' },
];

const isMobileNavOpen = ref(false);
const { isAuthenticated, signOut } = useAuth();

const isActive = (link: NavLink) => {
  if (link.target !== 'route') {
    return false;
  }
  return route.path === link.to;
};

const closeMobileNav = () => {
  isMobileNavOpen.value = false;
};

const toggleMobileNav = () => {
  isMobileNavOpen.value = !isMobileNavOpen.value;
};

const handleSignOut = () => {
  signOut();
  closeMobileNav();
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeMobileNav();
  }
};

watch(isMobileNavOpen, (open) => {
  document.body.classList.toggle('overflow-hidden', open);
});

watch(
  () => route.path,
  () => {
    closeMobileNav();
  },
);

onMounted(() => {
  window.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape);
  document.body.classList.remove('overflow-hidden');
});
</script>

<template>
  <header class="border-b border-slate-900/80 bg-slate-950/70 backdrop-blur">
    <nav class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
      <RouterLink to="/" class="flex items-center gap-3">
        <img src="/images/logo-C4-HUB.png" alt="C4 logo" class="h-[45px] w-[180px] rounded-[3px] p-[1px] object-cover shadow" />
      </RouterLink>
      <div class="hidden items-center gap-6 md:flex">
        <div class="flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/70 p-1 text-sm font-medium text-slate-300 shadow-inner">
          <template v-for="link in navLinks" :key="link.label">
            <RouterLink
              v-if="link.target === 'route'"
              :to="link.to"
              :class="[
                'rounded-full px-4 py-2 transition',
                isActive(link) ? 'bg-slate-800/80 text-white' : 'hover:bg-slate-800/60 hover:text-white',
              ]"
            >
              {{ link.label }}
            </RouterLink>
            <a
              v-else
              :href="link.href"
              class="rounded-full px-4 py-2 transition hover:bg-slate-800/60 hover:text-white"
            >
              {{ link.label }}
            </a>
          </template>
        </div>
        <RouterLink
          v-if="!isAuthenticated"
          to="/login"
          class="inline-flex items-center rounded-full border border-emerald-400/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200 transition hover:border-emerald-300 hover:text-white"
        >
          Sign in Account
        </RouterLink>
        <button
          v-else
          type="button"
          class="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-red-400 hover:text-red-300"
          @click="handleSignOut"
        >
          Sign out
        </button>
      </div>
      <button
        type="button"
        class="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900/80 p-2 text-slate-200 md:hidden"
        aria-label="Toggle menu"
        :aria-expanded="isMobileNavOpen"
        @click="toggleMobileNav"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </nav>
    <div
      v-if="isMobileNavOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur"
      @click.self="closeMobileNav"
    >
      <div class="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-950/95 p-6 text-slate-200 shadow-2xl">
        <div class="mb-4 flex items-center justify-between gap-4">
          <p class="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">Menu</p>
          <button
            type="button"
            class="rounded-full border border-slate-700 bg-slate-900/60 p-2 text-slate-300 transition hover:text-white"
            aria-label="Close menu"
            @click="closeMobileNav"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav class="space-y-3 text-sm font-medium">
          <template v-for="link in navLinks" :key="`mobile-${link.label}`">
            <RouterLink
              v-if="link.target === 'route'"
              :to="link.to"
              :class="[
                'block rounded-xl px-4 py-3 transition',
                isActive(link) ? 'bg-slate-800/80 text-white' : 'hover:bg-slate-800/60 hover:text-white',
              ]"
            >
              {{ link.label }}
            </RouterLink>
            <a
              v-else
              :href="link.href"
              class="block rounded-xl px-4 py-3 transition hover:bg-slate-800/60 hover:text-white"
            >
              {{ link.label }}
            </a>
          </template>
        </nav>
        <RouterLink
          v-if="!isAuthenticated"
          to="/login"
          class="mt-6 flex w-full justify-center rounded-full border border-emerald-400/40 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200 transition hover:border-emerald-300 hover:text-white"
          @click="closeMobileNav"
        >
          Sign in Account
        </RouterLink>
        <button
          v-else
          type="button"
          class="mt-6 w-full rounded-full border border-slate-700 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-red-400 hover:text-red-300"
          @click="handleSignOut"
        >
          Sign out
        </button>
      </div>
    </div>
  </header>
</template>
