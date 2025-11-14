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
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
      { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
      { path: '/plans', name: 'plans', component: () => import('../views/PricingView.vue') },
      { path: '/services', name: 'services', component: () => import('../views/ServicesView.vue') },
      { path: '/contact', name: 'contact', component: () => import('../views/ContactView.vue') },
      { path: '/cart', name: 'cart', component: () => import('../views/CartView.vue') },
      { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
      { path: '/account', name: 'account', component: () => import('../views/ProfileView.vue') },
      {
        path: '/services/:serviceId/order',
        name: 'service-order',
        component: () => import('../views/NewOrderView.vue'),
        props: true,
      },

      // ✅ new pages
      {
      path: '/privacy-policy',
      name: 'privacy',
      component: () => import('../views/PrivacyPolicyView.vue'),
    },
      {
        path: '/terms-of-service',
        name: 'terms',
        component: () => import('../views/TermsOfServiceView.vue'),
      },
      {
        path: '/faq',
        name: 'faq',
        component: () => import('../views/FaqView.vue'),
      },
    ],

  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
