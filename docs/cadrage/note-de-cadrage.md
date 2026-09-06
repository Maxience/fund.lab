# Note de cadrage

Outil digital d'étude de chalandise, MVP. Livrable L1 du challenge.

| Champ          | Valeur                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Commanditaire  | FUND.lab                                                                                                                 |
| Auteur         | Paul Maxime Dossou                                                                                                       |
| Date           | 2026-09-06                                                                                                               |
| Version        | 1.0                                                                                                                      |
| Documents liés | [backlog.md](backlog.md), [questions-fundlab.md](questions-fundlab.md), [matrice-tracabilite.md](matrice-tracabilite.md) |

## 1. Compréhension du besoin

FUND.lab qualifie aujourd'hui l'opportunité d'implantation d'un restaurant,
d'un snack ou d'un salon de thé avec un classeur Excel. Le challenge consiste
à transformer cet outil en application web : même méthode et mêmes formules,
mais un parcours guidé, une base de données, deux profils d'utilisateurs et
une restitution qui explique le résultat.

Le produit convertit des observations de terrain en une lecture structurée
sur cinq dimensions : demande accessible, pression concurrentielle, besoins
absents ou mal servis, capacité de paiement et risques d'exécution. Il
aboutit à une orientation GO, GO sous conditions ou NO GO, présentée comme
une aide à la décision et jamais comme une certitude. Un résultat favorable
ne dispense pas de traiter les risques critiques ni de vérifier les
hypothèses les plus sensibles.

Ce que le produit n'est pas : une étude géomarketing, une décision
d'investissement, un outil cartographique, un assistant conversationnel.

Trois principes structurent le MVP :

- **Un socle unique.** Un seul modèle de données, un seul moteur de calcul
  versionné, des règles de validation communes aux deux parcours. Aucune
  formule n'est dupliquée dans une interface.
- **Deux parcours.** Le parcours PME, sans compte, guide un promoteur en huit
  étapes jusqu'à une synthèse imprimable. Le parcours Expert, authentifié,
  donne au consultant FUND.lab ses clients, ses dossiers, ses scénarios, ses
  preuves et une restitution détaillée.
- **Une traçabilité complète.** Chaque résultat porte la version du moteur,
  la version de la méthodologie et l'instantané des paramètres utilisés. Les
  observations, les hypothèses et les résultats calculés restent distincts.

## 2. Périmètre

**Inclus, obligatoire.** Les huit modules fonctionnels (projet et site,
hypothèses commerciales, zones de chalandise, demande, concurrence, vides
commerciaux, risques, synthèse), le parcours PME complet avec sauvegarde par
identifiant temporaire et page imprimable, le parcours Expert complet
(authentification, tableau de bord, clients, études, duplication, archivage
logique, preuves et commentaires, scénarios, restitution, version du
moteur), les cinq familles d'états, les douze formules, les règles de
décision et les douze scénarios de recette.

**Exclu, conformément au brief.** Cartographie et géocodage, collecte
automatique de concurrents, application native, paiement, multilingue,
intelligence artificielle générative, administration avancée des comptes,
éditeur graphique des pondérations, exports Word ou PDF élaborés,
bibliothèque de benchmarks.

**Choix de simplification, signalés dès maintenant.**

- Les comptes Expert sont créés par script d'initialisation, sans interface
  d'administration (non requise par le brief).
- Une preuve est une source textuelle avec un niveau et une date, sans pièce
  jointe.
- La restitution imprimable est une page web mise en forme pour l'impression,
  sans export PDF dédié.
- La lecture de sensibilité Expert porte sur le ticket moyen et la
  fréquentation, les deux variables qui pilotent le chiffre d'affaires.

## 3. Hypothèses et arbitrages

Le brief laisse ouverts les points ci-dessous. Chaque arbitrage est appliqué
dès maintenant et porté en configuration versionnée : si FUND.lab tranche
autrement, seule la configuration change, pas le code. Les questions
correspondantes sont regroupées dans [questions-fundlab.md](questions-fundlab.md).

