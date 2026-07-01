import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/pettrace-ai/',
  server: {
    port: 5181,
    strictPort: false,
    watch: {
      usePolling: true,
    },
    hmr: {
      overlay: true,
    },
  },
})
