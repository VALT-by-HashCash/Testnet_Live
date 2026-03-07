import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
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