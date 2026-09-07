# Matrice de traçabilité des exigences

Chaque exigence du brief est reliée au module qui la porte et à la preuve
qui la valide (test automatisé, scénario de recette ou document). La colonne
« Statut » est tenue à jour à chaque phase : « à faire », « en cours »,
« fait ». Les identifiants sont ceux utilisés dans le backlog et les tests.

Modules abrégés : `moteur` pour `src/lib/moteur`, `validation` pour
`src/lib/validation`, `services` pour `src/lib/services`, `pme` pour
`src/app/etude`, `expert` pour `src/app/expert`, `bd` pour
`prisma/schema.prisma`.

## Modules fonctionnels (brief, section « Périmètre fonctionnel »)

| ID   | Exigence                                                        | Module                  | Preuve                | Statut |
| ---- | --------------------------------------------------------------- | ----------------------- | --------------------- | ------ |
| MF-A | Projet et site : fiche de cadrage                               | pme, expert, bd         | R01                   | fait   |
| MF-B | Hypothèses commerciales : CA mensuel et loyer soutenable        | moteur, pme             | FOR-1, FOR-2, R01     | fait   |
| MF-C | Zones de chalandise : jusqu'à quatre, rayon, temps, mode, poids | pme, validation, bd     | R03                   | fait   |
| MF-D | Demande : indice par zone et global                             | moteur, pme             | FOR-3, FOR-4          | fait   |
| MF-E | Concurrence : jusqu'à cinquante, menace et pression             | moteur, pme, validation | FOR-5 à FOR-7, R04    | fait   |
| MF-F | Vides commerciaux : score de gaps                               | moteur, pme             | FOR-8, FOR-9          | fait   |
| MF-G | Risques : score, alertes et red flags                           | moteur, pme             | FOR-10, DEC-2, DEC-3  | fait   |
| MF-H | Synthèse : attractivité, score global, orientation              | moteur, pme, expert     | FOR-11, FOR-12, DEC-1 | fait   |

## Parcours PME obligatoire

| ID    | Exigence                                                                  | Module             | Preuve          | Statut   |
| ----- | ------------------------------------------------------------------------- | ------------------ | --------------- | -------- |
| PME-1 | Démarrage sans authentification                                           | pme, services      | R01             | fait     |
| PME-2 | Parcours séquencé, progression visible, retour à l'étape précédente       | pme                | R01, revue      | fait     |
| PME-3 | Aides contextuelles : notes, concepts, unités                             | composants         | Revue UI        | fait     |
| PME-4 | Ajout, modification, suppression de concurrents                           | pme, services      | R04             | fait     |
| PME-5 | Contrôle des champs obligatoires, valeurs aberrantes, pondérations        | validation, moteur | R02, R03        | fait     |
| PME-6 | Sauvegarde locale ou identifiant temporaire, reprise depuis le navigateur | pme, services      | R09             | en cours |
| PME-7 | Synthèse : scores, décision, trois forces, trois vigilances, actions      | moteur, pme        | R01, tests S-08 | fait     |
| PME-8 | Page de résultat imprimable                                               | pme                | R11             | fait     |

## Parcours Expert obligatoire

| ID    | Exigence                                                                  | Module                | Preuve       | Statut   |
| ----- | ------------------------------------------------------------------------- | --------------------- | ------------ | -------- |
| EXP-1 | Authentification simple et sécurisée, rôle Expert                         | auth, proxy, services | R06, R07     | en cours |
| EXP-2 | Tableau de bord par client, statut, date de modification                  | expert, services      | R06          | en cours |
| EXP-3 | Création, consultation, modification, duplication, archivage logique      | expert, services      | R08          | en cours |
| EXP-4 | Accès aux données détaillées, hypothèses, scores intermédiaires, formules | expert, moteur        | Revue        | en cours |
| EXP-5 | Commentaires, sources et preuves sur les rubriques principales            | expert, services, bd  | ETA-4        | en cours |
| EXP-6 | Scénario dérivé sans écraser l'original                                   | services, bd          | R08          | en cours |
| EXP-7 | Restitution Expert : diagnostic, conditions critiques, recommandations    | expert, moteur        | Revue        | en cours |
| EXP-8 | Version du moteur visible sur le résultat                                 | expert, moteur        | Revue, DON-5 | en cours |

## États et statuts

