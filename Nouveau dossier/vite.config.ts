
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Listen on all network interfaces
    // Removing specific HMR config allows Vite to auto-detect, 
    // which is often more reliable for localhost.
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
