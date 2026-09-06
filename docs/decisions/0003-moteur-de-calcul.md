# 0003. Moteur de calcul : pureté, point d'entrée unique, manques et arrondis

Date : 2026-09-06
Statut : acceptée

## Contexte

Le brief exige un module de calcul identifiable, testable, partagé entre les
deux parcours, avec des coefficients regroupés dans une configuration
versionnée, une tolérance de recette de 0,1 point, la distinction entre
donnée manquante et zéro, et l'affichage séparé du score calculé et de
l'orientation finale. Plusieurs points restent ouverts (arbitrages H1, H6,
H7 de la note de cadrage) et devaient être tranchés pour coder.

## Décision

- **Module pur.** `src/lib/moteur` n'importe ni Next, ni React, ni Prisma.
  Ses fonctions prennent leurs coefficients en paramètre et retournent des
  valeurs, jamais d'effet de bord. Il se teste en isolation et se réutilise
  par un autre outil.
- **Point d'entrée unique.** `evaluerEtude(etude, config, horloge)` est la
  seule fonction appelée par les interfaces et les services. Elle ne lève
  jamais d'exception sur des données incomplètes : les manques deviennent
  des alertes et des résultats `null`.
- **Configuration versionnée et instantané.** Chaque coefficient, seuil et
  libellé vit dans `config/v1.ts`. Le résultat conserve la version du
  moteur, la version de la méthodologie et un instantané des paramètres
  numériques (sans libellés ni aides), ce qui permet de rejouer un calcul.
- **Valeur manquante différente de zéro.** Une notation absente est exclue
  de l'agrégation et les poids sont renormalisés sur les composantes
  renseignées (demande par zone, menace d'un concurrent, score de risque).
  Un critère « non applicable » est exclu sans alerte. Aucune composante
  renseignée rend l'indicateur `null` et bloque la finalisation.
- **Agrégats de tête sans renormalisation.** Attractivité et score global
  exigent toutes leurs composantes : une section entière absente rend le
  score global incalculable plutôt que de produire un chiffre trompeur.
- **Zéro concurrent recensé.** La pression concurrentielle vaut 0 et une
  alerte de vérification est émise. Des concurrents recensés mais non notés
  donnent une pression `null`.
- **Arrondi.** Calcul en précision complète, résultats conservés à deux
  décimales, seuils de décision appliqués à la valeur conservée, affichage à
  une décimale. Le score affiché et la décision ne peuvent pas se
  contredire. L'erreur maximale d'arrondi (0,005) reste loin de la tolérance
  de recette (0,1).
- **Décision.** Trois orientations (GO, GO sous conditions, NO GO) plus un
  indicateur `conditionsCritiques`. Un risque noté 3 interdit le GO et pose
  l'indicateur ; trois risques notés 2 ou plus interdisent le GO sans le
  poser. Le libellé « GO sous conditions critiques » est la variante
  affichée quand l'indicateur est posé.
- **Décomposition exacte.** Le score global se décompose en quatre
  contributions additives (demande, vides commerciaux, marge face à la
  concurrence, maîtrise des risques) dont les poids composés viennent de la
  configuration. Le résidu d'arrondi est porté par la plus grosse
  contribution pour que la somme affichée reconstitue exactement le score
  affiché.
- **Recommandations déterministes.** Trois forces, trois points de vigilance
  et au plus cinq actions, produits par des règles à seuils configurables,
  classés par priorité fixe. Des vigilances de fond rappellent toujours que
  le résultat est une indication construite sur des hypothèses.
- **Cas de référence.** Deux cas construits par le candidat, résultats
  calculés à la main, sont des entrées du moteur ; les valeurs attendues ne
  vivent que dans les tests. Ils servent aussi de données de démonstration.

## Conséquences

- Toute interface qui a besoin d'un chiffre l'obtient du résultat de
  `evaluerEtude`, jamais d'un calcul local.
- Changer une pondération, un seuil ou une liste revient à publier une
  nouvelle version de configuration, sans toucher au moteur.
- Les jeux de recette officiels de FUND.lab remplaceront les cas de référence
  en changeant les entrées et les constantes attendues des tests, rien
  d'autre.
- La version du moteur est incrémentée à tout changement de calcul ; la
  version de la méthodologie à tout changement de coefficient.
