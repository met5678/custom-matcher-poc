import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // For GitHub Pages, set BASE_PATH to your repo name, e.g. /my-repo/
  const base = process.env.BASE_PATH ?? (mode === 'production' ? '/' : '/')

  return {
    plugins: [react()],
    base
  }
})
