import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  worker: {
    format: 'es',
  },
  // Explicitly forward VITE_ env vars for Vercel builds where
  // import.meta.env may not pick them up automatically.
  define: Object.fromEntries(
    Object.entries(process.env)
      .filter(([key]) => key.startsWith('VITE_'))
      .map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  ),
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
