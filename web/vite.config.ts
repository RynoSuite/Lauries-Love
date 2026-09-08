import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Web app for Laurie's Love. Shares the same Supabase backend as the mobile
// apps (iOS/Android) — accounts, data, messages, groups all synced.

// Identifies this build. Baked into the bundle AND written to dist/version.json
// so a running tab can tell it is out of date. Without this an open tab keeps
// serving whatever JS it loaded on first visit: navigating inside a single-page
// app never re-fetches the bundle, so a deploy is invisible until a hard
// reload. That matters here because the client reviews with tabs left open for
// days and would otherwise report bugs that were already fixed.
const BUILD_ID = new Date().toISOString();

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    react(),
    {
      name: 'write-version-json',
      apply: 'build',
      writeBundle(options) {
        const dir = options.dir ?? join(process.cwd(), 'dist');
        writeFileSync(join(dir, 'version.json'), JSON.stringify({ build: BUILD_ID }));
      },
    },
  ],
  server: { port: 5173 },
});
