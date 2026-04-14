import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  server: {
    host: '127.0.0.1',
  },
  plugins: [react()],
  test: {
    exclude: [...configDefaults.exclude, 'tests/**'],
  },
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('/@dnd-kit/')) {
            return 'dnd'
          }

          if (id.includes('/lucide-react/')) {
            return 'icons'
          }

          if (id.includes('/@myriaddreamin/typst-ts-')) {
            return 'renderer'
          }
        },
      },
    },
  },
})
