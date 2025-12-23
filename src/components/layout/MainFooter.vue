<script setup lang="ts">
import { useI18n } from 'vue-i18n';

type LegalCard = {
  to: string;
  labelKey: string;
  descriptionKey: string;
  icon: 'shield' | 'document' | 'faq';
};

const { t } = useI18n({ useScope: 'global' });

const legalCards: LegalCard[] = [
  {
    to: '/privacy-policy',
    labelKey: 'footer.privacyPolicy',
    descriptionKey: 'footer.privacyPolicyDescription',
    icon: 'shield',
  },
  {
    to: '/terms-of-service',
    labelKey: 'footer.termsOfService',
    descriptionKey: 'footer.termsOfServiceDescription',
    icon: 'document',
  },
  {
    to: '/faq',
    labelKey: 'footer.faq',
    descriptionKey: 'footer.faqDescription',
    icon: 'faq',
  },
];

const iconPaths: Record<LegalCard['icon'], string> = {
  shield: 'M12 3.25l6 3.4v5.05c0 4.08-2.96 7.65-6 8.3-3.04-.65-6-4.22-6-8.3V6.65l6-3.4z',
  document: 'M15 3H9a2 2 0 00-2 2v14a2 2 0 002 2h6a2 2 0 002-2V7.5L15 3z',
  faq: 'M12 3a9 9 0 100 18 9 9 0 000-18zm.01 5.25a2.25 2.25 0 012.25 2.25c0 1.15-.73 1.77-1.45 2.26-.68.47-1.06.74-1.07 1.49v.25h-1.5v-.33c.04-1.26.78-1.82 1.47-2.29.68-.47 1.05-.78 1.05-1.38a.76.76 0 00-.75-.75.76.76 0 00-.75.75h-1.5a2.25 2.25 0 012.25-2.25zm-.01 8.5a1 1 0 110-2 1 1 0 010 2z',
};

</script>

<template>
  <footer class="bg-gradient-to-br from-[#e8f4fb] via-white to-white py-14">
    <div class="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <p class="text-3xl font-semibold  p-3 text-[#0c86c3]">{{ t('footer.legalInformation') }}</p>
      </div>
      <div class="grid gap-14 md:grid-cols-3 p-5">
        <article
          v-for="(card, index) in legalCards"
          :key="card.to"
          :data-aos="index % 3 === 0 ? 'fade-right' : index % 3 === 1 ? 'fade-up' : 'fade-left'"
          :data-aos-delay="index * 90"
          class="group rounded-xl border border-[#0c86c3]/25 bg-white/90 p-4 text-center shadow-[0_10px_30px_rgba(6,22,45,0.08)] transition hover:-translate-y-1 hover:border-[#0c86c3]/50 hover:shadow-[0_16px_40px_rgba(6,22,45,0.12)] cursor-pointer"
        >
          <router-link
            :to="card.to"
            class="flex flex-col items-center no-underline hover:no-underline focus:no-underline w-full h-full"
            style="cursor: pointer;"
            tabindex="0"
          >
            <span
              class="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#d6ecfb] text-[#0c86c3] transition group-hover:bg-[#0fa6ef]/15"
              >
              <svg
                class="h-6 w-6 transform transition-transform duration-150 ease-in-out group-hover:scale-110"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path :d="iconPaths[card.icon]" />
              </svg>
            </span>
            <p class="mt-3 text-base font-semibold text-slate-800">{{ t(card.labelKey) }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ t(card.descriptionKey) }}</p>
          </router-link>
        </article>
      </div>
      <div class=" flex items-center justify-center">
        <p class="mt-8  text-center text-sm text-slate-500">
          © 2025 C4TECHHUB. {{ t('footer.allRightsReserved') }}
        </p>
      </div>
    </div>
  </footer>
</template>
