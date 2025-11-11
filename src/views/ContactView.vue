<script setup lang="ts">
type HeroStat = {
  label: string;
  value: string;
  helper: string;
};

type IconKey = 'chat' | 'telegram' | 'email' | 'phone' | 'shield' | 'bolt' | 'layers' | 'clock';

type ContactChannel = {
  label: string;
  description: string;
  response: string;
  icon: IconKey;
  cta?: {
    label: string;
    href: string;
  };
  badge?: string;
  availability: string[];
  tone: 'emerald' | 'blue' | 'violet' | 'amber';
};

type ResponseStep = {
  title: string;
  eta: string;
  detail: string;
};

type EscalationStep = {
  title: string;
  detail: string;
  contact: string;
  icon: IconKey;
};

type FaqItem = {
  question: string;
  answer: string;
  category: string;
};

type ResourceCard = {
  title: string;
  description: string;
  href: string;
  badge?: string;
};

const CONTACT_LINK = 'https://t.me/c4techhub';

const heroStats: HeroStat[] = [
  { label: 'Avg. live chat pickup', value: '< 3 min', helper: 'Weekday performance' },
  { label: 'Weekend coverage', value: '18 hrs', helper: 'Dedicated pod, GMT+7' },
  { label: 'Customer satisfaction', value: '98.2%', helper: 'Last 30 days' },
  { label: 'Open conversations', value: '312', helper: 'Global queue' },
];

const heroBullets = [
  '24/7 operator coverage with Khmer + English support.',
  'Incident command playbooks for media, billing, and automation pods.',
  'Real-time visibility into deliverability, queue health, and status updates.',
];

const contactChannels: ContactChannel[] = [
  {
    label: 'Priority Live Chat',
    description: 'Best for launch blockers, billing updates, or new workflow pushes that cannot wait.',
    response: 'Replies in 2-5 minutes',
    icon: 'chat',
    cta: { label: 'Open chat', href: CONTACT_LINK },
    badge: 'Fastest',
    availability: ['Screen share ready', 'English • Khmer', 'Always on'],
    tone: 'emerald',
  },
  {
    label: 'Telegram Hotline',
    description: 'Escalate automations, campaign fails, or content moderation flags with the on-call lead.',
    response: 'Replies in < 10 minutes',
    icon: 'telegram',
    cta: { label: 'Message Telegram', href: CONTACT_LINK },
    availability: ['Broadcast updates', 'Incident bridge ready', 'SOC monitored'],
    tone: 'blue',
  },
  {
    label: 'Priority Email Desk',
    description: 'Structured deep dives: compliance reviews, snapshot exports, and invoicing adjustments.',
    response: 'Replies in < 2 hours',
    icon: 'email',
    cta: { label: 'Email support', href: CONTACT_LINK },
    availability: ['SLA-backed', 'Attachments welcome', 'Follow-the-sun'],
    tone: 'violet',
  },
  {
    label: 'Voice & Callback',
    description: 'For voice verification, merchant bank requirements, or when you simply want a human call.',
    response: 'Replies in 15 minutes',
    icon: 'phone',
    cta: { label: 'Book a callback', href: CONTACT_LINK },
    availability: ['APAC & EU windows', 'Encrypted recordings', 'Tier-2 advocates'],
    tone: 'amber',
  },
];

const responseTimeline: ResponseStep[] = [
  {
    title: 'Immediate intake',
    eta: '0 - 5 min',
    detail: 'Operators collect context, screenshots, and log bundles to reduce back-and-forth.',
  },
  {
    title: 'Specialist pairing',
    eta: '5 - 25 min',
    detail: 'A dedicated pod (billing, automation, or policy) owns next steps and updates the room.',
  },
  {
    title: 'Resolution & recap',
    eta: '25 - 90 min',
    detail: 'Delivery confirmation, rollback steps, or tracking IDs are documented inside your ticket.',
  },
];

