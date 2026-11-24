import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    host: true
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/three') || id.includes('@react-three')) {
            return 'three-bundle';
          }
          if (id.includes('node_modules/recharts')) {
            return 'recharts-bundle';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'motion-bundle';
          }
        }
      }
    }
  }
})
