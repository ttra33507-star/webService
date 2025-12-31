<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
    <article
      data-aos="fade-up"
      class="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0c86c3] to-[#096b9f] p-8 text-white shadow-[0_26px_80px_-50px_rgba(9,107,159,0.75)]"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:26px_26px]"
      />
      <div aria-hidden="true" class="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

      <div class="relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#096b9f] shadow">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="stroke-current">
          <path
            d="M6 7h14l-1.5 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.6L6 7Z"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path d="M6 7 5 3H2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <path
            d="M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM17 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <p class="relative mt-10 whitespace-nowrap text-4xl font-bold leading-none tracking-tight">51,991,453</p>
      <p class="relative mt-4 text-base font-medium text-white/90">
        {{ t('home.statsCards.ordersCompleted') }}
      </p>
    </article>

    <article
      data-aos="fade-up"
      data-aos-delay="80"
      class="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0c86c3] to-[#096b9f] p-8 text-white shadow-[0_26px_80px_-50px_rgba(9,107,159,0.75)]"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:26px_26px]"
      />
      <div aria-hidden="true" class="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

      <div class="relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#096b9f] shadow">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="stroke-current">
          <path
            d="M12 3a7 7 0 0 0-7 7c0 2.7 1.8 4.8 3.5 6.2.7.6 1.5 1.5 1.5 2.5h4c0-1 .8-1.9 1.5-2.5C17.2 14.8 19 12.7 19 10a7 7 0 0 0-7-7Z"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path d="M9 21h6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <p class="relative mt-10 whitespace-nowrap text-4xl font-bold leading-none tracking-tight">9,042</p>
      <p class="relative mt-4 text-base font-medium text-white/90">
        {{ t('home.statsCards.activeServices') }}
      </p>
    </article>

    <article
      data-aos="fade-up"
      data-aos-delay="160"
      class="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0c86c3] to-[#096b9f] p-8 text-white shadow-[0_26px_80px_-50px_rgba(9,107,159,0.75)]"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:26px_26px]"
      />
      <div aria-hidden="true" class="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

      <div class="relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#096b9f] shadow">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="stroke-current">
          <path
            d="M7 20h10a2 2 0 0 0 2-2V8.5a2 2 0 0 0-.6-1.4l-2.5-2.5A2 2 0 0 0 14.5 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path d="M9 10.5h6M9 14h6" stroke-width="1.8" stroke-linecap="round" />
          <path
            d="M10 8.2a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <p class="relative mt-10 whitespace-nowrap text-4xl font-bold leading-none tracking-tight">65,997</p>
      <p class="relative mt-4 text-base font-medium text-white/90">
        {{ t('home.statsCards.activeUsers') }}
      </p>
    </article>

    <article
      data-aos="fade-up"
      data-aos-delay="240"
      class="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0c86c3] to-[#096b9f] p-8 text-white shadow-[0_26px_80px_-50px_rgba(9,107,159,0.75)]"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:26px_26px]"
      />
      <div aria-hidden="true" class="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

      <div class="relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#096b9f] shadow">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="stroke-current">
          <path
            d="M8 5h8l1 2v4c0 3.9-2.2 6.9-5 8-2.8-1.1-5-4.1-5-8V7l1-2Z"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path d="M12 9v5" stroke-width="1.8" stroke-linecap="round" />
          <path d="M10 11h4" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </div>

      <p class="relative mt-10 whitespace-nowrap text-4xl font-bold leading-none tracking-tight">#1</p>
      <p class="relative mt-4 text-base font-medium text-white/90">
        {{ t('home.statsCards.smmPanelWorldwide') }}
      </p>
    </article>
  </div>
</template>
