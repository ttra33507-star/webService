<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'global' });

const supportEmail = 'support@c4techhub.com';
</script>

<template>
  <main class="min-h-screen text-slate-900 bg-white">
    <section class="max-w-4xl mx-auto px-6 py-16">
      <h1 class="text-4xl font-bold mb-8">{{ t('privacy.title') }}</h1>

      <div class="space-y-8 text-lg leading-relaxed text-slate-800"> 
        <section>
          <h2 class="text-2xl font-semibold mb-2">{{ t('privacy.sections.collect.title') }}</h2>
          <p>
            {{ t('privacy.sections.collect.body') }}
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold mb-2">{{ t('privacy.sections.use.title') }}</h2>
          <p>
            {{ t('privacy.sections.use.body') }}
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold mb-2">{{ t('privacy.sections.sharing.title') }}</h2>
          <p>
            {{ t('privacy.sections.sharing.body') }}
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold mb-2">{{ t('privacy.sections.security.title') }}</h2>
          <p>
            {{ t('privacy.sections.security.body') }}
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold mb-2">{{ t('privacy.sections.contact.title') }}</h2>
          <p>
            {{ t('privacy.sections.contact.bodyPrefix') }}
            <span class="font-medium">{{ supportEmail }}</span>{{ t('privacy.sections.contact.bodySuffix') }}
          </p>
        </section>
      </div>
    </section>
  </main>
</template>
