import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Les tests de recette (npm run test:recette) écrivent dans une vraie
    // base de données : exclus d'ici pour que la suite par défaut reste
    // rapide et sans connexion réseau.
    exclude: ['**/node_modules/**', 'src/**/*.recette.test.ts'],
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
      // Le marqueur server-only lève une exception hors composant serveur :
      // remplacé par un module vide pour tester la couche service.
      'server-only': path.resolve(import.meta.dirname, './src/lib/test/server-only.ts'),
    },
  },
});
