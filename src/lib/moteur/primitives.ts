/**
 * Primitives numériques du moteur : arrondi, contrôle des sommes de poids,
 * agrégations qui distinguent une valeur manquante d'un zéro.
 */

import type { Note } from './types';

/**
 * Arrondi à un nombre de décimales, robuste aux représentations binaires
 * (1,005 arrondi à deux décimales donne 1,01 et non 1).
 */
export function arrondir(valeur: number, decimales: number): number {
  const facteur = 10 ** decimales;
  const signe = valeur < 0 ? -1 : 1;
  return (signe * Math.round((Math.abs(valeur) + Number.EPSILON) * facteur)) / facteur;
}

/** Somme d'une liste, 0 pour une liste vide. */
export function somme(valeurs: number[]): number {
  return valeurs.reduce((acc, v) => acc + v, 0);
}

/** Écart signé entre la somme des valeurs et la cible. */
export function ecartSomme(valeurs: number[], cible: number): number {
  return somme(valeurs) - cible;
}

/** Vrai quand la somme des valeurs est à la cible, à la tolérance près. */
export function sommeConforme(valeurs: number[], cible: number, tolerance: number): boolean {
  return Math.abs(ecartSomme(valeurs, cible)) <= tolerance;
}

/** Moyenne simple ; null pour une liste vide. */
export function moyenne(valeurs: number[]): number | null {
  if (valeurs.length === 0) return null;
  return somme(valeurs) / valeurs.length;
}

export interface ElementPondere {
  poids: number;
  valeur: number | null;
}

/**
 * Moyenne pondérée renormalisée sur les éléments dont la valeur est
 * renseignée : Σ(poids × valeur) ÷ Σ(poids des éléments renseignés).
 * Retourne null si aucun élément n'est renseigné ou si les poids retenus
 * sont nuls. Un élément non renseigné ne compte jamais pour zéro.
 */
export function moyennePondereeRenormalisee(elements: ElementPondere[]): number | null {
  let numerateur = 0;
  let denominateur = 0;
  for (const { poids, valeur } of elements) {
    if (valeur === null) continue;
    numerateur += poids * valeur;
    denominateur += poids;
  }
  if (denominateur === 0) return null;
  return numerateur / denominateur;
}

/** Vrai quand la valeur est une note entière de l'échelle. */
export function estNoteValide(
  valeur: unknown,
  echelle: { min: number; max: number },
): valeur is Note {
  return (
    typeof valeur === 'number' &&
    Number.isInteger(valeur) &&
    valeur >= echelle.min &&
    valeur <= echelle.max
  );
}

/** Vrai pour un nombre fini strictement positif. */
export function estPositif(valeur: unknown): valeur is number {
  return typeof valeur === 'number' && Number.isFinite(valeur) && valeur > 0;
}

/** Vrai pour un nombre fini positif ou nul. */
export function estPositifOuNul(valeur: unknown): valeur is number {
  return typeof valeur === 'number' && Number.isFinite(valeur) && valeur >= 0;
}

/** Borne une valeur dans un intervalle. */
export function borner(valeur: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valeur));
}
