import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const isProd = mode === 'production';
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // L1: strip console.* and debugger statements from production bundles to
    // prevent PII (phones, names, payment ids) leaking via the browser console.
    // L2: source maps default to false but make it explicit so a future flip
    // to `sourcemap: true` for debugging doesn't accidentally land in prod.
    esbuild: isProd ? { drop: ['console', 'debugger'] } : {},
    build: {
      sourcemap: false,
    },
    server: {
      port: 5175,
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
