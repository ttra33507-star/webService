<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuth } from '../../composables/useAuth';
import { getPortalBaseUrl, requestSsoTicket, buildPortalCallbackUrl } from '../../services/authService';
import LanguageSwitcher from './LanguageSwitcher.vue';
import accountAvatar from '../../assets/boy.png';

type NavLink =
  | { label: string; target: 'route'; to: string }
  | { label: string; target: 'anchor'; href: string };

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n({ useScope: 'global' });

const appendPath = (base: string, path: string) => {
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const portalBaseUrl = getPortalBaseUrl();
const portalFallbackUrl = portalBaseUrl ? portalBaseUrl.replace(/\/+$/, '') : 'https://apps.c4techhub.com';
const portalSignupUrl = appendPath(portalBaseUrl || portalFallbackUrl, '/signup');
const dashboardRedirecting = ref(false);
const emailSupportAddress = 'c4techhub.info@gmail.com';
const showEmailSupportModal = ref(false);
const copyStatus = ref('');
let copyStatusTimeout: ReturnType<typeof setTimeout> | null = null;

const navLinks: NavLink[] = [
  { label: 'nav.home', target: 'route', to: '/' },
  // { label: 'Plans', target: 'route', to: '/plans' },
  { label: 'nav.services', target: 'route', to: '/services' },
  { label: 'nav.contact', target: 'route', to: '/contact' },
];

const isMobileNavOpen = ref(false);
const isProfileDropdownOpen = ref(false);
const isContactDropdownOpen = ref(false);
const isMobileContactOpen = ref(false);
const desktopNavPillRef = ref<HTMLElement | null>(null);
const profileMenuRef = ref<HTMLElement | null>(null);
const profileButtonRef = ref<HTMLElement | null>(null);
const contactMenuRef = ref<HTMLElement | null>(null);
const contactButtonRef = ref<HTMLElement | null>(null);
const { isAuthenticated, signOut, authState } = useAuth();
let ignoreNextOutsideClick = false;

const DASHBOARD_NAV_KEY = '__dashboard';
const navItemEls = new Map<string, HTMLElement>();
const hoveredNavKey = ref<string | null>(null);
const desktopNavIndicator = ref({ x: 0, width: 0, opacity: 0 });

let navIndicatorRaf: number | null = null;
let navResizeObserver: ResizeObserver | null = null;

const unwrapHTMLElement = (value: unknown): HTMLElement | null => {
  if (!value) return null;
  if (value instanceof HTMLElement) return value;
  const maybeEl = (value as { $el?: unknown } | null)?.$el;
  return maybeEl instanceof HTMLElement ? maybeEl : null;
};

const setNavItemRef = (key: string) => (value: unknown) => {
  const el = unwrapHTMLElement(value);
  if (el) {
    navItemEls.set(key, el);
    return;
  }
  navItemEls.delete(key);
};

const setContactButtonRef = (value: unknown) => {
  const el = unwrapHTMLElement(value);
  contactButtonRef.value = el;
  if (el) {
    navItemEls.set('/contact', el);
    return;
  }
  navItemEls.delete('/contact');
};

const nodeContains = (container: unknown, target: Node) => {
  const hasContains = (value: unknown): value is { contains: (node: Node) => boolean } =>
    !!value && typeof (value as { contains?: unknown }).contains === 'function';

  if (Array.isArray(container)) {
    return container.some((entry) => hasContains(entry) && entry.contains(target));
  }

  if (hasContains(container)) {
    return container.contains(target);
  }

  const maybeEl = (container as { $el?: unknown } | null)?.$el;
  if (hasContains(maybeEl)) {
    return maybeEl.contains(target);
  }

  return false;
};

const normalizePath = (path: string) => {
  const clean = path.split(/[?#]/)[0]?.replace(/\/+$/, '') ?? '';
  return clean.length ? clean : '/';
};

const isRouteMatch = (to: string, currentPath: string) => {
  const targetPath = normalizePath(to);
  const routePath = normalizePath(currentPath);
  if (targetPath === '/') return routePath === '/';
  return routePath === targetPath || routePath.startsWith(`${targetPath}/`);
};

const isContactActive = computed(() => isContactDropdownOpen.value || route.path === '/faq');

const isActive = (link: NavLink) => {
  if (link.target !== 'route') {
    return false;
  }
  if (link.to === '/contact') {
    return isContactActive.value;
  }
  return isRouteMatch(link.to, route.path);
};

const activeNavKey = computed(() => {
  if (isContactActive.value) return '/contact';
  const match = navLinks.find(
    (link) => link.target === 'route' && link.to !== '/contact' && isRouteMatch(link.to, route.path),
  );
  if (match?.target === 'route') {
    return match.to;
  }
  return null;
});

const currentNavKey = computed(() => hoveredNavKey.value ?? activeNavKey.value);

const desktopNavIndicatorStyle = computed(() => ({
  width: `${desktopNavIndicator.value.width}px`,
  transform: `translateX(${desktopNavIndicator.value.x}px)`,
  opacity: String(desktopNavIndicator.value.opacity),
  willChange: 'transform, width',
}));

const setHoveredNavKey = (key: string | null) => {
  hoveredNavKey.value = key;
};

const clearNavHover = () => {
  hoveredNavKey.value = null;
};

const handleDesktopNavFocusOut = (event: FocusEvent) => {
  const next = event.relatedTarget as Node | null;
  if (next && desktopNavPillRef.value?.contains(next)) {
    return;
  }
  clearNavHover();
};

const updateDesktopNavIndicator = () => {
  const container = desktopNavPillRef.value;
  if (!container) {
    desktopNavIndicator.value.opacity = 0;
    return;
  }

  const key = currentNavKey.value;
  if (!key) {
    desktopNavIndicator.value.opacity = 0;
    return;
  }

  const targetEl = navItemEls.get(key);
  if (!targetEl) {
    desktopNavIndicator.value.opacity = 0;
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();
  const width = targetRect.width;
  const x = targetRect.left - containerRect.left;

  if (!Number.isFinite(width) || !Number.isFinite(x) || width <= 0 || containerRect.width <= 0) {
    desktopNavIndicator.value.opacity = 0;
    return;
  }

  desktopNavIndicator.value = { x, width, opacity: 1 };
};

const scheduleDesktopNavIndicatorUpdate = async (options?: { awaitDom?: boolean }) => {
  if (options?.awaitDom) {
    await nextTick();
  }

  if (navIndicatorRaf !== null) {
    cancelAnimationFrame(navIndicatorRaf);
  }

  navIndicatorRaf = requestAnimationFrame(() => {
    navIndicatorRaf = null;
    updateDesktopNavIndicator();
  });
};

const MOBILE_TELEGRAM_KEY = '__telegram';
const MOBILE_EMAIL_SUPPORT_KEY = '__email_support';
const MOBILE_FAQ_KEY = '/faq';

const mobileNavListRef = ref<HTMLElement | null>(null);
const mobileNavItemEls = new Map<string, HTMLElement>();
const hoveredMobileNavKey = ref<string | null>(null);
const mobileNavIndicator = ref({ y: 0, height: 0, opacity: 0 });

let mobileNavIndicatorRaf: number | null = null;

const setMobileNavItemRef = (key: string) => (value: unknown) => {
  const el = unwrapHTMLElement(value);
  if (el) {
    mobileNavItemEls.set(key, el);
    return;
  }
  mobileNavItemEls.delete(key);
};

const mobileActiveNavKey = computed(() => {
  if (route.path === MOBILE_FAQ_KEY) return MOBILE_FAQ_KEY;
  const match = navLinks.find(
    (link) => link.target === 'route' && link.to !== '/contact' && isRouteMatch(link.to, route.path),
  );
  if (match?.target === 'route') {
    return match.to;
  }
  return null;
});

const currentMobileNavKey = computed(() => hoveredMobileNavKey.value ?? mobileActiveNavKey.value);

const mobileNavIndicatorStyle = computed(() => ({
  height: `${mobileNavIndicator.value.height}px`,
  transform: `translate3d(0, ${mobileNavIndicator.value.y}px, 0)`,
  opacity: String(mobileNavIndicator.value.opacity),
  willChange: 'transform, height',
}));

const setHoveredMobileNavKey = (key: string | null) => {
  hoveredMobileNavKey.value = key;
};

const clearMobileNavHover = () => {
  hoveredMobileNavKey.value = null;
};

const handleMobileNavFocusOut = (event: FocusEvent) => {
  const next = event.relatedTarget as Node | null;
  if (next && mobileNavListRef.value?.contains(next)) {
    return;
  }
  clearMobileNavHover();
};

const updateMobileNavIndicator = () => {
  const container = mobileNavListRef.value;
  if (!container || !isMobileNavOpen.value) {
    mobileNavIndicator.value.opacity = 0;
    return;
  }

  const key = currentMobileNavKey.value;
  if (!key) {
    mobileNavIndicator.value.opacity = 0;
    return;
  }

  const targetEl = mobileNavItemEls.get(key);
  if (!targetEl) {
    mobileNavIndicator.value.opacity = 0;
    return;
  }

  const height = targetEl.offsetHeight;
  const y = targetEl.offsetTop;
  if (!Number.isFinite(height) || !Number.isFinite(y) || height <= 0) {
    mobileNavIndicator.value.opacity = 0;
    return;
  }

  mobileNavIndicator.value = { y, height, opacity: 1 };
};

const scheduleMobileNavIndicatorUpdate = async (options?: { awaitDom?: boolean }) => {
  if (options?.awaitDom) {
    await nextTick();
  }

  if (mobileNavIndicatorRaf !== null) {
    cancelAnimationFrame(mobileNavIndicatorRaf);
  }

  mobileNavIndicatorRaf = requestAnimationFrame(() => {
    mobileNavIndicatorRaf = null;
    updateMobileNavIndicator();
  });
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

const openEmailSupportModal = () => {
  showEmailSupportModal.value = true;
  copyStatus.value = '';
  closeContactDropdown();
  closeMobileNav();
};

const closeEmailSupportModal = () => {
  showEmailSupportModal.value = false;
  if (copyStatusTimeout) {
    clearTimeout(copyStatusTimeout);
    copyStatusTimeout = null;
  }
};

const copyEmailSupport = async () => {
  const email = emailSupportAddress;
  const setCopied = (message: string) => {
    copyStatus.value = message;
    if (copyStatusTimeout) clearTimeout(copyStatusTimeout);
    copyStatusTimeout = setTimeout(() => {
      copyStatus.value = '';
    }, 2000);
  };

  try {
    await navigator.clipboard.writeText(email);
    setCopied(t('header.copiedToClipboard'));
    return;
  } catch {
    // fall back to execCommand for older browsers
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = email;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    setCopied(t('header.copiedToClipboard'));
  } catch {
    setCopied(t('header.unableToCopyAutomatically'));
  }
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
    closeEmailSupportModal();
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
  if (nodeContains(contactButtonRef.value, target)) {
    return;
  }
  if (nodeContains(contactMenuRef.value, target)) {
    return;
  }
  if (nodeContains(profileButtonRef.value, target)) {
    return;
  }
  if (nodeContains(profileMenuRef.value, target)) {
    return;
  }
  closeProfileDropdown();
  closeContactDropdown();
};

watch(isMobileNavOpen, (open) => {
  document.body.classList.toggle('overflow-hidden', open);
  if (open) {
    clearMobileNavHover();
    scheduleMobileNavIndicatorUpdate({ awaitDom: true });
  } else {
    clearMobileNavHover();
    mobileNavIndicator.value.opacity = 0;
  }
});

watch(
  () => route.path,
  () => {
    closeMobileNav();
    closeProfileDropdown();
    closeContactDropdown();
    closeEmailSupportModal();
    scheduleDesktopNavIndicatorUpdate({ awaitDom: true });
  },
);

watch(locale, () => {
  scheduleDesktopNavIndicatorUpdate({ awaitDom: true });
  scheduleMobileNavIndicatorUpdate({ awaitDom: true });
});

watch(currentNavKey, () => {
  scheduleDesktopNavIndicatorUpdate();
});

watch(currentMobileNavKey, () => {
  scheduleMobileNavIndicatorUpdate();
});

watch(isAuthenticated, (authed) => {
  if (!authed) {
    closeProfileDropdown();
  }
});

onMounted(() => {
  window.addEventListener('keydown', handleEscape);
  window.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', updateDesktopNavIndicator);
  window.addEventListener('resize', updateMobileNavIndicator);

  if (typeof ResizeObserver !== 'undefined') {
    navResizeObserver = new ResizeObserver(() => {
      scheduleDesktopNavIndicatorUpdate();
    });
    if (desktopNavPillRef.value) {
      navResizeObserver.observe(desktopNavPillRef.value);
    }
  }

  scheduleDesktopNavIndicatorUpdate({ awaitDom: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape);
  window.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', updateDesktopNavIndicator);
  window.removeEventListener('resize', updateMobileNavIndicator);
  if (navIndicatorRaf !== null) {
    cancelAnimationFrame(navIndicatorRaf);
  }
  if (mobileNavIndicatorRaf !== null) {
    cancelAnimationFrame(mobileNavIndicatorRaf);
  }
  navResizeObserver?.disconnect();
  navResizeObserver = null;
  document.body.classList.remove('overflow-hidden');
});
</script>

<template>
  <header
    class="sticky top-0 z-40 md:sticky md:top-0 md:z-40 border-b border-white bg-white/80 font-black backdrop-blur-md shadow-[0_8px_30px_rgba(15,23,42,0.08)] supports-[backdrop-filter]:bg-white/70"
  >
    <nav class="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-5 sm:px-6 lg:px-8">
      <RouterLink to="/" class="group flex items-center gap-3" data-aos="zoom-in">
        <span class="header-logo-frame h-[45px] w-[180px] rounded-[3px] bg-white p-[1px]">
          <span class="header-logo-typing">
            <img
              src="/images/logo C4 TECH HUB 1.png"
              alt="C4 Teach Hub logo"
              class="header-logo-img h-full w-full rounded-[2px] object-cover"
            />
          </span>
        </span>
      </RouterLink>
      <div class="hidden flex-1 items-center justify-center md:flex">
        <div
          ref="desktopNavPillRef"
          class="relative flex items-center gap-1 rounded-full border border-[#096b9f]/30 bg-white/80 p-1 text-sm font-black text-slate-600 shadow-inner shadow-[#096b9f]/10"
          @mouseleave="clearNavHover"
          @focusout="handleDesktopNavFocusOut"
        >
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-y-1 left-0 z-0 rounded-full border border-[#096b9f] bg-[#096b9f]/10 shadow-sm shadow-[#096b9f]/20 transition-[width,transform,opacity] duration-300 ease-out motion-reduce:transition-none"
            :style="desktopNavIndicatorStyle"
          ></div>
          <template v-for="link in navLinks" :key="link.label">
            <div v-if="link.target === 'route' && link.to === '/contact'" class="relative">
		              <button
		                :ref="setContactButtonRef"
		                type="button"
		                class="c4-border-attention relative z-10 inline-flex items-center rounded-full border border-transparent px-4 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
		                :class="
		                  isContactActive
		                    ? 'text-[#096b9f]'
		                    : 'text-slate-600 hover:text-[#096b9f]'
		                "
		                aria-haspopup="menu"
		                :aria-expanded="isContactDropdownOpen"
		                @click.stop="toggleContactDropdown"
		                @mouseenter="setHoveredNavKey('/contact')"
		                @focus="setHoveredNavKey('/contact')"
		              >
		                {{ t(link.label) }}
		              </button>
              <Transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0 -translate-y-1 scale-95"
                enter-to-class="opacity-100 translate-y-0 scale-100"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100 translate-y-0 scale-100"
                leave-to-class="opacity-0 -translate-y-1 scale-95"
              >
                <div
                  v-if="isContactDropdownOpen"
                  ref="contactMenuRef"
                  class="absolute left-0 z-30 mt-2 w-56 origin-top-left rounded-2xl border border-slate-300 bg-white text-slate-800 shadow-xl"
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
                    {{ t('header.telegramSupport') }}
                  </a>
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-slate-50"
                    @click="openEmailSupportModal"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M21.75 6.75v10.5a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5V6.75m18 0A1.5 1.5 0 0 0 20.25 5.25h-16.5A1.5 1.5 0 0 0 2.25 6.75m18 0v.243a1.5 1.5 0 0 1-.63 1.218l-7.5 5.25a1.5 1.5 0 0 1-1.74 0l-7.5-5.25a1.5 1.5 0 0 1-.63-1.218V6.75"
                      />
                    </svg>
                    {{ t('header.emailSupport') }}
                  </button>
                  <RouterLink
                    to="/faq"
                    class="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-slate-50"
                    @click="closeContactDropdown"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                    </svg>
                    {{ t('footer.faq') }}
                  </RouterLink>
                </div>
              </Transition>
            </div>
                <RouterLink v-else-if="link.target === 'route'" :to="link.to" custom v-slot="{ href, navigate }">
                  <a
                    :href="href"
                    :ref="setNavItemRef(link.to)"
                    class="relative z-10 inline-flex items-center rounded-full border border-transparent px-4 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
                    :class="isActive(link) ? 'text-[#096b9f]' : 'text-slate-600 hover:text-[#096b9f]'"
                    @click="navigate"
                    @mouseenter="setHoveredNavKey(link.to)"
                    @focus="setHoveredNavKey(link.to)"
                  >
                    {{ t(link.label) }}
                  </a>
                </RouterLink>
            <a
              v-else
              :href="link.href"
              :ref="setNavItemRef(link.href)"
              class="relative z-10 inline-flex items-center rounded-full border border-transparent px-4 py-2 text-slate-600 transition-colors hover:text-[#096b9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
              @mouseenter="setHoveredNavKey(link.href)"
              @focus="setHoveredNavKey(link.href)"
            >
              {{ t(link.label) }}
            </a>
          </template>
          <button
            type="button"
            :ref="setNavItemRef(DASHBOARD_NAV_KEY)"
            class="relative z-10 inline-flex items-center rounded-full border border-transparent px-4 py-2 text-slate-600 transition-colors hover:text-[#096b9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
            :class="dashboardRedirecting ? 'cursor-not-allowed opacity-70' : ''"
	          :disabled="dashboardRedirecting"
	          @click.prevent="handleDashboardRedirect"
            @mouseenter="setHoveredNavKey(DASHBOARD_NAV_KEY)"
            @focus="setHoveredNavKey(DASHBOARD_NAV_KEY)"
	        >
	          {{ t('header.dashboard') }}
	        </button>
	      </div>
	    </div>
	    <div class="hidden items-center md:flex">
        <LanguageSwitcher class="mr-2" />
	        <RouterLink
	          v-if="!isAuthenticated"
	          :to="{ path: '/signin', query: { redirect: '/' } }"
	          class="inline-flex items-center rounded-full border border-[#096b9f] px-4 py-2 text-xs font-black uppercase  text-[#096b9f] transition hover:border-[#096b9f] "
	        >
	          {{ t('header.login') }}
	        </RouterLink>
	        <a
	          v-if="!isAuthenticated"
          :href="portalSignupUrl"
          target="_blank"
	          rel="noopener noreferrer"
	          class="ml-2 inline-flex items-center rounded-full border border-[#096b9f] bg-[#096b9f] px-4 py-2 text-xs font-black uppercase text-white transition hover:border-[#0c86c3] hover:bg-[#0c86c3]"
	        >
	          {{ t('header.register') }}
	        </a>
	        <div v-else class="relative">
	          <button
	            ref="profileButtonRef"
	            type="button"
	            class="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-white/60 px-3 py-2 text-xs font-black uppercase  text-slate-700 transition hover:border-[#23bdee] hover:text-slate-900"
	            :aria-expanded="isProfileDropdownOpen"
	            :aria-label="t('header.accounts')"
	            aria-haspopup="menu"
	            @click.stop="toggleProfileDropdown"
	          >
		            <span
		              class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/20 shadow-sm"
		            >
		              <img :src="accountAvatar" alt="" class="h-full w-full object-cover" />
		            </span>
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
          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 -translate-y-1 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-1 scale-95"
          >
            <div
              v-if="isProfileDropdownOpen"
              ref="profileMenuRef"
              class="absolute right-0 z-20 mt-3 w-56 origin-top-right rounded-3xl border border-slate-800/80 bg-white p-3 text-left shadow-[0_25px_60px_rgba(5,14,32,0.6)]"
            >
              <RouterLink
                to="/account"
                class="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-white/60 hover:text-slate-900"
                @click="closeProfileDropdown"
              >
                {{ t('header.profile') }}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7" />
                </svg>
              </RouterLink>
              <button
                type="button"
                class="mt-2 flex w-full items-center justify-between rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-500/10 hover:text-slate-900"
                @click="handleSignOut"
              >
                {{ t('header.signOut') }}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7" />
                </svg>
              </button>
            </div>
          </Transition>
        </div>
      </div>
	      <button
	        type="button"
	        class="ml-auto inline-flex items-center rounded-xl border border-slate-700 bg-white/80 p-2 text-slate-700 md:hidden"
	        :aria-label="t('header.toggleMenu')"
	        :aria-expanded="isMobileNavOpen"
	        @click="toggleMobileNav"
	      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </nav>
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-show="isMobileNavOpen"
          class="fixed inset-0 z-50 flex items-center justify-center px-5 py-8"
          @click.self="closeMobileNav"
        >
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div v-if="isMobileNavOpen" class="absolute inset-0 bg-white/80 backdrop-blur-md"></div>
          </Transition>
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-3 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 translate-y-3 scale-95"
          >
            <div
              v-if="isMobileNavOpen"
              class="relative w-full max-w-sm overflow-hidden rounded-[2.75rem] border border-slate-800/60 bg-white/95 p-8 text-slate-900 shadow-[0_45px_120px_rgba(3,12,33,0.85)]"
            >
	          <div class="mb-8 flex items-center justify-between">
	            <p class="text-xs font-black uppercase  text-[#0c86c3]">{{ t('header.menu') }}</p>
	            <div class="flex items-center gap-3">
	              <LanguageSwitcher />
	              <button
	                type="button"
	                class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-white/70 text-slate-600 transition hover:border-slate-500 hover:text-slate-900"
	                :aria-label="t('header.closeMenu')"
	                @click="closeMobileNav"
	              >
	                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
	                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
	                </svg>
	              </button>
	            </div>
	          </div>
          <nav class="text-sm font-black uppercase text-slate-700">
            <div
              ref="mobileNavListRef"
              class="relative"
              @mouseleave="clearMobileNavHover"
              @focusout="handleMobileNavFocusOut"
            >
              <div
                aria-hidden="true"
                class="pointer-events-none absolute inset-x-0 top-0 z-0 rounded-2xl border border-[#096b9f]/60 bg-[#096b9f]/10 shadow-sm shadow-[#096b9f]/20 transition-[transform,height,opacity] duration-300 ease-out motion-reduce:transition-none"
                :style="mobileNavIndicatorStyle"
              ></div>
              <div class="space-y-3">
                <template v-for="(link, index) in navLinks" :key="`mobile-${link.label}`">
                  <div v-if="link.target === 'route' && link.to === '/contact'" class="space-y-[3px]">
                    <a
                      :ref="setMobileNavItemRef(MOBILE_TELEGRAM_KEY)"
                      href="https://t.me/c4techhub"
                      target="_blank"
                      rel="noopener noreferrer"
                      :style="{ '--i': index }"
                      class="mobile-menu-item relative z-10 flex items-center gap-2 rounded-2xl border border-transparent px-5 py-4 transition active:scale-[0.98] hover:text-[#096b9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
                      @pointerenter="setHoveredMobileNavKey(MOBILE_TELEGRAM_KEY)"
                      @pointerdown="setHoveredMobileNavKey(MOBILE_TELEGRAM_KEY)"
                      @focus="setHoveredMobileNavKey(MOBILE_TELEGRAM_KEY)"
                      @click="closeMobileNav"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m3 12 17-7-4 14-4-6-5 3z" />
                      </svg>
                      <span class="font-black uppercase">{{ t('header.telegramSupport') }}</span>
                    </a>
                    <button
                      :ref="setMobileNavItemRef(MOBILE_EMAIL_SUPPORT_KEY)"
                      type="button"
                      :style="{ '--i': index + 1 }"
                      class="mobile-menu-item relative z-10 flex w-full items-center gap-2 rounded-2xl border border-transparent px-5 py-4 text-left transition active:scale-[0.98] hover:text-[#096b9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
                      @pointerenter="setHoveredMobileNavKey(MOBILE_EMAIL_SUPPORT_KEY)"
                      @pointerdown="setHoveredMobileNavKey(MOBILE_EMAIL_SUPPORT_KEY)"
                      @focus="setHoveredMobileNavKey(MOBILE_EMAIL_SUPPORT_KEY)"
                      @click="openEmailSupportModal"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M21.75 6.75v10.5a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5V6.75m18 0A1.5 1.5 0 0 0 20.25 5.25h-16.5A1.5 1.5 0 0 0 2.25 6.75m18 0v.243a1.5 1.5 0 0 1-.63 1.218l-7.5 5.25a1.5 1.5 0 0 1-1.74 0l-7.5-5.25a1.5 1.5 0 0 1-.63-1.218V6.75"
                        />
                      </svg>
                      <span class="font-black uppercase">{{ t('header.emailSupport') }}</span>
                    </button>
                    <RouterLink
                      :ref="setMobileNavItemRef(MOBILE_FAQ_KEY)"
                      to="/faq"
                      :style="{ '--i': index + 2 }"
                      class="mobile-menu-item relative z-10 flex items-center gap-2 rounded-2xl border border-transparent px-5 py-4 transition active:scale-[0.98] hover:text-[#096b9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
                      :class="route.path === MOBILE_FAQ_KEY ? 'text-[#096b9f]' : ''"
                      @pointerenter="setHoveredMobileNavKey(MOBILE_FAQ_KEY)"
                      @pointerdown="setHoveredMobileNavKey(MOBILE_FAQ_KEY)"
                      @focus="setHoveredMobileNavKey(MOBILE_FAQ_KEY)"
                      @click="closeMobileNav"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                      </svg>
                      <span class="font-black uppercase">{{ t('footer.faq') }}</span>
                    </RouterLink>
                  </div>
                  <RouterLink
                    v-else-if="link.target === 'route'"
                    :ref="setMobileNavItemRef(link.to)"
                    :to="link.to"
                    :style="{ '--i': index }"
                    class="mobile-menu-item relative z-10 block rounded-2xl border border-transparent px-5 py-4 transition active:scale-[0.98] hover:text-[#096b9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
                    :class="isActive(link) ? 'text-[#096b9f]' : ''"
                    @pointerenter="setHoveredMobileNavKey(link.to)"
                    @pointerdown="setHoveredMobileNavKey(link.to)"
                    @focus="setHoveredMobileNavKey(link.to)"
                    @click="closeMobileNav"
                  >
                    {{ t(link.label) }}
                  </RouterLink>
                  <a
                    v-else
                    :ref="setMobileNavItemRef(link.href)"
                    :href="link.href"
                    :style="{ '--i': index }"
                    class="mobile-menu-item relative z-10 block rounded-2xl border border-transparent px-5 py-4 transition active:scale-[0.98] hover:text-[#096b9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
                    @pointerenter="setHoveredMobileNavKey(link.href)"
                    @pointerdown="setHoveredMobileNavKey(link.href)"
                    @focus="setHoveredMobileNavKey(link.href)"
                    @click="closeMobileNav"
                  >
                    {{ t(link.label) }}
                  </a>
                </template>
                <button
                  type="button"
                  :ref="setMobileNavItemRef(DASHBOARD_NAV_KEY)"
                  :style="{ '--i': navLinks.length + 2 }"
                  class="mobile-menu-item relative z-10 block w-full rounded-2xl border border-transparent px-5 py-4 text-left transition active:scale-[0.98] hover:text-[#096b9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
                  :class="dashboardRedirecting ? 'cursor-not-allowed opacity-70' : ''"
                  :disabled="dashboardRedirecting"
                  @pointerenter="setHoveredMobileNavKey(DASHBOARD_NAV_KEY)"
                  @pointerdown="setHoveredMobileNavKey(DASHBOARD_NAV_KEY)"
                  @focus="setHoveredMobileNavKey(DASHBOARD_NAV_KEY)"
                  @click="() => { closeMobileNav(); handleDashboardRedirect(); }"
                >
                  {{ t('header.dashboard') }}
                </button>
              </div>
            </div>
          </nav>
          <RouterLink
            v-if="!isAuthenticated"
            :to="{ path: '/signin', query: { redirect: '/' } }"
            :style="{ '--i': navLinks.length + 3 }"
            class="mobile-menu-item mt-10 flex w-full justify-center rounded-full border border-[#096b9f]/40 px-5 py-3 text-xs font-black uppercase tracking-[2px]  bg-[#096b9f] text-white transition active:scale-[0.98] hover:border-[#096b9f]/90"
            @click="closeMobileNav"
	          >
	            {{ t('header.login') }}
	          </RouterLink>
          <a
            v-if="!isAuthenticated"
            :href="portalSignupUrl"
            target="_blank"
            rel="noopener noreferrer"
            :style="{ '--i': navLinks.length + 4 }"
            class="mobile-menu-item mt-3 flex w-full justify-center rounded-full border border-[#096b9f] bg-[#096b9f] px-5 py-3 text-xs font-black uppercase tracking-[2px] text-white transition active:scale-[0.98] hover:border-[#0c86c3] hover:bg-[#0c86c3]"
            @click="closeMobileNav"
	          >
	            {{ t('header.register') }}
	          </a>
          <div v-else class="mt-10 space-y-3">
            <RouterLink
              to="/account"
              :style="{ '--i': navLinks.length + 3 }"
              class="mobile-menu-item flex w-full justify-center rounded-full  px-5 py-3 text-[14px] font-black uppercase  text-white bg-[#279dc2] transition active:scale-[0.98] hover:border-[#23bdee]"
              @click="closeMobileNav"
	            >
	              {{ t('header.accountsProfile') }}
	            </RouterLink>
            <button
              type="button"
              :style="{ '--i': navLinks.length + 4 }"
              class="mobile-menu-item w-full rounded-full border border-red-400/40 px-5 py-3 text-[14px] font-black uppercase  text-white bg-red-500 transition active:scale-[0.98] hover:border-red-300"
              @click="handleSignOut"
	            >
	              {{ t('header.signOut') }}
	            </button>
          </div>
        </div>
        </Transition>
      </div>
    </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showEmailSupportModal" class="fixed inset-0 z-[1200] flex items-center justify-center px-4">
          <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="closeEmailSupportModal"></div>
          <div class="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
	          <div class="flex items-start justify-between gap-3">
	            <div>
	              <p class="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{{ t('header.emailSupport') }}</p>
	              <p class="mt-1 text-lg font-black text-slate-900">{{ emailSupportAddress }}</p>
	            </div>
	            <button
              type="button"
              class="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
	              :aria-label="t('header.closeEmailSupportDialog')"
	              @click="closeEmailSupportModal"
	            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
	          </div>
	          <p class="mt-3 text-sm text-slate-600">
	            {{ t('header.tapCopyToEmail') }}
	          </p>
          <div class="mt-4 flex flex-wrap items-center gap-3">
            <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-700">
              {{ emailSupportAddress }}
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-[#096b9f] bg-[#096b9f] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#0c86c3] hover:bg-[#0c86c3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
              @click="copyEmailSupport"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7.5A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19h9a2.5 2.5 0 0 0 2.5-2.5V15" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 5h4v4m0-4L11 13" />
	              </svg>
	              {{ t('header.copyEmail') }}
	            </button>
	          </div>
          <p v-if="copyStatus" class="mt-2 text-xs font-semibold text-emerald-600">
            {{ copyStatus }}
          </p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>
