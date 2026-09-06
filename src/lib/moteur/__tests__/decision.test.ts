import { describe, expect, it } from 'vitest';

import { CONFIG_V1 } from '../config';
import {
  appliquerRedFlags,
  deciderOrientation,
  detecterRedFlags,
  evaluerDecision,
  libellerOrientation,
  type RisqueNote,
} from '../decision';
import type { Note } from '../types';

const risque = (code: string, note: Note | null): RisqueNote => ({ code, libelle: code, note });

describe('deciderOrientation : seuils du brief', () => {
  it('classe NO GO sous 55, GO sous conditions de 55 inclus à 70 exclu, GO à partir de 70', () => {
    expect(deciderOrientation(0, CONFIG_V1.seuils)).toBe('NO_GO');
    expect(deciderOrientation(54.99, CONFIG_V1.seuils)).toBe('NO_GO');
    expect(deciderOrientation(55, CONFIG_V1.seuils)).toBe('GO_SOUS_CONDITIONS');
    expect(deciderOrientation(62.5, CONFIG_V1.seuils)).toBe('GO_SOUS_CONDITIONS');
    expect(deciderOrientation(69.99, CONFIG_V1.seuils)).toBe('GO_SOUS_CONDITIONS');
    expect(deciderOrientation(70, CONFIG_V1.seuils)).toBe('GO');
    expect(deciderOrientation(100, CONFIG_V1.seuils)).toBe('GO');
  });
});

describe('detecterRedFlags', () => {
  it('signale un risque noté 3', () => {
    const flags = detecterRedFlags([risque('SITE', 3), risque('RH', 0)], CONFIG_V1);
    expect(flags.map((f) => f.code)).toEqual(['RISQUE_CRITIQUE']);
    expect(flags[0].risques).toEqual(['SITE']);
  });

  it('signale trois risques notés 2 ou 3', () => {
    const flags = detecterRedFlags(
      [risque('A', 2), risque('B', 2), risque('C', 2), risque('D', 1)],
      CONFIG_V1,
    );
    expect(flags.map((f) => f.code)).toEqual(['RISQUES_MULTIPLES']);
    expect(flags[0].risques).toEqual(['A', 'B', 'C']);
  });

  it('ne signale rien avec deux risques notés 2', () => {
    expect(detecterRedFlags([risque('A', 2), risque('B', 2), risque('C', 1)], CONFIG_V1)).toEqual(
      [],
    );
  });

  it('cumule les deux signaux et ignore les risques non notés', () => {
    const flags = detecterRedFlags(
      [risque('A', 3), risque('B', 2), risque('C', 2), risque('D', null)],
      CONFIG_V1,
    );
    expect(flags.map((f) => f.code)).toEqual(['RISQUE_CRITIQUE', 'RISQUES_MULTIPLES']);
  });
});

describe('appliquerRedFlags', () => {
  const critique = detecterRedFlags([risque('SITE', 3)], CONFIG_V1);
  const multiples = detecterRedFlags([risque('A', 2), risque('B', 2), risque('C', 2)], CONFIG_V1);

  it('ramène GO à GO sous conditions critiques avec un risque noté 3', () => {
    expect(appliquerRedFlags('GO', critique)).toEqual({
      orientationFinale: 'GO_SOUS_CONDITIONS',
      conditionsCritiques: true,
    });
  });

  it('maintient GO sous conditions en le marquant critique', () => {
    expect(appliquerRedFlags('GO_SOUS_CONDITIONS', critique)).toEqual({
      orientationFinale: 'GO_SOUS_CONDITIONS',
      conditionsCritiques: true,
    });
  });

  it('laisse NO GO en NO GO, sans conditions critiques', () => {
    expect(appliquerRedFlags('NO_GO', critique)).toEqual({
      orientationFinale: 'NO_GO',
      conditionsCritiques: false,
    });
  });

  it('ramène GO à GO sous conditions, non critiques, avec trois risques sérieux', () => {
    expect(appliquerRedFlags('GO', multiples)).toEqual({
      orientationFinale: 'GO_SOUS_CONDITIONS',
      conditionsCritiques: false,
    });
  });

  it('ne change rien sans red flag', () => {
    expect(appliquerRedFlags('GO', [])).toEqual({
      orientationFinale: 'GO',
      conditionsCritiques: false,
    });
  });
});

