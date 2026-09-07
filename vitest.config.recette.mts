import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Configuration séparée pour les tests de recette (un scénario R01 à R12
 * par cas, quand cela a du sens) : ils écrivent dans une vraie base de
 * données et sont donc plus lents que la suite unitaire par défaut.
 *
 * Exécution : npm run test:recette
 * Exclus de `npm test` et de `npm run verifier`, qui restent rapides et
 * n'ouvrent aucune connexion réseau.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.recette.test.ts'],
    setupFiles: ['./vitest.setup.recette.mts'],
    // Une base partagée entre les fichiers : pas d'exécution en parallèle
    // entre fichiers, pour éviter qu'un nettoyage n'efface les données
    // qu'un autre fichier est en train de vérifier.
    fileParallelism: false,
    testTimeout: 20_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      'server-only': path.resolve(import.meta.dirname, './src/lib/test/server-only.ts'),
    },
  },
});
