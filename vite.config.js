import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const ARCHIDEKT_TARGET = 'https://archidekt.com';
const ARCHIDEKT_PROXY_PREFIX = '/api/archidekt';
const SCRYFALL_TARGET = 'https://api.scryfall.com';
const SCRYFALL_PROXY_PREFIX = '/api/scryfall';
const APP_NAME = process.env.npm_package_name ?? 'middle-class-commander';
const APP_VERSION = process.env.npm_package_version ?? '1.0.0';
const APP_USER_AGENT = `${APP_NAME}/${APP_VERSION}`;
const DEFAULT_ACCEPT = 'application/json;q=0.9,*/*;q=0.8';

const archidektProxy = {
  target: ARCHIDEKT_TARGET,
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/archidekt/, '/api'),
};

const scryfallProxy = {
  target: SCRYFALL_TARGET,
  changeOrigin: true,
  headers: {
    'User-Agent': APP_USER_AGENT,
    Accept: DEFAULT_ACCEPT,
  },
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
