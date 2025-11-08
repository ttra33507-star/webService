<script setup lang="ts">
type LegalCard = {
  title: string;
  description: string;
  icon: 'shield' | 'scale' | 'doc';
  href: string;
};

type PolicySection = {
  heading: string;
  body: string;
};

const legalCards: LegalCard[] = [
  {
    title: 'Privacy Policy',
    description: 'Learn how we protect and handle your data.',
    icon: 'shield',
    href: '#privacy',
  },
  {
    title: 'Terms of Service',
    description: 'Read the legal terms for using the platform.',
    icon: 'scale',
    href: '#terms',
  },
  {
    title: 'FAQ',
    description: 'Find fast answers to the most common questions.',
    icon: 'doc',
    href: '/contact#faq',
  },
];

const iconPaths: Record<LegalCard['icon'], string> = {
  shield: 'M12 3 20 6v5c0 5.2-3.4 10.2-8 11-4.6-.8-8-5.8-8-11V6z',
  scale: 'M12 3v18m6-11-6-7-6 7m12 0c0 3.5-2.5 6-6 6s-6-2.5-6-6',
  doc: 'M7 3h7l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm7 0v4h4',
};

const privacySections: PolicySection[] = [
  {
    heading: '1. Information We Collect',
    body:
      'We collect information you provide directly to us when creating an account, making a purchase, or contacting support—this includes your name, email, payment details, and any files you upload.',
  },
  {
    heading: '2. How We Use Your Information',
    body:
      'Information is used to provide and improve services, process transactions, enforce security, and communicate with you about your workspace and automations.',
  },
  {
    heading: '3. Information Sharing',
    body:
      'We never sell your personal data. We only share it with vetted service providers or regulators when it is required to operate the platform or stay compliant.',
  },
  {
    heading: '4. Data Security',
    body:
      'We apply encryption in transit and at rest, maintain access controls, and continuously monitor for suspicious activity. Independent audits are performed annually.',
  },
  {
    heading: '5. Contact Us',
    body:
      'Questions about the policy? Email privacy@c4.com or open a ticket in chat. Requests for data export or deletion are processed within 7 days.',
  },
];

const termsSections: PolicySection[] = [
  {
    heading: '1. Acceptance of Terms',
    body:
      'By using the C4 platform you agree to these Terms of Service and all applicable laws. If you do not agree, please discontinue use.',
  },
  {
    heading: '2. License',
    body:
      'We grant you a revocable, non-transferable license to use the services for your business needs, subject to compliance with these terms.',
  },
  {
    heading: '3. Account Responsibilities',
    body:
      'Keep credentials secure and notify us immediately of unauthorized access. You are responsible for activities that happen under your account.',
  },
  {
    heading: '4. Service Modifications',
    body:
      'We may update, pause, or discontinue features with notice when possible. Critical security or compliance changes may occur without prior notice.',
  },
  {
    heading: '5. Termination',
    body:
      'We may suspend or terminate accounts that violate policies, create risk, or fail to pay invoices. You may cancel anytime with 30 days notice.',
  },
];
</script>

<template>
  <div class="bg-[#050608] text-slate-100">
    <section class="border-b border-emerald-500/10 bg-gradient-to-br from-[#021307] via-[#05260f] to-[#031308]">
      <div
        class="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-4 py-16 text-center sm:px-6 lg:px-8"
        style="background-image: radial-gradient(circle at 30% 20%, rgba(34,197,94,0.25), transparent 55%);"
      >
        <div class="space-y-4">
          <p class="text-xs font-semibold uppercase tracking-[0.55em] text-emerald-300">Legal Information</p>
          <h1 class="text-4xl font-semibold text-white sm:text-5xl">Transparent policies for every workflow.</h1>
          <p class="text-base text-emerald-100/80 sm:text-lg">
            Borrowing the Farmreel vibe—deep greens, iconography, and simple copy—this section gives your team quick access to everything compliance needs.
          </p>
        </div>
        <div class="grid w-full gap-6 text-left sm:grid-cols-3">
          <a
            v-for="card in legalCards"
            :key="card.title"
            :href="card.href"
            class="group rounded-3xl border border-emerald-500/20 bg-[#041609]/80 p-6 text-center transition hover:-translate-y-1 hover:border-emerald-400/60 hover:bg-[#062313]"
          >
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5">
                <path :d="iconPaths[card.icon]" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <h3 class="mt-4 text-lg font-semibold text-white">{{ card.title }}</h3>
            <p class="mt-2 text-sm text-emerald-100/80">{{ card.description }}</p>
          </a>
        </div>
      </div>
    </section>

    <section id="privacy" class="border-b border-slate-900/80 bg-[#050608]">
      <div class="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-semibold text-white">Privacy Policy</h2>
        <p class="mt-2 text-sm text-slate-400">
          This is a starter copy deck—replace with your internal policy text or import from your CMS once ready.
        </p>
        <div class="mt-8 space-y-7 text-base text-slate-200">
          <article v-for="section in privacySections" :key="section.heading">
            <h3 class="text-xl font-semibold text-white">{{ section.heading }}</h3>
            <p class="mt-2 text-slate-300">{{ section.body }}</p>
          </article>
        </div>
      </div>
    </section>

    <section id="terms" class="border-b border-slate-900/80 bg-[#050608]">
      <div class="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-semibold text-white">Terms of Service</h2>
        <p class="mt-2 text-sm text-slate-400">Use this structure to keep things scannable, just like the Farmreel example.</p>
        <div class="mt-8 space-y-7 text-base text-slate-200">
          <article v-for="section in termsSections" :key="section.heading">
            <h3 class="text-xl font-semibold text-white">{{ section.heading }}</h3>
            <p class="mt-2 text-slate-300">{{ section.body }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="bg-[#050b09]">
      <div class="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 py-14 text-center sm:px-6 lg:px-8">
        <p class="text-xs font-semibold uppercase tracking-[0.55em] text-emerald-300">Need something else?</p>
        <h3 class="text-3xl font-semibold text-white">We are happy to prep bespoke legal copy or documentation.</h3>
        <p class="max-w-3xl text-sm text-slate-300">
          This page is built using the same creative direction as the reference screenshots: dark foundation, green neon accents, rounded cards, and straightforward typography. Use it as a blueprint for other compliance screens.
        </p>
        <div class="flex flex-wrap justify-center gap-4 text-sm font-semibold uppercase tracking-[0.25em]">
          <a href="mailto:legal@c4.com" class="rounded-full border border-emerald-400/40 px-6 py-3 text-emerald-200 transition hover:bg-emerald-400/10">
            Email legal
          </a>
          <a href="/contact" class="rounded-full border border-slate-800/70 px-6 py-3 text-slate-300 transition hover:border-emerald-400/40 hover:text-white">
            Visit support center
          </a>
        </div>
      </div>
    </section>
  </div>
</template>
