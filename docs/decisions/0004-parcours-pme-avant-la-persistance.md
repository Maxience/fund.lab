# 0004. Construire le parcours PME avant la persistance serveur

Date : 2026-09-06
Statut : acceptée

## Contexte

Le plan initial prévoyait la couche de données et l'authentification (phase 3) avant le parcours PME (phase 4). Le commanditaire souhaite voir d'abord
l'interface de l'utilisateur sans compte, le formulaire en huit étapes, avant
l'espace Expert. Le brief autorise pour le parcours PME une « sauvegarde
locale ou par identifiant temporaire afin de reprendre une étude depuis le
même navigateur ».

## Décision

- Le parcours PME est construit maintenant, avec une **sauvegarde locale**
  dans le navigateur (`localStorage`) : l'étude en cours, l'étape atteinte
  et le statut sont enregistrés à chaque modification et rechargés à
  l'ouverture.
- L'état du parcours a exactement la forme de l'entrée du moteur
  (`EtudeSaisie`). La synthèse appelle `evaluerEtude` dans le navigateur ;
  la finalisation côté serveur, en phase suivante, appellera la même
  fonction et enregistrera le résultat versionné.
- Les **schémas Zod** de chaque étape sont écrits dès maintenant dans
  `src/lib/validation` pour être partagés tels quels par les actions serveur.
  Ils portent la forme, les champs obligatoires et les bornes. Les règles
  métier transversales (somme des poids, zone sans demande, données
  manquantes) restent dans le moteur et sont affichées par étape à partir de
  ses alertes : aucune règle n'est réécrite dans l'interface.
- La persistance par identifiant temporaire côté serveur remplacera la
  sauvegarde locale sans changer les formulaires : l'accès au stockage passe
  par un seul module (`src/lib/parcours/stockage-local.ts`) qui sera doublé
  d'un dépôt serveur.

## Conséquences

- Le commanditaire voit et teste le parcours complet avant toute mise en
  base ; les retours d'interface arrivent tôt.
- Les cas de recette R01, R02, R03, R04 et R11 se vérifient dès cette phase
  dans le navigateur ; R09 (actualisation) se vérifie avec la sauvegarde
  locale puis à nouveau avec la persistance serveur.
- La phase 3 (données, services, authentification) réutilise les schémas et
  le format d'état sans reprise du parcours.
