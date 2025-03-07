import { defineConfig } from 'vite';
import banner from 'vite-plugin-banner';
import { resolve } from 'path';

const LICENSE_BANNER = [
  '/*',
  ` MIT License - Copyright (c) ${new Date().getFullYear()} Privacy Portal.`,
  ` See full license at https://github.com/privacyportal/privacy-kit/LICENSE.`,
  `*/`
].join('\n');

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PrivacyKit',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => `privacy-kit.${format}.js`,
    }
  },
  esbuild: {
    drop: ['console', 'debugger']
  },
  plugins: [
    banner(LICENSE_BANNER)
  ]
});