const escalationSteps: EscalationStep[] = [
  {
    title: 'P1: Platform outage',
    detail: 'Triggers bridge call with engineering + operations; hourly broadcast until closed.',
    contact: '@c4hub_ops (Telegram)',
    icon: 'shield',
  },
  {
    title: 'P2: Campaign degradation',
    detail: 'Engage the automation pod for rate adjustments or manual overrides.',
    contact: 'ops@c4.com',
    icon: 'layers',
  },
  {
    title: 'P3: Billing & finance',
    detail: 'Direct line to finance for invoice edits, receipts, or KYB requirements.',
    contact: '+1 (555) 987-6543',
    icon: 'bolt',
  },
];

const faqItems: FaqItem[] = [
  {
    question: 'When should I use live chat versus Telegram?',
    answer:
      'Use live chat when you are inside the dashboard and need annotated guidance. Telegram is better for urgent escalations, especially if an ad set or automation is failing across multiple accounts.',
    category: 'Channels',
  },
  {
    question: 'Do you provide weekend coverage?',
    answer:
      'Yes. A dedicated weekend pod monitors billing, account health, and moderation queues from 06:00 to 00:00 GMT+7 with on-call engineers for blocking incidents.',
    category: 'Availability',
  },
  {
    question: 'Can I request a signed incident report?',
    answer:
      'Absolutely. Once an incident closes, reply to the transcript or email us at ops@c4.com with the ticket ID and we will export the findings within one business day.',
    category: 'Documentation',
  },
  {
    question: 'How do I share secure credentials?',
    answer:
      'Never paste passwords in chat. Use your existing encrypted vault link or request a temporary upload slot from the agent—each link expires after 60 minutes.',
    category: 'Security',
  },
  {
    question: 'What languages do agents speak?',
    answer: 'English and Khmer are staffed 24/7. Vietnamese coverage is available during APAC business hours.',
    category: 'Localization',
  },
];

const resourceCards: ResourceCard[] = [
  {
    title: 'Status dashboard',
    description: 'Live view of automation health, webhook queues, and platform partners.',
    href: '/status',
    badge: 'Realtime',
  },
  {
    title: 'Playbooks & policies',
    description: 'Billing dispute template, page recovery workflow, and ad-risk checklist.',
    href: '/docs/playbooks',
  },
  {
    title: 'Incident archive',
    description: 'Search prior escalations and download signed closure reports.',
    href: '/docs/incidents',
  },
];

const iconPaths: Record<IconKey, string> = {
  chat: 'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4v-4H6a2 2 0 0 1-2-2z',
  telegram: 'M3 12.5 21 4l-4.5 15-5.5-4-3.5 3 .5-6.5z',
  email: 'M4 6h16a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1zm0 0 8 6 8-6',
  phone: 'M5 4h3l2 5-2 2a11 11 0 0 0 7 7l2-2 5 2v3a2 2 0 0 1-2 2h-1c-7.18 0-16-8.82-16-16V6a2 2 0 0 1 2-2z',
  shield: 'M12 3 20 7v5c0 5.25-3.4 10.17-8 11-4.6-.83-8-5.75-8-11V7z',
  bolt: 'M13 2 3 14h7l-1 8 10-12h-7z',
  layers: 'M12 4 3 9l9 5 9-5-9-5zm-9 7 9 5 9-5m-18 6 9 5 9-5',
  clock: 'M12 7v5l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
};

const toneClasses: Record<ContactChannel['tone'], { border: string; glow: string }> = {
  emerald: {
    border: 'border-emerald-400/40',
    glow: 'from-emerald-400/20 via-emerald-400/5',
  },
  blue: {
    border: 'border-sky-400/40',
    glow: 'from-sky-400/20 via-sky-400/5',
  },
  violet: {
    border: 'border-violet-400/40',
    glow: 'from-violet-400/20 via-violet-400/5',
  },
  amber: {
    border: 'border-amber-400/40',
    glow: 'from-amber-400/25 via-amber-400/5',
  },
};
</script>