| ID    | Exigence                                                   | Module       | Preuve           | Statut   |
| ----- | ---------------------------------------------------------- | ------------ | ---------------- | -------- |
| ETA-1 | Étude : brouillon, complète, archivée                      | bd, services | Migration, tests | en cours |
| ETA-2 | Scénario : référence, variante                             | bd, services | R08              | en cours |
| ETA-3 | Donnée : renseignée, manquante, non applicable             | moteur, bd   | Tests S-02       | fait     |
| ETA-4 | Preuve : non documentée, déclarative, observée, documentée | bd, expert   | Migration, revue | en cours |
| ETA-5 | Décision : GO, GO sous conditions, NO GO                   | moteur       | Tests S-04       | fait     |

## Principes de données

| ID    | Exigence                                                       | Module               | Preuve                 | Statut |
| ----- | -------------------------------------------------------------- | -------------------- | ---------------------- | ------ |
| DON-1 | Type explicite pour chaque entrée                              | validation, bd       | Schémas Zod, migration | fait   |
| DON-2 | Notes hors échelle refusées côté interface et côté serveur     | validation, moteur   | R02                    | fait   |
| DON-3 | Pondérations à 100 % avec tolérance de 0,01 point              | moteur, validation   | R03, test de tolérance | fait   |
| DON-4 | Valeur manquante différente de zéro                            | moteur               | Tests S-02, H6         | fait   |
| DON-5 | Version du moteur et instantané des paramètres sur le résultat | moteur, services, bd | Test S-06, R05         | fait   |

## Formules de référence

| ID     | Exigence                                             | Module          | Preuve             | Statut |
| ------ | ---------------------------------------------------- | --------------- | ------------------ | ------ |
| FOR-1  | CA mensuel indicatif                                 | moteur/formules | Test unitaire      | fait   |
| FOR-2  | Loyer maximal indicatif                              | moteur/formules | Test unitaire      | fait   |
| FOR-3  | Demande d'une zone                                   | moteur/formules | Test unitaire      | fait   |
| FOR-4  | Demande globale                                      | moteur/formules | Test unitaire      | fait   |
| FOR-5  | Menace d'un concurrent (cinq composantes pondérées)  | moteur/formules | Test unitaire      | fait   |
| FOR-6  | Facteur de relation : direct 1,00, indirect 0,70     | moteur/config   | Test unitaire      | fait   |
| FOR-7  | Pression concurrentielle sur les menaces renseignées | moteur/formules | Test unitaire, R04 | fait   |
| FOR-8  | Points de gap selon le statut du besoin              | moteur/formules | Test unitaire      | fait   |
| FOR-9  | Score de gaps                                        | moteur/formules | Test unitaire      | fait   |
| FOR-10 | Score de risque                                      | moteur/formules | Test unitaire      | fait   |
| FOR-11 | Attractivité                                         | moteur/formules | Test unitaire      | fait   |
| FOR-12 | Score global                                         | moteur/formules | Test unitaire, R10 | fait   |

## Règles de décision et concurrence

| ID    | Exigence                                                                         | Module                 | Preuve                | Statut |
| ----- | -------------------------------------------------------------------------------- | ---------------------- | --------------------- | ------ |
| DEC-1 | Seuils : moins de 55 NO GO, 55 à 70 exclu GO sous conditions, 70 et plus GO      | moteur/decision        | Tests aux frontières  | fait   |
| DEC-2 | Un risque noté 3 : jamais GO ; GO sous conditions critiques ou NO GO             | moteur/decision        | R05                   | fait   |
| DEC-3 | Trois risques notés 2 ou 3 : jamais GO                                           | moteur/decision        | Test unitaire         | fait   |
| DEC-4 | Red flags prioritaires ; score calculé et orientation finale affichés séparément | moteur, pme, expert    | Test S-04, revue UI   | fait   |
| DEC-5 | Type d'offre du concurrent distinct de sa relation directe ou indirecte          | bd, validation, moteur | Migration, test FOR-6 | fait   |

## Restitution et prudence

| ID    | Exigence                                                                     | Module              | Preuve     | Statut  |
| ----- | ---------------------------------------------------------------------------- | ------------------- | ---------- | ------- |
| RES-1 | Aucune affirmation de viabilité ; hypothèses et données manquantes signalées | moteur, pme, expert | Revue UI   | fait    |
| RES-2 | Recommandations par règles déterministes, sans IA générative                 | moteur              | Tests S-08 | fait    |
| RES-3 | Restitution PME : résumé, projection, scores, décision, actions              | pme                 | R01, R11   | fait    |
| RES-4 | Restitution Expert : statut, sensibilité, composantes, conditions, preuves   | expert              | Revue      | à faire |

## Exigences d'interface

