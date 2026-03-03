import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/lib/widget/chaincred-verify.ts',
      name: 'ChainCredVerify',
      formats: ['iife'],
      fileName: () => 'chaincred-verify.js',
    },
    outDir: 'dist/widget',
    emptyOutDir: true,
  },
});
