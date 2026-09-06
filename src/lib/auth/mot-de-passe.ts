/**
 * Hachage et vérification des mots de passe avec scrypt, fourni par Node.js
 * sans dépendance. Le format stocké porte ses paramètres pour pouvoir les
 * renforcer plus tard sans invalider les comptes existants :
 * `scrypt$N$r$p$sel$empreinte`, sel et empreinte en base64url.
 */

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const PARAMETRES = { N: 2 ** 15, r: 8, p: 1 } as const;
const LONGUEUR_SEL = 16;
const LONGUEUR_EMPREINTE = 32;
const LONGUEUR_MINIMALE = 12;

function scryptAsync(
  motDePasse: string,
  sel: Buffer,
  longueur: number,
  parametres: { N: number; r: number; p: number },
): Promise<Buffer> {
  return new Promise((resoudre, rejeter) => {
    scrypt(
      motDePasse.normalize('NFKC'),
      sel,
      longueur,
      { ...parametres, maxmem: 128 * parametres.N * parametres.r * 2 },
      (erreur, cle) => (erreur ? rejeter(erreur) : resoudre(cle)),
    );
  });
}

/** Produit une chaîne de hachage autoportante. */
export async function hacherMotDePasse(motDePasse: string): Promise<string> {
  const sel = randomBytes(LONGUEUR_SEL);
  const empreinte = await scryptAsync(motDePasse, sel, LONGUEUR_EMPREINTE, PARAMETRES);
  return [
    'scrypt',
    PARAMETRES.N,
    PARAMETRES.r,
    PARAMETRES.p,
    sel.toString('base64url'),
    empreinte.toString('base64url'),
  ].join('$');
}

/**
 * Vérifie un mot de passe contre une chaîne de hachage. Retourne faux, sans
 * exception, pour une chaîne mal formée : un enregistrement corrompu ne doit
 * jamais ouvrir un accès.
 */
export async function verifierMotDePasse(motDePasse: string, hache: string): Promise<boolean> {
  const morceaux = hache.split('$');
  if (morceaux.length !== 6 || morceaux[0] !== 'scrypt') return false;
  const N = Number(morceaux[1]);
  const r = Number(morceaux[2]);
  const p = Number(morceaux[3]);
  if (![N, r, p].every((v) => Number.isInteger(v) && v > 0)) return false;
  let sel: Buffer;
  let attendu: Buffer;
  try {
    sel = Buffer.from(morceaux[4], 'base64url');
    attendu = Buffer.from(morceaux[5], 'base64url');
  } catch {
    return false;
  }
  if (sel.length === 0 || attendu.length === 0) return false;
  try {
    const empreinte = await scryptAsync(motDePasse, sel, attendu.length, { N, r, p });
    return empreinte.length === attendu.length && timingSafeEqual(empreinte, attendu);
  } catch {
    return false;
  }
}

/** Contrôle minimal de robustesse, appliqué à la création et au changement. */
export function controlerRobustesse(motDePasse: string): { ok: boolean; message?: string } {
  if (motDePasse.length < LONGUEUR_MINIMALE) {
    return {
      ok: false,
      message: `Le mot de passe doit compter au moins ${LONGUEUR_MINIMALE} caractères.`,
    };
  }
  if (!/[a-zà-ÿ]/i.test(motDePasse) || !/\d/.test(motDePasse)) {
    return { ok: false, message: 'Le mot de passe doit mêler des lettres et des chiffres.' };
  }
  return { ok: true };
}
