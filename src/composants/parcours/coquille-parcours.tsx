'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { Alerte } from '@/composants/ui/alerte';
import { Pastille } from '@/composants/ui/pastille';

import { BarreEtapes } from './barre-etapes';
import { useEtude } from './contexte-etude';

function heureCourte(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** En-tête et mise en page commune des huit étapes, dans les deux modes. */
export function CoquilleParcours({ children }: { children: ReactNode }) {
  const { mode, etude, locale, sauvegardeLe, sauvegardeIndisponible, erreur, cheminSortie } =
    useEtude();
  const nomProjet = etude.projet.nom.trim();
  const lieu = mode === 'PME' ? 'dans ce navigateur' : 'sur le serveur';

  const etatSauvegarde = sauvegardeIndisponible
    ? `Sauvegarde impossible ${lieu}`
    : sauvegardeLe
      ? `Enregistrée ${lieu} à ${heureCourte(sauvegardeLe)}`
      : `Enregistrement automatique ${lieu}`;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sans-impression border-b border-bordure bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {mode === 'PME' ? (
              <Link
                href="/"
                className="shrink-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-accent"
              >
                FUND.lab
              </Link>
            ) : (
              <Link href={cheminSortie} className="shrink-0 text-[13px] font-semibold text-accent">
                Dossier
              </Link>
            )}
            <span className="text-encre-attenuee" aria-hidden="true">
              /
            </span>
            <p className="min-w-0 truncate text-[14px] text-encre">
              {nomProjet ? nomProjet : 'Nouvelle étude de chalandise'}
            </p>
            {locale.statut === 'COMPLETE' && <Pastille ton="bon">Finalisée</Pastille>}
          </div>
          <p className="text-[12.5px] text-encre-attenuee" aria-live="polite">
            {etatSauvegarde}
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-8 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="mb-5 lg:mb-0">
          <BarreEtapes />
        </aside>
        <main className="min-w-0">
          {erreur && (
            <Alerte niveau="critique" titre="Opération refusée" className="sans-impression mb-5">
              {erreur}
            </Alerte>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
