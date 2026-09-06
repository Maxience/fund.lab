# 0002. Français partout et tirets cadratins interdits

Date : 2026-09-06
Statut : acceptée

## Contexte

Le brief exige des libellés en français correct, accessibles aux PME, et un
code maintenable par une autre équipe, elle aussi francophone. Le vocabulaire
métier (chalandise, générateurs de demande, vides commerciaux, red flags,
orientation) doit se retrouver tel quel du brief au code, pour que la
traçabilité entre la méthode et l'implémentation soit immédiate.

## Décision

- Le français est la langue de tout le dépôt : identifiants, types, colonnes,
  routes, commentaires, documentation, messages d'erreur et de commit. Seuls
  les noms imposés par les outils restent en anglais.
- Le tiret cadratin (U+2014) et le tiret demi-cadratin (U+2013) sont
  interdits partout, sous toutes leurs formes (caractère, entité HTML,
  séquence d'échappement). La ponctuation française classique les remplace :
  deux-points, virgule, parenthèses ou point.
- Un script du dépôt (`npm run tirets`) contrôle les fichiers versionnés et
  leurs noms. Il fait partie de la vérification enchaînée avant chaque
  commit.

## Conséquences

- Le vocabulaire du moteur est celui du brief (`demandeGlobale`,
  `pressionConcurrentielle`, `scoreGaps`, `orientationFinale`), ce qui
  facilite la recette et la reprise.
- Les tableaux de conventions et l'arborescence cible sont tenus dans
  `docs/conventions.md`.
- Les contributions qui ne respectent pas ces règles échouent à la
  vérification et ne sont pas fusionnées.
