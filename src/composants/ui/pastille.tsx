import type { ReactNode } from 'react';

import { classes } from '@/lib/utilitaires/classes';

export type TonPastille = 'neutre' | 'accent' | 'bon' | 'vigilance' | 'critique' | 'info';

const TONS: Record<TonPastille, string> = {
  neutre: 'border-bordure-forte bg-surface-appui text-encre-secondaire',
  accent: 'border-accent bg-accent-clair text-accent-fonce',
  bon: 'border-bon bg-bon-clair text-bon',
  vigilance: 'border-vigilance bg-vigilance-clair text-vigilance',
  critique: 'border-critique bg-critique-clair text-critique',
  info: 'border-info bg-info-clair text-info',
};

export interface ProprietesPastille {
  ton?: TonPastille;
  children: ReactNode;
  className?: string;
  grande?: boolean;
}

/** Étiquette de statut : la couleur est toujours accompagnée du libellé. */
export function Pastille({ ton = 'neutre', children, className, grande }: ProprietesPastille) {
  return (
    <span
      className={classes(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold',
        grande ? 'px-3.5 py-1.5 text-[15px]' : 'px-2.5 py-0.5 text-[12.5px]',
        TONS[ton],
        className,
      )}
    >
      <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}
