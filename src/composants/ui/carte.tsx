import type { ReactNode } from 'react';

import { classes } from '@/lib/utilitaires/classes';

export interface ProprietesCarte {
  titre?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Balise de section ; « section » par défaut. */
  balise?: 'section' | 'div' | 'article';
}

export function Carte({
  titre,
  description,
  actions,
  children,
  className,
  balise = 'section',
}: ProprietesCarte) {
  const Balise = balise;
  return (
    <Balise
      className={classes(
        'carte rounded-[var(--radius-carte)] border border-bordure bg-surface p-4 shadow-[0_1px_2px_rgba(20,20,20,0.04)] sm:p-6',
        className,
      )}
    >
      {(titre || actions) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {titre && (
              <h2 className="text-[17px] font-semibold leading-tight text-encre">{titre}</h2>
            )}
            {description && (
              <p className="mt-1 text-[14px] leading-snug text-encre-secondaire">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      {children}
    </Balise>
  );
}
