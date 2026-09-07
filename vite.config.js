import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps asset paths relative so the built site works both on
// Vercel (served at /) and when opening dist/index.html directly.
export default defineConfig({
  plugins: [react()],
  base: './',
})