| N°  | Point ouvert                                                                                                                       | Arbitrage appliqué                                                                                                                                                                                                                                                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | « GO sous conditions critiques » apparaît dans les red flags et le cas R05, mais la table des états ne compte que trois décisions. | Trois orientations dans le modèle, plus un indicateur « conditions critiques » posé quand un risque est noté 3. Le libellé affiché devient « GO sous conditions critiques ». Une quatrième valeur reste possible par simple changement de configuration.                                                                                                                   |
| H2  | La liste des générateurs de demande et leurs poids ne sont pas fournis.                                                            | Sept générateurs proposés : densité résidentielle 20 %, bureaux et administrations 20 %, commerces et marchés 15 %, axes de passage et transports 15 %, enseignement 10 %, loisirs, santé et culte 10 %, solvabilité de la zone 10 %.                                                                                                                                      |
| H3  | Les catégories de risques et leurs poids ne sont pas fournis ; le brief en cite quatre.                                            | Sept catégories : site et local 20 %, approvisionnement 15 %, ressources humaines 15 %, conformité et autorisations 15 %, financement et trésorerie 15 %, sécurité et environnement 10 %, dépendance à un facteur externe 10 %.                                                                                                                                            |
| H4  | La liste des besoins de la grille de vides commerciaux n'est pas fournie.                                                          | Dix besoins avec importance par défaut de 1 à 3, modifiable par l'utilisateur : petit-déjeuner matinal, déjeuner rapide à prix maîtrisé, dîner et soirée, cuisine locale de qualité, cuisine internationale ou spécialisée, offre saine ou légère, vente à emporter et livraison, espace de travail et connexion, espace familial ou privatisable, boissons et pâtisserie. |
| H5  | Le pourcentage cible de loyer par défaut n'est pas précisé.                                                                        | 10 % du chiffre d'affaires mensuel, valeur affichée et modifiable à l'étape des hypothèses commerciales.                                                                                                                                                                                                                                                                   |
| H6  | Traitement des agrégations partielles : seule la pression concurrentielle précise « menaces renseignées ».                         | Renormalisation sur les composantes renseignées pour la demande, la menace et le risque. Aucune composante renseignée rend l'indicateur manquant et bloque la finalisation. Zéro concurrent recensé donne une pression nulle accompagnée d'une alerte de vérification.                                                                                                     |
| H7  | La règle d'arrondi n'est pas fixée ; la tolérance de recette est de 0,1 point.                                                     | Calcul en précision complète, résultats conservés à deux décimales, seuils appliqués à la valeur conservée, affichage à une décimale. Le score affiché et la décision restent cohérents.                                                                                                                                                                                   |
| H8  | Capacité, clientèle cible et ticket du concurrent sont demandés mais n'entrent dans aucune formule.                                | Utilisés comme contrôles de cohérence et en restitution : alerte si la fréquentation dépasse la capacité fois quatre rotations, comparaison du ticket du projet à la moyenne des tickets concurrents. Aucun effet sur le score.                                                                                                                                            |
| H9  | Les deux jeux de recette annoncés ne figurent pas dans le pack.                                                                    | Deux cas construits par le candidat, résultats calculés à la main, servent de tests de non-régression. Les jeux officiels seront branchés à réception sans modifier le code.                                                                                                                                                                                               |
| H10 | Le mot « chatbot » a été employé oralement ; le brief exclut l'IA générative.                                                      | MVP sans assistant conversationnel. Le parcours guidé question par question et les recommandations par règles déterministes couvrent le besoin d'accompagnement.                                                                                                                                                                                                           |
| H11 | Un scénario est décrit comme un objet à part (étude source, hypothèses modifiées, lien).                                           | Un scénario est une étude de type « variante » liée à son étude de référence, copie complète au moment de la duplication. Cela garantit l'indépendance des deux (cas R08) et réutilise tout le parcours.                                                                                                                                                                   |
| H12 | Le brief numérote les livrables L1 à L10 sans L8.                                                                                  | Considéré comme une erreur de numérotation ; question posée pour confirmation.                                                                                                                                                                                                                                                                                             |

## 4. Architecture

**Stack.** Next.js 16 (App Router) et React 19, TypeScript strict, Tailwind 4,
Prisma 7 sur PostgreSQL, Zod, Vitest 5. Les motifs sont consignés dans
[decisions/0001-stack-conservee.md](../decisions/0001-stack-conservee.md).
Toutes les dépendances directes sont sous licence MIT ou Apache 2.0, sans
coût d'usage.

**Modules.** Quatre couches, chacune avec une seule responsabilité :

```
Interfaces      src/app (parcours PME, connexion, espace Expert) et src/composants
Services        src/lib/services : validation, contrôle d'accès, transactions, persistance
Moteur          src/lib/moteur : formules, décision, validation métier, configuration versionnée
Données         prisma/schema.prisma, migrations, seed de démonstration
```

Le moteur est un module pur, sans dépendance à Next ni à Prisma, avec un
point d'entrée unique appelé par les deux parcours. Il retourne les scores
intermédiaires, la décomposition du score global, l'orientation calculée,
l'orientation finale après red flags, les alertes, les recommandations et
l'instantané des paramètres.

