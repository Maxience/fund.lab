import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Le moteur porte l'exigence de tolérance de 0,1 point et les règles
      // de décision : c'est lui que la couverture mesure.
      include: ['src/lib/moteur/**/*.ts'],
      exclude: ['src/lib/moteur/**/__tests__/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
