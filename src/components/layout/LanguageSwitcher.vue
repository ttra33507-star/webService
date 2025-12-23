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
const activeCode = computed(() => (locale.value === 'km' ? 'KH' : 'EN'));

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
      class="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black uppercase shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
      :class="
        isOpen
          ? 'border-slate-700/70 bg-slate-700/80 text-white'
          : 'border-slate-700/40 bg-white/70 text-slate-800 hover:border-slate-700/60'
      "
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      :aria-label="activeLabel"
      @click="toggle"
    >
      <img
        :src="activeFlagSrc"
        alt=""
        class="h-5 w-7 rounded-sm border border-slate-900/10 object-cover shadow-sm"
      />
      <span aria-hidden="true">{{ activeCode }}</span>
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

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-1 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 z-50 mt-2 w-44 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10"
        role="menu"
      >
        <button
          type="button"
          role="menuitemradio"
          class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
          :class="locale === 'km' ? 'bg-slate-50' : ''"
          :aria-label="t('language.khmer')"
          :aria-checked="locale === 'km'"
          @click="selectLocale('km')"
        >
          <span class="flex items-center gap-3">
            <img :src="flagKm" alt="" class="h-4 w-6 rounded-sm border border-slate-900/10 object-cover" />
            <span>{{ t('language.khmer') }}</span>
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-emerald-500 transition"
            viewBox="0 0 20 20"
            fill="currentColor"
            :class="locale === 'km' ? 'opacity-100' : 'opacity-0'"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M16.704 5.292a1 1 0 0 1 .004 1.414l-7.5 7.6a1 1 0 0 1-1.43.02l-3.5-3.4a1 1 0 0 1 1.395-1.432l2.786 2.705 6.79-6.906a1 1 0 0 1 1.455-.001Z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <button
          type="button"
          role="menuitemradio"
          class="flex w-full items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3]"
          :class="locale === 'en' ? 'bg-slate-50' : ''"
          :aria-label="t('language.english')"
          :aria-checked="locale === 'en'"
          @click="selectLocale('en')"
        >
          <span class="flex items-center gap-3">
            <img :src="flagEn" alt="" class="h-4 w-6 rounded-sm border border-slate-900/10 object-cover" />
            <span>{{ t('language.english') }}</span>
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-emerald-500 transition"
            viewBox="0 0 20 20"
            fill="currentColor"
            :class="locale === 'en' ? 'opacity-100' : 'opacity-0'"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M16.704 5.292a1 1 0 0 1 .004 1.414l-7.5 7.6a1 1 0 0 1-1.43.02l-3.5-3.4a1 1 0 0 1 1.395-1.432l2.786 2.705 6.79-6.906a1 1 0 0 1 1.455-.001Z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>
