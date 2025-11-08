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
  { label: 'Services', target: 'route', to: '/services' },
  { label: 'Privacy & Terms', target: 'route', to: '/legal' },
  { label: 'Contact', target: 'route', to: '/contact' },
  { label: 'Cart', target: 'route', to: '/cart' },
];

const isMobileNavOpen = ref(false);
const isProfileDropdownOpen = ref(false);
const profileMenuRef = ref<HTMLElement | null>(null);
const profileButtonRef = ref<HTMLElement | null>(null);
const { isAuthenticated, signOut } = useAuth();
let ignoreNextOutsideClick = false;

const isActive = (link: NavLink) => {
  if (link.target !== 'route') {
    return false;
  }
  return route.path === link.to;
};

const closeMobileNav = () => {
  isMobileNavOpen.value = false;
};

const closeProfileDropdown = () => {
  isProfileDropdownOpen.value = false;
};

const toggleMobileNav = () => {
  isMobileNavOpen.value = !isMobileNavOpen.value;
};

const toggleProfileDropdown = () => {
  const willOpen = !isProfileDropdownOpen.value;
  isProfileDropdownOpen.value = willOpen;
  if (willOpen) {
    ignoreNextOutsideClick = true;
  }
};

const handleSignOut = () => {
  signOut();
  closeProfileDropdown();
  closeMobileNav();
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeMobileNav();
    closeProfileDropdown();
  }
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node | null;
  if (!target) {
    return;
  }
  if (ignoreNextOutsideClick) {
    ignoreNextOutsideClick = false;
    return;
  }
  if (profileButtonRef.value?.contains(target)) {
    return;
  }
  if (profileMenuRef.value?.contains(target)) {
    return;
  }
  closeProfileDropdown();
};

watch(isMobileNavOpen, (open) => {
  document.body.classList.toggle('overflow-hidden', open);
});

watch(
  () => route.path,
  () => {
    closeMobileNav();
    closeProfileDropdown();
  },
);

watch(isAuthenticated, (authed) => {
  if (!authed) {
    closeProfileDropdown();
  }
});

onMounted(() => {
  window.addEventListener('keydown', handleEscape);
  window.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape);
  window.removeEventListener('click', handleClickOutside);
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
          Sign in Accounts
        </RouterLink>
        <div v-else class="relative">
          <button
            ref="profileButtonRef"
            type="button"
            class="inline-flex items-center gap-3 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-[#23bdee] hover:text-white"
            :aria-expanded="isProfileDropdownOpen"
            aria-haspopup="menu"
            @click.stop="toggleProfileDropdown"
          >
            <span
              class="flex h-8 w-8 items-center justify-center rounded-full bg-[#23bdee]/20 text-sm font-semibold text-[#23bdee]"
            >
              AC
            </span>
            <span class="hidden sm:inline">Accounts</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 transition"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              :class="isProfileDropdownOpen ? 'rotate-180 text-[#23bdee]' : 'text-slate-400'"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div
            v-if="isProfileDropdownOpen"
            ref="profileMenuRef"
            class="absolute right-0 z-20 mt-3 w-56 rounded-3xl border border-slate-800/80 bg-[#0c152e] p-3 text-left shadow-[0_25px_60px_rgba(5,14,32,0.6)]"
          >
            <RouterLink
              to="/account"
              class="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800/60 hover:text-white"
              @click="closeProfileDropdown"
            >
              Profile
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7" />
              </svg>
            </RouterLink>
            <button
              type="button"
              class="mt-2 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 hover:text-white"
              @click="handleSignOut"
            >
              Sign out
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7" />
              </svg>
            </button>
          </div>
        </div>
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
    <Teleport to="body">
      <div
        v-if="isMobileNavOpen"
        class="fixed inset-0 z-50 flex items-center justify-center px-5 py-8"
        @click.self="closeMobileNav"
      >
        <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>
        <div
          class="relative w-full max-w-sm overflow-hidden rounded-[2.75rem] border border-slate-800/60 bg-[#0b152b]/95 p-8 text-slate-100 shadow-[0_45px_120px_rgba(3,12,33,0.85)]"
        >
          <div class="mb-8 flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-[0.45em] text-emerald-300">Menu</p>
            <button
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900/70 text-slate-300 transition hover:border-slate-500 hover:text-white"
              aria-label="Close menu"
              @click="closeMobileNav"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav class="space-y-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">
            <template v-for="link in navLinks" :key="`mobile-${link.label}`">
              <RouterLink
                v-if="link.target === 'route'"
                :to="link.to"
                :class="[
                  'block rounded-2xl px-5 py-4 transition',
                  isActive(link)
                    ? 'bg-slate-800/80 text-white shadow-[inset_0_0_0_1px_rgba(94,234,212,0.4)]'
                    : 'hover:bg-slate-800/60 hover:text-white',
                ]"
                @click="closeMobileNav"
              >
                {{ link.label }}
              </RouterLink>
              <a
                v-else
                :href="link.href"
                class="block rounded-2xl px-5 py-4 transition hover:bg-slate-800/60 hover:text-white"
                @click="closeMobileNav"
              >
                {{ link.label }}
              </a>
            </template>
          </nav>
          <RouterLink
            v-if="!isAuthenticated"
            to="/login"
            class="mt-10 flex w-full justify-center rounded-full border border-emerald-400/40 px-5 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200 transition hover:border-emerald-300 hover:text-white"
            @click="closeMobileNav"
          >
            Sign in Accounts
          </RouterLink>
          <div v-else class="mt-10 space-y-3">
            <RouterLink
              to="/account"
              class="flex w-full justify-center rounded-full border border-slate-700 px-5 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200 transition hover:border-[#23bdee] hover:text-white"
              @click="closeMobileNav"
            >
              Accounts Profile
            </RouterLink>
            <button
              type="button"
              class="w-full rounded-full border border-red-400/40 px-5 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-red-200 transition hover:border-red-300 hover:text-white"
              @click="handleSignOut"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </header>
</template>
