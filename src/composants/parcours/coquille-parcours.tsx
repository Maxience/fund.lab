'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { Pastille } from '@/composants/ui/pastille';

import { BarreEtapes } from './barre-etapes';
import { useEtude } from './contexte-etude';

function heureCourte(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** En-tête et mise en page commune des huit étapes. */
export function CoquilleParcours({ children }: { children: ReactNode }) {
  const { etude, locale, sauvegardeLe, sauvegardeIndisponible } = useEtude();
  const nomProjet = etude.projet.nom.trim();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sans-impression border-b border-bordure bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="shrink-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-accent"
            >
              FUND.lab
            </Link>
            <span className="text-encre-attenuee" aria-hidden="true">
              /
            </span>
            <p className="min-w-0 truncate text-[14px] text-encre">
              {nomProjet ? nomProjet : 'Nouvelle étude de chalandise'}
            </p>
            {locale.statut === 'COMPLETE' && <Pastille ton="bon">Finalisée</Pastille>}
          </div>
          <p className="text-[12.5px] text-encre-attenuee" aria-live="polite">
            {sauvegardeIndisponible
              ? 'Sauvegarde impossible dans ce navigateur'
              : sauvegardeLe
                ? `Enregistrée dans ce navigateur à ${heureCourte(sauvegardeLe)}`
                : 'Enregistrement automatique dans ce navigateur'}
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-8 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="mb-5 lg:mb-0">
          <BarreEtapes />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
