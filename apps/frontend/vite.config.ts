import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

// Custom plugin to copy _redirects file
const copyRedirectsPlugin = () => ({
  name: 'copy-redirects',
  closeBundle() {
    const source = resolve(__dirname, 'public/_redirects');
    const dest = resolve(__dirname, 'dist/_redirects');
    
    if (existsSync(source)) {
      if (!existsSync('dist')) {
        mkdirSync('dist', { recursive: true });
      }
      copyFileSync(source, dest);
      console.log('✅ _redirects file copied to dist/');
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyRedirectsPlugin()],
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
      input: {
        main: resolve(__dirname, 'index.html'),
      }
    }
  }
});
