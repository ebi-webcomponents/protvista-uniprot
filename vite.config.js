import { defineConfig } from 'vite';
import envCompatible from 'vite-plugin-env-compatible';
import { createHtmlPlugin } from 'vite-plugin-html';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import svg from 'vite-plugin-svgo';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    viteCommonjs(),
    envCompatible(),
    createHtmlPlugin({
      inject: {
        data: {
          title: 'protvista-uniprot',
        },
      },
    }),
    svg(),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'protvista-uniprot.mjs',
    },
    rollupOptions: {
      output: {
        chunkFileNames: '[name].js',
      },
    },
  },
});
