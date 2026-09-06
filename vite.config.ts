import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The prototype is served from https://<user>.github.io/joan-kitchen-prototype/
// Set BASE_PATH=/ for local preview of a root-hosted build.
const base = process.env.BASE_PATH ?? '/joan-kitchen-prototype/'

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
