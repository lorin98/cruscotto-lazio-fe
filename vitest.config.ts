import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/shared/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      // si misura il codice dell'applicazione (src/, client generato compreso): le regole di lint locali e la config
      // eslint, eseguite dai test canary delle regole (tests/eslint-regole.test.ts), sono strumenti, non prodotto
      include: ['src/**'],
      reporter: ['text', 'json-summary'],
      reportsDirectory: './coverage',
    },
  },
});
