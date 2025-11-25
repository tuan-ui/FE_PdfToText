import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import viteConfig from './vite.config';
export default defineConfig({
  plugins: [...(viteConfig.plugins ?? []), react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        '**/*.d.ts',
        'src/types/**',
        'src/generated/**',
      ],
    },
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/, /@alilc/],
    },
  },
  optimizeDeps: {
    include: [
      '@alilc/lowcode-engine',
      '@alilc/antd-lowcode-materials',
      '@alilc/lowcode-utils',
      '@alilc/lowcode-editor-core',
    ],
  },
  resolve: {
    alias: {},
  },
  server: {
    host: '192.168.1.69',
    port: 5173,
  },
});
