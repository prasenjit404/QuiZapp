import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        // ⚠️ CHECK YOUR BACKEND PORT!
        // Your code says 10000 in index.js but 11000 in axiosClient. 
        // I used 10000 here. Change it if your backend runs on 11000.
        target: 'http://localhost:11000', 
        changeOrigin: true,
        secure: false,
      },
    },
  },
  css: {
    transformer: 'postcss',
  },
})