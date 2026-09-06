# Outil de chalandise FUND.lab

Application web d'aide à l'étude de chalandise pour projets de restauration,
snack et salon de thé. Elle transpose la méthode FUND.lab, jusqu'ici portée
par un classeur Excel, en un parcours guidé pour les PME et un espace de
travail pour les experts du cabinet, avec un moteur de calcul unique,
versionné et testé.

Le plan ordonné est dans [docs/plan-implementation.md](docs/plan-implementation.md),
l'état d'avancement dans [docs/avancement/](docs/avancement/).

## Prérequis

- Node.js 24 (22.12 minimum) et npm.
- PostgreSQL 16, nécessaire à partir de la phase 3 (persistance).

## Installation

```bash
npm install
cp .env.example .env
npm run dev
```

Renseigner les valeurs de `.env` avant de lancer les fonctions qui en
dépendent. L'application répond sur http://localhost:3000, ou sur le port
suivant si celui-ci est occupé.

## Commandes

| Commande                | Rôle                              |
| ----------------------- | --------------------------------- |
| `npm run dev`           | Serveur de développement          |
| `npm run build`         | Construction de production        |
| `npm run typecheck`     | Vérification des types            |
| `npm run lint`          | ESLint                            |
| `npm run format`        | Formatage Prettier                |
| `npm run tirets`        | Contrôle des tirets interdits     |
| `npm test`              | Tests Vitest                      |
| `npm run test:coverage` | Tests avec couverture du moteur   |
| `npm run verifier`      | Enchaîne toutes les vérifications |

## Documentation

- [Conventions du projet](docs/conventions.md) : langue, nommage,
  arborescence, invariants d'architecture, flux de travail.
- [Journal des décisions](docs/decisions/) : choix structurants et leurs
  motifs.
- [Plan d'implémentation](docs/plan-implementation.md) : points ordonnés,
  phase par phase.

## Confidentialité

Projet réalisé pour FUND.lab dans le cadre d'un challenge. La méthode, les
règles de calcul et les contenus sont confidentiels : aucune diffusion sans
autorisation écrite de FUND.lab.
