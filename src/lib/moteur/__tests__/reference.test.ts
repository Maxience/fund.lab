/**
 * Cas de référence (arbitrage H9) : les résultats attendus ci-dessous ont
 * été calculés à la main à partir des formules du brief. Tolérance de
 * recette : 0,1 point. À la réception des jeux officiels de FUND.lab, seules
 * les entrées (cas-reference.ts) et ces constantes changent.
 */
import { describe, expect, it } from 'vitest';

import { CAS_NOMINAL, CAS_RISQUES_CRITIQUES } from '../cas-reference';
import { evaluerEtude } from '../index';

const TOLERANCE_RECETTE = 0.1;

const ATTENDU_NOMINAL = {
  caMensuelFcfa: 7_800_000,
  loyerMaximalFcfa: 780_000,
  demandeParZone: { Z1: 88.33, Z2: 65 },
  demandeGlobale: 79,
  menaceParConcurrent: { C1: 1.65, C2: 1.55, C3: 1.96 },
  pressionConcurrentielle: 57.33,
  scoreGaps: 66.67,
  scoreRisque: 20,
  attractivite: 68.03,
  scoreGlobal: 71.62,
};

const ATTENDU_CRITIQUE = {
  caMensuelFcfa: 24_000_000,
  loyerMaximalFcfa: 2_400_000,
  demandeParZone: { Z1: 93.33, Z2: 75, Z3: 66.67 },
  demandeGlobale: 82.5,
  menaceParConcurrent: { C1: 0.88, C2: 1.1 },
  pressionConcurrentielle: 32.92,
  scoreGaps: 80.95,
  scoreRisque: 50,
  attractivite: 78.95,
  scoreGlobal: 70.27,
};

function verifierScores(
  obtenu: ReturnType<typeof evaluerEtude>,
  attendu: typeof ATTENDU_NOMINAL | typeof ATTENDU_CRITIQUE,
) {
  const { scores, projection } = obtenu;
  expect(projection.caMensuelFcfa).toBe(attendu.caMensuelFcfa);
  expect(projection.loyerMaximalFcfa).toBe(attendu.loyerMaximalFcfa);
  for (const [zone, valeur] of Object.entries(attendu.demandeParZone)) {
    expect(scores.demandeParZone[zone]).toBeCloseTo(valeur, 2);
  }
  for (const [id, valeur] of Object.entries(attendu.menaceParConcurrent)) {
    expect(scores.menaceParConcurrent[id]).toBeCloseTo(valeur, 2);
  }
  expect(scores.demandeGlobale).toBeCloseTo(attendu.demandeGlobale, 2);
  expect(scores.pressionConcurrentielle).toBeCloseTo(attendu.pressionConcurrentielle, 2);
  expect(scores.scoreGaps).toBeCloseTo(attendu.scoreGaps, 2);
  expect(scores.scoreRisque).toBeCloseTo(attendu.scoreRisque, 2);
  expect(scores.attractivite).toBeCloseTo(attendu.attractivite, 2);
  expect(scores.scoreGlobal).toBeCloseTo(attendu.scoreGlobal, 2);
  expect(Math.abs(scores.scoreGlobal! - attendu.scoreGlobal)).toBeLessThanOrEqual(
    TOLERANCE_RECETTE,
  );
}

describe('cas de référence 1 : nominal', () => {
  const resultat = evaluerEtude(CAS_NOMINAL);

  it('reproduit les indicateurs calculés à la main dans la tolérance', () => {
    verifierScores(resultat, ATTENDU_NOMINAL);
  });

  it('conclut GO sans signal critique et reste finalisable', () => {
    expect(resultat.decision.orientationCalculee).toBe('GO');
    expect(resultat.decision.orientationFinale).toBe('GO');
    expect(resultat.decision.conditionsCritiques).toBe(false);
    expect(resultat.decision.libelle).toBe('GO');
    expect(resultat.decision.redFlags).toEqual([]);
    expect(resultat.alertes).toEqual([]);
    expect(resultat.finalisable).toBe(true);
    expect(resultat.completude).toEqual({ renseignees: 46, manquantes: 0, nonApplicables: 0 });
  });

  it('décompose le score global en contributions qui le reconstituent', () => {
    expect(resultat.decomposition.map((c) => c.points)).toEqual([27.65, 14, 5.97, 24]);
    const total = resultat.decomposition.reduce((acc, c) => acc + c.points, 0);
    expect(total).toBeCloseTo(resultat.scores.scoreGlobal!, 10);
  });
});

describe('cas de référence 2 : risques critiques (recette R05)', () => {
  const resultat = evaluerEtude(CAS_RISQUES_CRITIQUES);

  it('reproduit les indicateurs calculés à la main dans la tolérance', () => {
    verifierScores(resultat, ATTENDU_CRITIQUE);
  });

  it('calcule GO par les seuils mais plafonne l’orientation à GO sous conditions critiques', () => {
    expect(resultat.decision.orientationCalculee).toBe('GO');
    expect(resultat.decision.orientationFinale).toBe('GO_SOUS_CONDITIONS');
    expect(resultat.decision.conditionsCritiques).toBe(true);
    expect(resultat.decision.libelle).toBe('GO sous conditions critiques');
    expect(resultat.decision.redFlags.map((f) => f.code)).toEqual([
      'RISQUE_CRITIQUE',
      'RISQUES_MULTIPLES',
    ]);
    expect(resultat.decision.redFlags[0].risques).toEqual(['SITE']);
    expect(resultat.decision.redFlags[1].risques).toEqual([
      'SITE',
      'APPROVISIONNEMENT',
      'RESSOURCES_HUMAINES',
    ]);
  });

  it('signale le loyer excessif sans bloquer la finalisation', () => {
    expect(resultat.projection.ecartLoyerFcfa).toBe(600_000);
    expect(resultat.alertes.map((a) => a.code)).toEqual(['LOYER_SUPERIEUR_AU_SOUTENABLE']);
    expect(resultat.finalisable).toBe(true);
  });

  it('décompose le score global en contributions qui le reconstituent', () => {
    expect(resultat.decomposition.map((c) => c.points)).toEqual([28.88, 17, 9.39, 15]);
    const total = resultat.decomposition.reduce((acc, c) => acc + c.points, 0);
    expect(total).toBeCloseTo(resultat.scores.scoreGlobal!, 10);
  });
});
