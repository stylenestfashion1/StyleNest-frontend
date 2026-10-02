import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://api.stylenestfashion.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://api.stylenestfashion.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
