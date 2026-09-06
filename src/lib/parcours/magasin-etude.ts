/**
 * Magasin de l'étude en cours dans le navigateur, exposé comme source
 * externe pour React (`useSyncExternalStore`). Il tient l'étude en mémoire,
 * la sauvegarde dans le navigateur avec un léger délai après chaque
 * modification, et prévient les abonnés à chaque changement.
 *
 * Côté serveur, l'instantané est vide : le parcours affiche une attente
 * jusqu'à ce que le navigateur ait chargé l'étude.
 */

import type { EtudeSaisie } from '@/lib/moteur';

import {
  creerEtudeLocale,
  ecrireEtudeLocale,
  effacerEtudeLocale,
  lireEtudeLocale,
  stockageNavigateur,
  type EtudeLocale,
} from './stockage-local';

export interface EtatMagasin {
  /** Étude en cours ; null tant que le navigateur ne l'a pas chargée. */
  locale: EtudeLocale | null;
  /** Vrai si l'étude vient du stockage du navigateur ou y a déjà été sauvegardée. */
  existante: boolean;
  sauvegardeLe: string | null;
  sauvegardeIndisponible: boolean;
}

const DELAI_SAUVEGARDE_MS = 250;

const ETAT_SERVEUR: EtatMagasin = {
  locale: null,
  existante: false,
  sauvegardeLe: null,
  sauvegardeIndisponible: false,
};

let etat: EtatMagasin | null = null;
let minuterie: ReturnType<typeof setTimeout> | null = null;
const abonnes = new Set<() => void>();

function initialiser(): EtatMagasin {
  const stockage = stockageNavigateur();
  const chargee = lireEtudeLocale(stockage);
  return {
    locale: chargee ?? creerEtudeLocale(),
    existante: chargee !== null,
    sauvegardeLe: chargee?.misAJourLe ?? null,
    sauvegardeIndisponible: stockage === null,
  };
}

function emettre(): void {
  for (const abonne of abonnes) abonne();
}

function planifierSauvegarde(): void {
  if (minuterie) clearTimeout(minuterie);
  minuterie = setTimeout(() => {
    minuterie = null;
    const courant = instantane();
    if (!courant.locale) return;
    const ok = ecrireEtudeLocale(stockageNavigateur(), courant.locale);
    etat = {
      ...courant,
      existante: courant.existante || ok,
      sauvegardeLe: ok ? courant.locale.misAJourLe : courant.sauvegardeLe,
      sauvegardeIndisponible: !ok,
    };
    emettre();
  }, DELAI_SAUVEGARDE_MS);
}

/** Instantané côté navigateur ; charge l'étude au premier appel. */
export function instantane(): EtatMagasin {
  if (etat === null) etat = initialiser();
  return etat;
}

/** Instantané côté serveur, stable et vide. */
export function instantaneServeur(): EtatMagasin {
  return ETAT_SERVEUR;
}

export function souscrire(abonne: () => void): () => void {
  abonnes.add(abonne);
  return () => {
    abonnes.delete(abonne);
  };
}

/** Applique une transformation à l'étude locale et planifie la sauvegarde. */
export function mettreAJour(transformer: (locale: EtudeLocale) => EtudeLocale): void {
  const courant = instantane();
  if (!courant.locale) return;
  etat = {
    ...courant,
    locale: { ...transformer(courant.locale), misAJourLe: new Date().toISOString() },
  };
  emettre();
  planifierSauvegarde();
}

export function modifierEtude(transformer: (etude: EtudeSaisie) => EtudeSaisie): void {
  mettreAJour((locale) => ({ ...locale, etude: transformer(locale.etude) }));
}

/** Efface l'étude du navigateur et en démarre une nouvelle. */
export function recommencer(): void {
  if (minuterie) {
    clearTimeout(minuterie);
    minuterie = null;
  }
  const stockage = stockageNavigateur();
  effacerEtudeLocale(stockage);
  etat = {
    locale: creerEtudeLocale(),
    existante: false,
    sauvegardeLe: null,
    sauvegardeIndisponible: stockage === null,
  };
  emettre();
}

/** Remplace l'étude en cours par une étude donnée (exemple, reprise). */
export function chargerEtude(etude: EtudeSaisie, etapeAtteinte: number): void {
  const courant = instantane();
  const base = courant.locale ?? creerEtudeLocale();
  etat = {
    ...courant,
    locale: {
      ...base,
      etude,
      etapeAtteinte,
      statut: 'BROUILLON',
      misAJourLe: new Date().toISOString(),
    },
  };
  emettre();
  planifierSauvegarde();
}

/** Réservé aux tests : remet le magasin à l'état initial. */
export function reinitialiserMagasin(): void {
  if (minuterie) clearTimeout(minuterie);
  minuterie = null;
  etat = null;
  abonnes.clear();
}
