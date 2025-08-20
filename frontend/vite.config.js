import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import path from 'path'

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const BACKEND_URL = process.env.BACKEND_URL

// Export async config so we can dynamically import the Tailwind plugin
export default defineConfig(async () => {
  const plugins = [react()]

  // If TAILWIND_DISABLE_OXIDE is not set, import the Tailwind Vite plugin.
  // In some container environments the native @tailwindcss/oxide binding fails,
  // so we respect the TAILWIND_DISABLE_OXIDE env var to skip loading it.
  if (process.env.TAILWIND_DISABLE_OXIDE !== '1') {
    try {
      const tailwindModule = await import('@tailwindcss/vite')
      if (tailwindModule && typeof tailwindModule.default === 'function') {
        plugins.push(tailwindModule.default())
      }
    } catch (err) {
      console.error('Failed to import @tailwindcss/vite at runtime:', err)
    }
  } else {
    console.log('TAILWIND_DISABLE_OXIDE=1 — skipping @tailwindcss/vite plugin import')
  }

  // Prefer the Vite-specific env var (set by docker-compose as VITE_BACKEND_URL).
  const proxyTarget = process.env.VITE_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:3000'

  return {
    plugins,
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
