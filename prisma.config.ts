import { defineConfig, env } from 'prisma/config';

/**
 * Configuration de la CLI Prisma.
 *
 * Depuis Prisma 7, l'URL de connexion ne figure plus dans le schéma : elle
 * est fournie ici pour les commandes de migration, et par un adaptateur de
 * driver pour l'accès applicatif (src/lib/bd.ts). Prisma 7 ne charge plus
 * le fichier .env automatiquement ; en production, les variables viennent
 * de l'environnement et l'absence de .env n'est pas une erreur.
 */
try {
  process.loadEnvFile('.env');
} catch {
  // Pas de fichier .env : les variables sont déjà dans l'environnement.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.mts',
  },
});