| ID   | Exigence                                                                   | Module                 | Preuve              | Statut   |
| ---- | -------------------------------------------------------------------------- | ---------------------- | ------------------- | -------- |
| UI-1 | Responsive dès 360 px et sur ordinateur                                    | app, composants        | Captures            | en cours |
| UI-2 | Libellés en français correct, vocabulaire PME                              | app                    | Revue               | fait     |
| UI-3 | Unités affichées systématiquement                                          | composants             | Revue               | fait     |
| UI-4 | Champs obligatoires, facultatifs, non applicables identifiés               | composants             | Revue               | fait     |
| UI-5 | Messages d'erreur à proximité du champ, actionnables                       | composants, validation | R02, R03            | fait     |
| UI-6 | Aucune perte silencieuse de données à la navigation                        | pme, expert            | R09, revue          | fait     |
| UI-7 | Hiérarchie lisible ; valeurs numériques et explications toujours présentes | pme, expert            | Revue               | fait     |
| UI-8 | Couleurs accessibles, contraste, labels associés aux contrôles             | composants             | Audit accessibilité | en cours |

## Architecture minimale

| ID    | Exigence                                                   | Module               | Preuve                           | Statut   |
| ----- | ---------------------------------------------------------- | -------------------- | -------------------------------- | -------- |
| TEC-1 | Front responsive couvrant les deux parcours                | app                  | Captures                         | fait     |
| TEC-2 | Couche serveur : validation, persistance, contrôle d'accès | services             | R07, R09                         | en cours |
| TEC-3 | Base persistante : comptes, études, scénarios, résultats   | bd                   | Migration                        | en cours |
| TEC-4 | Module de calcul isolé, sans duplication                   | moteur               | Revue, NR-2                      | fait     |
| TEC-5 | Configuration centralisée et versionnée                    | moteur/config        | Test de config                   | fait     |
| TEC-6 | Tests automatisés des calculs et des décisions             | moteur/\_\_tests\_\_ | Rapport Vitest, tests de recette | fait     |

## Sécurité et qualité

| ID    | Exigence                                          | Module          | Preuve                         | Statut   |
| ----- | ------------------------------------------------- | --------------- | ------------------------------ | -------- |
| SEC-1 | Mots de passe hachés                              | auth            | Test unitaire                  | fait     |
| SEC-2 | Secrets en variables d'environnement              | .env.example    | Revue, NR-6                    | fait     |
| SEC-3 | Contrôle d'accès côté serveur                     | proxy, services | R07, audit-securite-2026-09-07 | fait     |
| SEC-4 | Validation côté client et côté serveur            | validation      | R02, R03                       | en cours |
| SEC-5 | Aucune donnée réelle de client                    | prisma/seed     | Revue                          | fait     |
| SEC-6 | Erreurs gérées sans information technique exposée | services, app   | audit-securite-2026-09-07      | fait     |
| SEC-7 | Dépendances inventoriées avec licence et coût     | docs            | inventaire-dependances.md      | fait     |

## Contraintes de développement

| ID    | Exigence                                            | Module       | Preuve                      | Statut   |
| ----- | --------------------------------------------------- | ------------ | --------------------------- | -------- |
| DEV-1 | Code déposé dès le démarrage dans un espace partagé | dépôt        | Accès FUND.lab (question 9) | en cours |
| DEV-2 | Aucun résultat codé en dur                          | moteur       | Revue, R10                  | fait     |
| DEV-3 | Pas de socle no-code                                | architecture | Note de cadrage             | fait     |
| DEV-4 | Migrations et scripts d'initialisation fournis      | prisma       | R12                         | en cours |
| DEV-5 | Lancement local reproductible                       | README       | R12                         | en cours |
| DEV-6 | Réductions de périmètre signalées avant la démo     | docs/cadrage | Note de cadrage, section 2  | fait     |

## Exigences non fonctionnelles

| ID   | Exigence                                                  | Module      | Preuve                                | Statut   |
| ---- | --------------------------------------------------------- | ----------- | ------------------------------------- | -------- |
| NF-1 | Disponibilité pendant la recette                          | hébergement | URL stable (L2)                       | à faire  |
| NF-2 | Navigation fluide, calcul sans attente perceptible        | moteur, app | Mesure                                | en cours |
| NF-3 | Chrome et Edge récents, mobile et desktop                 | app         | Captures                              | en cours |
| NF-4 | Aucune perte après sauvegarde confirmée                   | services    | R09                                   | à faire  |
| NF-5 | Résultats rattachés à une version et à des paramètres     | moteur, bd  | DON-5                                 | à faire  |
| NF-6 | Structure claire, nommage cohérent, fonctions documentées | dépôt       | docs/conventions.md                   | en cours |
| NF-7 | Navigation clavier, labels, contraste                     | composants  | Audit accessibilité                   | en cours |
| NF-8 | Journalisation minimale des erreurs serveur               | services    | journal.ts, audit-securite-2026-09-07 | fait     |

