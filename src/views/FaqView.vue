<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const { locale, t } = useI18n({ useScope: 'global' });

const faqs = computed<FaqItem[]>(() => {
  void locale.value;

  return [
    {
      id: 'whatIs',
      question: t('faq.items.whatIs.question'),
      answer: t('faq.items.whatIs.answer'),
    },
    {
      id: 'gettingStarted',
      question: t('faq.items.gettingStarted.question'),
      answer: t('faq.items.gettingStarted.answer'),
    },
    {
      id: 'payment',
      question: t('faq.items.payment.question'),
      answer: t('faq.items.payment.answer'),
    },
    {
      id: 'support',
      question: t('faq.items.support.question'),
      answer: t('faq.items.support.answer'),
    },
    {
      id: 'refund',
      question: t('faq.items.refund.question'),
      answer: t('faq.items.refund.answer'),
    },
  ];
});

const openIndex = ref<number | null>(0);

const toggle = (index: number) => {
  openIndex.value = openIndex.value === index ? null : index;
};
</script>

<template>
  <main class="min-h-screen bg-white text-slate-700">
    <section class="max-w-4xl mx-auto px-6 py-16">
      <h1 class="text-4xl font-bold mb-8">{{ t('faq.title') }}</h1>

      <div data-aos="fade-up" class="bg-white/60 rounded-2xl shadow-xl border text-slate-800">
        <ul class="divide-y text-slate-700">
          <li
            v-for="(item, index) in faqs"
            :key="item.id"
            class="px-6"
          >
            <button
              type="button"
              class="w-full flex items-center justify-between py-5 text-left focus:outline-none"
              @click="toggle(index)"
            >
              <span
                class="font-semibold text-lg"
                :class="openIndex === index ? 'text-black' : 'text-black/70'"
              >
                {{ item.question }}
              </span>
              <span class="ml-4 text-xl select-none">
                {{ openIndex === index ? '▴' : '▾' }}
              </span>
            </button>

            <transition name="fade">
              <div
                v-if="openIndex === index"
                class="pb-5 text-black/50 text-base leading-relaxed"
              >
                {{ item.answer }}
              </div>
            </transition>
          </li>
        </ul>
      </div>
    </section>
  </main>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