<template>
  <div class="bg-white text-slate-900">
    <section class="relative overflow-hidden border-b border-slate-900/70 bg-white/80">
      <div class="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.2),_transparent_55%)]"></div>
      <div class="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8">
        <div class="space-y-8">
          <div class="space-y-4">
            <p class="text-xs font-semibold uppercase tracking-[0.55em] text-slate-500">Contact operations</p>
            <div>
              <h1 class="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">Your queue, our priority.</h1>
              <p class="mt-4 text-lg text-slate-600 sm:text-xl">
                Reach the same team that builds and monitors C4 Teach Hub automation every day. We keep conversations structured, transparent, and fast—mirroring the Farmreel support rhythm you know.
              </p>
            </div>
          </div>
          <div class="flex flex-wrap gap-4">
            <a
              :href="CONTACT_LINK"
              target="_blank"
              rel="noreferrer"
              class="inline-flex h-10 items-center gap-2 rounded-full border border-[#0c86c3] bg-[#096b9f] px-4 text-sm font-semibold text-white shadow-md shadow-[#096b9f]/25 transition hover:border-[#0fa6ef] hover:bg-[#0fa6ef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c86c3] whitespace-nowrap"
            >
              Start live chat
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 12h14m0 0-6-6m6 6-6 6" />
              </svg>
            </a>
            <a
              :href="CONTACT_LINK"
              class="inline-flex h-10 items-center gap-2 rounded-full border border-[#096b9f]/50 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#096b9f] transition hover:border-[#096b9f] hover:text-[#0c86c3]"
            >
              Email operations
              <span aria-hidden="true" class="text-slate-9000">↗</span>
            </a>
          </div>
          <dl class="grid gap-6 sm:grid-cols-2">
            <div
              v-for="stat in heroStats"
              :key="stat.label"
              class="rounded-3xl border border-[#096b9f]/30 bg-white/70 p-5 shadow-inner shadow-[#096b9f]/20"
            >
              <dt class="text-xs font-semibold uppercase tracking-[0.4em] text-slate-9000">{{ stat.label }}</dt>
              <dd class="mt-3 text-3xl font-semibold text-slate-900">{{ stat.value }}</dd>
              <p class="mt-2 text-sm text-slate-500">{{ stat.helper }}</p>
            </div>
          </dl>
        </div>
        <div class="rounded-[32px] border border-[#096b9f]/40 bg-white from-white via-[#e7f5fb] to-[#f2f9fd] p-8 shadow-[0_35px_90px_rgba(9,107,159,0.18)]">
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.4em] text-slate-9000">Live queue health</p>
                <p class="mt-2 text-3xl font-semibold text-slate-900">Green · 4 agents</p>
              </div>
              <span class="rounded-full border border-[#0c86c3]/40 bg-[#0c86c3]/10 px-3 py-1 text-xs font-semibold text-[#0c86c3]">Realtime</span>
            </div>
            <ul class="space-y-4 text-sm text-slate-600">
              <li
                v-for="item in heroBullets"
                :key="item"
                class="flex items-start gap-3 rounded-2xl border border-[#096b9f]/30 bg-white/50 p-3"
              >
                <span class="mt-0.5 h-2 w-2 rounded-full bg-[#096b9f]"></span>
                <span>{{ item }}</span>
              </li>
            </ul>
            <div class="grid gap-4 pt-2 sm:grid-cols-2">
              <div class="rounded-2xl border border-[#096b9f]/30 bg-white/70 p-4">
                <p class="text-xs uppercase tracking-[0.35em] text-slate-9000">Coverage</p>
                <p class="mt-2 text-xl font-semibold text-slate-900">24/7 · GMT+7</p>
                <p class="text-sm text-slate-500">Follow-the-sun pods</p>
              </div>
              <div class="rounded-2xl border border-[#096b9f]/30 bg-white/70 p-4">
                <p class="text-xs uppercase tracking-[0.35em] text-slate-9000">Escalations</p>
                <p class="mt-2 text-xl font-semibold text-slate-900">P1 in 10 min</p>
                <p class="text-sm text-slate-500">Ops lead always on</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="border-b border-slate-900/80 bg-white">
      <div class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div class="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.55em] text-slate-500">Channels</p>
            <h2 class="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Choose your lane.</h2>
            <p class="mt-2 text-base text-slate-500 sm:text-lg">Every path mirrors the Farmreel FAQ layout—just optimized for C4 Teach Hub workflows.</p>
          </div>
          <a href="https://status.c4.com" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900">
            View status page
            <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div class="grid gap-6 md:grid-cols-2">
          <article
            v-for="channel in contactChannels"
            :key="channel.label"
            class="rounded-3xl border bg-white to-slate-950/80 p-6 shadow-[0_25px_60px_rgba(2,6,23,0.55)] transition hover:-translate-y-1"
            :class="[toneClasses[channel.tone].border, toneClasses[channel.tone].glow]"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-4">
                <span class="rounded-2xl border border-white/5 bg-white/5 p-3 text-slate-900">
                  <svg
                    class="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path :d="iconPaths[channel.icon]" />
                  </svg>
                </span>
                <div>
                  <p class="text-lg font-semibold text-slate-900">{{ channel.label }}</p>
                  <p class="text-sm text-slate-500">{{ channel.response }}</p>
                </div>
              </div>
              <span v-if="channel.badge" class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900/80">{{ channel.badge }}</span>
            </div>
            <p class="mt-4 text-base text-slate-600">{{ channel.description }}</p>
            <ul class="mt-5 flex flex-wrap gap-3 text-sm text-slate-700">
              <li v-for="item in channel.availability" :key="item" class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em]">{{ item }}</li>
            </ul>
            <a
              v-if="channel.cta"
              :href="channel.cta.href"
              class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-emerald-200"
              target="_blank"
              rel="noreferrer"
            >
              {{ channel.cta.label }}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 12h14m0 0-6-6m6 6-6 6" />
              </svg>
            </a>
          </article>
        </div>
      </div>
    </section>

    <section class="border-b border-slate-900/80 bg-white/80">
      <div class="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div class="rounded-[32px] border border-slate-800/80 bg-white/60 p-8">
          <div class="mb-8">
            <p class="text-xs font-semibold uppercase tracking-[0.55em] text-slate-500">SLA timeline</p>
            <h3 class="mt-3 text-3xl font-semibold text-slate-900">Expect a response in predictable waves.</h3>
            <p class="mt-2 text-base text-slate-500">Borrowed from the Farmreel FAQ cadence, but tuned to C4 Teach Hub pods.</p>
          </div>
          <ul class="space-y-8">
            <li v-for="(step, index) in responseTimeline" :key="step.title" class="relative pl-12">
              <span class="absolute left-0 top-0 flex h-full w-12 items-start justify-center">
                <span class="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700 bg-white/70">
                  <svg
                    class="h-5 w-5 text-emerald-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path :d="iconPaths.clock" />
                  </svg>
                  <span
                    v-if="index < responseTimeline.length - 1"
                    class="absolute left-1/2 top-10 h-[calc(100%-2.5rem)] w-px -translate-x-1/2 bg-white"
                  ></span>
                </span>
              </span>
              <p class="text-sm font-semibold uppercase tracking-[0.4em] text-slate-500">{{ step.eta }}</p>
              <h4 class="mt-2 text-2xl font-semibold text-slate-900">{{ step.title }}</h4>
              <p class="mt-2 text-base text-slate-600">{{ step.detail }}</p>
            </li>
          </ul>
        </div>
        <div class="rounded-[32px] border border-slate-800/80 bg-white from-[#0b1224] via-[#050b1b] to-black p-8">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.55em] text-slate-500">Escalation desk</p>
              <h3 class="mt-3 text-3xl font-semibold text-slate-900">Never guess who to ping.</h3>
            </div>
            <span class="rounded-full border border-orange-300/40 bg-orange-400/10 px-3 py-1 text-xs font-semibold text-orange-100">On-call</span>
          </div>
          <div class="mt-8 space-y-6">
            <article
              v-for="step in escalationSteps"
              :key="step.title"
              class="rounded-3xl border border-white/10 bg-white/5 p-5"
            >
              <div class="flex items-center gap-3">
                <span class="rounded-2xl border border-white/10 bg-white/80 p-3 text-slate-900">
                  <svg
                    class="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path :d="iconPaths[step.icon]" />
                  </svg>
                </span>
                <div>
                  <p class="text-lg font-semibold text-slate-900">{{ step.title }}</p>
                  <p class="text-sm text-slate-500">{{ step.detail }}</p>
                </div>
              </div>
              <p class="mt-4 text-sm font-semibold text-emerald-200">{{ step.contact }}</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section id="faq" class="border-b border-slate-900/80 bg-white">
      <div class="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div class="rounded-[32px] border border-slate-800/80 bg-white/60 p-8">
          <div class="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.55em] text-slate-500">FAQ</p>
              <h3 class="mt-3 text-3xl font-semibold text-slate-900">Answers before you reach out.</h3>
            </div>
            <a href="/docs" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900">
              View help center
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div class="divide-y divide-slate-800/70">
            <article v-for="item in faqItems" :key="item.question" class="py-5">
              <p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-9000">{{ item.category }}</p>
              <h4 class="mt-2 text-2xl font-semibold text-slate-900">{{ item.question }}</h4>
              <p class="mt-2 text-base text-slate-600">{{ item.answer }}</p>
            </article>
          </div>
        </div>
        <div class="space-y-6">
          <div class="rounded-[32px] border border-slate-800/80 bg-white from-slate-900/80 via-slate-900/40 to-slate-950/80 p-8">
            <p class="text-xs font-semibold uppercase tracking-[0.55em] text-slate-500">Resources</p>
            <h3 class="mt-3 text-3xl font-semibold text-slate-900">Stay ahead of incidents.</h3>
            <p class="mt-2 text-base text-slate-500">Borrow our favourite Farmreel-style quick links.</p>
            <div class="mt-6 space-y-4">
              <a
                v-for="resource in resourceCards"
                :key="resource.title"
                :href="resource.href"
                class="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left text-slate-700 transition hover:border-white/30"
              >
                <div>
                  <p class="text-lg font-semibold text-slate-900">{{ resource.title }}</p>
                  <p class="text-sm text-slate-500">{{ resource.description }}</p>
                </div>
                <div class="flex flex-col items-end gap-2">
                  <span v-if="resource.badge" class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-900/80">{{ resource.badge }}</span>
                  <span aria-hidden="true" class="text-slate-900">→</span>
                </div>
              </a>
            </div>
          </div>
          <div class="rounded-[32px] border border-slate-800/80 bg-white/60 p-8">
            <p class="text-xs font-semibold uppercase tracking-[0.55em] text-slate-500">Office hours</p>
            <h3 class="mt-3 text-2xl font-semibold text-slate-900">Need a scheduled sync?</h3>
            <p class="mt-2 text-base text-slate-600">Book 15 minutes with an advocate to review onboarding, billing, or policy changes.</p>
            <div class="mt-5 grid gap-4 sm:grid-cols-2">
              <div class="rounded-2xl border border-slate-800/70 bg-white/70 p-4">
                <p class="text-sm font-semibold text-slate-900">APAC · GMT+7</p>
                <p class="text-sm text-slate-500">09:00 - 18:00 daily</p>
              </div>
              <div class="rounded-2xl border border-slate-800/70 bg-white/70 p-4">
                <p class="text-sm font-semibold text-slate-900">EU · GMT</p>
                <p class="text-sm text-slate-500">08:00 - 16:00 Mon-Fri</p>
              </div>
            </div>
            <a href="https://calendly.com" class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-emerald-200">
              Reserve a slot
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white">
      <div class="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:px-8">
        <p class="text-xs font-semibold uppercase tracking-[0.55em] text-slate-500">Need immediate help?</p>
        <h3 class="text-4xl font-semibold text-slate-900">Ops & success are listening.</h3>
        <p class="max-w-2xl text-base text-slate-600">
          Share context, ticket IDs, or screenshots exactly like the Farmreel FAQ suggests. We will mirror the process, keep you updated, and close the loop with clear documentation.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4">
          <a :href="CONTACT_LINK" class="btn-primary" target="_blank" rel="noreferrer">Open support chat</a>
          <a
            :href="CONTACT_LINK"
            class="inline-flex items-center gap-2 rounded-full border border-slate-800/70 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-200/60"
          >
            Send context pack
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  </div>
</template>