## Scénarios de recette

| ID  | Scénario                                          | Résultat attendu                                     | Preuve prévue                              | Statut  |
| --- | ------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------ | ------- |
| R01 | Parcours PME complet avec données valides         | Synthèse produite, étude récupérable                 | `pme.recette.test.ts`                      | fait    |
| R02 | Note inférieure à 0 ou supérieure à 3             | Saisie refusée avec message explicite                | Tests Zod et moteur, `pme.recette.test.ts` | fait    |
| R03 | Poids de zones dont la somme diffère de 100 %     | Finalisation bloquée, écart signalé                  | Tests Zod et moteur, `pme.recette.test.ts` | fait    |
| R04 | Ajouter, modifier, supprimer un concurrent        | Liste et pression actualisées                        | `pme.recette.test.ts`                      | fait    |
| R05 | Finaliser avec un risque noté 3                   | Orientation plafonnée à GO sous conditions critiques | `expert.recette.test.ts`                   | fait    |
| R06 | Connexion Expert et consultation des dossiers     | Accès autorisé, tableau de bord affiché              | `npm run auth:verifier`                    | fait    |
| R07 | Route Expert sans authentification                | Accès refusé ou redirection                          | `npm run auth:verifier`                    | fait    |
| R08 | Dupliquer une étude et modifier une hypothèse     | Scénario indépendant, source inchangée               | `expert.recette.test.ts`                   | fait    |
| R09 | Actualiser après sauvegarde                       | Données persistées et récupérées                     | `pme.recette.test.ts`                      | fait    |
| R10 | Exécuter les deux cas de référence                | Résultats dans la tolérance de 0,1 point             | `reference.test.ts`                        | fait    |
| R11 | Imprimer la synthèse                              | Contenu lisible sans éléments d'interface inutiles   | Export PDF manuel                          | fait    |
| R12 | Lancer le projet localement avec la documentation | Installation reproductible                           | Lancement à froid, à rejouer (L-02)        | à faire |

## Livrables

| ID  | Livrable                  | Emplacement prévu                                   | Statut   |
| --- | ------------------------- | --------------------------------------------------- | -------- |
| L1  | Note de cadrage           | docs/cadrage/                                       | fait     |
| L2  | Application déployée      | URL de recette (phase 7)                            | à faire  |
| L3  | Code source               | Dépôt git, historique par phase                     | en cours |
| L4  | Base et migrations        | prisma/                                             | en cours |
| L5  | Tests                     | src/lib/moteur/\_\_tests\_\_, rapport de couverture | en cours |
| L6  | Documentation technique   | README.md, docs/                                    | en cours |
| L7  | Documentation utilisateur | docs/utilisateur/ (phase 7)                         | à faire  |
| L8  | Absent du brief           | Question 12                                         | en cours |
| L9  | Registre des écarts       | docs/ecarts.md (phase 7)                            | à faire  |
| L10 | Feuille de route          | docs/feuille-de-route.md (phase 7)                  | à faire  |

## Motifs de non-recevabilité

| ID   | Constat éliminatoire                                           | Parade                                                                 | Statut   |
| ---- | -------------------------------------------------------------- | ---------------------------------------------------------------------- | -------- |
| NR-1 | Code source incomplet ou projet impossible à lancer            | Dépôt complet, README testé à froid (R12)                              | en cours |
| NR-2 | Résultats codés en dur ou calculs différents selon le parcours | Moteur unique, cas de recette en entrée seulement                      | en cours |
| NR-3 | Écarts inexpliqués avec les cas de référence                   | Tests de référence, décomposition du score                             | en cours |
| NR-4 | Perte de données après sauvegarde confirmée                    | Transactions, R09 automatisé                                           | à faire  |
| NR-5 | Accès aux données Expert sans autorisation                     | Garde de routage et de service, R07 automatisé                         | à faire  |
| NR-6 | Secrets dans le dépôt                                          | .env ignoré, audit-securite-2026-09-07 (aucun secret trouvé)           | fait     |
| NR-7 | Dépendance critique non déclarée ou abonnement non approuvé    | inventaire-dependances.md ; hébergement encore à choisir (question 11) | en cours |
| NR-8 | Application inaccessible pour la recette                       | URL stable vérifiée avant la démo                                      | à faire  |
