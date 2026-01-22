import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // Tauri expects a fixed port in development
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
  },
  
  // Tauri uses a dynamic base path
  build: {
    outDir: 'dist',
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
  
  // Prevent vite from obscuring rust errors
  clearScreen: false,
  
  // Environment prefix for Tauri
  envPrefix: ['VITE_', 'TAURI_'],
})
