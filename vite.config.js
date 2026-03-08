import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const ARCHIDEKT_TARGET = 'https://archidekt.com';
const ARCHIDEKT_PROXY_PREFIX = '/api/archidekt';
const SCRYFALL_TARGET = 'https://api.scryfall.com';
const SCRYFALL_PROXY_PREFIX = '/api/scryfall';

const archidektProxy = {
  target: ARCHIDEKT_TARGET,
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/archidekt/, '/api'),
};

const scryfallProxy = {
  target: SCRYFALL_TARGET,
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/scryfall/, ''),
};

const proxyConfig = {
  [ARCHIDEKT_PROXY_PREFIX]: archidektProxy,
  [SCRYFALL_PROXY_PREFIX]: scryfallProxy,
};

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: proxyConfig,
  },
  preview: {
    proxy: proxyConfig,
  },
});
