import { describe, expect, it } from 'vitest';

import { CONFIG_V1 } from '../config';
import { decomposerScoreGlobal } from '../decomposition';
import { calculerAttractivite, calculerScoreGlobal } from '../formules';
import { arrondir } from '../primitives';
import type { Scores } from '../types';

function scoresDepuis(demande: number, gaps: number, pression: number, risque: number): Scores {
  const attractivite = calculerAttractivite(demande, gaps, pression, CONFIG_V1.attractivite);
  return {
    demandeParZone: {},
    demandeGlobale: demande,
    menaceParConcurrent: {},
    pressionConcurrentielle: pression,
    scoreGaps: gaps,
    scoreRisque: risque,
    attractivite,
    scoreGlobal: calculerScoreGlobal(attractivite, risque, CONFIG_V1.scoreGlobal),
  };
}

describe('decomposerScoreGlobal', () => {
  it('dérive les potentiels maximaux des poids de la configuration', () => {
    const contributions = decomposerScoreGlobal(
      scoresDepuis(79, 66.666667, 57.333333, 20),
      CONFIG_V1,
    );
    expect(contributions.map((c) => c.code)).toEqual(['DEMANDE', 'GAPS', 'CONCURRENCE', 'RISQUE']);
    expect(contributions.map((c) => c.potentielMax)).toEqual([35, 21, 14, 30]);
  });

  it('reconstitue exactement le score global arrondi sur le cas nominal', () => {
    const scores = scoresDepuis(79, 66.666667, 57.333333, 20);
    const contributions = decomposerScoreGlobal(scores, CONFIG_V1);
    expect(contributions.map((c) => c.points)).toEqual([27.65, 14, 5.97, 24]);
    const total = contributions.reduce((acc, c) => acc + c.points, 0);
    expect(arrondir(total, 2)).toBe(arrondir(scores.scoreGlobal!, 2));
  });

  it('reconstitue exactement le score global arrondi quel que soit le résidu d’arrondi', () => {
    const jeux: [number, number, number, number][] = [
      [82.5, 80.952381, 32.916667, 50],
      [33.333333, 33.333333, 33.333333, 33.333333],
      [10.005, 20.015, 30.025, 40.035],
      [99.999, 0.001, 99.999, 0.001],
      [45.455, 54.545, 63.635, 72.725],
    ];
    for (const [d, g, p, r] of jeux) {
      const scores = scoresDepuis(d, g, p, r);
      const contributions = decomposerScoreGlobal(scores, CONFIG_V1);
      const total = contributions.reduce((acc, c) => acc + c.points, 0);
      expect(arrondir(total, 2)).toBe(arrondir(scores.scoreGlobal!, 2));
      for (const c of contributions) expect(c.points).toBeLessThanOrEqual(c.potentielMax + 0.01);
    }
  });

  it('retourne une liste vide sans score global', () => {
    const scores = scoresDepuis(79, 66.666667, 57.333333, 20);
    expect(
      decomposerScoreGlobal({ ...scores, scoreGaps: null, scoreGlobal: null }, CONFIG_V1),
    ).toEqual([]);
  });
});
