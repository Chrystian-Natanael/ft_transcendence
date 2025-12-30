import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  publicDir: 'public',
  server: {
    host: true,
    port: 5173
  }
})
