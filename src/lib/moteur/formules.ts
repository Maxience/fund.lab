/**
 * Formules de référence de la méthodologie, une fonction par ligne du
 * tableau du brief. Chaque fonction est pure, prend ses coefficients en
 * paramètre et retourne null quand le calcul est impossible faute de
 * données. Une donnée manquante ne vaut jamais zéro.
 */

import { estPositifOuNul, moyenne, moyennePondereeRenormalisee } from './primitives';
import type { ComposanteMenace, Note, StatutMarche } from './types';

/** CA mensuel indicatif = clients par jour × ticket moyen × jours d'ouverture par mois. */
export function calculerCaMensuel(
  clientsParJour: number | null,
  ticketMoyenFcfa: number | null,
  joursOuvertureParMois: number | null,
): number | null {
  if (
    !estPositifOuNul(clientsParJour) ||
    !estPositifOuNul(ticketMoyenFcfa) ||
    !estPositifOuNul(joursOuvertureParMois)
  ) {
    return null;
  }
  return clientsParJour * ticketMoyenFcfa * joursOuvertureParMois;
}

/** Loyer maximal indicatif = CA mensuel indicatif × pourcentage cible de loyer. */
export function calculerLoyerMaximal(
  caMensuelFcfa: number | null,
  partLoyerCible: number,
): number | null {
  if (caMensuelFcfa === null || !estPositifOuNul(partLoyerCible)) return null;
  return caMensuelFcfa * partLoyerCible;
}

export interface NotePonderee {
  poids: number;
  note: Note | null;
}

/**
 * Demande d'une zone = Σ(poids du driver × note) ÷ note maximale × 100.
 * Les drivers non renseignés sont exclus et les poids renormalisés sur les
 * drivers renseignés. Null si aucun driver n'est noté.
 */
export function calculerDemandeZone(notes: NotePonderee[], noteMax: number): number | null {
  const moyennePonderee = moyennePondereeRenormalisee(
    notes.map(({ poids, note }) => ({ poids, valeur: note })),
  );
  return moyennePonderee === null ? null : (moyennePonderee / noteMax) * 100;
}

export interface DemandeZonePonderee {
  poids: number;
  demande: number | null;
}

/**
 * Demande globale = Σ(poids de la zone × indice de demande de la zone).
 * Quand les poids font 1 et que toutes les zones sont calculées, c'est la
 * formule du brief ; sinon le résultat est renormalisé sur les zones
 * calculées. Null si aucune zone n'a d'indice.
 */
export function calculerDemandeGlobale(zones: DemandeZonePonderee[]): number | null {
  return moyennePondereeRenormalisee(
    zones.map(({ poids, demande }) => ({ poids, valeur: demande })),
  );
}

export type NotesMenace = Record<ComposanteMenace, Note | null>;

/**
 * Menace d'un concurrent = [20 % proximité + 35 % affluence + 25 % qualité
 * + 10 % vitesse + 10 % différenciation] × facteur de relation. Résultat sur
 * l'échelle des notes. Composantes non renseignées exclues avec
 * renormalisation. Null si aucune composante n'est notée.
 */
export function calculerMenaceConcurrent(
  notes: NotesMenace,
  poidsComposantes: Record<ComposanteMenace, number>,
  facteurRelation: number,
): number | null {
  const composantes = Object.keys(poidsComposantes) as ComposanteMenace[];
  const moyennePonderee = moyennePondereeRenormalisee(
    composantes.map((c) => ({ poids: poidsComposantes[c], valeur: notes[c] })),
  );
  return moyennePonderee === null ? null : moyennePonderee * facteurRelation;
}

/**
 * Pression concurrentielle = moyenne des menaces renseignées ÷ note
 * maximale × 100. Null si aucune menace n'est renseignée.
 */
export function calculerPressionConcurrentielle(
  menaces: (number | null)[],
  noteMax: number,
): number | null {
  const renseignees = menaces.filter((m): m is number => m !== null);
  const moyenneMenaces = moyenne(renseignees);
  return moyenneMenaces === null ? null : (moyenneMenaces / noteMax) * 100;
}

/** Points de gap : absent = importance ; mal servi = part de l'importance ; correct = 0. */
export function calculerPointsGap(
  statut: StatutMarche,
  importance: number,
  partMalServi: number,
): number {
  switch (statut) {
    case 'ABSENT':
      return importance;
    case 'MAL_SERVI':
      return importance * partMalServi;
    case 'CORRECT':
      return 0;
  }
}

export interface GapEvalue {
  statut: StatutMarche | null;
  importance: number;
}

/**
 * Score de gaps = Σ points de gap ÷ Σ importance × 100, sur les besoins dont
 * le statut est renseigné. Null si aucun besoin n'est qualifié.
 */
export function calculerScoreGaps(gaps: GapEvalue[], partMalServi: number): number | null {
  let points = 0;
  let importanceTotale = 0;
  for (const { statut, importance } of gaps) {
    if (statut === null) continue;
    points += calculerPointsGap(statut, importance, partMalServi);
    importanceTotale += importance;
  }
  if (importanceTotale === 0) return null;
  return (points / importanceTotale) * 100;
}

/**
 * Score de risque = Σ(poids du risque × note) ÷ note maximale × 100, avec
 * renormalisation sur les risques notés. Null si aucun risque n'est noté.
 */
export function calculerScoreRisque(risques: NotePonderee[], noteMax: number): number | null {
  const moyennePonderee = moyennePondereeRenormalisee(
    risques.map(({ poids, note }) => ({ poids, valeur: note })),
  );
  return moyennePonderee === null ? null : (moyennePonderee / noteMax) * 100;
}

export interface PoidsAttractivite {
  demande: number;
  gaps: number;
  concurrence: number;
}

/** Attractivité = 50 % demande globale + 30 % gaps + 20 % × (100 - concurrence). */
export function calculerAttractivite(
  demandeGlobale: number | null,
  scoreGaps: number | null,
  pressionConcurrentielle: number | null,
  poids: PoidsAttractivite,
): number | null {
  if (demandeGlobale === null || scoreGaps === null || pressionConcurrentielle === null) {
    return null;
  }
  return (
    poids.demande * demandeGlobale +
    poids.gaps * scoreGaps +
    poids.concurrence * (100 - pressionConcurrentielle)
  );
}

export interface PoidsScoreGlobal {
  attractivite: number;
  risque: number;
}

/** Score global = 70 % attractivité + 30 % × (100 - risque). */
export function calculerScoreGlobal(
  attractivite: number | null,
  scoreRisque: number | null,
  poids: PoidsScoreGlobal,
): number | null {
  if (attractivite === null || scoreRisque === null) return null;
  return poids.attractivite * attractivite + poids.risque * (100 - scoreRisque);
}
