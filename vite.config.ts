import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
export default defineConfig({
  plugins: [react()],
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
    alias: {
    },
  },
  server: {
    host: '192.168.1.69',
    port: 5173,
  },
});
