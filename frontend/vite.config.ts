import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/store': {
          target: env.VITE_MEDUSA_URL || 'http://localhost:9000',
          changeOrigin: true,
        },
        '/admin': {
          target: env.VITE_MEDUSA_URL || 'http://localhost:9000',
          changeOrigin: true,
        },
        '/auth': {
          target: env.VITE_MEDUSA_URL || 'http://localhost:9000',
          changeOrigin: true,
        },
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})
