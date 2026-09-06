# Conventions du projet

Ce document fixe les règles de rédaction, de nommage, d'architecture et de
travail du dépôt. Il fait foi pour toute personne qui intervient sur le code.
Le plan ordonné est dans [plan-implementation.md](plan-implementation.md), les
décisions structurantes dans [decisions/](decisions/).

## 1. Langue et rédaction

- Tout est en français : identifiants, types, colonnes, commentaires,
  documentation, messages d'erreur, messages de commit, libellés d'interface.
  Seules exceptions : les noms imposés par les outils (page.tsx, layout.tsx,
  route.ts, proxy.ts, README.md) et les identifiants d'une bibliothèque.
- Les unités sont toujours affichées : FCFA, km, min, %, clients par jour.
- Le tiret cadratin (U+2014) et le tiret demi-cadratin (U+2013) sont
  interdits partout, y compris sous forme d'entité HTML ou de séquence
  d'échappement, dans le code comme dans les contenus et les messages de
  commit. Remplacer par deux-points, virgule, parenthèses ou point. La
  commande `npm run tirets` fait échouer la vérification s'il en reste.
- Guillemets français « » dans les contenus, guillemets droits dans le code.

## 2. Nommage

| Élément                     | Convention                     | Exemple                                    |
| --------------------------- | ------------------------------ | ------------------------------------------ |
| Dossiers et fichiers        | kebab-case, français           | `evaluer-etude.ts`, `formulaire-zones.tsx` |
| Composants React            | PascalCase, fichier kebab-case | `ChampNote` dans `champ-note.tsx`          |
| Types et interfaces         | PascalCase                     | `EtudeSaisie`, `ResultatEtude`             |
| Fonctions et variables      | camelCase                      | `calculerDemandeZone`                      |
| Constantes de configuration | MAJUSCULES_SOULIGNEES          | `SEUIL_GO`                                 |
| Modèles Prisma              | PascalCase singulier           | `Etude`, `Concurrent`                      |
| Colonnes                    | camelCase                      | `ticketMoyenFcfa`                          |
| Valeurs d'énumération       | MAJUSCULES_SOULIGNEES          | `GO_SOUS_CONDITIONS`                       |
| Routes                      | kebab-case, français           | `/etude/[id]/zones`, `/expert/clients`     |

Les montants portent leur unité dans le nom (`loyerMensuelFcfa`). Les notes
portent leur échelle en commentaire (0 à 3). Les pourcentages sont stockés en
fraction de 0 à 1 et affichés en pourcentage.

## 3. Arborescence cible

```
src/
  app/                    Routes Next.js (App Router)
    page.tsx              Accueil, point d'entrée du parcours PME
    etude/                Parcours PME séquencé (phase 4)
    connexion/            Authentification Expert (phase 3)
    expert/               Parcours Expert, protégé (phase 5)
    globals.css           Jetons de design et styles globaux
  composants/             Composants React partagés (formulaires, restitution)
  lib/
    moteur/               Moteur de calcul pur, sans dépendance (phase 2)
      config/             Coefficients, seuils et libellés versionnés
      __tests__/          Tests unitaires et cas de référence
    validation/           Schémas Zod partagés client et serveur (phase 3)
    services/             Persistance, calcul, contrôle d'accès (server-only)
    auth/                 Sessions et mots de passe
    bd.ts                 Client Prisma
prisma/
  schema.prisma
  migrations/
  seed.mts
scripts/                  Outils du dépôt (vérifications)
docs/
  plan-implementation.md
  conventions.md
  decisions/              Journal des décisions d'architecture
  avancement/             Points d'avancement quotidiens
```

## 4. Invariants d'architecture

Ces règles viennent du brief FUND.lab. Les enfreindre rend le livrable
irrecevable ou non auditable.

1. **Un seul moteur, un seul point d'entrée.** Les parcours PME et Expert
   appellent la même fonction d'évaluation. Aucune formule n'est réécrite
   dans un composant, une action serveur ou une requête.
