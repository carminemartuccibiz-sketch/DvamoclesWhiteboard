import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- Aggiungi questo import

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss() // <-- Attiva il plugin qui
  ],
})