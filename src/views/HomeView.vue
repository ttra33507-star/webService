<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { fetchBestsellerServices } from '../services/catalogService';
import type { ServiceRecord } from '../types/service';

type HeroHighlightIcon = 'clock' | 'check' | 'trend';

interface HeroHighlight {
  text: string;
  classes: string;
  icon?: HeroHighlightIcon;
}

interface HeroSlide {
  id: string;
  badgeLabel: string;
  badgeClasses: string;
  gradient: string;
  title: string;
  description: string;
  highlights: HeroHighlight[];
  image: {
    src: string;
    alt: string;
    shadow: string;
  };
}

interface FeaturedServiceCard {
  id: number;
  title: string;
  tagline: string;
  description: string;
  price: string;
  image: {
    src: string;
    alt: string;
  };
  iconUrl?: string;
  service: ServiceRecord;
}

type ServiceImagery = { src: string; alt: string };

const heroSlides: HeroSlide[] = [
  {
    id: 'managed-checkout',
    badgeLabel: 'Managed Checkout',
    badgeClasses: 'border-[#096b9f]/35 bg-white/70 text-[#096b9f]',
    gradient: 'from-[#096b9f]/20 via-slate-950/80 to-slate-950',
    title: 'Creative Facebook automation tools.',
    description:
      'Create and launch Facebook automation workflows with smart messaging, audience syncing, and creative monitoring in one place.',
    highlights: [
      {
        text: 'Go live in under 48 hours',
        classes: 'rounded-xl border border-[#096b9f]/35 bg-[#096b9f]/10 px-3 py-2 font-medium text-[#096b9f]',
        icon: 'clock',
      },
      {
        text: 'No-code customization',
        classes: 'rounded-xl border border-slate-800 bg-white/70 px-3 py-2',
      },
    ],
    image: {
      src: '/images/C4-FB-Station.png',
      alt: 'Managed checkout dashboard preview',
      shadow: 'shadow-[#096b9f]/10',
    },
  },
  {
    id: 'commerce-playbooks',
    badgeLabel: 'Commerce Playbooks',
    badgeClasses: 'border-blue-400/30 bg-white/70 text-blue-200',
    gradient: 'from-blue-500/15 via-slate-950/80 to-slate-950',
    title: 'Prebuilt campaigns that convert on autopilot.',
    description:
      'Launch seasonal offers, retarget warm prospects, and run social commerce through automation built for Southeast Asia.',
    highlights: [
      {
        text: 'Templates ready to deploy',
        classes: 'rounded-xl border border-blue-400/30 bg-blue-500/10 px-3 py-2 font-medium text-blue-200',
        icon: 'check',
      },
      {
        text: 'CRM & analytics included',
        classes: 'rounded-xl border border-slate-800 bg-white/70 px-3 py-2',
      },
    ],
    image: {
      src: '/images/C4-TG-Station.png',
      alt: 'Automated campaign preview',
      shadow: 'shadow-blue-500/10',
    },
  },
  {
    id: 'real-time-insights',
    badgeLabel: 'Real-time Insights',
    badgeClasses: 'border-purple-400/30 bg-white/70 text-purple-200',
    gradient: 'from-purple-500/15 via-slate-950/80 to-slate-950',
    title: 'Monitor every transaction with mission control.',
    description:
      'Keep finance and ops aligned with live dashboards, anomaly alerts, and drill-down reporting across all channels.',
    highlights: [
      {
        text: 'Revenue pulse & trendlines',
        classes: 'rounded-xl border border-purple-400/30 bg-purple-500/10 px-3 py-2 font-medium text-purple-200',
        icon: 'trend',
      },
      {
        text: 'Export-ready reports',
        classes: 'rounded-xl border border-slate-800 bg-white/70 px-3 py-2',
      },
    ],
    image: {
      src: '/images/C4-Report-Facebook.png',
      alt: 'Insights dashboard preview',
      shadow: 'shadow-purple-500/10',
    },
  },
];

const FEATURED_SERVICE_LIMIT = 6;
const featuredServices = ref<ServiceRecord[]>([]);
const isServicesLoading = ref(true);
const servicesError = ref<string | null>(null);

