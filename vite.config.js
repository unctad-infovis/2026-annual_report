import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const name = '2026-annual_report';

export default defineConfig(({ command }) => ({
  build: {
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: command === 'build',
      },
    },
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: `js/${name}.min.js`,
        chunkFileNames: `js/${name}.[name].js`,
        assetFileNames: assetInfo => (assetInfo.name?.endsWith('.css') ? `css/${name}.min.css` : 'assets/[name]-[hash][extname]'),
      },
    },
    sourcemap: true,
  },
  define: { __PROJECT_NAME__: JSON.stringify(name) },
  plugins: [{ enforce: 'pre', ...mdx() }, react()],
  resolve: { preserveSymlinks: true },
  server: { port: 8080 },
}));
