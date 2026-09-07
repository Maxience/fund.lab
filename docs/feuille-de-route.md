# Feuille de route après le MVP

Livrable L10. Priorités pour les 30 à 60 jours suivant la livraison,
classées par horizon. Chaque ligne renvoie, quand c'est pertinent, à
l'écart correspondant du registre (`docs/registre-ecarts.md`).

Dernière mise à jour : 2026-09-07.

## Avant tout : trancher les points ouverts avec FUND.lab

Préalable à toute évolution de méthodologie : les sept points listés dans
le registre des écarts (listes et poids des drivers, risques et besoins,
pourcentage de loyer, statut de la décision critique, jeux de recette
officiels, sens du mot « chatbot », jour 0). Chaque arbitrage par défaut
est déjà en configuration versionnée : les trancher ne demande de changer
qu'un fichier, jamais le moteur.

## Horizon 0 à 15 jours : consolider le MVP livré

- Recevoir les jeux de données de recette officiels et les rejouer contre
  la suite de tests (remplace les deux cas construits par le candidat,
  sans changer le moteur).
- Ajouter le bouton de rattachement d'un client depuis l'écran du dossier
  Expert (le service existe et est testé, seul le bouton manque).
- Lien d'évitement et vérification outillée du contraste (accessibilité).
- Compteur de limitation des tentatives de connexion en base plutôt qu'en
  mémoire du processus, pour survivre à un redéploiement.
- Recherche filtrante dans le sélecteur de client de la nouvelle étude.

## Horizon 15 à 30 jours : profondeur Expert

- Pièces jointes sur les preuves (photo, document scanné), avec stockage
  de fichiers.
- Export PDF mis en page pour la restitution, au-delà de l'impression
  navigateur actuelle.
- Comparaison de plus de deux scénarios côte à côte, et lecture de
  sensibilité étendue à d'autres hypothèses que le ticket et la
  fréquentation.
- Suite Playwright (ou équivalent) pour les scénarios R06, R07 et R11
  contre un serveur réel, en plus du script `auth:verifier` existant.

## Horizon 30 à 60 jours : passage à l'échelle

- Interface d'administration des comptes Expert (création, désactivation),
  aujourd'hui faite par script (`npm run auth:creer`).
- Purge ou archivage automatique des études PME anonymes après une durée à
  définir avec FUND.lab, pour éviter l'accumulation de brouillons orphelins.
- Bibliothèque de valeurs de référence par ville et par concept, pour
  préremplir des hypothèses plausibles selon la localité.
- Réévaluation de Prisma 8 dès sa sortie en version stable (actuellement
  épinglé en 7.10, voir décision 0001).
- Si l'application s'étend à d'autres outils FUND.lab : extraire le moteur
  de calcul dans un module partagé entre plusieurs applications, sans
  changer son fonctionnement (il est déjà sans dépendance à Next ou
  Prisma, pensé pour cet usage dès la conception).

## Hors périmètre, à ne considérer que sur demande explicite de FUND.lab

Repris du brief : cartographie et géocodage automatiques, collecte
automatique de concurrents ou de données de trafic, application mobile
native, paiement en ligne, multilingue, intelligence artificielle
générative, éditeur graphique des pondérations et règles méthodologiques.
