import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The backend (backend/src/server.ts) listens on 3001 by default.
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3001'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': apiTarget },
  },
  preview: {
    proxy: { '/api': apiTarget },
  },
})
