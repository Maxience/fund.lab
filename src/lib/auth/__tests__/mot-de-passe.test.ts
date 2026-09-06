import { describe, expect, it } from 'vitest';

import { controlerRobustesse, hacherMotDePasse, verifierMotDePasse } from '../mot-de-passe';

describe('hachage des mots de passe', () => {
  it('vérifie un mot de passe correct et refuse un mot de passe faux', async () => {
    const hache = await hacherMotDePasse('Cotonou-2026-secret');
    expect(hache.startsWith('scrypt$')).toBe(true);
    expect(hache).not.toContain('Cotonou');
    expect(await verifierMotDePasse('Cotonou-2026-secret', hache)).toBe(true);
    expect(await verifierMotDePasse('Cotonou-2026-secreT', hache)).toBe(false);
    expect(await verifierMotDePasse('', hache)).toBe(false);
  });

  it('produit un sel différent à chaque hachage', async () => {
    const a = await hacherMotDePasse('meme-mot-de-passe-1');
    const b = await hacherMotDePasse('meme-mot-de-passe-1');
    expect(a).not.toBe(b);
    expect(await verifierMotDePasse('meme-mot-de-passe-1', a)).toBe(true);
    expect(await verifierMotDePasse('meme-mot-de-passe-1', b)).toBe(true);
  });

  it('refuse sans exception une chaîne de hachage mal formée', async () => {
    expect(await verifierMotDePasse('x', '')).toBe(false);
    expect(await verifierMotDePasse('x', 'bcrypt$1$2$3$4$5')).toBe(false);
    expect(await verifierMotDePasse('x', 'scrypt$abc$8$1$sel$empreinte')).toBe(false);
    expect(await verifierMotDePasse('x', 'scrypt$16384$8$1$$')).toBe(false);
  });

  it('normalise les caractères composés pour éviter deux formes du même mot de passe', async () => {
    const hache = await hacherMotDePasse('café-secret-2026');
    expect(await verifierMotDePasse('café-secret-2026', hache)).toBe(true);
  });
});

describe('contrôle de robustesse', () => {
  it('exige douze caractères, des lettres et des chiffres', () => {
    expect(controlerRobustesse('court1')).toEqual({
      ok: false,
      message: expect.stringContaining('12'),
    });
    expect(controlerRobustesse('sanschiffreici')).toEqual({
      ok: false,
      message: expect.stringContaining('chiffres'),
    });
    expect(controlerRobustesse('123456789012')).toEqual({
      ok: false,
      message: expect.stringContaining('lettres'),
    });
    expect(controlerRobustesse('Cotonou-2026-ok')).toEqual({ ok: true });
  });
});
