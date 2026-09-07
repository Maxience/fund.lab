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

- [ ] Q-01 Responsive vérifié à 360 px et sur ordinateur, Chrome et Edge
- [ ] Q-02 Accessibilité : labels, clavier, focus visible, contraste, couleur
      jamais seule
- [ ] Q-03 Performance : rendu serveur, calcul sans attente perceptible
- [ ] Q-04 Un scénario de test automatisé par cas de recette R01 à R12
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
