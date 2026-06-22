import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standalone proving-ground app. Kept separate from the repo root so its React/three/Spark
// deps never tangle with the no-build raw-WebGL2 instrument in src/. When the pipeline is
// proven, the scene/camera modules graduate into a Vite library-mode build (ADR-012, PLAN §6).
export default defineConfig({
  root: '.',
  plugins: [react()],
  build: { outDir: 'dist', target: 'es2022' },
})
