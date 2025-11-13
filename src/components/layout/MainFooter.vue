<script setup lang="ts">
import { RouterLink } from 'vue-router';

const legalLinks = [
  { label: 'Privacy Policy', to: { path: '/legal', hash: '#privacy' } },
  { label: 'Terms of Service', to: { path: '/legal', hash: '#terms' } },
  { label: 'FAQ', to: { path: '/contact', hash: '#faq' } },
];
</script>

<template>
  <footer class="border-t border-slate-900/80 bg-white/70">
    <div
      class="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-12 text-center sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8 lg:text-left"
    >
      <div class="max-w-md">
        <p class="font-display text-lg font-semibold text-slate-900">C4 Tech Hub</p>
        <p class="mt-3 text-sm text-slate-500">
          A digital innovation platform powering automation, marketing, and creative tech solutions for modern businesses.
        </p>
        <div class="mt-6 flex justify-center text-center text-xs tracking-[0.25em] text-slate-900">
          <span>&copy; 2025 c4 Tech Hub</span>
        </div>
      </div>
      <div class="grid w-full gap-8 text-center sm:grid-cols-2 sm:text-left lg:flex-1">
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Privacy &amp; Terms</h3>
          <ul class="mt-3 space-y-2 text-sm text-slate-600">
            <li v-for="item in legalLinks" :key="item.label">
              <RouterLink :to="item.to" class="transition hover:text-slate-900">
                {{ item.label }}
              </RouterLink>
            </li>
          </ul>
        </div>
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Support</h3>
          <ul class="mt-3 space-y-2 text-sm text-slate-600">
            <li><a href="https://t.me/c4techhub" class="transition hover:text-slate-900">t.me/c4techhub</a></li>
            <li><a href="https://t.me/c4techhub" class="transition hover:text-slate-900">Chat on Telegram</a></li>
            <li>
              <RouterLink to="/contact" class="transition hover:text-slate-900">
                Contact form
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</template>

