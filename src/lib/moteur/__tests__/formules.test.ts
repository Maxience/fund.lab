import { describe, expect, it } from 'vitest';

import { CONFIG_V1 } from '../config';
import {
  calculerAttractivite,
  calculerCaMensuel,
  calculerDemandeGlobale,
  calculerDemandeZone,
  calculerLoyerMaximal,
  calculerMenaceConcurrent,
  calculerPointsGap,
  calculerPressionConcurrentielle,
  calculerScoreGaps,
  calculerScoreGlobal,
  calculerScoreRisque,
} from '../formules';

const NOTE_MAX = CONFIG_V1.echelleNote.max;
const POIDS_MENACE = CONFIG_V1.menace.composantes;

describe('CA mensuel indicatif', () => {
  it('multiplie clients par jour, ticket moyen et jours d’ouverture', () => {
    expect(calculerCaMensuel(120, 2500, 26)).toBe(7_800_000);
    expect(calculerCaMensuel(200, 4000, 30)).toBe(24_000_000);
  });

  it('retourne null dès qu’une hypothèse manque ou est invalide', () => {
    expect(calculerCaMensuel(null, 2500, 26)).toBeNull();
    expect(calculerCaMensuel(120, null, 26)).toBeNull();
    expect(calculerCaMensuel(120, 2500, null)).toBeNull();
    expect(calculerCaMensuel(-1, 2500, 26)).toBeNull();
    expect(calculerCaMensuel(Number.NaN, 2500, 26)).toBeNull();
  });
});

describe('Loyer maximal indicatif', () => {
  it('applique la part cible au CA', () => {
    expect(calculerLoyerMaximal(7_800_000, 0.1)).toBe(780_000);
    expect(calculerLoyerMaximal(24_000_000, 0.1)).toBe(2_400_000);
  });

  it('retourne null sans CA ou avec une part invalide', () => {
    expect(calculerLoyerMaximal(null, 0.1)).toBeNull();
    expect(calculerLoyerMaximal(7_800_000, -0.1)).toBeNull();
  });
});

describe('Demande d’une zone', () => {
  const poids = CONFIG_V1.drivers.map((d) => d.poids);

  it('vaut 100 quand tout est noté 3 et 0 quand tout est noté 0', () => {
    expect(
      calculerDemandeZone(
        poids.map((p) => ({ poids: p, note: 3 })),
        NOTE_MAX,
      ),
    ).toBeCloseTo(100, 10);
    expect(
      calculerDemandeZone(
        poids.map((p) => ({ poids: p, note: 0 })),
        NOTE_MAX,
      ),
    ).toBe(0);
  });

  it('pondère les notes selon la formule Σ(poids × note) ÷ 3 × 100', () => {
    const notes = [3, 3, 2, 3, 2, 2, 3] as const;
    const elements = poids.map((p, i) => ({ poids: p, note: notes[i] }));
    expect(calculerDemandeZone(elements, NOTE_MAX)).toBeCloseTo(88.333333, 5);
  });

  it('renormalise sur les drivers renseignés', () => {
    expect(
      calculerDemandeZone(
        [
          { poids: 0.5, note: 3 },
          { poids: 0.5, note: null },
        ],
        NOTE_MAX,
      ),
    ).toBeCloseTo(100, 10);
  });

  it('retourne null sans aucun driver noté', () => {
    expect(
      calculerDemandeZone(
        poids.map((p) => ({ poids: p, note: null })),
        NOTE_MAX,
      ),
    ).toBeNull();
    expect(calculerDemandeZone([], NOTE_MAX)).toBeNull();
  });
});

describe('Demande globale', () => {
  it('pondère les zones par leur poids', () => {
    expect(
      calculerDemandeGlobale([
        { poids: 0.6, demande: 75 },
        { poids: 0.4, demande: 55 },
      ]),
    ).toBeCloseTo(67, 10);
  });

  it('renormalise quand une zone n’a pas d’indice', () => {
    expect(
      calculerDemandeGlobale([
        { poids: 0.6, demande: 75 },
        { poids: 0.4, demande: null },
      ]),
    ).toBeCloseTo(75, 10);
  });

  it('retourne null sans zone calculée', () => {
    expect(calculerDemandeGlobale([{ poids: 1, demande: null }])).toBeNull();
    expect(calculerDemandeGlobale([])).toBeNull();
  });
});

describe('Menace d’un concurrent', () => {
  it('pondère les cinq composantes puis applique le facteur de relation', () => {
    const notes = {
      proximite: 3,
      affluence: 3,
      qualite: 3,
      vitesse: 1,
      differenciation: 3,
    } as const;
    expect(calculerMenaceConcurrent(notes, POIDS_MENACE, 1)).toBeCloseTo(2.8, 10);
    expect(calculerMenaceConcurrent(notes, POIDS_MENACE, 0.7)).toBeCloseTo(1.96, 10);
  });

  it('renormalise sur les composantes renseignées', () => {
    const notes = {
      proximite: 3,
      affluence: null,
      qualite: null,
      vitesse: null,
      differenciation: null,
    } as const;
    expect(calculerMenaceConcurrent(notes, POIDS_MENACE, 0.7)).toBeCloseTo(2.1, 10);
  });

  it('retourne null sans composante notée', () => {
    const notes = {
      proximite: null,
      affluence: null,
      qualite: null,
      vitesse: null,
      differenciation: null,
    };
    expect(calculerMenaceConcurrent(notes, POIDS_MENACE, 1)).toBeNull();
  });
});

