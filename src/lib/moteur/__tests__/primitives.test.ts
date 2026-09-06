import { describe, expect, it } from 'vitest';

import {
  arrondir,
  borner,
  ecartSomme,
  estNoteValide,
  estPositif,
  estPositifOuNul,
  moyenne,
  moyennePondereeRenormalisee,
  somme,
  sommeConforme,
} from '../primitives';

describe('arrondir', () => {
  it('arrondit au plus proche avec un nombre fixe de décimales', () => {
    expect(arrondir(71.623333, 2)).toBe(71.62);
    expect(arrondir(71.625, 2)).toBe(71.63);
    expect(arrondir(88.333333, 1)).toBe(88.3);
    expect(arrondir(780000.4, 0)).toBe(780000);
  });

  it('résiste aux représentations binaires ambiguës', () => {
    expect(arrondir(1.005, 2)).toBe(1.01);
    expect(arrondir(54.995, 2)).toBe(55);
    expect(arrondir(2.675, 2)).toBe(2.68);
  });

  it('traite les négatifs symétriquement', () => {
    expect(arrondir(-1.005, 2)).toBe(-1.01);
    expect(arrondir(-180000, 0)).toBe(-180000);
  });
});

describe('sommes et tolérances', () => {
  it('additionne et mesure un écart signé', () => {
    expect(somme([])).toBe(0);
    expect(somme([0.6, 0.4])).toBeCloseTo(1, 10);
    expect(ecartSomme([0.6, 0.5], 1)).toBeCloseTo(0.1, 10);
    expect(ecartSomme([0.6, 0.3], 1)).toBeCloseTo(-0.1, 10);
  });

  it('accepte une somme dans la tolérance et refuse au-delà', () => {
    expect(sommeConforme([0.6, 0.4], 1, 0.0001)).toBe(true);
    expect(sommeConforme([0.6, 0.39995], 1, 0.0001)).toBe(true);
    expect(sommeConforme([0.6, 0.3998], 1, 0.0001)).toBe(false);
    expect(sommeConforme([0.6, 0.5], 1, 0.0001)).toBe(false);
  });
});

describe('moyennes', () => {
  it('retourne null pour une liste vide', () => {
    expect(moyenne([])).toBeNull();
    expect(moyenne([2, 4])).toBe(3);
  });

  it('renormalise sur les éléments renseignés sans jamais compter un null pour zéro', () => {
    expect(
      moyennePondereeRenormalisee([
        { poids: 0.5, valeur: 3 },
        { poids: 0.5, valeur: null },
      ]),
    ).toBe(3);
    expect(
      moyennePondereeRenormalisee([
        { poids: 0.2, valeur: 3 },
        { poids: 0.8, valeur: 0 },
      ]),
    ).toBeCloseTo(0.6, 10);
  });

  it('retourne null sans élément renseigné ou sans poids', () => {
    expect(moyennePondereeRenormalisee([])).toBeNull();
    expect(moyennePondereeRenormalisee([{ poids: 1, valeur: null }])).toBeNull();
    expect(moyennePondereeRenormalisee([{ poids: 0, valeur: 2 }])).toBeNull();
  });
});

describe('prédicats', () => {
  const echelle = { min: 0, max: 3 };

  it('reconnaît une note entière de l’échelle', () => {
    expect(estNoteValide(0, echelle)).toBe(true);
    expect(estNoteValide(3, echelle)).toBe(true);
    expect(estNoteValide(4, echelle)).toBe(false);
    expect(estNoteValide(-1, echelle)).toBe(false);
    expect(estNoteValide(2.5, echelle)).toBe(false);
    expect(estNoteValide('2', echelle)).toBe(false);
    expect(estNoteValide(null, echelle)).toBe(false);
  });

  it('distingue positif strict et positif ou nul', () => {
    expect(estPositif(1)).toBe(true);
    expect(estPositif(0)).toBe(false);
    expect(estPositif(Number.NaN)).toBe(false);
    expect(estPositif(Number.POSITIVE_INFINITY)).toBe(false);
    expect(estPositifOuNul(0)).toBe(true);
    expect(estPositifOuNul(-0.1)).toBe(false);
    expect(estPositifOuNul(null)).toBe(false);
  });

  it('borne une valeur', () => {
    expect(borner(150, 0, 100)).toBe(100);
    expect(borner(-5, 0, 100)).toBe(0);
    expect(borner(42, 0, 100)).toBe(42);
  });
});
