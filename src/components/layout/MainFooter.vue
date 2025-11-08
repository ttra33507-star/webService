<script setup lang="ts">
import { RouterLink } from 'vue-router';

const legalLinks = [
  { label: 'Privacy Policy', to: { path: '/legal', hash: '#privacy' } },
  { label: 'Terms of Service', to: { path: '/legal', hash: '#terms' } },
  { label: 'FAQ', to: { path: '/contact', hash: '#faq' } },
];
</script>

<template>
  <footer class="border-t border-slate-900/80 bg-slate-950/70">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
      <div class="max-w-md">
        <p class="font-display text-lg font-semibold text-white">C4</p>
        <p class="mt-3 text-sm text-slate-400">
          Tailored workspace products paired with secure ABA PayWay checkout integration.
        </p>
        <div class="mt-6 flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-slate-500">
          <span>&copy; 2025 C4</span>
          <span class="h-1 w-1 rounded-full bg-slate-700"></span>
          <span>All rights reserved</span>
        </div>
      </div>
      <div class="grid flex-1 gap-8 sm:grid-cols-2">
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Privacy &amp; Terms</h3>
          <ul class="mt-3 space-y-2 text-sm text-slate-300">
            <li v-for="item in legalLinks" :key="item.label">
              <RouterLink :to="item.to" class="transition hover:text-white">
                {{ item.label }}
              </RouterLink>
            </li>
          </ul>
        </div>
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Support</h3>
          <ul class="mt-3 space-y-2 text-sm text-slate-300">
            <li><a href="mailto:support@c4.com" class="transition hover:text-white">support@c4.com</a></li>
            <li><a href="tel:+15551234567" class="transition hover:text-white">+1 (555) 123-4567</a></li>
            <li>
              <RouterLink to="/contact" class="transition hover:text-white">
                Contact form
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</template>
