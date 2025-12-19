import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    // Suppress console output during tests
    silent: false,
    env: {
      NODE_ENV: 'test',
    },
  },
});
