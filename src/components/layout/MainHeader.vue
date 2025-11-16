<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useAuth } from '../../composables/useAuth';
import { getPortalBaseUrl, requestSsoTicket, buildPortalCallbackUrl } from '../../services/authService';

type NavLink =
  | { label: string; target: 'route'; to: string }
  | { label: string; target: 'anchor'; href: string };

const route = useRoute();
const router = useRouter();

const portalBaseUrl = getPortalBaseUrl();
const portalFallbackUrl = portalBaseUrl ? portalBaseUrl.replace(/\/+$/, '') : 'https://apps.c4techhub.com';
const dashboardRedirecting = ref(false);

const navLinks: NavLink[] = [
  { label: 'Home', target: 'route', to: '/' },
  // { label: 'Plans', target: 'route', to: '/plans' },
  { label: 'Services', target: 'route', to: '/services' },
  { label: 'Contact', target: 'route', to: '/contact' },
];

const isMobileNavOpen = ref(false);
const isProfileDropdownOpen = ref(false);
const isContactDropdownOpen = ref(false);
const isMobileContactOpen = ref(false);
const profileMenuRef = ref<HTMLElement | null>(null);
const profileButtonRef = ref<HTMLElement | null>(null);
const contactMenuRef = ref<HTMLElement | null>(null);
const contactButtonRef = ref<HTMLElement | null>(null);
const { isAuthenticated, signOut, authState } = useAuth();
let ignoreNextOutsideClick = false;

const isActive = (link: NavLink) => {
  if (link.target !== 'route') {
    return false;
  }
  return route.path === link.to;
};

const closeMobileNav = () => {
  isMobileNavOpen.value = false;
  isMobileContactOpen.value = false;
  closeContactDropdown();
};

const closeProfileDropdown = () => {
  isProfileDropdownOpen.value = false;
};

const closeContactDropdown = () => {
  isContactDropdownOpen.value = false;
};

const toggleMobileNav = () => {
  isMobileNavOpen.value = !isMobileNavOpen.value;
  if (isMobileNavOpen.value) {
    closeContactDropdown();
    isMobileContactOpen.value = false;
  }
};

const toggleProfileDropdown = () => {
  const willOpen = !isProfileDropdownOpen.value;
  isProfileDropdownOpen.value = willOpen;
  if (willOpen) {
    ignoreNextOutsideClick = true;
  }
};

const toggleContactDropdown = () => {
  const willOpen = !isContactDropdownOpen.value;
  isContactDropdownOpen.value = willOpen;
  if (willOpen) {
    ignoreNextOutsideClick = true;
  }
};

const redirectToLogin = (redirectPath?: string) => {
  const target = redirectPath && typeof redirectPath === 'string' ? redirectPath : route.fullPath || '/';
  router.push({ path: '/signin', query: { redirect: target } });
};

const handleSignOut = () => {
  const nextRedirect = route.fullPath || '/';
  signOut();
  closeProfileDropdown();
  closeMobileNav();
  redirectToLogin(nextRedirect);
};

const resolvePortalRedirectPath = () => {
  return '/orders';
};

