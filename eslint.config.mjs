import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Désactive les règles de style déjà couvertes par Prettier.
  prettier,
  globalIgnores([
    // Ignorés par défaut par eslint-config-next.
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Rapports de couverture générés par Vitest.
    'coverage/**',
    // Client Prisma généré, ni écrit ni maintenu à la main.
    'src/generated/**',
  ]),
]);
