# Registre des écarts

Livrable L9. Bugs connus, limites assumées et dette technique, tenus à jour
jusqu'à la livraison. Chaque entrée porte son origine, son effet, et la
parade retenue ou l'effort restant pour la traiter.

Dernière mise à jour : 2026-09-07.

## Écarts fonctionnels

Aucun bug connu bloquant à ce jour. Les 179 tests unitaires et les 7 tests
de recette contre une base réelle passent (voir
`docs/preuves/moteur-2026-09-06.md` et
`docs/decisions/0006-tests-de-recette-base-dediee.md`).

## Limites assumées pour le MVP

| Sujet                                           | Limite                                                                                                                                                                                                                                                        | Effet                                                                                                                                                                            | Effort pour lever                                                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Limitation des tentatives de connexion          | Le compteur vit en mémoire du processus Node : il repart à zéro à chaque redémarrage du serveur, et n'est pas partagé si l'application tourne sur plusieurs instances.                                                                                        | Protection réelle sur une seule instance longue durée ; affaiblie après un redéploiement ou en cas de mise à l'échelle horizontale.                                              | Faible : remplacer par un compteur en base ou dans un magasin partagé (Redis, table dédiée). Une demi-journée.                                                     |
| Preuves sans pièce jointe                       | Une preuve porte une source textuelle, un commentaire et un niveau, mais pas de fichier joint (photo, document scanné).                                                                                                                                       | L'Expert décrit la preuve plutôt que de l'attacher. Conforme au brief, qui ne demande pas de pièce jointe.                                                                       | Moyen : stockage de fichiers (S3 compatible ou équivalent), gestion des types et de la taille. Plusieurs jours.                                                    |
| Restitution imprimable en page web              | Pas d'export PDF mis en page : l'impression passe par la fonction native du navigateur sur une vue sans éléments d'interface.                                                                                                                                 | Rendu correct mais dépend du moteur d'impression du navigateur (marges, sauts de page) plutôt que d'une mise en page maîtrisée.                                                  | Moyen : génération PDF côté serveur avec une bibliothèque dédiée. Une à deux journées.                                                                             |
| Recherche d'un client existant                  | La création d'une étude propose la liste complète des clients dans un menu déroulant, sans recherche.                                                                                                                                                         | Devient malcommode au-delà d'une cinquantaine de clients. Sans effet pour un volume de démonstration.                                                                            | Faible : champ de recherche filtrant la liste. Quelques heures.                                                                                                    |
| Rattachement d'une étude PME à un client        | Le service `rattacherClient` existe et est testé, mais aucun bouton ne l'expose encore dans l'interface du dossier Expert.                                                                                                                                    | Le rattachement n'est aujourd'hui possible que par un appel direct au service (script ou futur bouton), pas depuis l'écran du dossier.                                           | Faible : un composant de formulaire réutilisant l'action existante. Quelques heures.                                                                               |
| Édition des coefficients méthodologiques        | Aucun éditeur graphique des pondérations, seuils ou libellés : tout changement passe par le fichier de configuration versionné (`src/lib/moteur/config`).                                                                                                     | Conforme au brief, qui exclut explicitement un éditeur graphique du MVP. Toute évolution de méthodologie demande une intervention technique.                                     | Hors périmètre du MVP (feuille de route).                                                                                                                          |
| Recette automatisée R06, R07, R11, R12          | Ces quatre scénarios ne sont pas des tests Vitest : R06 et R07 sont vérifiés par un script dédié contre un serveur réel (`npm run auth:verifier`), R11 par un export PDF manuel, R12 est par nature un test procédural (lancement sur poste vierge).          | Preuve d'exécution existante pour chacun, mais pas dans la même suite automatisée que le reste. Voir `docs/decisions/0006-tests-de-recette-base-dediee.md` pour le raisonnement. | Faible à moyen selon le niveau d'automatisation souhaité (par exemple un banc Playwright pour R06/R07).                                                            |
| Contraste et lien d'évitement                   | Revue d'accessibilité faite par lecture de code, sans outil de mesure automatisée du contraste (aucun installé), et sans lien « aller au contenu » avant la navigation.                                                                                       | Risque résiduel faible : les teintes choisies visent déjà le contraste, la navigation reste rare (peu de liens avant le contenu).                                                | Faible : ajout d'un lien d'évitement et passage d'un vérificateur de contraste. Quelques heures.                                                                   |
| Performance de l'espace Expert en développement | Les pages Expert répondent en ~900 ms sur ce poste, contre quelques millisecondes pour les pages publiques, à cause de la distance réseau vers la base de développement distante (voir `docs/preuves/performance-2026-09-07.md`).                             | Sans rapport avec un calcul lent ; devrait se résorber une fois l'application et la base hébergées dans la même région.                                                          | Aucun effort de code ; dépend du choix d'hébergement (L-01).                                                                                                       |
| Content-Security-Policy absente                 | Les en-têtes de sécurité couvrent le clickjacking, le sniffing MIME et le référent, mais pas de CSP stricte (voir `docs/preuves/audit-securite-2026-09-07.md`).                                                                                               | Risque jugé faible pour le MVP : aucun script tiers, aucun contenu externe embarqué.                                                                                             | Faible : à ajouter si des scripts tiers sont introduits plus tard.                                                                                                 |
| Navigateur de recette                           | Le rendu a été vérifié sur Edge (Chromium). Chrome partage le même moteur de rendu ; non testé séparément faute d'accès à un second poste.                                                                                                                    | Risque très faible, Edge et Chrome étant tous deux Chromium.                                                                                                                     | Aucun, sauf si un écart est observé en recette.                                                                                                                    |
| Vulnérabilités `npm audit`                      | Quatre alertes de sévérité haute, portées uniquement par `deepmerge-ts` et `mysql2`, deux dépendances transitives de la CLI Prisma (développement), absentes de `@prisma/client` et de la construction de production (voir `docs/inventaire-dependances.md`). | Aucun effet sur l'application déployée : ces paquets ne sont jamais importés par le code applicatif.                                                                             | Aucun dans l'immédiat ; la correction proposée régresserait vers Prisma 6, à l'encontre de la décision 0001. À surveiller aux prochaines mises à jour de Prisma 7. |
| Durée de `npm install` sur un dépôt neuf        | Mesurée à 7,5 minutes lors du test de lancement à froid (section 8 de la documentation technique), sur ce poste précis.                                                                                                                                       | Une installation plus longue que d'ordinaire ; sans rapport avec le projet (taille normale des dépendances Next.js et Prisma).                                                   | Aucun ; propre au disque et au réseau du poste de test.                                                                                                            |

