import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy only runs in dev (npm run dev), NOT in production build
    proxy: command === 'serve' ? {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    } : {}
  }
}))
