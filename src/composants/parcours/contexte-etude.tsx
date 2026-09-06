'use client';

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';

import { sauvegarderEtudePmeAction } from '@/app/etude/actions';
import type { EtudeSaisie } from '@/lib/moteur';
import { cheminEtape, type SlugEtape } from '@/lib/parcours/etapes';
import {
  definirSynchroniseur,
  instantane,
  instantaneServeur,
  mettreAJour,
  modifierEtude as modifierEtudeMagasin,
  recommencer as recommencerMagasin,
  souscrire,
} from '@/lib/parcours/magasin-etude';
import type { EtudeLocale } from '@/lib/parcours/stockage-local';

// Copie serveur de l'étude PME par identifiant temporaire (point 26 du plan).
definirSynchroniseur(async (locale) => {
  await sauvegarderEtudePmeAction(locale.id, locale.etude, locale.etapeAtteinte, locale.statut);
});

/**
 * Contrat commun aux deux modes du parcours : PME (étude dans le
 * navigateur) et Expert (étude en base). Les composants d'étape ne
 * connaissent que ce contrat.
 */
export interface ValeurContexteEtude {
  mode: 'PME' | 'EXPERT';
  locale: EtudeLocale;
  etude: EtudeSaisie;
  modifierEtude: (transformer: (etude: EtudeSaisie) => EtudeSaisie) => void;
  marquerEtapeAtteinte: (numero: number) => void;
  finaliser: () => void | Promise<void>;
  rouvrir: () => void | Promise<void>;
  /** Démarrer une nouvelle étude ; absent en mode Expert. */
  recommencer?: () => void;
  /** Horodatage de la dernière sauvegarde réussie. */
  sauvegardeLe: string | null;
  /** Vrai si la sauvegarde échoue (navigation privée, quota, serveur injoignable). */
  sauvegardeIndisponible: boolean;
  /** Message de la dernière opération refusée (finalisation, sauvegarde). */
  erreur: string | null;
  /** Chemin d'une étape dans le mode courant. */
  chemin: (slug: SlugEtape) => string;
  /** Sortie du parcours : accueil en mode PME, dossier en mode Expert. */
  cheminSortie: string;
  libelleSortie: string;
}

export const ContexteEtude = createContext<ValeurContexteEtude | null>(null);

/**
 * Mode PME : fournit l'étude en cours du navigateur. Le contenu n'est rendu
 * qu'une fois l'étude chargée, pour éviter tout écart entre le rendu serveur
 * et le rendu client.
 */
export function FournisseurEtude({
  children,
  attente,
}: {
  children: ReactNode;
  attente?: ReactNode;
}) {
  const etat = useSyncExternalStore(souscrire, instantane, instantaneServeur);

  const valeur = useMemo<ValeurContexteEtude | null>(() => {
    if (!etat.locale) return null;
    return {
      mode: 'PME',
      locale: etat.locale,
      etude: etat.locale.etude,
      modifierEtude: modifierEtudeMagasin,
      marquerEtapeAtteinte: (numero) =>
        mettreAJour((l) => ({ ...l, etapeAtteinte: Math.max(l.etapeAtteinte, numero) })),
      finaliser: () => mettreAJour((l) => ({ ...l, statut: 'COMPLETE' })),
      rouvrir: () => mettreAJour((l) => ({ ...l, statut: 'BROUILLON' })),
      recommencer: recommencerMagasin,
      sauvegardeLe: etat.sauvegardeLe,
      sauvegardeIndisponible: etat.sauvegardeIndisponible,
      erreur: null,
      chemin: cheminEtape,
      cheminSortie: '/',
      libelleSortie: "Retour à l'accueil",
    };
  }, [etat]);

  if (!valeur) return <>{attente ?? null}</>;
  return <ContexteEtude.Provider value={valeur}>{children}</ContexteEtude.Provider>;
}

export function useEtude(): ValeurContexteEtude {
  const valeur = useContext(ContexteEtude);
  if (!valeur) {
    throw new Error("useEtude doit être appelé à l'intérieur d'un fournisseur d'étude.");
  }
  return valeur;
}
