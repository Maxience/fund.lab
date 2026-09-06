'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import {
  enregistrerSaisieAction,
  finaliserEtudeAction,
  rouvrirEtudeAction,
} from '@/app/expert/actions';
import type { EtudeSaisie } from '@/lib/moteur';
import type { SlugEtape } from '@/lib/parcours/etapes';
import type { EtudeLocale } from '@/lib/parcours/stockage-local';

import { ContexteEtude, type ValeurContexteEtude } from './contexte-etude';

const DELAI_SAUVEGARDE_MS = 800;

export interface ProprietesFournisseurEtudeServeur {
  etudeId: string;
  saisieInitiale: EtudeSaisie;
  statut: 'BROUILLON' | 'COMPLETE';
  etapeAtteinte: number;
  creeLe: string;
  misAJourLe: string;
  children: ReactNode;
}

/**
 * Mode Expert : l'étude vit en base. Les composants d'étape modifient un
 * état local, sauvegardé sur le serveur avec un léger délai après chaque
 * modification. Les mêmes formulaires servent aux deux parcours.
 */
export function FournisseurEtudeServeur({
  etudeId,
  saisieInitiale,
  statut,
  etapeAtteinte,
  creeLe,
  misAJourLe,
  children,
}: ProprietesFournisseurEtudeServeur) {
  const router = useRouter();
  const [locale, setLocale] = useState<EtudeLocale>({
    version: 1,
    id: etudeId,
    etude: saisieInitiale,
    statut,
    etapeAtteinte,
    creeLe,
    misAJourLe,
  });
  const [version, setVersion] = useState(0);
  const [sauvegardeLe, setSauvegardeLe] = useState<string | null>(misAJourLe);
  const [sauvegardeIndisponible, setSauvegardeIndisponible] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const derniereVersionSauvee = useRef(0);

  // Sauvegarde différée après chaque modification (version > 0).
  useEffect(() => {
    if (version === 0 || version === derniereVersionSauvee.current) return;
    const minuterie = setTimeout(async () => {
      const versionEnvoyee = version;
      const reponse = await enregistrerSaisieAction(etudeId, locale.etude, locale.etapeAtteinte);
      if (reponse.ok) {
        derniereVersionSauvee.current = versionEnvoyee;
        setSauvegardeLe(reponse.misAJourLe);
        setSauvegardeIndisponible(false);
        setErreur(null);
      } else {
        setSauvegardeIndisponible(true);
        setErreur(reponse.erreur);
      }
    }, DELAI_SAUVEGARDE_MS);
    return () => clearTimeout(minuterie);
  }, [version, locale.etude, locale.etapeAtteinte, etudeId]);

  const valeur = useMemo<ValeurContexteEtude>(() => {
    const chemin = (slug: SlugEtape) => `/expert/etudes/${etudeId}/${slug}`;
    return {
      mode: 'EXPERT',
      locale,
      etude: locale.etude,
      modifierEtude: (transformer) => {
        setLocale((l) => ({
          ...l,
          etude: transformer(l.etude),
          misAJourLe: new Date().toISOString(),
        }));
        setVersion((v) => v + 1);
      },
      marquerEtapeAtteinte: (numero) => {
        setLocale((l) => (l.etapeAtteinte >= numero ? l : { ...l, etapeAtteinte: numero }));
        setVersion((v) => v + 1);
      },
      finaliser: async () => {
        const reponse = await finaliserEtudeAction(etudeId);
        if (reponse.ok) {
          setLocale((l) => ({ ...l, statut: 'COMPLETE' }));
          setErreur(null);
          router.refresh();
        } else {
          setErreur(reponse.erreur);
        }
      },
      rouvrir: async () => {
        const reponse = await rouvrirEtudeAction(etudeId);
        if (reponse.ok) {
          setLocale((l) => ({ ...l, statut: 'BROUILLON' }));
          setErreur(null);
          router.refresh();
        } else {
          setErreur(reponse.erreur);
        }
      },
      sauvegardeLe,
      sauvegardeIndisponible,
      erreur,
      chemin,
      cheminSortie: `/expert/etudes/${etudeId}`,
      libelleSortie: 'Retour au dossier',
    };
  }, [locale, etudeId, sauvegardeLe, sauvegardeIndisponible, erreur, router]);

  return <ContexteEtude.Provider value={valeur}>{children}</ContexteEtude.Provider>;
}
