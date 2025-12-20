import { createApp, nextTick, watch } from 'vue';
import AOS from 'aos';
import 'aos/dist/aos.css';
import App from './App.vue';
import router from './router';
import { i18n } from './i18n';
import './style.css';

const app = createApp(App);
app.use(router);
app.use(i18n);
app.mount('#app');

if (typeof window !== 'undefined') {
	const prefersReducedMotion =
		typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

	if (!prefersReducedMotion) {
		const mobileMq = window.matchMedia('(max-width: 639.98px)');

		const initAos = () => {
			const isMobile = mobileMq.matches;
			AOS.init({
				disable: false,
				once: true,
				offset: isMobile ? 80 : 120,
				duration: isMobile ? 580 : 650,
				easing: 'ease-out-cubic',
			});
		};

		initAos();
		mobileMq.addEventListener('change', initAos);

		router.afterEach(() => {
			nextTick(() => {
				AOS.refresh();
			});
		});
	}

	const setHtmlLang = (lang: string) => {
		document.documentElement.lang = lang;
	};

	setHtmlLang(i18n.global.locale.value);
	watch(i18n.global.locale, (lang) => setHtmlLang(lang));
}

// Version check: compare frontend build version with API /meta.json and prompt reload when changed
;(function registerVersionChecker() {
	const API_BASE = (import.meta.env.VITE_API_BASE ?? '').toString().replace(/\/+$/, '');
	const localVersion = (import.meta.env.VITE_APP_VERSION ?? '').toString();

	if (!API_BASE || !localVersion) return;

	const metaUrl = `${API_BASE.replace(/\/+$/, '')}/meta.json`;

	async function fetchServerVersion(): Promise<string | null> {
		try {
			const res = await fetch(metaUrl, { cache: 'no-store' });
			if (!res.ok) return null;
			const j = await res.json();
			return j?.version ?? null;
		} catch {
			return null;
		}
	}

	async function checkAndNotify() {
		const serverVer = await fetchServerVersion();
		if (!serverVer) return;
		if (serverVer !== localVersion) {
				try {
					// Try to show a non-blocking toast if available, then auto-reload after a short delay.
					try {
						const mod = await import('./composables/useToast');
						if (mod && typeof mod.useToast === 'function') {
							mod.useToast().push('A new version is available — the app will reload shortly.', 'info');
						}
					} catch {
						// toast not available — fall back to console.log
						console.log('New frontend version available, reloading...');
					}

					// Auto-reload after 3 seconds so user has a moment to see the message
					setTimeout(() => {
						window.location.reload();
					}, 3000);
				} catch {
					// ignore
				}
		}
	}

	// Check on load and when tab becomes visible
	checkAndNotify();
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') {
			checkAndNotify();
		}
	});
})();
