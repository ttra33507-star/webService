<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchBestsellerServices } from '../services/catalogService';
import type { ServiceRecord } from '../types/service';
import SignInSection from '../components/auth/SignInSection.vue';
import { useAuth } from '../composables/useAuth';

interface FeaturedServiceCard {
  id: number;
  title: string;
  tagline: string;
  description: string;
  image: {
    src: string;
    alt: string;
  };
  iconUrl?: string;
  service: ServiceRecord;
}

type ServiceImagery = { src: string; alt: string };

const { locale, t } = useI18n({ useScope: 'global' });
const { isAuthenticated } = useAuth();

const FEATURED_SERVICE_LIMIT = 12;
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

const featuredServiceCards = computed<FeaturedServiceCard[]>(() => {
  void locale.value;

  return featuredServices.value.map((service) => {
    const heroImage = service.iconUrl
      ? { src: service.iconUrl, alt: `${service.label} icon` }
      : resolveServiceImagery(service);
    return {
      id: service.id,
      title: service.label,
      tagline: `${service.mainCategory.label} ${t('services.at')} ${service.category.label}`,
      description: `Default quantity ${service.defaultQuantity}`,
      image: heroImage,
      iconUrl: service.iconUrl,
      service,
    };
  });
});

const hasFeaturedServices = computed(() => featuredServiceCards.value.length > 0);

const loadFeaturedServices = async () => {
  servicesError.value = null;
  try {
    const bestsellers = await fetchBestsellerServices();
    featuredServices.value = bestsellers.slice(0, FEATURED_SERVICE_LIMIT);
  } catch (error) {
    console.error('[Home] Failed to load featured services', error);
    servicesError.value = t('home.featuredServices.errors.loadFailed');
    featuredServices.value = [];
  } finally {
    isServicesLoading.value = false;
  }
};

const retryFeaturedServices = () => {
  isServicesLoading.value = true;
  return loadFeaturedServices();
};

onMounted(() => {
  loadFeaturedServices();
});
</script>

<template>
  <div>
    <SignInSection v-if="!isAuthenticated" />

    <section class="border-t border-white bg-white/40">
	      <div class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
	        <div class="flex flex-wrap items-end justify-between gap-6">
	          <div>
	            <h2 class="text-3xl font-black text-slate-800 font-display">{{ t('home.featuredServices.title') }}</h2>
	          </div>
	          <RouterLink to="/services" class="inline-flex items-center text-sm font-black text-[#0c86c3] transition hover:text-[#096b9f]">
	            {{ t('actions.viewCatalog') }}
	            <svg xmlns="http://www.w3.org/2000/svg" class="ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
	              <path fill-rule="evenodd" d="M3 10a1 1 0 011-1h9.586l-3.293-3.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 11H4a1 1 0 01-1-1z" clip-rule="evenodd" />
	            </svg>
	          </RouterLink>
	        </div>
	        <div class="mt-10">
	          <div v-if="servicesError" data-aos="fade-up" class="rounded-2xl border border-red-400/40 bg-red-500/10 p-6 text-red-100">
	            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
	              <div>
	                <p class="text-base font-black text-slate-800">{{ t('home.featuredServices.errors.title') }}</p>
	                <p class="text-sm font-medium text-red-100/80">{{ servicesError }}</p>
	              </div>
	              <button
	                type="button"
	                class="inline-flex items-center justify-center rounded-full border border-red-400/40 px-5 py-2 text-xs font-black uppercase  text-red-100 transition hover:border-red-300 hover:text-slate-800"
	                @click="retryFeaturedServices"
	              >
	                {{ t('actions.retry') }}
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
	          <div v-else-if="!hasFeaturedServices" data-aos="fade-up" class="rounded-2xl border border-slate-900/80 bg-white/40 p-8 text-center text-slate-600">
	            <p class="text-base font-black text-slate-800">{{ t('home.featuredServices.syncing.title') }}</p>
	            <p class="mt-2 text-sm font-medium text-slate-800">{{ t('home.featuredServices.syncing.description') }}</p>
	            <RouterLink
	              to="/services"
	              class="mt-6 inline-flex items-center justify-center rounded-full border border-[#096b9f]/40 px-6 py-3 text-xs font-black uppercase  text-[#096b9f] transition hover:border-[#0fa6ef] hover:text-slate-800"
	            >
	              {{ t('actions.goToServices') }}
	            </RouterLink>
	          </div>
          <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <article
              v-for="(card, cardIndex) in featuredServiceCards"
              :key="card.id"
              tabindex="0"
              :data-aos="cardIndex % 2 === 0 ? 'fade-right' : 'fade-left'"
              :data-aos-delay="(cardIndex % 6) * 70"
              class="group relative overflow-hidden rounded-2xl border border-slate-900/80 bg-white/50 shadow-lg transition hover:border-[#096b9f]/40 hover:shadow-glow focus:border-[#096b9f]/40 focus:shadow-glow focus:outline-none"
            >
              <div class="relative h-48 overflow-hidden">
                <img
                  :src="card.image.src"
                  :alt="card.image.alt"
                  class="h-full w-full object-cover transition duration-500 group-hover:scale-110 group-focus-within:scale-110"
                />
                <div class="absolute inset-0  from-slate-950 via-slate-950/40 to-transparent opacity-70 transition duration-300 group-hover:opacity-60 group-focus-within:opacity-60" />
              </div>
              <div class="relative space-y-4 p-6 transition duration-300 group-hover:translate-y-4 group-hover:opacity-0 group-focus-within:translate-y-4 group-focus-within:opacity-0">
                <div>
                  <h3 class="text-lg font-black text-slate-800">{{ card.title }}</h3>
                  <p class="mt-2 text-sm font-medium text-slate-800">
                    {{ card.tagline }}
                  </p>
                </div>
              </div>
              <div
                class="pointer-events-none absolute inset-4 flex flex-col gap-4 rounded-2xl border border-[#096b9f]/25 bg-white/95 px-6 py-8 text-center opacity-0 shadow-glow transition-all duration-300 ease-out backdrop-blur-md group-hover:pointer-events-auto group-hover:-translate-y-1 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:-translate-y-1 group-focus-within:opacity-100"
	              >
	                <span class="self-center rounded-full border border-[#096b9f]/35 bg-[#096b9f]/10 px-3 py-1 text-[11px] font-medium uppercase text-[#096b9f]">
	                  {{ t('actions.quickView') }}
	                </span>
	                <div class="space-y-2">
	                  <h3 class="text-xl font-black text-slate-800">{{ card.title }}</h3>
	                </div>
	                <RouterLink
	                  :to="{ name: 'service-order', params: { serviceId: card.id } }"
	                  class="btn-order-glow"
	                >
	                  {{ t('actions.orderNow') }}
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

