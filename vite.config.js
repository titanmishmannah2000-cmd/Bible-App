import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // maplibre-gl alone is ~1 MB; it is already split into its own lazy chunk.
    chunkSizeWarningLimit: 1100,
  },
  optimizeDeps: {
    include: ['maplibre-gl'],
  },
})