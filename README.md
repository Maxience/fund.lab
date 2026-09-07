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
- PostgreSQL 16 ou 17, joignable depuis le poste (URL dans .env).

## Installation

```bash
npm install
cp .env.example .env
npm run dev
```

Renseigner ensuite `.env` : URL PostgreSQL, identité et mot de passe du
premier compte Expert (voir les commentaires du fichier). Puis :

````bash
npm run db:migrer   # applique les migrations versionnées
npm run db:semer    # compte Expert initial et données de démonstration fictives
``` L'application répond sur http://localhost:3000, ou sur le port
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
| `npm run db:migrer`     | Applique les migrations           |
| `npm run db:semer`      | Données de démonstration          |
| `npm run exporter:pdf`  | Export PDF d'un document Markdown |
| `npm test`              | Tests Vitest (suite rapide, sans base de données) |
| `npm run test:coverage` | Tests avec couverture du moteur   |
| `npm run test:recette`  | Tests de recette R01-R12 contre `DATABASE_URL_TEST` (voir `docs/decisions/0006-tests-de-recette-base-dediee.md`) |
| `npm run auth:creer`    | Crée ou met à jour un compte Expert |
| `npm run auth:verifier` | Contrôle d'accès Expert de bout en bout (cas R06, R07) |
| `npm run verifier`      | Enchaîne toutes les vérifications |

## Documentation

- [Conventions du projet](docs/conventions.md) : langue, nommage,
  arborescence, invariants d'architecture, flux de travail.
- [Journal des décisions](docs/decisions/) : choix structurants et leurs
  motifs.
- [Documentation technique](docs/documentation-technique.md) (L6) :
  installation, variables d'environnement, architecture, déploiement.
- [Guide utilisateur](docs/utilisateur/guide-utilisateur.md) (L7) :
  parcours PME et accès Expert, avec captures.
- [Registre des écarts](docs/registre-ecarts.md) (L9) et
  [feuille de route](docs/feuille-de-route.md) (L10).
- [Plan d'implémentation](docs/plan-implementation.md) : points ordonnés,
  phase par phase.

## Confidentialité

Projet réalisé pour FUND.lab dans le cadre d'un challenge. La méthode, les
règles de calcul et les contenus sont confidentiels : aucune diffusion sans
autorisation écrite de FUND.lab.
````
