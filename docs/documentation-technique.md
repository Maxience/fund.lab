# Documentation technique

Livrable L6. Installation, variables d'environnement, architecture et
déploiement. Complète le README (démarrage rapide) et
`docs/conventions.md` (règles de code) sans les répéter.

Dernière mise à jour : 2026-09-07.

## 1. Prérequis

- Node.js 24 (minimum 22.12, exigence de Vitest 5).
- npm (le dépôt versionne `package-lock.json`).
- Une base PostgreSQL 16 ou 17, joignable depuis le poste qui exécute
  l'application.
- Pour les tests de recette uniquement (`npm run test:recette`) : une
  seconde base PostgreSQL dédiée, distincte de la première.

## 2. Installation locale

```bash
git clone <url-du-depot>
cd chalandise
npm install
cp .env.example .env
```

Éditer `.env` : renseigner `DATABASE_URL` (voir section 3), puis :

```bash
npm run db:migrer   # applique les migrations versionnées
npm run db:semer    # crée le compte Expert initial et des données fictives
npm run dev
```

L'application répond sur `http://localhost:3000` (ou le port suivant s'il
est occupé). Se connecter à l'espace Expert avec l'adresse et le mot de
passe définis dans `EXPERT_EMAIL_INITIAL` et
`EXPERT_MOT_DE_PASSE_INITIAL`.

Cette séquence a été rejouée intégralement à partir d'un dépôt sans
`node_modules`, `.next` ni client Prisma généré, pour vérifier qu'elle est
reproductible (cas de recette R12) ; voir la section 8.

## 3. Variables d'environnement

Toutes déclarées, avec un commentaire, dans `.env.example`. Aucune n'a de
valeur par défaut cachée dans le code : une variable absente provoque une
erreur explicite au démarrage plutôt qu'un comportement silencieux.

| Variable                      | Rôle                                                                                     | Exemple                                                         |
| ----------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `DATABASE_URL`                | Connexion PostgreSQL de l'application (développement ou production).                     | `postgresql://utilisateur:motdepasse@hote:5432/chalandise`      |
| `DATABASE_URL_TEST`           | Connexion à la base dédiée aux tests de recette. Jamais la même base que `DATABASE_URL`. | `postgresql://utilisateur:motdepasse@hote:5432/chalandise_test` |
| `EXPERT_EMAIL_INITIAL`        | Adresse du compte Expert créé par `npm run db:semer`.                                    | `expert@fund-lab.example`                                       |
| `EXPERT_NOM_INITIAL`          | Nom affiché de ce compte.                                                                | `Expert FUND.lab`                                               |
| `EXPERT_MOT_DE_PASSE_INITIAL` | Mot de passe initial, haché avant enregistrement, jamais stocké en clair.                | Douze caractères au moins, lettres et chiffres.                 |
| `SESSION_DUREE_JOURS`         | Durée de vie d'une session Expert, en jours.                                             | `7`                                                             |

Aucun secret ne doit jamais être écrit dans un fichier suivi par git : seul
`.env.example` (avec des valeurs factices) est versionné.

## 4. Architecture

Quatre couches, chacune avec une seule responsabilité (détaillées dans
`docs/conventions.md`, section 3) :

```
Interfaces   src/app (routes Next.js) et src/composants
Services     src/lib/services : validation, contrôle d'accès, transactions, persistance
Moteur       src/lib/moteur : formules, décision, validation métier, configuration versionnée
Données      prisma/schema.prisma, migrations, seed
```

Invariant central : les parcours PME et Expert appellent la même fonction
`evaluerEtude` du moteur, jamais une formule réécrite dans une interface.
Le moteur n'a aucune dépendance à Next, React ou Prisma : il est
réutilisable tel quel par un futur outil de la plateforme FUND.lab.

Le parcours PME persiste son état dans le navigateur (`localStorage`) et
en garde une copie sur le serveur sous un identifiant temporaire, pour
qu'un Expert puisse la retrouver. Le parcours Expert persiste directement
en base à chaque étape.

L'authentification repose sur des sessions opaques : un jeton aléatoire
dans un cookie `httpOnly`, dont seule l'empreinte SHA-256 est stockée
(`src/lib/auth/session.ts`). Le fichier `src/proxy.ts` redirige les routes
`/expert/*` sans cookie (contrôle optimiste) ; chaque page et chaque action
serveur de l'espace Expert appelle en plus `exigerExpert()` (contrôle
réel, qui fait foi).

