// Vite config for the DESKTOP STANDALONE build (and any bundled deploy).
// The raw static app still runs with no build (python3 -m http.server / the gig
// link) — Vite is additive: `vite build` emits a self-contained ./dist that the
// Tauri desktop app bundles, and that also uploads to static hosting as-is.
//
// base: './' → relative asset URLs, required so the bundle works inside Tauri's
// webview (and on any subpath host) rather than assuming a server root.
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'esnext', // top-level await / modern WebGL2 code; desktop webview is modern
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: { port: 5173, strictPort: true },
  // Tauri wants a fixed dev port and clean error overlay behaviour.
  clearScreen: false,
});
