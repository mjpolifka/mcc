import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const ARCHIDEKT_TARGET = 'https://archidekt.com';
const ARCHIDEKT_PROXY_PREFIX = '/api/archidekt';

const archidektProxy = {
  target: ARCHIDEKT_TARGET,
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/archidekt/, '/api'),
};

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      [ARCHIDEKT_PROXY_PREFIX]: archidektProxy,
    },
  },
  preview: {
    proxy: {
      [ARCHIDEKT_PROXY_PREFIX]: archidektProxy,
    },
  },
});
