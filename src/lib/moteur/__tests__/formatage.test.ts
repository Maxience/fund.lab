import { describe, expect, it } from 'vitest';

import { formaterDecimal, formaterEntier, formaterFcfa, formaterPourcentage } from '../formatage';

describe('formatage des nombres', () => {
  it('sépare les milliers par une espace', () => {
    expect(formaterEntier(7_800_000)).toBe('7 800 000');
    expect(formaterEntier(999)).toBe('999');
    expect(formaterEntier(1000)).toBe('1 000');
    expect(formaterEntier(780_000.4)).toBe('780 000');
    expect(formaterEntier(-180_000)).toBe('-180 000');
  });

  it('ajoute l’unité FCFA sans décimale', () => {
    expect(formaterFcfa(2_400_000)).toBe('2 400 000 FCFA');
    expect(formaterFcfa(0)).toBe('0 FCFA');
  });

  it('écrit les décimales avec une virgule', () => {
    expect(formaterDecimal(71.623, 1)).toBe('71,6');
    expect(formaterDecimal(71.623, 2)).toBe('71,62');
    expect(formaterDecimal(55, 1)).toBe('55,0');
  });

  it('convertit une fraction en pourcentage', () => {
    expect(formaterPourcentage(0.1)).toBe('10 %');
    expect(formaterPourcentage(0.125, 1)).toBe('12,5 %');
  });
});
