import { beforeEach, describe, expect, it } from 'vitest';

import {
  enregistrerEchec,
  estBloque,
  PARAMETRES_LIMITATION,
  reinitialiserTentatives,
  viderLimitation,
} from '../limitation';

const { TENTATIVES_MAX, BLOCAGE_MS, FENETRE_MS } = PARAMETRES_LIMITATION;

describe('limitation des tentatives de connexion', () => {
  beforeEach(() => viderLimitation());

  it('bloque après le nombre maximal d’échecs dans la fenêtre', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < TENTATIVES_MAX - 1; i += 1) enregistrerEchec('a@b|1.2.3.4', t0 + i);
    expect(estBloque('a@b|1.2.3.4', t0 + 10)).toBe(false);
    enregistrerEchec('a@b|1.2.3.4', t0 + 10);
    expect(estBloque('a@b|1.2.3.4', t0 + 11)).toBe(true);
    expect(estBloque('autre@b|1.2.3.4', t0 + 11)).toBe(false);
  });

  it('lève le blocage à l’expiration', () => {
    const t0 = 5_000;
    for (let i = 0; i < TENTATIVES_MAX; i += 1) enregistrerEchec('x|ip', t0);
    expect(estBloque('x|ip', t0 + BLOCAGE_MS - 1)).toBe(true);
    expect(estBloque('x|ip', t0 + BLOCAGE_MS + 1)).toBe(false);
  });

  it('repart de zéro quand la fenêtre est dépassée ou après une réussite', () => {
    const t0 = 0;
    for (let i = 0; i < TENTATIVES_MAX - 1; i += 1) enregistrerEchec('y|ip', t0);
    enregistrerEchec('y|ip', t0 + FENETRE_MS + 1);
    expect(estBloque('y|ip', t0 + FENETRE_MS + 2)).toBe(false);
    for (let i = 0; i < TENTATIVES_MAX; i += 1) enregistrerEchec('z|ip', t0);
    reinitialiserTentatives('z|ip');
    expect(estBloque('z|ip', t0 + 1)).toBe(false);
  });
});
