/**
 * Contrat de la configuration méthodologique versionnée.
 *
 * Tout coefficient, seuil ou libellé méthodologique vit ici, jamais dans le
 * code des formules ni dans les interfaces. Une nouvelle version de la
 * méthode est un nouveau fichier de configuration, pas une modification du
 * moteur.
 */

import type {
  ComposanteMenace,
  ModeDeplacement,
  Orientation,
  RelationConcurrentielle,
  StatutMarche,
} from '../types';

export interface DriverDemande {
  code: string;
  libelle: string;
  /** Poids en fraction ; la somme des drivers fait 1. */
  poids: number;
  aide: string;
}

export interface CategorieRisque {
  code: string;
  libelle: string;
  /** Poids en fraction ; la somme des catégories fait 1. */
  poids: number;
  aide: string;
}

export interface BesoinMarche {
  code: string;
  libelle: string;
  importanceParDefaut: 1 | 2 | 3;
  aide: string;
}

export interface SeuilsRecommandations {
  demandeForte: number;
  demandeFaible: number;
  pressionFaible: number;
  pressionForte: number;
  gapsEleves: number;
  gapsFaibles: number;
  risqueFaible: number;
  risqueEleve: number;
  /** Menace individuelle, sur l'échelle des notes, à partir de laquelle un concurrent pèse. */
  menaceForte: number;
  /** Écart relatif du ticket du projet à la moyenne des concurrents jugé notable. */
  ecartTicketRelatif: number;
  nombreForces: number;
  nombreVigilances: number;
  nombreActions: number;
}

export interface HypotheseAConfirmer {
  reference: string;
  question: string;
  arbitrage: string;
}

export interface ConfigurationMethodologie {
  /** Version de la méthodologie, indépendante de la version du moteur. */
  version: string;
  dateEffet: string;
  echelleNote: { min: number; max: number };
  drivers: DriverDemande[];
  risques: CategorieRisque[];
  besoins: BesoinMarche[];
  menace: {
    composantes: Record<ComposanteMenace, number>;
    facteurRelation: Record<RelationConcurrentielle, number>;
  };
  gaps: {
    /** Part de l'importance comptée pour un besoin mal servi. */
    partMalServi: number;
  };
  attractivite: { demande: number; gaps: number; concurrence: number };
  scoreGlobal: { attractivite: number; risque: number };
  seuils: {
    /** En dessous de cette valeur, NO GO. */
    noGoStrict: number;
    /** À partir de cette valeur incluse, GO. */
    goInclus: number;
  };
  redFlags: {
    /** Note de risque qui interdit le GO à elle seule. */
    noteCritique: number;
    /** Note de risque comptée dans le cumul de vigilance. */
    noteVigilance: number;
    /** Nombre de risques à la note de vigilance ou plus qui interdit le GO. */
    nombreRisquesVigilance: number;
  };
  loyer: {
    partCibleParDefaut: number;
    partCibleMax: number;
  };
  limites: {
    zonesMax: number;
    concurrentsMax: number;
    joursOuvertureMax: number;
    /** Rotations par couvert et par jour au-delà desquelles la fréquentation est jugée incohérente. */
    rotationsMaxParCouvert: number;
  };
  /** Tolérance sur la somme des poids, en fraction (0,0001 pour 0,01 point de pourcentage). */
  tolerancePoids: number;
  arrondi: {
    decimalesConservees: number;
    decimalesAffichees: number;
  };
  recommandations: SeuilsRecommandations;
  libelles: {
    orientations: Record<Orientation, string>;
    orientationCritique: string;
    orientationNonCalculable: string;
    statutsMarche: Record<StatutMarche, string>;
    relations: Record<RelationConcurrentielle, string>;
    modesDeplacement: Record<ModeDeplacement, string>;
    composantesMenace: Record<ComposanteMenace, string>;
    aideEchelleDemande: string;
    aideEchelleMenace: string;
    aideEchelleRisque: string;
  };
  hypothesesAConfirmer: HypotheseAConfirmer[];
}

/**
 * Paramètres numériques ayant servi à un calcul, conservés avec chaque
 * résultat. Les libellés et aides en sont exclus : ils n'influencent pas le
 * résultat.
 */
export interface InstantaneParametres {
  versionMethodologie: string;
  drivers: { code: string; poids: number }[];
  risques: { code: string; poids: number }[];
  besoins: { code: string; importanceParDefaut: number }[];
  menace: ConfigurationMethodologie['menace'];
  gaps: ConfigurationMethodologie['gaps'];
  attractivite: ConfigurationMethodologie['attractivite'];
  scoreGlobal: ConfigurationMethodologie['scoreGlobal'];
  seuils: ConfigurationMethodologie['seuils'];
  redFlags: ConfigurationMethodologie['redFlags'];
  loyer: ConfigurationMethodologie['loyer'];
  tolerancePoids: number;
  arrondi: ConfigurationMethodologie['arrondi'];
}