describe('Pression concurrentielle', () => {
  it('moyenne les menaces renseignées et ramène sur 100', () => {
    expect(calculerPressionConcurrentielle([2.1, 2.2, 1.96], NOTE_MAX)).toBeCloseTo(69.555556, 5);
    expect(calculerPressionConcurrentielle([1.65, 1.55, 1.96], NOTE_MAX)).toBeCloseTo(57.333333, 5);
  });

  it('ignore les concurrents sans menace calculée', () => {
    expect(calculerPressionConcurrentielle([null, 1.5], NOTE_MAX)).toBeCloseTo(50, 10);
  });

  it('retourne null sans menace renseignée', () => {
    expect(calculerPressionConcurrentielle([], NOTE_MAX)).toBeNull();
    expect(calculerPressionConcurrentielle([null, null], NOTE_MAX)).toBeNull();
  });
});

describe('Points de gap et score de gaps', () => {
  it('compte l’importance entière, la moitié ou rien selon le statut', () => {
    expect(calculerPointsGap('ABSENT', 2, 0.5)).toBe(2);
    expect(calculerPointsGap('MAL_SERVI', 3, 0.5)).toBe(1.5);
    expect(calculerPointsGap('CORRECT', 3, 0.5)).toBe(0);
  });

  it('rapporte les points à l’importance totale', () => {
    const gaps = [
      { statut: 'ABSENT', importance: 2 },
      { statut: 'ABSENT', importance: 3 },
      { statut: 'MAL_SERVI', importance: 2 },
      { statut: 'CORRECT', importance: 3 },
      { statut: 'ABSENT', importance: 1 },
      { statut: 'MAL_SERVI', importance: 2 },
      { statut: 'ABSENT', importance: 3 },
      { statut: 'ABSENT', importance: 2 },
      { statut: 'CORRECT', importance: 1 },
      { statut: 'MAL_SERVI', importance: 2 },
    ] as const;
    expect(calculerScoreGaps([...gaps], 0.5)).toBeCloseTo(66.666667, 5);
  });

  it('vaut 100 si tout est absent et 0 si tout est correct', () => {
    expect(calculerScoreGaps([{ statut: 'ABSENT', importance: 2 }], 0.5)).toBe(100);
    expect(calculerScoreGaps([{ statut: 'CORRECT', importance: 2 }], 0.5)).toBe(0);
  });

  it('exclut les besoins non qualifiés et retourne null sans besoin qualifié', () => {
    expect(
      calculerScoreGaps(
        [
          { statut: null, importance: 3 },
          { statut: 'ABSENT', importance: 1 },
        ],
        0.5,
      ),
    ).toBe(100);
    expect(calculerScoreGaps([{ statut: null, importance: 3 }], 0.5)).toBeNull();
    expect(calculerScoreGaps([], 0.5)).toBeNull();
  });
});

describe('Score de risque', () => {
  const poids = CONFIG_V1.risques.map((r) => r.poids);

  it('pondère les notes selon Σ(poids × note) ÷ 3 × 100', () => {
    const notes = [1, 1, 0, 0, 1, 1, 0] as const;
    expect(
      calculerScoreRisque(
        poids.map((p, i) => ({ poids: p, note: notes[i] })),
        NOTE_MAX,
      ),
    ).toBeCloseTo(20, 10);
    expect(
      calculerScoreRisque(
        poids.map((p) => ({ poids: p, note: 3 })),
        NOTE_MAX,
      ),
    ).toBeCloseTo(100, 10);
  });

  it('retourne null sans risque noté', () => {
    expect(
      calculerScoreRisque(
        poids.map((p) => ({ poids: p, note: null })),
        NOTE_MAX,
      ),
    ).toBeNull();
  });
});

describe('Attractivité et score global', () => {
  it('combine demande, gaps et concurrence inversée', () => {
    expect(calculerAttractivite(79, 66.666667, 57.333333, CONFIG_V1.attractivite)).toBeCloseTo(
      68.033333,
      5,
    );
  });

  it('combine attractivité et risque inversé', () => {
    expect(calculerScoreGlobal(68.033333, 20, CONFIG_V1.scoreGlobal)).toBeCloseTo(71.623333, 5);
  });

  it('retourne null dès qu’une composante manque', () => {
    expect(calculerAttractivite(null, 50, 50, CONFIG_V1.attractivite)).toBeNull();
    expect(calculerAttractivite(50, null, 50, CONFIG_V1.attractivite)).toBeNull();
    expect(calculerAttractivite(50, 50, null, CONFIG_V1.attractivite)).toBeNull();
    expect(calculerScoreGlobal(null, 20, CONFIG_V1.scoreGlobal)).toBeNull();
    expect(calculerScoreGlobal(60, null, CONFIG_V1.scoreGlobal)).toBeNull();
  });
});
