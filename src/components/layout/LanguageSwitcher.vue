<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { LOCALE_STORAGE_KEY, type AppLocale } from '../../i18n';
import flagKm from '../../assets/Flag_of_Cambodia.svg.png';
import flagEn from '../../assets/Flag_of_the_United.png';

const { locale, t } = useI18n({ useScope: 'global' });
const isOpen = ref(false);
const rootRef = ref<HTMLElement | null>(null);

const setLocale = (next: AppLocale) => {
  if (locale.value === next) return;
  locale.value = next;
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    }
  } catch {
    // ignore storage errors (private mode, blocked storage, etc.)
  }
};

const activeFlagSrc = computed(() => (locale.value === 'km' ? flagKm : flagEn));
const activeLabel = computed(() => (locale.value === 'km' ? t('language.khmer') : t('language.english')));

const close = () => {
  isOpen.value = false;
};

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const selectLocale = (next: AppLocale) => {
  setLocale(next);
  close();
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node | null;
  if (!target) return;
  const root = rootRef.value;
  if (!root) return;
  if (root.contains(target)) return;
  close();
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close();
  }
};

onMounted(() => {
  window.addEventListener('click', handleClickOutside);
  window.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  window.removeEventListener('click', handleClickOutside);
  window.removeEventListener('keydown', handleEscape);
});
</script>

<template>
  <div ref="rootRef" class="relative inline-flex">
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-full border bg-white/70 px-2.5 py-2 text-xs font-black uppercase text-slate-700 shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
      :class="isOpen ? 'border-[#096b9f]/60 text-[#096b9f]' : 'border-slate-700/40 hover:border-slate-700/60'"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      :aria-label="activeLabel"
      @click="toggle"
    >
      <img :src="activeFlagSrc" alt="" class="h-7 w-7 rounded-full border border-slate-900/10 object-cover shadow-sm" />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 transition"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        :class="isOpen ? 'rotate-180' : ''"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 9l6 6 6-6" />
      </svg>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 z-50 mt-2"
      role="menu"
    >
      <div class="inline-flex items-center gap-2 rounded-full border border-slate-700/30 bg-white p-1 shadow-lg shadow-slate-900/10">
        <button
          type="button"
          role="menuitemradio"
          class="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
          :class="locale === 'km' ? 'border-[#096b9f] ring-2 ring-[#096b9f]/25' : 'border-transparent hover:border-slate-700/30'"
          :aria-label="t('language.khmer')"
          :aria-checked="locale === 'km'"
          @click="selectLocale('km')"
        >
          <img :src="flagKm" alt="" class="h-full w-full object-cover" />
        </button>
        <button
          type="button"
          role="menuitemradio"
          class="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
          :class="locale === 'en' ? 'border-[#096b9f] ring-2 ring-[#096b9f]/25' : 'border-transparent hover:border-slate-700/30'"
          :aria-label="t('language.english')"
          :aria-checked="locale === 'en'"
          @click="selectLocale('en')"
        >
          <img :src="flagEn" alt="" class="h-full w-full object-cover" />
        </button>
      </div>
    </div>
  </div>
</template>
