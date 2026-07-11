import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: true,
  },
  build: {
    // The Spline 3D hero background (@splinetool/react-spline) is already lazy-loaded into
    // its own chunk (see src/components/ui/SplineScene.tsx) and only fetched on desktop
    // viewports, with a lightweight canvas fallback everywhere else — its chunk size is
    // inherent to the library, not a splitting problem, so raise the warning ceiling instead
    // of fragmenting an already-optimal lazy import.
    chunkSizeWarningLimit: 2200,
  },
})
