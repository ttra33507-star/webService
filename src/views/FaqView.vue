<script setup lang="ts">
import { ref } from 'vue'

type FaqItem = {
  question: string
  answer: string
}

const faqs = ref<FaqItem[]>([
  {
    question: 'What is C4 TechHub?',
    answer:
      'C4 TechHub is a tool designed to help users manage and automate their farming operations efficiently, with features for monitoring, analyzing, and optimizing agricultural activities.',
  },
  {
    question: 'How do I get started with C4 TechHub?',
    answer:
      'Create an account, choose a plan, and follow the onboarding steps inside your dashboard to connect your data and start using the features.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept major cards and other supported payment methods shown at checkout. All payments are processed securely.',
  },
  // {
  //   question: 'How long are license keys valid?',
  //   answer:
  //     'License validity depends on the plan you choose. Most licenses are valid for the duration of your subscription period.',
  // },
  // {
  //   question: 'Can I transfer my license to another device?',
  //   answer:
  //     'In most cases, yes. You can deactivate your license on one device and activate it on another, following the instructions in your account.',
  // },
  {
    question: 'How do I get support if I have issues?',
    answer:
      'You can contact our support team via the contact form or the support email provided in your dashboard.',
  },
  {
    question: 'Is there a refund policy?',
    answer:
      'Refunds are handled according to our Refund Policy. Please review it before making a purchase.',
  },
])

const openIndex = ref<number | null>(0)

const toggle = (index: number) => {
  openIndex.value = openIndex.value === index ? null : index
}
</script>

<template>
  <main class="min-h-screen bg-white text-[#096b9f]">
    <section class="max-w-4xl mx-auto px-6 py-16">
      <h1 class="text-4xl font-bold mb-8">FAQ</h1>

      <div class="bg-white/60 rounded-2xl shadow-xl border text-[#096b9f]">
        <ul class="divide-y text-slate-900">
          <li
            v-for="(item, index) in faqs"
            :key="item.question"
            class="px-6"
          >
            <button
              type="button"
              class="w-full flex items-center justify-between py-5 text-left focus:outline-none"
              @click="toggle(index)"
            >
              <span
                class="font-semibold text-lg"
                :class="openIndex === index ? 'text-[#096b9f]' : 'text-[#096b9f]/70'"
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
                class="pb-5 text-[#096b9f]/50 text-base leading-relaxed"
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
