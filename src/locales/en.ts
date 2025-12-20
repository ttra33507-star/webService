const en = {
  nav: {
    home: 'Home',
    services: 'Services',
    contact: 'Contact',
  },
  header: {
    dashboard: 'Dashboard',
    login: 'Login',
    register: 'Register',
    accounts: 'Accounts',
    profile: 'Profile',
    signOut: 'Sign out',
    accountsProfile: 'Accounts Profile',
    menu: 'Menu',
    toggleMenu: 'Toggle menu',
    closeMenu: 'Close menu',
    telegramSupport: 'Telegram Support',
    emailSupport: 'Email Support',
    closeEmailSupportDialog: 'Close email support dialog',
    tapCopyToEmail: 'Tap copy to quickly email us from your device.',
    copyEmail: 'Copy email',
    copiedToClipboard: 'Copied to clipboard',
    unableToCopyAutomatically: 'Unable to copy automatically',
  },
  footer: {
    legalInformation: 'Legal Information',
    privacyPolicy: 'Privacy Policy',
    privacyPolicyDescription: 'Learn how we protect and handle your data.',
    termsOfService: 'Terms of Service',
    termsOfServiceDescription: 'Read the legal terms for using the platform.',
    faq: 'FAQ',
    faqDescription: 'Find fast answers to the most common questions.',
    allRightsReserved: 'All rights reserved.',
  },
  chat: {
    chatSupport: 'Chat Support',
    ariaTelegramSupport: 'Chat support on Telegram',
  },
  language: {
    english: 'English',
    khmer: 'Khmer',
  },
  actions: {
    quickView: 'Quick view',
    orderNow: 'Order Now',
    retry: 'Retry',
    viewCatalog: 'View the catalog',
    goToServices: 'Go to services',
  },
  home: {
    hero: {
      title: 'Modern Solutions for Modern Work',
      description:
        'C4TechHub delivers modern services and smart digital tools designed to make your work faster and easier.',
    },
    heroSlides: {
      badges: {
        managedCheckout: 'Managed Checkout',
        commercePlaybooks: 'Commerce Playbooks',
        realTimeInsights: 'Real-time Insights',
      },
      highlights: {
        goLive48Hours: 'Go live in under 48 hours',
        noCodeCustomization: 'No-code customization',
        templatesReady: 'Templates ready to deploy',
        crmAnalytics: 'CRM & analytics included',
        revenuePulse: 'Revenue pulse & trendlines',
        exportReports: 'Export-ready reports',
      },
      managedCheckoutTitle: 'Fast Follower Growth Solutions',
      managedCheckoutDescription:
        'Increase your page followers with C4TechHub’s fast, reliable, and modern growth services',
      managedCheckoutImageAlt: 'Managed checkout dashboard preview',
      facebookAutomationTitle: 'C4 Facebook Automation Hub',
      facebookAutomationDescription:
        'C4 Facebook Automation Hub gives you smart tools to manage your page faster and more easily. Handle tasks like comments and page actions in one place, reduce manual work, and keep everything running smoothly',
      facebookAutomationImageAlt: 'Automated campaign preview',
      telegramAutomationTitle: 'C4 Telegram Automation Hub',
      telegramAutomationDescription:
        'C4 Telegram Automation Hub helps you manage your Telegram audience more easily. Add members safely, send messages automatically, and keep your channels active with simple, smart automation tools',
      telegramAutomationImageAlt: 'Insights dashboard preview',
      tiktokDownloaderTitle: 'C4 TikTok Video Downloader',
      tiktokDownloaderDescription:
        'Download TikTok videos quickly and in high quality with C4TechHub. Just paste the link and save your videos without watermarks, fast and easy',
      tiktokDownloaderImageAlt: 'TikTok downloader preview',
      pageManagementTitle: 'Page Management Services',
      pageManagementDescription:
        'We manage your Facebook Pages and handle boosting for live videos and posts. Our private Facebook group also helps share your content to increase reach. This gives your page more visibility and helps you attract more customers faster.',
      pageManagementImageAlt: 'Page management service preview',
    },
    featuredServices: {
      title: 'Our Service',
      errors: {
        title: 'Unable to load featured services.',
        loadFailed: 'Unable to load services right now. Please try again.',
      },
      syncing: {
        title: 'Services are syncing.',
        description: 'Visit the catalog to browse every offer from the API.',
      },
    },
  },
  services: {
    at: 'at',
    catalog: {
      label: 'Services Catalog',
      heroTitle: 'Modern Tools & Services Hub',
      heroDescription:
        'C4TechHub brings all your digital services and smart tools together in one place. Work faster, manage everything easily, and access powerful features for automation, growth, and daily tasks without any complexity',
      stats: {
        services: 'Services',
        categories: 'Categories',
        lastSynced: 'Last synced',
      },
      status: {
        awaitingSync: 'Awaiting sync',
      },
      errors: {
        title: 'We hit a snag syncing services.',
        loadFailed: 'Unable to load services right now. Please try again in a moment.',
      },
      empty: {
        title: 'No services available yet.',
        description: 'Once catalog data is published, it will appear here automatically.',
      },
    },
  },
  account: {
    title: 'Account Overview',
    placeholders: {
      memberName: 'C4 TechHub Member',
    },
    labels: {
      name: 'Name',
      email: 'Email',
      session: 'Session',
      support: 'Support',
    },
    actions: {
      signOut: 'Sign out',
    },
    sessionStatus: {
      active: 'Session active',
      expired: 'Session expired',
    },
    support: {
      telegram: 'Telegram',
      faq: 'FAQ',
    },
    signInPrompt: {
      prefix: 'You need to sign in to view your account. Please ',
      link: 'continue to login',
      suffix: ' first.',
    },
  },
  auth: {
    signIn: {
      badge: 'Account access',
      title: 'Sign in to continue',
      subtitle:
        'Use your account to continue ordering. Your session unlocks checkout flows and saved information.',
      email: 'Email',
      password: 'Password',
      cta: 'Sign in',
      ctaLoading: 'Signing in...',
      securityCheck: {
        required: 'Please complete the security check.',
        loadError: 'Unable to load the security check. Please refresh the page.',
        notConfigured: 'Security check is required but not configured. Set VITE_TURNSTILE_SITE_KEY and reload.',
      },
      alreadySignedIn: {
        message: 'You are already signed in.',
        continue: 'Continue',
      },
    },
    errors: {
      genericSignIn: 'Unable to sign in. Please try again.',
      turnstileRequired: 'The turnstile token field is required.',
      turnstileNotConfigured: 'Turnstile is required by the API but not configured in this app.',
    },
  },
  cart: {
    badge: 'Manage orders',
    title: 'Cart overview',
    description:
      'Review every item currently queued for checkout. Connected directly to the live API so you can monitor quantities, pricing, and order totals in real time.',
    refresh: 'Refresh cart',
    refreshing: 'Refreshing...',
    errors: {
      loadFailed: 'Unable to load the cart right now. Please try again shortly.',
    },
    empty: {
      title: 'No items are currently in the cart.',
      ctaPrefix: 'Head back to the ',
      homeLink: 'home page',
      ctaSuffix: ' to add products.',
    },
    table: {
      product: 'Product',
      quantity: 'Quantity',
      unitPrice: 'Unit price',
      lineTotal: 'Line total',
      sku: 'SKU',
      empty: 'No items in the cart yet.',
    },
    summary: {
      title: 'Order summary',
      subtotal: 'Subtotal',
      discount: 'Discount',
      tax: 'Tax',
      total: 'Total',
      proceed: 'Proceed to checkout',
    },
  },
  terms: {
    title: 'Terms of Service',
    sections: {
      acceptance: {
        title: '1. Acceptance of Terms',
        body: "By accessing or using C4 TechHub’s services, you agree to these Terms of Service and all applicable laws and regulations.",
      },
      license: {
        title: '2. Use License',
        body: 'We grant you a limited, non-exclusive, non-transferable license to use our services for personal or business purposes, subject to these terms.',
      },
      responsibilities: {
        title: '3. Account Responsibilities',
        body: 'You are responsible for keeping your account credentials secure and for all actions taken under your account.',
      },
      modifications: {
        title: '4. Service Modifications',
        body: 'We may modify, update, suspend, or discontinue any part of our services at any time without prior notice.',
      },
      termination: {
        title: '5. Termination',
        body: 'We may suspend or terminate your account immediately, without prior notice, if you violate these Terms of Service.',
      },
    },
  },
  privacy: {
    title: 'Privacy Policy',
    sections: {
      collect: {
        title: '1. Information We Collect',
        body: 'We collect information you provide directly to us when you create an account, make a purchase, or communicate with us. This may include your name, email address, and payment information.',
      },
      use: {
        title: '2. How We Use Your Information',
        body: 'We use the information we collect to provide, maintain, and improve our services, process your transactions, and communicate with you about your account and our services.',
      },
      sharing: {
        title: '3. Information Sharing',
        body: 'We do not sell or rent your personal information to third parties. We may share your information with service providers who assist us in operating our business.',
      },
      security: {
        title: '4. Data Security',
        body: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, or destruction.',
      },
      contact: {
        title: '5. Contact Us',
        bodyPrefix: 'If you have any questions about this Privacy Policy, please contact us at ',
        bodySuffix: '.',
      },
    },
  },
  faq: {
    title: 'FAQ',
    items: {
      whatIs: {
        question: 'What is C4 TechHub?',
        answer:
          'C4 TechHub is a tool designed to help users manage and automate their farming operations efficiently, with features for monitoring, analyzing, and optimizing agricultural activities.',
      },
      gettingStarted: {
        question: 'How do I get started with C4 TechHub?',
        answer:
          'Create an account, choose a service, and follow the onboarding steps inside your dashboard to connect your data and start using it.',
      },
      payment: {
        question: 'What payment methods do you accept?',
        answer:
          'We accept major cards and other supported payment methods shown at checkout. All payments are processed securely.',
      },
      support: {
        question: 'How do I get support if I have issues?',
        answer:
          'You can contact our support team via the contact form or the support email provided in your dashboard.',
      },
      refund: {
        question: 'Is there a refund policy?',
        answer:
          'Refunds are handled according to our Refund Policy. Please review it before making a purchase.',
      },
    },
  },
};

export default en;
