import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Determine Env vars for client side. 
    // Vite uses import.meta.env, but the existing code uses process.env.
    // This polyfills process.env so we don't have to rewrite the whole app.
    'process.env': process.env
  }
});