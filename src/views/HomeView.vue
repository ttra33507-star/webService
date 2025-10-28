<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

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

interface BestsellerCard {
  title: string;
  tagline: string;
  description: string;
  image: {
    src: string;
    alt: string;
  };
  planId: string;
}

const heroSlides: HeroSlide[] = [
  {
    id: 'managed-checkout',
    badgeLabel: 'Managed Checkout',
    badgeClasses: 'border-emerald-400/30 bg-slate-950/70 text-emerald-200',
    gradient: 'from-emerald-500/15 via-slate-950/80 to-slate-950',
    title: 'Smart payment flows built for busy teams.',
    description:
      'Guide every customer through a secure ABA PayWay experience with branded pages, risk monitoring, and instant invoicing.',
    highlights: [
      {
        text: 'Go live in under 48 hours',
        classes: 'rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 font-medium text-emerald-200',
        icon: 'clock',
      },
      {
        text: 'No-code customization',
        classes: 'rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2',
      },
    ],
    image: {
      src: '/images/C4-FB-Station.png',
      alt: 'Managed checkout dashboard preview',
      shadow: 'shadow-emerald-500/10',
    },
  },
  {
    id: 'commerce-playbooks',
    badgeLabel: 'Commerce Playbooks',
    badgeClasses: 'border-blue-400/30 bg-slate-950/70 text-blue-200',
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
        classes: 'rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2',
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
    badgeClasses: 'border-purple-400/30 bg-slate-950/70 text-purple-200',
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
        classes: 'rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2',
      },
    ],
    image: {
      src: '/images/C4-Report-Facebook.png',
      alt: 'Insights dashboard preview',
      shadow: 'shadow-purple-500/10',
    },
  },
];

const router = useRouter();
const { isAuthenticated } = useAuth();

const bestsellers: BestsellerCard[] = [
  {
    title: 'Auto Delete Comment - 1 Month Plan',
    tagline: 'Kick-off automation with full feature access for 30 days.',
    description: 'Entry plan for teams validating their workflow. Includes all standard modules and support.',
    image: {
      src: '/images/C4-Auto-Delete-Comment.png',
      alt: 'Auto Delete Comment - 1 Month Plan',
    },
    planId: 'local-1m',
  },
  {
    title: 'Facebook Station',
    tagline: 'Quarterly bundle with bonus days and premium feature unlocks.',
    description: 'Our most popular option - extend coverage, unlock additional rotations, and receive priority support.',
    image: {
      src: '/images/C4-FB-Station.png',
      alt: 'Facebook Station',
    },
    planId: 'local-3m',
  },
  {
    title: 'Report Facebook',
    tagline: 'Annual coverage with native verification and custom feature access.',
    description: 'Full-year automation license with concierge onboarding, compliance review, and tailored feature drops.',
    image: {
      src: '/images/C4-Report-Facebook.png',
      alt: 'Report Facebook',
    },
    planId: 'local-12m',
  },
  {
    title: 'Telegram Station',
    tagline: 'Immersive audio with hybrid ANC for open offices.',
    description: 'Deploy premium messaging workflows with automation-ready routing and proactive moderation.',
    image: {
      src: '/images/C4-TG-Station.png',
      alt: 'Telegram Station',
    },
    planId: 'international-3m',
  },
  {
    title: 'Smart Desk Organizer',
    tagline: 'Wireless charging, pen storage, and cable routing combined.',
    description: 'Turn any desk into a tidy command center with embedded charging, storage, and lighting control.',
    image: {
      src: '/images/txt.jpg',
      alt: 'Smart Desk Organizer',
    },
    planId: 'international-12m',
  },
];

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

const goToPlans = (planId: string) => {
  if (!isAuthenticated.value) {
    router.push({ name: 'login', query: { redirect: '/plans', plan: planId } });
    return;
  }
  router.push({ name: 'plans', query: { plan: planId } });
};

onMounted(() => {
  startAutoSlide();
});

onBeforeUnmount(() => {
  stopAutoSlide();
});
</script>

