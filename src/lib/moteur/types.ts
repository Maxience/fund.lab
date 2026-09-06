/**
 * Types métier du moteur de calcul. Le vocabulaire est celui du brief
 * FUND.lab. Ce module est pur : aucune dépendance à Next, React ou Prisma.
 */

import type { InstantaneParametres } from './config/types';

/** Note d'observation sur l'échelle du brief, de 0 à 3. */
export type Note = 0 | 1 | 2 | 3;

/** Statut d'une donnée, conforme au brief. */
export type StatutDonnee = 'RENSEIGNEE' | 'MANQUANTE' | 'NON_APPLICABLE';

/**
 * Notation saisie. `note` vaut null tant que la donnée n'est pas renseignée.
 * `nonApplicable` exclut le critère du calcul sans le signaler comme manquant.
 */
export interface Notation {
  note: Note | null;
  nonApplicable?: boolean;
  commentaire?: string;
}

export type ModeDeplacement = 'A_PIED' | 'DEUX_ROUES' | 'VOITURE' | 'TRANSPORT_COMMUN';

export type RelationConcurrentielle = 'DIRECTE' | 'INDIRECTE';

export type StatutMarche = 'ABSENT' | 'MAL_SERVI' | 'CORRECT';

export type Orientation = 'GO' | 'GO_SOUS_CONDITIONS' | 'NO_GO';

/** Rubriques du parcours, utilisées pour rattacher alertes et recommandations. */
export type Rubrique =
  'PROJET' | 'HYPOTHESES' | 'ZONES' | 'DEMANDE' | 'CONCURRENCE' | 'GAPS' | 'RISQUES' | 'SYNTHESE';

export type ComposanteMenace =
  'proximite' | 'affluence' | 'qualite' | 'vitesse' | 'differenciation';

/* ------------------------------------------------------------------------ */
/* Entrées                                                                  */
/* ------------------------------------------------------------------------ */

export interface ProjetSaisi {
  nom: string;
  localite: string;
  concept: string;
  horaires?: string;
  /** Places assises ou couverts servis simultanément. */
  capaciteCouverts?: number | null;
  modesService?: string[];
}

export interface HypothesesSaisies {
  clientsParJour: number | null;
  ticketMoyenFcfa: number | null;
  joursOuvertureParMois: number | null;
  /**
   * Part du chiffre d'affaires consacrée au loyer, en fraction (0,10 pour
   * 10 %). Null : la valeur par défaut de la configuration s'applique.
   */
  partLoyerCible: number | null;
  loyerMensuelEnvisageFcfa?: number | null;
  clienteleCible?: string;
}

export interface ZoneSaisie {
  id: string;
  libelle: string;
  rayonKm: number | null;
  tempsAccesMin: number | null;
  mode: ModeDeplacement | null;
  /** Poids relatif en fraction. La somme des poids des zones doit faire 1. */
  poids: number | null;
}

export interface EvaluationDemandeSaisie {
  zoneId: string;
  driverCode: string;
  notation: Notation;
}

export interface ConcurrentSaisi {
  id: string;
  nom: string;
  /** Catégorie commerciale libre : crêperie, fast-food, maquis... */
  typeOffre: string;
  /** Relation avec le projet, seule à piloter le facteur de pondération. */
  relation: RelationConcurrentielle | null;
  ticketMoyenFcfa?: number | null;
  proximite: Notation;
  affluence: Notation;
  qualite: Notation;
  vitesse: Notation;
  differenciation: Notation;
  observation?: string;
}

export interface GapSaisi {
  besoinCode: string;
  statutMarche: StatutMarche | null;
  /** Importance de 1 à 3. Null : importance par défaut de la configuration. */
  importance: number | null;
  nonApplicable?: boolean;
}

export interface RisqueSaisi {
  risqueCode: string;
  notation: Notation;
  mesure?: string;
  responsable?: string;
}

/** Une étude telle que saisie, quel que soit le parcours. */
export interface EtudeSaisie {
  projet: ProjetSaisi;
  hypotheses: HypothesesSaisies;
  zones: ZoneSaisie[];
  demande: EvaluationDemandeSaisie[];
  concurrents: ConcurrentSaisi[];
  gaps: GapSaisi[];
  risques: RisqueSaisi[];
}

/* ------------------------------------------------------------------------ */
/* Résultats                                                                */
/* ------------------------------------------------------------------------ */

export type NiveauAlerte = 'BLOQUANTE' | 'AVERTISSEMENT' | 'INFORMATION';

export interface Alerte {
  code: string;
  niveau: NiveauAlerte;
  rubrique: Rubrique;
  message: string;
  /** Élément concerné : identifiant de zone, de concurrent, code de driver... */
  cible?: string;
}

export interface Projection {
  caMensuelFcfa: number | null;
  /** Part de loyer effectivement appliquée, en fraction. */
  partLoyerCible: number;
  loyerMaximalFcfa: number | null;
  loyerMensuelEnvisageFcfa: number | null;
  /** Loyer envisagé moins loyer maximal ; positif quand le loyer envisagé dépasse. */
  ecartLoyerFcfa: number | null;
}

export interface Scores {
  demandeParZone: Record<string, number | null>;
  demandeGlobale: number | null;
  menaceParConcurrent: Record<string, number | null>;
  pressionConcurrentielle: number | null;
  scoreGaps: number | null;
  scoreRisque: number | null;
  attractivite: number | null;
  scoreGlobal: number | null;
}

export type CodeRedFlag = 'RISQUE_CRITIQUE' | 'RISQUES_MULTIPLES';

export interface RedFlag {
  code: CodeRedFlag;
  libelle: string;
  /** Codes des risques à l'origine du signal. */
  risques: string[];
  effet: string;
}

export interface Decision {
  /** Orientation issue des seuls seuils, null si le score global est incalculable. */
  orientationCalculee: Orientation | null;
  /** Orientation après application des red flags. */
  orientationFinale: Orientation | null;
  /** Vrai quand un risque critique impose des conditions critiques. */
  conditionsCritiques: boolean;
  libelle: string;
  redFlags: RedFlag[];
  justification: string[];
}

export interface Recommandation {
  code: string;
  rubrique: Rubrique;
  texte: string;
}

export interface Recommandations {
  forces: Recommandation[];
  vigilances: Recommandation[];
  actions: Recommandation[];
}

export type CodeContribution = 'DEMANDE' | 'GAPS' | 'CONCURRENCE' | 'RISQUE';

/** Part du score global apportée par une composante. */
export interface Contribution {
  code: CodeContribution;
  libelle: string;
  points: number;
  potentielMax: number;
}

export interface Completude {
  renseignees: number;
  manquantes: number;
  nonApplicables: number;
}

export interface ResultatEtude {
  versionMoteur: string;
  versionMethodologie: string;
  /** Horodatage ISO 8601 du calcul. */
  calculeLe: string;
  projection: Projection;
  scores: Scores;
  decision: Decision;
  alertes: Alerte[];
  recommandations: Recommandations;
  decomposition: Contribution[];
  completude: Completude;
  /** Vrai quand aucune alerte bloquante ne subsiste et que le score global est calculé. */
  finalisable: boolean;
  parametres: InstantaneParametres;
}
