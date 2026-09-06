/**
 * Sauvegarde locale du parcours PME dans le navigateur (arbitrage 0004).
 * Une seule étude en cours par navigateur. Le stockage est passé en
 * paramètre pour rester testable hors navigateur ; toute lecture ou
 * écriture est tolérante aux pannes (navigation privée, quota, données
 * corrompues) et ne lève jamais d'exception.
 */

import type { EtudeSaisie } from '@/lib/moteur';

import { nouvelIdentifiant, nouvelleEtude } from './etude-vide';

export const CLE_STOCKAGE = 'chalandise.etude';
export const VERSION_STOCKAGE = 1;

export type StatutEtudeLocale = 'BROUILLON' | 'COMPLETE';

export interface EtudeLocale {
  version: typeof VERSION_STOCKAGE;
  id: string;
  etude: EtudeSaisie;
  statut: StatutEtudeLocale;
  /** Numéro de la dernière étape atteinte, de 1 à 8. */
  etapeAtteinte: number;
  creeLe: string;
  misAJourLe: string;
}

/** Sous-ensemble de l'API Storage utilisé, pour les tests. */
export type StockageMinimal = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function creerEtudeLocale(horloge: () => Date = () => new Date()): EtudeLocale {
  const maintenant = horloge().toISOString();
  return {
    version: VERSION_STOCKAGE,
    id: nouvelIdentifiant('etude'),
    etude: nouvelleEtude(),
    statut: 'BROUILLON',
    etapeAtteinte: 1,
    creeLe: maintenant,
    misAJourLe: maintenant,
  };
}

function estEtudeLocale(valeur: unknown): valeur is EtudeLocale {
  if (typeof valeur !== 'object' || valeur === null) return false;
  const v = valeur as Record<string, unknown>;
  return (
    v.version === VERSION_STOCKAGE &&
    typeof v.id === 'string' &&
    typeof v.etude === 'object' &&
    v.etude !== null &&
    (v.statut === 'BROUILLON' || v.statut === 'COMPLETE') &&
    typeof v.etapeAtteinte === 'number' &&
    typeof v.creeLe === 'string' &&
    typeof v.misAJourLe === 'string'
  );
}

export function lireEtudeLocale(stockage: StockageMinimal | null | undefined): EtudeLocale | null {
  if (!stockage) return null;
  try {
    const brut = stockage.getItem(CLE_STOCKAGE);
    if (!brut) return null;
    const valeur: unknown = JSON.parse(brut);
    return estEtudeLocale(valeur) ? valeur : null;
  } catch {
    return null;
  }
}

export function ecrireEtudeLocale(
  stockage: StockageMinimal | null | undefined,
  etude: EtudeLocale,
): boolean {
  if (!stockage) return false;
  try {
    stockage.setItem(CLE_STOCKAGE, JSON.stringify(etude));
    return true;
  } catch {
    return false;
  }
}

export function effacerEtudeLocale(stockage: StockageMinimal | null | undefined): void {
  if (!stockage) return;
  try {
    stockage.removeItem(CLE_STOCKAGE);
  } catch {
    // Rien à faire : le stockage est indisponible.
  }
}

/** Le stockage du navigateur, ou null hors navigateur ou si l'accès est refusé. */
export function stockageNavigateur(): StockageMinimal | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}
