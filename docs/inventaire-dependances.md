# Inventaire des dépendances et services externes

Exigence du brief (Sécurité et qualité, p.8) : dépendances tierces
inventoriées avec licence et éventuel coût futur. Mis à jour à chaque ajout
ou retrait de dépendance.

## Bibliothèques (dépendances de production)

| Paquet             | Version | Licence    | Rôle                                             | Coût    |
| ------------------ | ------- | ---------- | ------------------------------------------------ | ------- |
| next               | 16.3.4  | MIT        | Framework applicatif (App Router)                | Gratuit |
| react / react-dom  | 19.2.8  | MIT        | Bibliothèque d'interface                         | Gratuit |
| @prisma/client     | ^7.10.0 | Apache-2.0 | Client ORM vers PostgreSQL                       | Gratuit |
| @prisma/adapter-pg | ^7.10.0 | Apache-2.0 | Adaptateur Prisma pour `pg`                      | Gratuit |
| zod                | ^4.5.4  | MIT        | Schémas de validation partagés client/serveur    | Gratuit |
| server-only        | ^0.0.1  | MIT        | Garde-fou : empêche l'import serveur côté client | Gratuit |

## Outillage (dépendances de développement, jamais livrées)

| Paquet                                               | Version           | Licence    | Rôle                                                   |
| ---------------------------------------------------- | ----------------- | ---------- | ------------------------------------------------------ |
| typescript                                           | ^5                | Apache-2.0 | Vérification de types                                  |
| eslint / eslint-config-next / eslint-config-prettier | ^9 / 16.3.4 / ^10 | MIT        | Analyse statique                                       |
| prettier                                             | ^3.9.6            | MIT        | Formatage automatique                                  |
| tailwindcss / @tailwindcss/postcss                   | ^4                | MIT        | Styles utilitaires                                     |
| vitest / @vitest/coverage-v8                         | ^5.0.0            | MIT        | Tests automatisés et couverture                        |
| prisma (CLI)                                         | ^7.10.0           | Apache-2.0 | Migrations et génération du client                     |
| tsx                                                  | ^4.23.13          | MIT        | Exécution de scripts TypeScript (seed, comptes Expert) |
| marked                                               | ^18.0.11          | MIT        | Conversion Markdown → HTML pour l'export PDF           |

Toutes les licences (MIT, Apache-2.0) sont permissives et sans redevance :
aucune ne conditionne l'usage commercial à un paiement.

## Services externes utilisés

| Service                | Usage                                        | Niveau gratuit                                                      | Coût si dépassement      | Réversibilité                                                         |
| ---------------------- | -------------------------------------------- | ------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------- |
| PostgreSQL             | Base de données (comptes, études, résultats) | Dépend de l'hébergeur retenu (proposition : Neon, offre gratuite)   | Variable selon hébergeur | Totale : `pg_dump` / `pg_restore`, aucun format propriétaire          |
| Hébergement applicatif | Exécution de l'application Next.js           | Dépend de l'hébergeur retenu (proposition : Vercel, offre gratuite) | Variable selon hébergeur | Totale : Node.js standard, déployable sur toute plateforme compatible |

Aucun autre service externe n'est appelé par le code (pas d'API tierce, pas
d'envoi d'e-mail, pas de géocodage, pas d'IA générative, conformément au
périmètre du MVP).

Le choix définitif d'hébergeur sera consigné ici avec l'URL de recette dès
la tâche L-01 de la checklist de livraison.
