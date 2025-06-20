import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  define: {
    'process.env': {},
  },

  base: '/frontend-v2',

  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },

  worker: {
    format: 'es', 
  },
});
