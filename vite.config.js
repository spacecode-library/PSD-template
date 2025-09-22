import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Allow serving files from the project root and node_modules
      allow: ['..', join(__dirname, 'node_modules')]
    }
  },
  assetsInclude: ['**/*.psd'],
  // Serve CESDK assets from node_modules
  publicDir: 'public',
  resolve: {
    alias: {
      '@cesdk-assets': join(__dirname, 'node_modules/@cesdk/cesdk-js/assets')
    }
  }
})
