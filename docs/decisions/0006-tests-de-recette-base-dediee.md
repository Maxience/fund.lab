# 0006. Tests de recette contre une base de test dédiée

Date : 2026-09-07
Statut : acceptée

## Contexte

La checklist de livraison (Q-04) demande un scénario de test automatisé par
cas de recette R01 à R12. Certains de ces scénarios (R01 à R05, R08, R09)
touchent la persistance et ne peuvent pas être vérifiés par les tests
unitaires du moteur seuls, qui ne parlent pas à une base de données. Écrire
ces tests contre la base de développement ou de démonstration aurait
mélangé des données de test avec les données visibles pendant les
démonstrations, et risqué une collision si quelqu'un l'utilise pendant
qu'un test s'exécute.

## Décision

- **Base dédiée : `chalandise_test`.** Une base PostgreSQL distincte, créée
  sur le même serveur que la base de développement mais jamais partagée
  avec elle. Son URL vit dans `.env`, variable `DATABASE_URL_TEST`, jamais
  versionnée. Le schéma y est appliqué par `prisma migrate deploy`, comme
  pour toute base neuve.
- **Suite Vitest séparée.** `vitest.config.recette.mts` couvre les fichiers
  `src/**/*.recette.test.ts`, avec un fichier d'initialisation
  (`vitest.setup.recette.mts`) qui bascule `DATABASE_URL` sur
  `DATABASE_URL_TEST` avant que la couche service ne soit chargée. La
  configuration par défaut (`vitest.config.mts`) exclut ces fichiers : la
  suite rapide (`npm test`, utilisée par `npm run verifier`) n'ouvre aucune
  connexion réseau et reste utilisable même sans base disponible.
- **Commande dédiée.** `npm run test:recette`, à exécuter séparément, avant
  chaque jalon de recette. Chaque fichier vide la base de test au début de
  chaque cas (`nettoyerBaseTest`), donc rejouable sans effet de bord.
- **Couverture par les tests automatisés de persistance :**
  - R01 (parcours PME complet et étude récupérable),
  - R02 (note hors échelle, finalisation bloquée),
  - R03 (poids de zones invalides, finalisation bloquée),
  - R04 (ajout, modification, suppression d'un concurrent, pression
    recalculée à chaque étape),
  - R05 (risque noté 3, orientation plafonnée à GO sous conditions
    critiques),
  - R08 (scénario dupliqué indépendant, référence inchangée),
  - R09 (persistance après relecture, équivalent d'une actualisation de
    page).
  - R10 est déjà couvert par `src/lib/moteur/__tests__/reference.test.ts`,
    sans dépendance à une base.
- **Couverture par un autre moyen, documentée plutôt que forcée dans
  Vitest :**
  - R06 et R07 (connexion Expert, accès refusé sans session) sont vérifiés
    de bout en bout par `scripts/verifier-acces-expert.mts`
    (`npm run auth:verifier`), qui a besoin d'un serveur `next dev` ou
    `next start` lancé : ouvrir une vraie session HTTP dans un test Vitest
    aurait exigé de démarrer ce serveur dans chaque exécution, ce qui
    alourdit inutilement la suite rapide.
  - R11 (impression) a été vérifié manuellement par export PDF réel
    (`npm run exporter:pdf` adapté, capture visuelle) : la mise en page
    d'impression n'est pas un objet qu'un test automatisé juge utilement.
  - R12 (lancement local avec la documentation) est par nature un test
    procédural, à rejouer sur un poste vierge ; prévu au livrable L2/L6.

## Conséquences

- Un test de recette qui échoue pointe vers un vrai défaut de bout en bout,
  pas seulement une formule isolée : le premier test R05 a révélé une
  incohérence réelle entre la donnée de référence (part de loyer à `null`,
  pour exercer la valeur par défaut du moteur) et l'exigence de
  finalisation, qui requiert une valeur confirmée. Corrigé en donnant au
  test une étude complète, conforme à ce qu'un formulaire produit
  réellement.
- La base `chalandise_test` doit être recréée (`CREATE DATABASE` puis
  `prisma migrate deploy`) sur tout nouvel environnement qui exécute
  `npm run test:recette` ; documenté dans `.env.example` et le README.
- `npm run verifier` reste inchangé et rapide ; les tests de recette sont un
  jalon à part, à exécuter avant chaque étape de recette (L-06) et avant la
  démonstration finale.
