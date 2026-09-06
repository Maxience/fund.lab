# Backlog priorisé

Complément de la [note de cadrage](note-de-cadrage.md). Les éléments sont
regroupés par lot fonctionnel et ordonnés par priorité, puis par dépendance.
La colonne « Plan » renvoie aux points du
[plan d'implémentation](../plan-implementation.md), la colonne « Preuve » au
scénario de recette ou au test qui valide l'élément.

Priorités :

- **P1** : condition de recevabilité. Son absence fait rejeter le MVP.
- **P2** : exigence explicite du brief, notée à la recette.
- **P3** : souhaitable dans le MVP, sinon reporté en feuille de route.

## Lot 1. Socle et moteur de calcul

| ID   | Élément                                                                                  | Priorité | Preuve                        | Plan |
| ---- | ---------------------------------------------------------------------------------------- | -------- | ----------------------------- | ---- |
| S-01 | Configuration versionnée : drivers, risques, besoins, poids, seuils, red flags, libellés | P1       | Test de validité de la config | 7    |
| S-02 | Types métier avec statut renseigné, manquant, non applicable                             | P1       | Tests unitaires               | 8    |
| S-03 | Douze formules du brief, une fonction pure par formule                                   | P1       | Un test par formule           | 10   |
| S-04 | Règles de décision : seuils, red flags, orientation calculée et finale                   | P1       | Tests aux frontières, R05     | 11   |
| S-05 | Validation métier : notes bornées, poids à 100 %, valeurs aberrantes                     | P1       | R02, R03                      | 12   |
| S-06 | Point d'entrée unique du moteur, résultat versionné avec instantané                      | P1       | R10, NR-2                     | 13   |
| S-07 | Deux cas de référence internes dans la tolérance de 0,1 point                            | P1       | R10                           | 14   |
| S-08 | Recommandations déterministes : forces, vigilances, actions                              | P2       | Tests de règles               | 15   |
| S-09 | Décomposition du score global en contributions                                           | P2       | Test de somme exacte          | 16   |
| S-10 | Couverture du moteur d'au moins 90 %                                                     | P2       | Rapport de couverture (L5)    | 17   |

## Lot 2. Données et couche serveur

| ID   | Élément                                                                    | Priorité | Preuve                  | Plan |
| ---- | -------------------------------------------------------------------------- | -------- | ----------------------- | ---- |
| D-01 | Schéma Prisma des douze objets et de tous les états                        | P1       | Migration initiale (L4) | 18   |
| D-02 | Migrations et seed de démonstration sans donnée réelle                     | P1       | R12, SEC-5              | 19   |
| D-03 | Schémas Zod partagés client et serveur                                     | P1       | R02, R03                | 20   |
| D-04 | Services : validation, accès, transaction, calcul, persistance             | P1       | R09, NR-4               | 21   |
| D-05 | Erreurs métier typées et journalisation sans donnée sensible               | P2       | Revue, NF-8             | 22   |
| D-06 | Authentification Expert : scrypt, sessions, garde de routage et de service | P1       | R06, R07                | 23   |
| D-07 | Limitation des tentatives et messages neutres                              | P2       | Test de service         | 24   |

## Lot 3. Parcours PME

| ID   | Élément                                                                 | Priorité | Preuve      | Plan   |
| ---- | ----------------------------------------------------------------------- | -------- | ----------- | ------ |
| P-01 | Machine à huit étapes, progression, retour, verrou de finalisation      | P1       | R01         | 25     |
| P-02 | Identifiant temporaire, brouillon en base, reprise depuis le navigateur | P1       | R09         | 26     |
| P-03 | Composants de formulaire : unités, notes, pondérations, aides, erreurs  | P2       | UI-3 à UI-5 | 27     |
| P-04 | Étapes projet et hypothèses avec CA et loyer immédiats                  | P1       | R01         | 28     |
| P-05 | Étape zones avec contrôle de la somme                                   | P1       | R03         | 29     |
| P-06 | Étape demande avec « non renseigné » distinct de zéro                   | P1       | R02, DON-4  | 30     |
| P-07 | Étape concurrence : ajout, modification, suppression, pression à jour   | P1       | R04         | 31     |
| P-08 | Étapes vides commerciaux et risques                                     | P1       | R01, R05    | 32, 33 |
| P-09 | Synthèse : scores, orientations séparées, forces, vigilances, actions   | P1       | R01, DEC-4  | 34     |
| P-10 | Page imprimable                                                         | P2       | R11         | 35     |
| P-11 | Finalisation avec instantané des paramètres                             | P1       | R01, R05    | 36     |

## Lot 4. Parcours Expert

| ID   | Élément                                                               | Priorité | Preuve          | Plan |
| ---- | --------------------------------------------------------------------- | -------- | --------------- | ---- |
| E-01 | Connexion et déconnexion                                              | P1       | R06             | 37   |
| E-02 | Tableau de bord par client, statut, date, filtres et tri              | P2       | R06             | 38   |
| E-03 | Gestion des clients                                                   | P2       | Test de service | 39   |
| E-04 | Études : création, consultation, modification, duplication, archivage | P2       | R08             | 40   |
| E-05 | Scénarios référence et variante, comparaison, source inchangée        | P1       | R08             | 41   |
| E-06 | Preuves et commentaires par rubrique, quatre niveaux                  | P2       | ETA-4           | 42   |
| E-07 | Contrôles de cohérence avant finalisation                             | P2       | Revue           | 43   |
| E-08 | Restitution Expert avec sensibilité, décomposition, version du moteur | P2       | EXP-7, EXP-8    | 44   |
| E-09 | Rattachement d'une étude PME à un client                              | P3       | Test de service | 45   |

## Lot 5. Qualité transversale

| ID   | Élément                                                          | Priorité | Preuve           | Plan |
| ---- | ---------------------------------------------------------------- | -------- | ---------------- | ---- |
| Q-01 | Responsive vérifié à 360 px, Chrome et Edge                      | P2       | Captures, revue  | 46   |
| Q-02 | Accessibilité : labels, clavier, contraste, couleur jamais seule | P2       | Revue, NF-7      | 47   |
| Q-03 | Performance : rendu serveur, calcul instantané                   | P2       | NF-2             | 48   |
| Q-04 | Tests d'intégration et un scénario automatisé par cas R01 à R12  | P2       | Rapport de tests | 49   |
| Q-05 | Audit de sécurité et scan des secrets                            | P1       | NR-5, NR-6       | 50   |
| Q-06 | Inventaire des dépendances : licence, coût, réversibilité        | P1       | SEC-7, NR-7      | 51   |

## Lot 6. Livraison

| ID   | Élément                                                 | Priorité | Preuve      | Plan |
| ---- | ------------------------------------------------------- | -------- | ----------- | ---- |
| L-01 | Déploiement sur URL stable avec base hébergée           | P1       | L2, NR-8    | 52   |
| L-02 | Documentation technique testée par un lancement à froid | P1       | L6, R12     | 53   |
| L-03 | Documentation utilisateur                               | P2       | L7          | 54   |
| L-04 | Registre des écarts                                     | P2       | L9          | 55   |
| L-05 | Feuille de route 30 à 60 jours                          | P2       | L10         | 56   |
| L-06 | Recette interne complète sur l'URL déployée             | P1       | R01 à R12   | 57   |
| L-07 | Répétition de la démonstration et transfert des accès   | P2       | Démo finale | 58   |

## Feuille de route après le MVP (P3, hors recette)

- Purge automatique des études anonymes après une durée à définir.
- Pièces jointes sur les preuves.
- Export PDF mis en page.
- Interface d'administration des comptes Expert.
- Comparaison de plus de deux scénarios et lecture de sensibilité étendue.
- Bibliothèque de valeurs de référence par ville et par concept.
