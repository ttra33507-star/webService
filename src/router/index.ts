// import { createRouter, createWebHistory } from 'vue-router';

// const router = createRouter({
//   history: createWebHistory(import.meta.env.BASE_URL),
//   routes: [
//     {
//       path: '/',
//       name: 'home',
//       component: () => import('../views/HomeView.vue'),
//     },
//     {
//       path: '/plans',
//       name: 'plans',
//       component: () => import('../views/PricingView.vue'),
//     },
//     {
//       path: '/services',
//       name: 'services',
//       component: () => import('../views/ServicesView.vue'),
//     },
//     {
//       path: '/contact',
//       name: 'contact',
//       component: () => import('../views/ContactView.vue'),
//     },
//     {
//       path: '/cart',
//       name: 'cart',
//       component: () => import('../views/CartView.vue'),
//     },
//     {
//       path: '/login',
//       name: 'login',
//       component: () => import('../views/LoginView.vue'),
//     },
//     {
//       path: '/account',
//       name: 'account',
//       component: () => import('../views/ProfileView.vue'),
//     },
//     {
//       path: '/services/:serviceId/order',
//       name: 'service-order',
//       component: () => import('../views/NewOrderView.vue'),
//       props: true,
//     },
//   ],
//   scrollBehavior() {
//     return { top: 0 };
//   },
// });

// export default router;
import { createRouter, createWebHistory, type RouteMeta } from 'vue-router';
import { applyPageMeta, type PageMetaOptions } from '../composables/usePageMeta';

type RouteSeoMeta = PageMetaOptions & RouteMeta;

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
      {
        path: '/',
        name: 'home',
        component: () => import('../views/HomeView.vue'),
        meta: {
          title: 'Automation & Growth Hub',
          description:
            'Grow faster with C4 Tech Hub automation playbooks, managed page services, and streamlined digital tools across Facebook, Telegram, and TikTok.',
        },
      },
      {
        path: '/plans',
        name: 'plans',
        component: () => import('../views/PricingView.vue'),
        meta: {
          title: 'Pricing & Plans',
          description: 'Simple plans for automation, page management, and support that help you scale efficiently.',
        },
      },
      {
        path: '/services',
        name: 'services',
        component: () => import('../views/ServicesView.vue'),
        meta: {
          title: 'Services Catalog',
          description: 'Browse automation playbooks, page management, and growth services tailored to your channels.',
        },
      },
      {
        path: '/cart',
        name: 'cart',
        component: () => import('../views/CartView.vue'),
        meta: {
          title: 'Your Cart',
          description: 'Review your selections before checkout for C4 Tech Hub services.',
          noIndex: true,
        },
      },
      {
        path: '/signin',
        name: 'login',
        component: () => import('../views/LoginView.vue'),
        meta: {
          title: 'Sign In',
          description: 'Access your C4 Tech Hub account to manage services and automation tools.',
          noIndex: true,
        },
      },
      {
        path: '/signup',
        name: 'signup',
        component: () => import('../views/SignupView.vue'),
        meta: {
          title: 'Create Account',
          description: 'Join C4 Tech Hub to unlock automation, growth services, and managed support.',
          noIndex: true,
        },
      },
      {
        path: '/account',
        name: 'account',
        component: () => import('../views/ProfileView.vue'),
        meta: {
          title: 'Account',
          description: 'Manage your profile, billing, and service access in C4 Tech Hub.',
          noIndex: true,
        },
      },
      {
        path: '/services/:serviceId/order',
        name: 'service-order',
        component: () => import('../views/NewOrderView.vue'),
        props: true,
        meta: {
          title: 'Order Service',
          description: 'Confirm and submit your service order with C4 Tech Hub.',
          noIndex: true,
        },
      },

      // ✅ new pages
      {
      path: '/privacy-policy',
      name: 'privacy',
      component: () => import('../views/PrivacyPolicyView.vue'),
      meta: {
        title: 'Privacy Policy',
        description: 'Learn how C4 Tech Hub handles data privacy, security, and user information.',
        noIndex: true,
      },
    },
      {
        path: '/terms-of-service',
        name: 'terms',
        component: () => import('../views/TermsOfServiceView.vue'),
        meta: {
          title: 'Terms of Service',
          description: 'Review the terms for using C4 Tech Hub products and services.',
          noIndex: true,
        },
      },
      {
        path: '/faq',
        name: 'faq',
        component: () => import('../views/FaqView.vue'),
        meta: {
          title: 'Frequently Asked Questions',
          description: 'Find quick answers about C4 Tech Hub services, billing, and support.',
        },
      },
    ],

  scrollBehavior() {
    return { top: 0 };
  },
});

router.afterEach((to) => {
  const seoMeta = (to.meta as RouteSeoMeta | undefined) || {};
  const canonicalPath = typeof to.fullPath === 'string' ? to.fullPath : to.path;
  applyPageMeta({
    title: seoMeta.title,
    description: seoMeta.description,
    canonical: canonicalPath,
    ogImage: seoMeta.ogImage,
    noIndex: seoMeta.noIndex,
  });
});

export default router;