2. **Moteur pur.** `src/lib/moteur` n'importe ni Next, ni React, ni Prisma,
   ni `server-only`. Il se teste en isolation et se réutilise ailleurs.
3. **Coefficients en configuration versionnée.** Aucun nombre méthodologique
   hors de `src/lib/moteur/config`. Changer une pondération ne modifie aucun
   code.
4. **Valeur manquante différente de zéro.** Une donnée non renseignée n'est
   jamais convertie en 0. Les agrégations s'appuient sur les composantes
   renseignées et le résultat signale ce qui manque.
5. **Score et orientation séparés.** L'orientation issue des seuils et
   l'orientation finale après red flags sont toujours calculées et affichées
   toutes les deux.
6. **Résultat auditable.** Chaque résultat porte la version du moteur, la
   version de la méthodologie, l'instantané des paramètres et l'horodatage.
7. **Validation des deux côtés.** Les mêmes schémas Zod servent aux
   formulaires et aux actions serveur. Une valeur hors plage est refusée aux
   deux niveaux.
8. **Contrôle d'accès côté serveur.** Toute fonction Expert vérifie la
   session dans la couche service, en plus de la garde de routage.
9. **Aucun secret dans le dépôt.** `.env` n'est jamais versionné ; seul
   `.env.example` l'est, avec des valeurs factices. Aucune donnée réelle de
   client FUND.lab dans les données de démonstration.
10. **Aucun résultat codé en dur.** Les cas de recette sont des entrées
    passées au moteur, jamais des sorties écrites à la main dans le code de
    production.

## 5. Flux de travail

- **Branches.** `main` contient uniquement du code vérifié. Chaque phase du
  plan se fait sur une branche `phase-N-nom` (par exemple `phase-2-moteur`)
  fusionnée dans `main` avec un commit de fusion explicite en fin de phase.
  La phase 0 est faite directement sur `main`.
- **Commits.** Un commit par point terminé du plan. Sujet en français, au
  plus 72 caractères, préfixé par le domaine (`Moteur :`, `PME :`,
  `Expert :`, `Données :`, `Outillage :`, `Docs :`), suivi si besoin d'un
  corps qui explique le pourquoi et cite le point du plan.
- **Avant chaque commit.** `npm run verifier` doit passer : typecheck, lint,
  formatage, tirets, tests.
- **Point d'avancement quotidien.** Un fichier `docs/avancement/AAAA-MM-JJ.md`
  avec trois rubriques : réalisé, prochain objectif, blocage éventuel.
- **Décisions.** Toute décision structurante est consignée dans
  `docs/decisions/NNNN-titre.md` (contexte, décision, conséquences). Une
  décision n'est jamais modifiée après coup : une nouvelle la remplace.
- **Questions à FUND.lab.** Regroupées, chacune avec une proposition
  d'arbitrage, et consignées dans la note de cadrage.

## 6. Commandes

| Commande                | Rôle                                                  |
| ----------------------- | ----------------------------------------------------- |
| `npm run dev`           | Serveur de développement                              |
| `npm run build`         | Construction de production                            |
| `npm run typecheck`     | Vérification des types (`tsc --noEmit`)               |
| `npm run lint`          | ESLint (configuration Next et compatibilité Prettier) |
| `npm run format`        | Formatage Prettier de tout le dépôt                   |
| `npm run format:check`  | Vérification du formatage sans modification           |
| `npm run tirets`        | Contrôle des tirets interdits                         |
| `npm test`              | Tests Vitest                                          |
| `npm run test:coverage` | Tests avec couverture du moteur                       |
| `npm run verifier`      | Enchaîne toutes les vérifications ci-dessus           |

## 7. Environnement

- Node.js 24 en local, contrainte `>=22.12` (exigence de Vitest 5).
- npm comme gestionnaire de paquets, `package-lock.json` versionné.
- PostgreSQL 16 à partir de la phase 3.
- Les variables d'environnement sont listées dans `.env.example`, chacune
  avec un commentaire. Toute nouvelle variable y est ajoutée dans le même
  commit que le code qui la lit.
