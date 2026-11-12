import { defineConfig } from 'vite';

// Relative base so the built bundle can be dropped into any Minest host path.
export default defineConfig({
  base: './',
  server: { host: true, port: 5188 },
  build: {
    target: 'es2022',
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
