import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// 3D Type 2.0: the 1.0 engine and its 23 world modules are imported unchanged from
// ../typing-worlds-app/src; this project only adds the 2.0 renderer, staging and UI.
// The build goes to /type3d-2/ at the repo root (the folder that is deployed).
export default defineConfig({
  base: './',
  server: { host: true, port: 5189, fs: { allow: [here('..')] } },
  resolve: {
    alias: { '@v1': here('../typing-worlds-app/src') },
    dedupe: ['three'],
  },
  build: {
    target: 'es2022',
    outDir: here('../../type3d-2'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
        },
      },
    },
  },
});
