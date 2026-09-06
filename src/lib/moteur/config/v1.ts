/**
 * Méthodologie FUND.lab, version 1.0.
 *
 * Les coefficients cités par le brief sont repris tels quels. Les listes que
 * le brief ne fournit pas (générateurs de demande, catégories de risques,
 * besoins de marché, part de loyer) sont des propositions consignées dans la
 * note de cadrage (arbitrages H2 à H5) et remplaçables ici sans toucher au
 * code.
 */

import type { ConfigurationMethodologie } from './types';

export const CONFIG_V1: ConfigurationMethodologie = {
  version: '1.0',
  dateEffet: '2026-09-06',
  echelleNote: { min: 0, max: 3 },

  drivers: [
    {
      code: 'RESIDENTIEL',
      libelle: 'Densité résidentielle',
      poids: 0.2,
      aide: 'Habitations autour du site. 0 : quasi inexistante. 1 : faible. 2 : moyenne. 3 : forte, quartier dense.',
    },
    {
      code: 'BUREAUX',
      libelle: 'Bureaux et administrations',
      poids: 0.2,
      aide: 'Salariés et agents présents en journée. 0 : aucun. 1 : quelques structures. 2 : plusieurs employeurs. 3 : pôle tertiaire ou administratif.',
    },
    {
      code: 'COMMERCES',
      libelle: 'Commerces et marchés',
      poids: 0.15,
      aide: 'Boutiques, marchés, centres commerciaux qui attirent du passage. 0 : aucun. 3 : pôle commercial très fréquenté.',
    },
    {
      code: 'AXES',
      libelle: 'Axes de passage et transports',
      poids: 0.15,
      aide: 'Voies passantes, gares routières, arrêts, carrefours. 0 : voie isolée. 3 : axe majeur ou nœud de transport.',
    },
    {
      code: 'ENSEIGNEMENT',
      libelle: "Établissements d'enseignement",
      poids: 0.1,
      aide: 'Écoles, lycées, universités, centres de formation. 0 : aucun. 3 : campus ou plusieurs établissements.',
    },
    {
      code: 'LOISIRS',
      libelle: 'Loisirs, santé et lieux de culte',
      poids: 0.1,
      aide: 'Stades, salles, cliniques, hôpitaux, lieux de culte générant des flux réguliers. 0 : aucun. 3 : plusieurs lieux très fréquentés.',
    },
    {
      code: 'SOLVABILITE',
      libelle: 'Solvabilité de la zone',
      poids: 0.1,
      aide: 'Capacité de paiement observée : niveau de vie, tickets pratiqués alentour. 0 : très faible. 3 : élevée.',
    },
  ],

  risques: [
    {
      code: 'SITE',
      libelle: 'Site et local',
      poids: 0.2,
      aide: 'Accès, visibilité, état du local, sécurité du bail, travaux à prévoir.',
    },
    {
      code: 'APPROVISIONNEMENT',
      libelle: 'Approvisionnement',
      poids: 0.15,
      aide: 'Régularité et coût des matières premières, dépendance à un fournisseur, chaîne du froid.',
    },
    {
      code: 'RESSOURCES_HUMAINES',
      libelle: 'Ressources humaines',
      poids: 0.15,
      aide: 'Recrutement, formation et fidélisation du personnel qualifié.',
    },
    {
      code: 'CONFORMITE',
      libelle: 'Conformité et autorisations',
      poids: 0.15,
      aide: "Autorisations d'exploitation, hygiène, fiscalité, normes de sécurité.",
    },
    {
      code: 'FINANCEMENT',
      libelle: 'Financement et trésorerie',
      poids: 0.15,
      aide: 'Financement du lancement et trésorerie des premiers mois.',
    },
    {
      code: 'SECURITE_ENVIRONNEMENT',
      libelle: 'Sécurité et environnement',
      poids: 0.1,
      aide: 'Inondation, insécurité, nuisances, travaux de voirie.',
    },
    {
      code: 'DEPENDANCE_EXTERNE',
      libelle: 'Dépendance à un facteur externe',
      poids: 0.1,
      aide: 'Saisonnalité, dépendance à un client, un prescripteur ou un événement.',
    },
  ],

  besoins: [
    {
      code: 'PETIT_DEJEUNER',
      libelle: 'Petit-déjeuner matinal',
      importanceParDefaut: 2,
      aide: 'Offre disponible tôt le matin pour les actifs et les élèves.',
    },
    {
      code: 'DEJEUNER_RAPIDE',
      libelle: 'Déjeuner rapide à prix maîtrisé',
      importanceParDefaut: 3,
      aide: 'Repas de midi servi vite, à un prix accessible aux salariés du secteur.',
    },
    {
      code: 'DINER_SOIREE',
      libelle: 'Dîner et soirée',
      importanceParDefaut: 2,
      aide: 'Offre du soir, y compris après 21 h.',
    },
    {
      code: 'CUISINE_LOCALE',
      libelle: 'Cuisine locale de qualité',
      importanceParDefaut: 3,
      aide: 'Plats locaux bien préparés, hygiène irréprochable.',
    },
    {
      code: 'CUISINE_SPECIALISEE',
      libelle: 'Cuisine internationale ou spécialisée',
      importanceParDefaut: 1,
      aide: 'Cuisine étrangère, grill, pizza, poisson, ou concept thématique.',
    },
    {
      code: 'OFFRE_SAINE',
      libelle: 'Offre saine ou légère',
      importanceParDefaut: 2,
      aide: 'Salades, plats équilibrés, options végétariennes.',
    },
    {
      code: 'EMPORTER_LIVRAISON',
      libelle: 'Vente à emporter et livraison',
      importanceParDefaut: 3,
      aide: 'Commande à emporter, livraison au bureau ou à domicile.',
    },
    {
      code: 'ESPACE_TRAVAIL',
      libelle: 'Espace de travail et connexion',
      importanceParDefaut: 2,
      aide: 'Tables adaptées, prises, connexion internet fiable, calme relatif.',
    },
    {
      code: 'ESPACE_FAMILIAL',
      libelle: 'Espace familial ou privatisable',
      importanceParDefaut: 1,
      aide: 'Accueil des familles, salle ou espace privatisable pour événements.',
    },
    {
      code: 'BOISSONS_PATISSERIE',
      libelle: 'Boissons, pâtisserie et salon de thé',
      importanceParDefaut: 2,
      aide: 'Boissons chaudes ou fraîches de qualité, pâtisserie, pause en journée.',
    },
  ],

  menace: {
    composantes: {
      proximite: 0.2,
      affluence: 0.35,
      qualite: 0.25,
      vitesse: 0.1,
      differenciation: 0.1,
    },
    facteurRelation: {
      DIRECTE: 1.0,
      INDIRECTE: 0.7,
    },
  },

  gaps: {
    partMalServi: 0.5,
  },

  attractivite: { demande: 0.5, gaps: 0.3, concurrence: 0.2 },
  scoreGlobal: { attractivite: 0.7, risque: 0.3 },

  seuils: { noGoStrict: 55, goInclus: 70 },

  redFlags: {
    noteCritique: 3,
    noteVigilance: 2,
    nombreRisquesVigilance: 3,
  },

  loyer: {
    partCibleParDefaut: 0.1,
    partCibleMax: 0.5,
  },

  limites: {
    zonesMax: 4,
    concurrentsMax: 50,
    joursOuvertureMax: 31,
    rotationsMaxParCouvert: 4,
  },

  tolerancePoids: 0.0001,

  arrondi: {
    decimalesConservees: 2,
    decimalesAffichees: 1,
  },

  recommandations: {
    demandeForte: 70,
    demandeFaible: 45,
    pressionFaible: 40,
    pressionForte: 65,
    gapsEleves: 50,
    gapsFaibles: 25,
    risqueFaible: 25,
    risqueEleve: 50,
    menaceForte: 2.2,
    ecartTicketRelatif: 0.25,
    nombreForces: 3,
    nombreVigilances: 3,
    nombreActions: 5,
  },

  libelles: {
    orientations: {
      GO: 'GO',
      GO_SOUS_CONDITIONS: 'GO sous conditions',
      NO_GO: 'NO GO',
    },
    orientationCritique: 'GO sous conditions critiques',
    orientationNonCalculable: 'Non calculable',
    statutsMarche: {
      ABSENT: 'Absent',
      MAL_SERVI: 'Mal servi',
      CORRECT: 'Correctement servi',
    },
    relations: {
      DIRECTE: 'Concurrent direct',
      INDIRECTE: 'Concurrent indirect',
    },
    modesDeplacement: {
      A_PIED: 'À pied',
      DEUX_ROUES: 'Deux-roues',
      VOITURE: 'Voiture',
      TRANSPORT_COMMUN: 'Transport en commun',
    },
    composantesMenace: {
      proximite: 'Proximité',
      affluence: 'Affluence',
      qualite: 'Qualité perçue',
      vitesse: 'Vitesse de service',
      differenciation: 'Différenciation',
    },
    aideEchelleDemande:
      'Notez chaque générateur de 0 (absent) à 3 (très fort) pour la zone observée. Laissez vide si vous ne savez pas : une case vide ne vaut jamais zéro.',
    aideEchelleMenace:
      'Notez la menace que représente chaque critère de 0 (aucune) à 3 (très forte). Par exemple, proximité 3 pour un concurrent voisin immédiat.',
    aideEchelleRisque:
      "0 : risque absent ou négligeable. 1 : faible. 2 : sérieux mais maîtrisable. 3 : critique tant qu'aucune mesure ne le traite.",
  },

  hypothesesAConfirmer: [
    {
      reference: 'H1',
      question: 'Statut de « GO sous conditions critiques » : quatrième orientation ou variante ?',
      arbitrage:
        'Variante de GO sous conditions, signalée par un indicateur de conditions critiques.',
    },
    {
      reference: 'H2',
      question: 'Liste et poids des générateurs de demande.',
      arbitrage: 'Sept générateurs proposés, poids en configuration.',
    },
    {
      reference: 'H3',
      question: 'Liste et poids des catégories de risques.',
      arbitrage: 'Sept catégories proposées, dont les quatre citées par le brief.',
    },
    {
      reference: 'H4',
      question: 'Liste et importance des besoins de la grille de vides commerciaux.',
      arbitrage: 'Dix besoins proposés, importance par défaut de 1 à 3 modifiable.',
    },
    {
      reference: 'H5',
      question: 'Pourcentage cible de loyer par défaut.',
      arbitrage: "10 % du chiffre d'affaires mensuel, modifiable dans le parcours.",
    },
    {
      reference: 'H6',
      question: 'Traitement des agrégations partiellement renseignées.',
      arbitrage:
        "Renormalisation sur les composantes renseignées ; aucune composante rend l'indicateur manquant.",
    },
    {
      reference: 'H7',
      question: "Règle d'arrondi.",
      arbitrage:
        'Calcul en précision complète, deux décimales conservées, seuils appliqués à la valeur conservée.',
    },
  ],
};