## Dette technique

| Sujet                            | Nature                                                                                                                                                                                                                                                                               | Effort                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Prisma épinglé en 7.10.0         | Choix documenté (décision 0001) : le tag `latest` de npm pointait sur une version candidate de Prisma 8 au moment du choix. À réévaluer quand Prisma 8 sortira en version stable.                                                                                                    | Suivi ponctuel, pas de code à changer avant la sortie stable.                   |
| Traçabilité des exigences Expert | Plusieurs lignes de `docs/cadrage/matrice-tracabilite.md` (EXP-1 à EXP-8, ETA-1, ETA-2, ETA-4, PME-6) restent à « en cours » : l'espace Expert est fonctionnellement complet et vérifié manuellement, mais pas entièrement couvert par une preuve automatisée dédiée à chaque ligne. | Suivi documentaire ; correspond aux mêmes écarts que R06/R07/R11/R12 ci-dessus. |

## Points ouverts avec FUND.lab

Reportés depuis la note de cadrage et la checklist de livraison, sans effet
bloquant : chaque arbitrage par défaut est déjà appliqué en configuration.

1. Listes et poids des générateurs de demande, des risques et des besoins
   de la grille de vides commerciaux (arbitrages H2 à H4).
2. Pourcentage cible de loyer par défaut (arbitrage H5, 10 % appliqué).
3. Statut de « GO sous conditions critiques » : variante ou quatrième
   orientation (arbitrage H1).
4. Jeux de données de recette officiels, non encore reçus (arbitrage H9,
   deux cas construits par le candidat en attendant).
5. Sens exact du mot « chatbot » évoqué oralement, absent du brief écrit.
6. Dépôt et compte à créditer de l'accès administrateur.
7. Date officielle du jour 0 du calendrier.

Voir `docs/cadrage/questions-fundlab.md` pour le message détaillé et le
suivi des réponses.

## Aucune fonctionnalité écartée silencieusement

Conformément à l'exigence du brief, aucune fonctionnalité du périmètre
obligatoire n'a été retirée sans le signaler ici ou dans la note de
cadrage. Le hors-périmètre du MVP (cartographie, IA générative, paiement,
multilingue, administration avancée, éditeur de pondérations, export PDF
élaboré) reprend exactement la liste du brief, section « Exigences non
fonctionnelles ».
