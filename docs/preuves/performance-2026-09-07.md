# Vérification de performance (Q-03)

Exigence du brief : « navigation fluide ; calcul des résultats sans attente
perceptible sur un jeu de données normal ».

Mesures prises sur une vraie construction de production
(`npm run build` puis `npm run start`), pas en mode développement : le
mode développement (Turbopack, rechargement à chaud) a des temps de
compilation à la volée qui n'ont aucun rapport avec ce qu'un utilisateur ou
FUND.lab verrait une fois déployé.

## Construction

`npm run build` réussit sans erreur (type et lint compris). Les pages du
parcours PME (`/etude/*`) et l'accueil sont pré-rendues en statique (`○`
dans la sortie de build) : servies instantanément, sans calcul serveur à
chaque visite, le calcul du moteur se faisant côté client à la saisie.
Les pages de connexion et de tout l'espace Expert sont rendues à la demande
(`ƒ`), nécessairement, puisqu'elles dépendent de la session et de la base.

Total des scripts statiques partagés : 1,3 Mo non compressés, répartis sur
une douzaine de fichiers ; aucune bibliothèque graphique tierce (les jauges
et graphiques sont du SVG écrit à la main), aucune police téléchargée.

## Temps de réponse mesurés (serveur de production local, 5 requêtes par

route, moyenne)

| Route                                              | Temps moyen | Remarque                                                |
| -------------------------------------------------- | ----------- | ------------------------------------------------------- |
| `/` (accueil, statique)                            | 9 ms        | Servie sans calcul serveur.                             |
| `/etude/exemple` (statique)                        | 12 ms       | Redirection cliente vers la synthèse ensuite.           |
| `/connexion` (dynamique, sans session)             | 96 ms       | Rendu à la demande, aucune base interrogée sans cookie. |
| `/expert` (dynamique, avec session, base distante) | 898 ms      | Voir constat ci-dessous.                                |

## Constat : latence réseau vers la base de développement

Les 898 ms de `/expert` ne viennent pas d'un calcul lent : le moteur
évalue une étude en moins d'une milliseconde (mesuré dans la suite de
tests). Ils viennent de la distance réseau entre ce poste de développement
et la base PostgreSQL de développement, hébergée sur un serveur distant. La
page enchaîne plusieurs allers-retours (session, liste des études, liste
des clients) sur cette même liaison.

Ce n'est pas représentatif du déploiement final : la base et l'application
seront hébergées dans la même région (proposition Vercel et Neon, mêmes
zones disponibles), ce qui ramène ce type de liste à quelques dizaines de
millisecondes en pratique. À vérifier à nouveau une fois l'hébergement
choisi (tâche L-01), et à surveiller si la latence reste perceptible en
recette.

## Ce qui est déjà fait pour rester rapide

- Rendu serveur par défaut (composants serveur Next.js), pas de librairie
  de graphiques côté client.
- Requêtes indépendantes lancées en parallèle (`Promise.all`) quand rien ne
  les rend séquentielles (tableau de bord Expert : études et clients).
- Colonnes utilisées pour filtrer ou trier une étude (`statut`,
  `misAJourLe`, `clientId`) couvertes par un index dans le schéma Prisma.
- Le moteur de calcul (`evaluerEtude`) est une fonction pure, synchrone, sur
  des tableaux de quelques dizaines d'éléments au plus (cinquante
  concurrents au maximum autorisé) : négligeable devant la latence réseau
  mesurée ci-dessus.

## Conclusion

Q-03 satisfait pour les pages publiques et le parcours PME (millisecondes).
Un point de vigilance documenté pour l'espace Expert, dû à la distance
réseau vers la base de développement actuelle, à revérifier après le choix
d'hébergement définitif.
