import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react()
    ],
    server: {
        host: true,
        port: 5174,
        allowedHosts: [
            'localhost',
            '127.0.0.1',
            '407ce18f23a7.ngrok-free.app',
            '.ngrok-free.app',
            '.ngrok.io'
        ]
    }
})