const serviceImageryMap = {
  facebook: {
    src: '/images/C4-FB-Station.png',
    alt: 'Facebook automation service',
  },
  telegram: {
    src: '/images/C4-TG-Station.png',
    alt: 'Telegram automation service',
  },
  tiktok: {
    src: '/images/txt.jpg',
    alt: 'TikTok automation service',
  },
  default: {
    src: '/images/C4-Report-Facebook.png',
    alt: 'Premium automation service',
  },
} as const satisfies Record<string, ServiceImagery>;

const resolveServiceImagery = (service: ServiceRecord): ServiceImagery => {
  const key = service.mainCategory.label.toLowerCase();
  if (key in serviceImageryMap) {
    return serviceImageryMap[key as keyof typeof serviceImageryMap];
  }
  return serviceImageryMap.default;
};

const featuredServiceCards = computed<FeaturedServiceCard[]>(() =>
  featuredServices.value.map((service) => {
    const heroImage = service.iconUrl
      ? { src: service.iconUrl, alt: `${service.label} icon` }
      : resolveServiceImagery(service);
    return {
      id: service.id,
      title: service.label,
      tagline: `${service.mainCategory.label} â€¢ ${service.category.label}`,
      description: `Default quantity ${service.defaultQuantity} Â· ${service.price.formatted}`,
      price: service.price.formatted,
      image: heroImage,
      iconUrl: service.iconUrl,
      service,
    };
  }),
);

const hasFeaturedServices = computed(() => featuredServiceCards.value.length > 0);

const loadFeaturedServices = async () => {
  servicesError.value = null;
  try {
    const bestsellers = await fetchBestsellerServices();
    featuredServices.value = bestsellers.slice(0, FEATURED_SERVICE_LIMIT);
  } catch (error) {
    console.error('[Home] Failed to load featured services', error);
    servicesError.value = 'Unable to load services right now. Please try again.';
    featuredServices.value = [];
  } finally {
    isServicesLoading.value = false;
  }
};

const retryFeaturedServices = () => {
  isServicesLoading.value = true;
  return loadFeaturedServices();
};

const activeHeroSlide = ref(0);

let heroTimer: number | null = null;
const HERO_INTERVAL_MS = 4000;

const goToSlide = (index: number) => {
  const total = heroSlides.length;
  activeHeroSlide.value = ((index % total) + total) % total;
};

const startAutoSlide = () => {
  if (heroTimer !== null || heroSlides.length <= 1) {
    return;
  }
  heroTimer = window.setInterval(() => {
    goToSlide(activeHeroSlide.value + 1);
  }, HERO_INTERVAL_MS);
};

const stopAutoSlide = () => {
  if (heroTimer !== null) {
    window.clearInterval(heroTimer);
    heroTimer = null;
  }
};

const restartAutoSlide = () => {
  stopAutoSlide();
  startAutoSlide();
};

const handlePrev = () => {
  goToSlide(activeHeroSlide.value - 1);
  restartAutoSlide();
};

const handleNext = () => {
  goToSlide(activeHeroSlide.value + 1);
  restartAutoSlide();
};

const handleSelectSlide = (index: number) => {
  goToSlide(index);
  restartAutoSlide();
};

onMounted(() => {
  startAutoSlide();
  loadFeaturedServices();
});

onBeforeUnmount(() => {
  stopAutoSlide();
});
</script>

