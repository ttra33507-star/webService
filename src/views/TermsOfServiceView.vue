<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <main class="min-h-screen bg-white text-slate-700">
    <section class="max-w-4xl mx-auto px-6 py-16">
      <h1 class="text-4xl font-bold mb-8">{{ t('terms.title') }}</h1>

      <div class="space-y-8 text-lg leading-relaxed text-slate-800">
        <section>
          <h2 class="text-2xl font-semibold mb-2">{{ t('terms.sections.acceptance.title') }}</h2>
          <p>
            {{ t('terms.sections.acceptance.body') }}
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold mb-2">{{ t('terms.sections.license.title') }}</h2>
          <p>
            {{ t('terms.sections.license.body') }}
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold mb-2">{{ t('terms.sections.responsibilities.title') }}</h2>
          <p>
            {{ t('terms.sections.responsibilities.body') }}
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold mb-2">{{ t('terms.sections.modifications.title') }}</h2>
          <p>
            {{ t('terms.sections.modifications.body') }}
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold mb-2">{{ t('terms.sections.termination.title') }}</h2>
          <p>
            {{ t('terms.sections.termination.body') }}
          </p>
        </section>
      </div>
    </section>
  </main>
</template>