**Modèle de données.** Douze objets, conformes au brief : Utilisateur,
Session, Client, Étude (statut brouillon, complète ou archivée ; type
référence ou variante ; lien vers l'étude source ; version du moteur), Zone,
Évaluation de la demande, Concurrent (type d'offre libre distinct de la
relation directe ou indirecte), Gap, Risque, Preuve, Résultat (scores,
orientations, paramètres, horodatage). Chaque donnée notée porte un statut
renseignée, manquante ou non applicable.

**Flux.** Une étude PME est créée sans compte avec un identifiant temporaire
conservé dans le navigateur ; chaque étape validée est sauvegardée côté
serveur, ce qui couvre la reprise après actualisation. Un Expert peut
rattacher une étude anonyme à un client. Toute écriture passe par la couche
services : validation Zod, vérification de session pour les fonctions
Expert, transaction, calcul par le moteur, enregistrement du résultat.

**Sécurité.** Mots de passe hachés avec scrypt, sessions en base avec cookie
httpOnly et sécurisé, garde de routage sur les routes Expert doublée d'une
vérification dans chaque service, validation identique côté client et côté
serveur, secrets en variables d'environnement, journalisation serveur sans
donnée sensible, aucune donnée réelle de client FUND.lab.

**Hébergement proposé pour la recette.** Application sur Vercel (offre
gratuite, suffisante pour une recette, limites de bande passante et de temps
d'exécution) et base PostgreSQL sur Neon (offre gratuite, 0,5 Go, mise en
veille après inactivité). Réversibilité : l'application se construit en Node
standard et tourne sous Docker chez tout hébergeur ; la base s'exporte par
`pg_dump`. Ces services seront déclarés avec leurs limites et leurs coûts
prévisibles ; tout autre choix de FUND.lab est possible sans modification du
code.

## 5. Risques

| Risque                                                            | Probabilité | Impact | Parade                                                                                                                              |
| ----------------------------------------------------------------- | ----------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Jeux de recette officiels reçus tard ou différents des hypothèses | Élevée      | Élevé  | Cas de test internes dès le jour 2 ; coefficients en configuration ; branchement des jeux officiels sans changement de code         |
| Ambiguïtés méthodologiques tranchées autrement par FUND.lab       | Moyenne     | Moyen  | Arbitrages appliqués en configuration versionnée et documentés ; questions groupées avec proposition                                |
| Périmètre Expert large pour sept jours                            | Moyenne     | Élevé  | Parcours PME et Expert partagent les mêmes étapes et composants ; scénario modélisé comme une étude variante ; priorités P1 d'abord |
| Hébergement ou service externe non approuvé                       | Moyenne     | Élevé  | Proposition déclarée dès le jour 1 avec niveau gratuit, limites et réversibilité ; validation demandée avant le jour 6              |
| Saisie de cinquante concurrents peu confortable sur mobile        | Moyenne     | Moyen  | Liste avec fiche par concurrent, ajout progressif, résumé de pression recalculé à chaque changement                                 |
| Authentification maison mal sécurisée                             | Faible      | Élevé  | scrypt natif, sessions en base, cookies sécurisés, limitation des tentatives, cas R07 automatisé                                    |
| Installation non reproductible chez FUND.lab                      | Faible      | Élevé  | Fins de ligne imposées, versions épinglées, README testé par un lancement à froid (cas R12)                                         |

## 6. Calendrier

Le jour 0 correspond à la confirmation de démarrage ; sa date exacte est
demandée à FUND.lab. Les jalons suivent le brief.

| Jour | Contenu                                                        | Point de contrôle                            |
| ---- | -------------------------------------------------------------- | -------------------------------------------- |
| 0    | Accusé de réception, dépôt initial, fondations                 | Confirmation de démarrage                    |
| 1    | Cadrage, arbitrages, questions, backlog                        | Cette note et le backlog                     |
| 2    | Configuration méthodologique, moteur, tests, modèle de données | Démonstration du squelette et premiers tests |
| 3    | Couche serveur, authentification, premières étapes PME         | Point d'avancement                           |
| 4    | Parcours PME complet et calculs principaux                     | Démonstration intermédiaire de 30 minutes    |
| 5    | Parcours Expert : tableau de bord, clients, études, scénarios  | Point d'avancement                           |
| 6    | Preuves, restitution Expert, persistance, déploiement          | Release candidate et liste des écarts        |
| 7    | Corrections, recette, documentation, transfert                 | MVP final et démonstration                   |

Un point d'avancement écrit est produit chaque soir dans `docs/avancement/`.

## 7. Backlog

Le backlog priorisé complet est dans [backlog.md](backlog.md). Les cinq
priorités absolues, sans lesquelles le MVP n'est pas recevable :

1. Moteur unique, testé, avec coefficients en configuration et deux cas de
   référence dans la tolérance.
2. Parcours PME complet, de la saisie à la synthèse imprimable, avec
   sauvegarde et reprise.
3. Contrôle d'accès serveur sur toutes les fonctions Expert.
4. Persistance sans perte après sauvegarde confirmée.
5. Dépôt complet, lancement local reproductible, aucun secret versionné.
