import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { contentPlugin } from './scripts/lib/vite-plugin-content.ts';
import { personalPrefixes } from './src/config/site.ts';

const root = path.dirname(fileURLToPath(import.meta.url));

// Raptor Text is commercial: it is only used when licensed files exist in public/fonts/.
const hasRaptor = fs.existsSync(path.join(root, 'public/fonts/RaptorText-Regular.woff2'));

export default defineConfig({
  plugins: [
    react(),
    contentPlugin(root),
    {
      name: 'theme-boot-script',
      transformIndexHtml(html) {
        return html.replace('__PERSONAL_PREFIXES__', JSON.stringify(personalPrefixes));
      },
    },
  ],
  build: {
    // Firestore is one big (lazily loaded) chunk; everything else stays small.
    chunkSizeWarningLimit: 700,
  },
  define: {
    __HAS_RAPTOR__: JSON.stringify(hasRaptor),
  },
  server: {
    // `vercel dev` runs the /api functions; plain `npm run dev` proxies to it if it runs on :3000.
    proxy: process.env.API_PROXY ? { '/api': process.env.API_PROXY } : undefined,
  },
});