describe('libellerOrientation', () => {
  it('produit les libellés du brief et la variante critique', () => {
    expect(libellerOrientation('GO', false, CONFIG_V1)).toBe('GO');
    expect(libellerOrientation('GO_SOUS_CONDITIONS', false, CONFIG_V1)).toBe('GO sous conditions');
    expect(libellerOrientation('GO_SOUS_CONDITIONS', true, CONFIG_V1)).toBe(
      'GO sous conditions critiques',
    );
    expect(libellerOrientation('NO_GO', false, CONFIG_V1)).toBe('NO GO');
    expect(libellerOrientation(null, false, CONFIG_V1)).toBe('Non calculable');
  });
});

describe('evaluerDecision', () => {
  it('expose séparément orientation calculée et orientation finale', () => {
    const decision = evaluerDecision(75, [risque('SITE', 3)], CONFIG_V1);
    expect(decision.orientationCalculee).toBe('GO');
    expect(decision.orientationFinale).toBe('GO_SOUS_CONDITIONS');
    expect(decision.conditionsCritiques).toBe(true);
    expect(decision.libelle).toBe('GO sous conditions critiques');
    expect(decision.justification.join(' ')).toContain(
      'ramenée de GO à GO sous conditions critiques',
    );
  });

  it('décrit une décision sans signal critique', () => {
    const decision = evaluerDecision(62.5, [risque('SITE', 1)], CONFIG_V1);
    expect(decision.orientationCalculee).toBe('GO_SOUS_CONDITIONS');
    expect(decision.orientationFinale).toBe('GO_SOUS_CONDITIONS');
    expect(decision.conditionsCritiques).toBe(false);
    expect(decision.justification[0]).toContain('62,5');
    expect(decision.justification.at(-1)).toContain('Aucun signal critique');
  });

  it('donne NO GO sous le seuil même avec un risque critique', () => {
    const decision = evaluerDecision(50, [risque('SITE', 3)], CONFIG_V1);
    expect(decision.orientationFinale).toBe('NO_GO');
    expect(decision.conditionsCritiques).toBe(false);
    expect(decision.libelle).toBe('NO GO');
    expect(decision.redFlags).toHaveLength(1);
  });

  it('maintient GO sous conditions tout en le marquant critique quand le score est entre les seuils', () => {
    const decision = evaluerDecision(60, [risque('SITE', 3)], CONFIG_V1);
    expect(decision.orientationCalculee).toBe('GO_SOUS_CONDITIONS');
    expect(decision.orientationFinale).toBe('GO_SOUS_CONDITIONS');
    expect(decision.conditionsCritiques).toBe(true);
    expect(decision.justification.at(-1)).toContain('doit être traité avant toute décision');
  });

  it('nomme plusieurs risques critiques et signale une orientation inchangée par les signaux', () => {
    const decision = evaluerDecision(
      40,
      [risque('SITE', 3), risque('CONFORMITE', 3), risque('RH', 2)],
      CONFIG_V1,
    );
    expect(decision.redFlags[0].libelle).toContain('Risques notés 3 : SITE, CONFORMITE');
    expect(decision.orientationFinale).toBe('NO_GO');
    expect(decision.justification.at(-1)).toContain('inchangée par les signaux critiques');
  });

  it('déclare la décision non calculable sans score global', () => {
    const decision = evaluerDecision(null, [risque('SITE', 3)], CONFIG_V1);
    expect(decision.orientationCalculee).toBeNull();
    expect(decision.orientationFinale).toBeNull();
    expect(decision.libelle).toBe('Non calculable');
    expect(decision.redFlags.map((f) => f.code)).toEqual(['RISQUE_CRITIQUE']);
    expect(decision.justification[0]).toContain('ne peut pas être calculé');
  });
});
