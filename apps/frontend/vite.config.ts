import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4001', // Nest.js backend
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Ensure _redirects file is copied to dist
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === '_redirects') {
            return '_redirects';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
});
