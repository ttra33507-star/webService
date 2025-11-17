import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './style.css';

createApp(App).use(router).mount('#app');

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