Le détail des choix et leurs motifs sont dans `docs/decisions/` :

| Décision | Sujet                                                        |
| -------- | ------------------------------------------------------------ |
| 0001     | Choix de la stack (Next.js, Prisma, PostgreSQL)              |
| 0002     | Rédaction en français, tirets interdits                      |
| 0003     | Conception du moteur de calcul                               |
| 0004     | Ordre des phases : parcours PME avant la persistance serveur |
| 0005     | Modèle de données, sessions, hachage des mots de passe       |
| 0006     | Tests de recette contre une base dédiée                      |

## 5. Base de données

Douze tables (`prisma/schema.prisma`), reprenant les objets métier du
brief. Un scénario n'est pas une table à part : c'est une étude de type
`VARIANTE`, liée à son étude de référence par `etudeSourceId`.

```bash
npx prisma studio          # explorer la base dans une interface graphique
npm run db:migrer          # applique les migrations (production)
npm run db:migrer:dev      # crée une migration à partir du schéma modifié (développement)
npm run db:generer         # régénère le client Prisma après modification du schéma
```

Après toute modification de `schema.prisma` : régénérer le client puis
redémarrer le serveur de développement, sans quoi l'ancien client reste en
mémoire (piège documenté dans `docs/conventions.md`).

## 6. Comptes Expert

Aucune inscription en libre-service, conformément au brief. Deux façons de
créer ou modifier un compte :

```bash
# à la première installation, avec les variables d'environnement
npm run db:semer

# à tout moment, en ligne de commande
npm run auth:creer -- --email prenom.nom@exemple.test --nom "Prénom Nom" --mot-de-passe "..."
```

## 7. Tests

```bash
npm test                 # suite rapide (179 tests), sans connexion réseau
npm run test:coverage    # avec couverture du moteur
npm run test:recette     # scénarios R01 à R12, contre DATABASE_URL_TEST (voir décision 0006)
npm run auth:verifier    # contrôle d'accès Expert de bout en bout (cas R06, R07)
```

## 8. Vérification de l'installation reproductible (cas R12)

Rejoué le 2026-09-07, sur ce même poste mais à partir d'un état de projet
sans artefacts générés :

```bash
rm -rf node_modules .next src/generated tsconfig.tsbuildinfo
npm install
npm run db:migrer
npm run dev
```

Résultat : installation et démarrage réussis sans intervention manuelle
au-delà des étapes documentées ici. Node.js et le cache npm global
restaient présents sur la machine (un poste réellement vierge n'aurait pas
ce raccourci) ; le reste (dépendances du projet, client Prisma, base de
données) a été reconstruit intégralement.

## 9. Déploiement

Aucune dépendance propriétaire : l'application est un projet Next.js
standard, déployable sur toute plateforme qui exécute Node.js. Proposition
retenue dans la note de cadrage, pour sa réversibilité et son niveau
gratuit :

- **Application : Vercel.** Connecter le dépôt, définir les variables
  d'environnement de la section 3 dans les paramètres du projet, laisser
  la commande de construction par défaut (`next build`).
- **Base de données : Neon.** Créer un projet PostgreSQL, copier l'URL de
  connexion dans `DATABASE_URL`, puis exécuter `npm run db:migrer` et
  `npm run db:semer` une fois contre cette base (localement, avec
  `DATABASE_URL` pointée sur Neon, ou via une commande de build dédiée).

Réversibilité : le code se déploie sans changement sur tout hébergeur
Node.js (conteneur Docker, serveur classique) ; la base s'exporte avec
`pg_dump` vers n'importe quel PostgreSQL. Aucun format propriétaire.

L'URL de recette définitive et le choix d'hébergeur effectivement retenu
seront consignés ici dès qu'ils seront connus (tâche L-01).

## 10. Observabilité

Les erreurs serveur sont journalisées via `src/lib/journal.ts`, en JSON,
avec un contexte court et, pour une erreur, son nom et son message
uniquement : jamais de mot de passe, de jeton, ni de contenu d'étude.
Voir `docs/preuves/audit-securite-2026-09-07.md` pour le détail de la
revue de sécurité.
