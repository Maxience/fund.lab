'use client';

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';

import type { EtudeSaisie } from '@/lib/moteur';
import {
  instantane,
  instantaneServeur,
  mettreAJour,
  modifierEtude as modifierEtudeMagasin,
  recommencer as recommencerMagasin,
  souscrire,
} from '@/lib/parcours/magasin-etude';
import type { EtudeLocale } from '@/lib/parcours/stockage-local';

export interface ValeurContexteEtude {
  locale: EtudeLocale;
  etude: EtudeSaisie;
  modifierEtude: (transformer: (etude: EtudeSaisie) => EtudeSaisie) => void;
  marquerEtapeAtteinte: (numero: number) => void;
  finaliser: () => void;
  rouvrir: () => void;
  recommencer: () => void;
  /** Horodatage de la dernière sauvegarde réussie dans le navigateur. */
  sauvegardeLe: string | null;
  /** Vrai si le navigateur refuse la sauvegarde (navigation privée, quota). */
  sauvegardeIndisponible: boolean;
}

const ContexteEtude = createContext<ValeurContexteEtude | null>(null);

/**
 * Fournit l'étude en cours à tout le parcours. Le contenu n'est rendu
 * qu'une fois l'étude chargée par le navigateur, pour éviter tout écart
 * entre le rendu serveur et le rendu client.
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
    };
  }, [etat]);

  if (!valeur) return <>{attente ?? null}</>;
  return <ContexteEtude.Provider value={valeur}>{children}</ContexteEtude.Provider>;
}

export function useEtude(): ValeurContexteEtude {
  const valeur = useContext(ContexteEtude);
  if (!valeur) {
    throw new Error("useEtude doit être appelé à l'intérieur de FournisseurEtude.");
  }
  return valeur;
}
