# 0001. Conserver la stack Next.js, Prisma et PostgreSQL

Date : 2026-09-06
Statut : acceptée

## Contexte

Le brief laisse le choix technique libre, à condition de le justifier, de
rester maintenable par une autre équipe et de pouvoir évoluer vers une
plateforme réunissant plusieurs outils FUND.lab. Une première tentative de
développement a été écartée dans son intégralité. Restait à décider si son
socle technique devait l'être aussi.

## Décision

Reprise de zéro sur la même stack, jugée adaptée au périmètre et au délai :

- **Next.js 16 (App Router) et React 19.** Un seul projet couvre le front,
  la couche serveur (actions et routes), le contrôle d'accès (`proxy.ts` et
  gardes serveur) et le rendu côté serveur des restitutions imprimables.
- **TypeScript strict.** Types métier partagés entre moteur, validation,
  base et interfaces.
- **Tailwind 4.** Styles utilitaires, responsive et impression sans
  bibliothèque de composants.
- **Prisma 7.10 avec PostgreSQL.** Schéma explicite, migrations versionnées,
  seed reproductible. La contrainte de version reste dans la majeure 7 : au
  moment du choix, le tag `latest` de npm pointait sur une release candidate
  de Prisma 8, inadaptée à un livrable repris par une autre équipe.
- **Zod.** La même validation côté client et côté serveur.
- **Vitest 5.** Tests du moteur, couverture et preuves d'exécution.
- **Prettier et ESLint (configuration Next).** Formatage et lint uniformes,
  vérifiés avant chaque commit.
- **Node.js 24** en local, contrainte `>=22.12` imposée par Vitest 5.
- **Polices système, sans `next/font`.** Aucun téléchargement à la
  construction, rendu identique hors ligne et à l'impression.

## Conséquences

- Un seul dépôt et un seul déploiement (hébergeur Node.js et PostgreSQL
  géré), à déclarer avec licences, niveau gratuit, limites et réversibilité,
  comme l'exige le brief.
- Le moteur reste un module pur, sans dépendance à Next ni à Prisma,
  réutilisable par un futur outil de la plateforme.
- Toutes les dépendances directes sont sous licence MIT ou Apache 2.0, sans
  coût d'usage. L'inventaire complet est produit en phase 6.
- Le passage à Prisma 8 sera réévalué à sa sortie en version stable.
