import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    // Prevent Vitest from picking up Playwright E2E specs in e2e/
    exclude: ['node_modules', 'dist', 'e2e/**'],
  },
  server: {
    proxy: {
      // proxy API calls to avoid CORS in dev
      '/api': {
        target: 'https://breadcrumbsdata.com',
        changeOrigin: true,
        secure: true,
        ws: false,
        rewrite: (path) => path
      },
      '/profiles': {
        target: 'https://breadcrumbsdata.com',
        changeOrigin: true,
        secure: true,
        ws: false,
        rewrite: (path) => path
      }
    }
  }
})