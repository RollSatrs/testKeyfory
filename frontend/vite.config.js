import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dotenv from 'dotenv'
import path from 'path'

// Загружаем .env из корневой папки проекта
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const BACKEND_URL = process.env.BACKEND_URL
console.log('BACKEND_URL:', BACKEND_URL)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: BACKEND_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
