/**
 * Bascule la base de données utilisée par la couche services sur la base de
 * test dédiée, avant que `src/lib/bd.ts` (ou tout service qui l'importe) ne
 * soit chargé par un fichier `*.recette.test.ts`.
 *
 * `chalandise_test` est une base PostgreSQL séparée sur le même serveur,
 * jamais partagée avec le développement ni la démonstration. Son URL vit
 * dans `.env`, variable `DATABASE_URL_TEST`, jamais versionnée.
 */
try {
  process.loadEnvFile('.env');
} catch {
  // Variables déjà dans l'environnement (intégration continue).
}

if (!process.env.DATABASE_URL_TEST) {
  throw new Error(
    'DATABASE_URL_TEST est absente. Les tests de recette exigent une base PostgreSQL dédiée, ' +
      'distincte de la base de développement. Voir .env.example.',
  );
}

process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