const appendPath = (base: string, path: string) => {
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const handleDashboardRedirect = async () => {
  if (dashboardRedirecting.value) {
    return;
  }
  if (!isAuthenticated.value) {
    router.push({ path: '/signin', query: { redirect: '/' } });
    return;
  }

  dashboardRedirecting.value = true;
  const redirectPath = resolvePortalRedirectPath();

  try {
    const user = authState.value?.user ?? null;
    const ticket = await requestSsoTicket({
      userId: typeof user?.id === 'number' || typeof user?.id === 'string' ? user.id : undefined,
      email: typeof user?.email === 'string' ? user.email : undefined,
      redirectTo: redirectPath,
      state: redirectPath,
    });

    const targetUrl = buildPortalCallbackUrl(ticket.ticket, redirectPath, 'persistent');
    window.location.href = targetUrl;
  } catch (error: unknown) {
    console.error('[SSO] Dashboard redirect failed', error);
    const fallback = appendPath(portalFallbackUrl, redirectPath || '/');
    window.location.href = fallback;
  } finally {
    dashboardRedirecting.value = false;
  }
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeMobileNav();
    closeProfileDropdown();
    closeContactDropdown();
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
  if (contactButtonRef.value?.contains(target)) {
    return;
  }
  if (contactMenuRef.value?.contains(target)) {
    return;
  }
  if (profileButtonRef.value?.contains(target)) {
    return;
  }
  if (profileMenuRef.value?.contains(target)) {
    return;
  }
  closeProfileDropdown();
  closeContactDropdown();
};

watch(isMobileNavOpen, (open) => {
  document.body.classList.toggle('overflow-hidden', open);
});

watch(
  () => route.path,
  () => {
    closeMobileNav();
    closeProfileDropdown();
    closeContactDropdown();
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
  <header
    class="sticky top-0 z-40 border-b border-white bg-white/80 font-black backdrop-blur-md shadow-[0_8px_30px_rgba(15,23,42,0.08)] supports-[backdrop-filter]:bg-white/70"
  >
    <nav class="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-5 sm:px-6 lg:px-8">
      <RouterLink to="/" class="flex items-center gap-3">
        <img src="/images/logo C4 TECH HUB 1.png" alt="C4 Teach Hub logo" class="h-[45px] w-[180px] rounded-[3px] p-[1px] object-cover shadow" />
      </RouterLink>
      <div class="hidden flex-1 items-center justify-center md:flex">
        <div class="flex items-center gap-1 rounded-full border border-[#096b9f]/30 bg-white/80 p-1 text-sm font-black text-slate-600 shadow-inner shadow-[#096b9f]/10">
          <template v-for="link in navLinks" :key="link.label">
            <div v-if="link.target === 'route' && link.to === '/contact'" class="relative">
              <button
                ref="contactButtonRef"
                type="button"
                class="rounded-full px-4 py-2 border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
                :class="
                  isContactDropdownOpen
                    ? 'border-[#096b9f] bg-[#096b9f]/10 text-[#096b9f] shadow-sm shadow-[#096b9f]/20'
                    : 'border-transparent text-slate-600 hover:text-[#096b9f] hover:border-[#0c86c3]/40 hover:bg-white'
                "
                aria-haspopup="menu"
                :aria-expanded="isContactDropdownOpen"
                @click.stop="toggleContactDropdown"
              >
                Contact
              </button>
              <div
                v-if="isContactDropdownOpen"
                ref="contactMenuRef"
                class="absolute left-0 z-30 mt-2 w-56 rounded-2xl border border-slate-300 bg-white text-slate-800 shadow-xl"
              >
                <a
                  href="https://t.me/c4techhub"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-slate-50"
                  @click="closeContactDropdown"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m3 12 17-7-4 14-4-6-5 3z" />
                  </svg>
                  Telegram Support
                </a>
                <RouterLink
                  to="/faq"
                  class="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-slate-50"
                  @click="closeContactDropdown"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  </svg>
                  FAQ
                </RouterLink>
              </div>
            </div>
            <RouterLink
              v-else-if="link.target === 'route'"
              :to="link.to"
              :class="[
                'rounded-full px-4 py-2 border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]',
                isActive(link)
                  ? 'border-[#096b9f] bg-[#096b9f]/10 text-[#096b9f] shadow-sm shadow-[#096b9f]/20'
                  : 'border-transparent text-slate-600 hover:text-[#096b9f] hover:border-[#0c86c3]/40 hover:bg-white',
              ]"
            >
              {{ link.label }}
            </RouterLink>
            <a
              v-else
              :href="link.href"
              class="rounded-full px-4 py-2 border border-transparent text-slate-600 transition hover:border-[#0c86c3]/40 hover:bg-white hover:text-[#096b9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
            >
              {{ link.label }}
            </a>
          </template>
          <button
            type="button"
            class="rounded-full px-4 py-2 border border-transparent text-slate-600 transition hover:border-[#0c86c3]/40 hover:bg-white hover:text-[#096b9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
            :class="dashboardRedirecting ? 'cursor-not-allowed opacity-70' : ''"
            :disabled="dashboardRedirecting"
            @click.prevent="handleDashboardRedirect"
          >
            Dashboard
          </button>
        </div>
      </div>
      <div class="hidden items-center md:flex">
        <RouterLink
          v-if="!isAuthenticated"
          to="/login"
          class="inline-flex items-center rounded-full border border-[#096b9f] px-4 py-2 text-xs font-black uppercase  text-[#096b9f] transition hover:border-[#096b9f] "
        >
          Sign in Accounts
        </RouterLink>
        <div v-else class="relative">
          <button
            ref="profileButtonRef"
            type="button"
            class="inline-flex items-center gap-3 rounded-full border border-slate-700 bg-white/60 px-3 py-2 text-xs font-black uppercase  text-slate-700 transition hover:border-[#23bdee] hover:text-slate-900"
            :aria-expanded="isProfileDropdownOpen"
            aria-haspopup="menu"
            @click.stop="toggleProfileDropdown"
          >
            <span
              class="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-black text-[#23bdee]"
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
              :class="isProfileDropdownOpen ? 'rotate-180 text-[#23bdee]' : 'text-slate-500'"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div
            v-if="isProfileDropdownOpen"
            ref="profileMenuRef"
            class="absolute right-0 z-20 mt-3 w-56 rounded-3xl border border-slate-800/80 bg-white p-3 text-left shadow-[0_25px_60px_rgba(5,14,32,0.6)]"
          >
            <RouterLink
              to="/account"
              class="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-white/60 hover:text-slate-900"
              @click="closeProfileDropdown"
            >
              Profile
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7" />
              </svg>
            </RouterLink>
            <button
              type="button"
              class="mt-2 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-black bg-red-500 text-white transition hover:bg-red-500/10 hover:text-slate-900"
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
        class="ml-auto inline-flex items-center rounded-xl border border-slate-700 bg-white/80 p-2 text-slate-700 md:hidden"
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
        <div class="absolute inset-0 bg-white/80 backdrop-blur-md"></div>
        <div
          class="relative w-full max-w-sm overflow-hidden rounded-[2.75rem] border border-slate-800/60 bg-white/95 p-8 text-slate-900 shadow-[0_45px_120px_rgba(3,12,33,0.85)]"
        >
          <div class="mb-8 flex items-center justify-between">
            <p class="text-xs font-black uppercase  text-[#0c86c3]">Menu</p>
            <button
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-white/70 text-slate-600 transition hover:border-slate-500 hover:text-slate-900"
              aria-label="Close menu"
              @click="closeMobileNav"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav class="space-y-3 text-sm font-black uppercase  text-slate-700">
            <template v-for="link in navLinks" :key="`mobile-${link.label}`">
              <div v-if="link.target === 'route' && link.to === '/contact'" class="space-y-[3px]">
                <a
                  href="https://t.me/c4techhub"
                  target="_blank"
                  rel="noopener noreferrer"
                  :class="[
                  'flex items-center gap-2 rounded-2xl px-5 py-4 border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]',
                  isActive(link)
                    ? 'border-[#096b9f] bg-[#096b9f]/10 text-[#096b9f]'
                    : 'border-transparent hover:border-[#0c86c3]/40 hover:bg-white/70 hover:text-[#096b9f]',
                ]"
                  @click="closeMobileNav"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m3 12 17-7-4 14-4-6-5 3z" />
                  </svg>
                  <span class="font-black uppercase">Telegram Support</span>
                </a>
                <RouterLink
                  to="/faq"
                  :class="[
                  'flex items-center gap-2 rounded-2xl px-5 py-4 border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]',
                  isActive(link)
                    ? 'border-[#096b9f] bg-[#096b9f]/10 text-[#096b9f]'
                    : 'border-transparent hover:border-[#0c86c3]/40 hover:bg-white/70 hover:text-[#096b9f]',
                ]"
                  @click="closeMobileNav"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  </svg>
                  <span class="font-black uppercase">FAQ</span>
                </RouterLink>
              </div>
              <RouterLink
                v-else-if="link.target === 'route'"
                :to="link.to"
                :class="[
                  'block rounded-2xl px-5 py-4 border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]',
                  isActive(link)
                    ? 'border-[#096b9f] bg-[#096b9f]/10 text-[#096b9f]'
                    : 'border-transparent hover:border-[#0c86c3]/40 hover:bg-white/70 hover:text-[#096b9f]',
                ]"
                @click="closeMobileNav"
              >
                {{ link.label }}
              </RouterLink>
              <a
                v-else
                :href="link.href"
                class="block rounded-2xl px-5 py-4 border border-transparent transition hover:border-[#0c86c3]/40 hover:bg-white/70 hover:text-[#096b9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
                @click="closeMobileNav"
              >
                {{ link.label }}
              </a>
            </template>
            <button
              type="button"
              class="block w-full  rounded-2xl px-5 py-4 border border-transparent text-left transition hover:border-[#0c86c3]/40 hover:bg-white/70 hover:text-[#096b9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
              :class="dashboardRedirecting ? 'cursor-not-allowed opacity-70' : ''"
              :disabled="dashboardRedirecting"
              @click="() => { closeMobileNav(); handleDashboardRedirect(); }"
            >
              Dashboard
            </button>
          </nav>
          <RouterLink
            v-if="!isAuthenticated"
            to="/login"
            class="mt-10 flex w-full justify-center rounded-full border border-emerald-400/40 px-5 py-3 text-xs font-black uppercase  text-emerald-200 transition hover:border-emerald-300 hover:text-slate-900"
            @click="closeMobileNav"
          >
            Sign in Accounts
          </RouterLink>
          <div v-else class="mt-10 space-y-3">
            <RouterLink
              to="/account"
              class="flex w-full justify-center rounded-full  px-5 py-3 text-[14px] font-black uppercase  text-white bg-[#279dc2] transition hover:border-[#23bdee] hover:text-slate-900"
              @click="closeMobileNav"
            >
              Accounts Profile
            </RouterLink>
            <button
              type="button"
              class="w-full rounded-full border border-red-400/40 px-5 py-3 text-[14px] font-black uppercase  text-white bg-red-500 transition hover:border-red-300 hover:text-slate-900"
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