<template>
  <div>
    <section class="border-y border-slate-900/80 bg-white/60">
      <div class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <div class="max-w-3xl">
          <span class="inline-flex items-center gap-2 rounded-full border border-[#096b9f]/40 bg-[#096b9f]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#096b9f]">
            Launch faster
          </span>
          <h1 class="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl font-display">
            Everything your brand needs to sell with confidence.
          </h1>
          <p class="mt-4 text-lg leading-relaxed text-slate-600">
            Showcase products, automate fulfillment, and delight customers from a single dashboard. Explore how C4 Teach Hub streamlines every touchpoint of your payments journey.
          </p>
        </div>
        <div
          class="relative"
          @mouseenter="stopAutoSlide"
          @mouseleave="startAutoSlide"
          @touchstart.passive="stopAutoSlide"
          @touchend="startAutoSlide"
        >
          <div class="relative overflow-hidden rounded-3xl border border-slate-900/80 bg-white/40 shadow-2xl shadow-[#096b9f]/10">
            <article
              v-for="(slide, index) in heroSlides"
              :key="slide.id"
              class="grid min-h-[22rem] gap-8 bg-white px-8 py-10 transition duration-500 sm:grid-cols-[1.1fr_0.9fr] sm:px-12 sm:py-14"
              :class="[slide.gradient, index === activeHeroSlide ? 'opacity-100' : 'hidden opacity-0']"
            >
              <div class="flex flex-col justify-between gap-6">
                <div class="space-y-5">
                  <span
                    class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.4em]"
                    :class="slide.badgeClasses"
                  >
                    {{ slide.badgeLabel }}
                  </span>
                  <h2 class="text-3xl font-semibold text-slate-900 sm:text-4xl font-display">
                    {{ slide.title }}
                  </h2>
                  <p class="text-base text-slate-600 sm:text-lg">
                    {{ slide.description }}
                  </p>
                </div>
                <div class="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <span
                    v-for="highlight in slide.highlights"
                    :key="`${slide.id}-${highlight.text}`"
                    class="rounded-xl border px-3 py-2 transition"
                    :class="[highlight.classes, highlight.icon ? 'flex items-center gap-2' : '']"
                  >
                    <svg
                      v-if="highlight.icon === 'clock'"
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <svg
                      v-else-if="highlight.icon === 'check'"
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M5 13l4 4L19 7" />
                    </svg>
                    <svg
                      v-else-if="highlight.icon === 'trend'"
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M3 3v18h18" />
                    </svg>
                    {{ highlight.text }}
                  </span>
                </div>
              </div>
              <div class="relative flex items-center justify-center">
                <img
                  :src="slide.image.src"
                  :alt="slide.image.alt"
                  class="h-full max-h-[18rem] w-full max-w-[20rem] rounded-2xl border border-slate-800/80 bg-white/70 object-cover shadow-lg"
                  :class="slide.image.shadow"
                />
              </div>
            </article>
          </div>
          <button
            type="button"
            class="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-slate-800/80 bg-white/80 p-3 text-slate-700 shadow-lg transition hover:text-slate-900 lg:flex"
            aria-label="Show previous slide"
            @click="handlePrev"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            class="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-slate-800/80 bg-white/80 p-3 text-slate-700 shadow-lg transition hover:text-slate-900 lg:flex"
            aria-label="Show next slide"
            @click="handleNext"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 6l6 6-6 6" />
            </svg>
          </button>
          <div class="mt-6 flex justify-center gap-3">
            <button
              v-for="(slide, index) in heroSlides"
              :key="`dot-${slide.id}`"
              type="button"
              class="h-3 w-3 rounded-full border transition"
              :class="
                index === activeHeroSlide
                  ? 'border-[#096b9f]/60 bg-[#096b9f]'
                  : 'border-slate-700 bg-white/80 hover:border-[#0fa6ef]/60 hover:bg-white'
              "
              :aria-label="`Show slide ${index + 1}`"
              :aria-selected="index === activeHeroSlide"
              @click="handleSelectSlide(index)"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="border-t border-slate-900/80 bg-white/40">
      <div class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 class="text-3xl font-semibold text-slate-900 font-display">Bestsellers</h2>
            <p class="mt-2 text-sm text-slate-900">Curated equipment that teams keep coming back for.</p>
          </div>
          <RouterLink to="/services" class="inline-flex items-center text-sm font-semibold text-[#0c86c3] transition hover:text-[#096b9f]">
            View the catalog
            <svg xmlns="http://www.w3.org/2000/svg" class="ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 10a1 1 0 011-1h9.586l-3.293-3.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 11H4a1 1 0 01-1-1z" clip-rule="evenodd" />
            </svg>
          </RouterLink>
        </div>
        <div class="mt-10">
          <div v-if="servicesError" class="rounded-2xl border border-red-400/40 bg-red-500/10 p-6 text-red-100">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-base font-semibold text-slate-900">Unable to load featured services.</p>
                <p class="text-sm text-red-100/80">{{ servicesError }}</p>
              </div>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-full border border-red-400/40 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-red-100 transition hover:border-red-300 hover:text-slate-900"
                @click="retryFeaturedServices"
              >
                Retry
              </button>
            </div>
          </div>
          <div v-else-if="isServicesLoading" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="index in 3" :key="`featured-skeleton-${index}`" class="animate-pulse rounded-2xl border border-slate-900/80 bg-white/40 p-6">
              <div class="h-48 w-full rounded-2xl bg-white/60"></div>
              <div class="mt-6 space-y-3">
                <div class="h-4 w-3/5 rounded bg-white"></div>
                <div class="h-3 w-full rounded bg-white/70"></div>
                <div class="h-3 w-2/3 rounded bg-white/60"></div>
              </div>
              <div class="mt-4 h-10 w-1/2 rounded-full bg-white"></div>
            </div>
          </div>
          <div v-else-if="!hasFeaturedServices" class="rounded-2xl border border-slate-900/80 bg-white/40 p-8 text-center text-slate-600">
            <p class="text-base font-semibold text-slate-900">Services are syncing.</p>
            <p class="mt-2 text-sm text-slate-900">Visit the catalog to browse every offer from the API.</p>
            <RouterLink
              to="/services"
              class="mt-6 inline-flex items-center justify-center rounded-full border border-[#096b9f]/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#096b9f] transition hover:border-[#0fa6ef] hover:text-slate-900"
            >
              Go to services
            </RouterLink>
          </div>
          <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <article
              v-for="card in featuredServiceCards"
              :key="card.id"
              tabindex="0"
              class="group relative overflow-hidden rounded-2xl border border-slate-900/80 bg-white/50 shadow-lg transition hover:border-[#096b9f]/40 hover:shadow-glow focus:border-[#096b9f]/40 focus:shadow-glow focus:outline-none"
            >
              <div class="relative h-48 overflow-hidden">
                <img
                  :src="card.image.src"
                  :alt="card.image.alt"
                  class="h-full w-full object-cover transition duration-500 group-hover:scale-110 group-focus-within:scale-110"
                />
                <div class="absolute inset-0 bg-white from-slate-950 via-slate-950/40 to-transparent opacity-70 transition duration-300 group-hover:opacity-60 group-focus-within:opacity-60" />
              </div>
              <div class="relative space-y-4 p-6 transition duration-300 group-hover:translate-y-4 group-hover:opacity-0 group-focus-within:translate-y-4 group-focus-within:opacity-0">
                <div>
                  <h3 class="text-lg font-semibold text-slate-900">{{ card.title }}</h3>
                  <p class="mt-2 text-sm text-slate-900">
                    {{ card.tagline }}
                  </p>
                </div>
              </div>
              <div
                class="pointer-events-none absolute inset-4 flex flex-col gap-4 rounded-2xl border border-[#096b9f]/25 bg-white/95 px-6 py-8 text-center opacity-0 shadow-glow transition-all duration-300 ease-out backdrop-blur-md group-hover:pointer-events-auto group-hover:-translate-y-1 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:-translate-y-1 group-focus-within:opacity-100"
              >
                <span class="self-center rounded-full border border-[#096b9f]/35 bg-[#096b9f]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-[#096b9f]">
                  Quick view
                </span>
                <div class="space-y-2">
                  <h3 class="text-xl font-semibold text-slate-900">{{ card.title }}</h3>
                  <p class="text-sm leading-relaxed text-slate-600">
                    {{ card.description }}
                  </p>
                  <p class="text-sm font-semibold text-[#0c86c3]">{{ card.price }}</p>
                </div>
                <RouterLink
                  to="/services/6/order"
                  class="btn-order-glow"
                >
                  Order Now
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </RouterLink>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

