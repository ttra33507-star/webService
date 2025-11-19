import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = (env.VITE_DEV_PROXY_TARGET ?? env.VITE_API_BASE_URL ?? 'https://api.c4techhub.com').trim()

  return {
    plugins: [vue()],
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget || 'https://api.c4techhub.com',
          changeOrigin: true,
        },
      },
    },
  }
})
