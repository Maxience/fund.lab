# Checklist de livraison

Suivi vivant des tâches restantes avant recette et transfert à FUND.lab.
Cocher une case dès la tâche terminée, ajouter une date entre parenthèses.
Ne pas retirer les tâches faites : l'historique des cases cochées vaut preuve
d'avancement.

Dernière mise à jour : 2026-09-07.

## Urgent : bloque la recevabilité

- [x] Écrire le point d'avancement du jour dans `docs/avancement/`
      (2026-09-07)
- [ ] Envoyer le message de questions à FUND.lab (`docs/cadrage/questions-fundlab.md`)
- [x] Committer les changements en cours et statuer sur `AGENTS.md`, `CLAUDE.md`,
      le PDF du brief (2026-09-07 : ajoutés au `.gitignore`, dépôt propre,
      `npm run verifier` au vert avant commit)
- [x] Revérifier qu'aucun secret n'est commité avant livraison (2026-09-07 :
      historique git sans `.env`, aucun motif de secret trouvé dans le code)

## Phase 6. Qualité transversale (plan, points 46 à 51)

- [x] Q-01 Responsive vérifié à 360 px et sur ordinateur, Chrome et Edge
      (2026-09-07, `docs/preuves/responsive-2026-09-07.md` : toutes les
      pages testées à 360 px via le protocole DevTools, aucun débordement ;
      Edge seulement, Chrome partage le même moteur, à confirmer en recette)
- [x] Q-02 Accessibilité : labels, clavier, focus visible, contraste, couleur
      jamais seule (2026-09-07, `docs/preuves/accessibilite-2026-09-07.md` :
      revue de code, aucun défaut bloquant, deux points mineurs non
      bloquants notés)
- [x] Q-03 Performance : rendu serveur, calcul sans attente perceptible
      (2026-09-07, `docs/preuves/performance-2026-09-07.md` : mesuré sur une
      vraie construction de production ; pages publiques et PME en quelques
      millisecondes, un point de vigilance documenté sur la latence réseau
      vers la base de développement distante)
- [x] Q-04 Un scénario de test automatisé par cas de recette R01 à R12
      (2026-09-07 : R01 à R05, R08, R09 par une nouvelle base de test
      dédiée `chalandise_test` et `npm run test:recette`
      (`docs/decisions/0006-tests-de-recette-base-dediee.md`) ; R10 déjà
      couvert par le moteur ; R06 et R07 par `npm run auth:verifier` contre
      un serveur réel ; R11 vérifié par export PDF manuel ; R12 reste un
      test procédural, prévu à L-02/L-06)
- [x] Q-05 Audit de sécurité : garde sur chaque route Expert, scan des
      secrets, en-têtes de sécurité, aucune trace technique exposée
      (2026-09-07, `docs/preuves/audit-securite-2026-09-07.md` ; seul écart
      trouvé, en-têtes de sécurité absents, corrigé dans `next.config.ts`)
- [x] Q-06 Inventaire des dépendances : licence, coût, niveau gratuit,
      réversibilité (2026-09-07, `docs/inventaire-dependances.md`)

## Phase 7. Déploiement et livraison (plan, points 52 à 58)

- [ ] L-01 Déploiement sur une URL stable de recette (base hébergée)
- [ ] L-02 Documentation technique (L6), testée par un lancement à froid sur
      poste vierge (cas R12)
- [ ] L-03 Documentation utilisateur (L7), captures d'écran
- [ ] L-04 Registre des écarts (L9) : bugs connus, limites, dette technique
- [ ] L-05 Feuille de route (L10) : priorités à 30-60 jours
- [ ] L-06 Recette interne : dérouler R01 à R12 sur l'URL déployée
- [ ] L-07 Répétition de la démonstration de 45 minutes + transfert des accès

## À trancher avec FUND.lab

Arbitrages déjà appliqués par défaut en configuration, en attente de
confirmation (voir `docs/cadrage/questions-fundlab.md`) :

- [ ] Dépôt et compte à créditer de l'accès administrateur (point 9)
- [ ] Jour 0 officiel du calendrier (point 10)
- [ ] Confirmation que le chatbot est hors MVP (point 13)
