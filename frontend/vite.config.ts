import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load frontend/.env* (all keys, not only VITE_*) so the dev proxy target is configurable.
  // BACKEND_URL has no VITE_ prefix, so it is never exposed to browser code.
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.BACKEND_URL || 'http://localhost:3000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Forward /api/* to Rails during development, so the browser sees a single origin
      // and no CORS setup is needed.
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