<template>
  <div>
    <section class="border-y border-slate-900/80 bg-slate-950/60">
      <div class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <div class="max-w-3xl">
          <span class="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200">
            Launch faster
          </span>
          <h1 class="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl font-display">
            Everything your brand needs to sell with confidence.
          </h1>
          <p class="mt-4 text-lg leading-relaxed text-slate-300">
            Showcase products, automate fulfillment, and delight customers from a single dashboard. Explore how C4 streamlines every touchpoint of your payments journey.
          </p>
        </div>
        <div
          class="relative"
          @mouseenter="stopAutoSlide"
          @mouseleave="startAutoSlide"
          @touchstart.passive="stopAutoSlide"
          @touchend="startAutoSlide"
        >
          <div class="relative overflow-hidden rounded-3xl border border-slate-900/80 bg-slate-900/40 shadow-2xl shadow-emerald-500/10">
            <article
              v-for="(slide, index) in heroSlides"
              :key="slide.id"
              class="grid min-h-[22rem] gap-8 bg-gradient-to-br px-8 py-10 transition duration-500 sm:grid-cols-[1.1fr_0.9fr] sm:px-12 sm:py-14"
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
                  <h2 class="text-3xl font-semibold text-white sm:text-4xl font-display">
                    {{ slide.title }}
                  </h2>
                  <p class="text-base text-slate-300 sm:text-lg">
                    {{ slide.description }}
                  </p>
                </div>
                <div class="flex flex-wrap items-center gap-4 text-sm text-slate-300">
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
                  class="h-full max-h-[18rem] w-full max-w-[20rem] rounded-2xl border border-slate-800/80 bg-slate-950/70 object-cover shadow-lg"
                  :class="slide.image.shadow"
                />
              </div>
            </article>
          </div>
          <button
            type="button"
            class="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-slate-800/80 bg-slate-950/80 p-3 text-slate-200 shadow-lg transition hover:text-white lg:flex"
            aria-label="Show previous slide"
            @click="handlePrev"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            class="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-slate-800/80 bg-slate-950/80 p-3 text-slate-200 shadow-lg transition hover:text-white lg:flex"
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
                  ? 'border-emerald-400/60 bg-emerald-400'
                  : 'border-slate-700 bg-slate-800/80 hover:border-emerald-300/60 hover:bg-slate-700'
              "
              :aria-label="`Show slide ${index + 1}`"
              :aria-selected="index === activeHeroSlide"
              @click="handleSelectSlide(index)"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="border-t border-slate-900/80 bg-slate-950/40">
      <div class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 class="text-3xl font-semibold text-white font-display">Bestsellers</h2>
            <p class="mt-2 text-sm text-slate-400">Curated equipment that teams keep coming back for.</p>
          </div>
          <a href="/services" class="inline-flex items-center text-sm font-semibold text-emerald-300 transition hover:text-emerald-200">
            View the catalog
            <svg xmlns="http://www.w3.org/2000/svg" class="ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 10a1 1 0 011-1h9.586l-3.293-3.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 11H4a1 1 0 01-1-1z" clip-rule="evenodd" />
            </svg>
          </a>
        </div>
        <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="card in bestsellers"
            :key="card.title"
            tabindex="0"
            class="group relative overflow-hidden rounded-2xl border border-slate-900/80 bg-slate-900/50 shadow-lg transition hover:border-emerald-400/40 hover:shadow-glow focus:border-emerald-400/40 focus:shadow-glow focus:outline-none"
          >
            <div class="relative h-48 overflow-hidden">
              <img
                :src="card.image.src"
                :alt="card.image.alt"
                class="h-full w-full object-cover transition duration-500 group-hover:scale-110 group-focus-within:scale-110"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-70 transition duration-300 group-hover:opacity-60 group-focus-within:opacity-60" />
            </div>
            <div class="relative space-y-4 p-6 transition duration-300 group-hover:translate-y-4 group-hover:opacity-0 group-focus-within:translate-y-4 group-focus-within:opacity-0">
              <div>
                <h3 class="text-lg font-semibold text-white">{{ card.title }}</h3>
                <p class="mt-2 text-sm text-slate-400">
                  {{ card.tagline }}
                </p>
              </div>
            </div>
            <div
              class="pointer-events-none absolute inset-4 flex flex-col gap-4 rounded-2xl border border-emerald-400/20 bg-slate-950/95 px-6 py-8 text-center opacity-0 shadow-glow transition-all duration-300 ease-out backdrop-blur-md group-hover:pointer-events-auto group-hover:-translate-y-1 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:-translate-y-1 group-focus-within:opacity-100"
            >
              <span class="self-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-emerald-200">
                Quick view
              </span>
              <div class="space-y-2">
                <h3 class="text-xl font-semibold text-white">{{ card.title }}</h3>
                <p class="text-sm leading-relaxed text-slate-300">
                  {{ card.description }}
                </p>
              </div>
              <button type="button" class="btn-order-glow" @click="goToPlans(card.planId)">
                Order now
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>
