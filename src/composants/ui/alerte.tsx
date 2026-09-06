import type { ReactNode } from 'react';

import { classes } from '@/lib/utilitaires/classes';

export type NiveauAlerteUi = 'critique' | 'vigilance' | 'info' | 'bon';

const STYLES: Record<NiveauAlerteUi, { cadre: string; titre: string; icone: string }> = {
  critique: {
    cadre: 'border-critique bg-critique-clair',
    titre: 'text-critique',
    icone: 'Bloquant',
  },
  vigilance: {
    cadre: 'border-vigilance bg-vigilance-clair',
    titre: 'text-vigilance',
    icone: 'Attention',
  },
  info: { cadre: 'border-info bg-info-clair', titre: 'text-info', icone: 'Information' },
  bon: { cadre: 'border-bon bg-bon-clair', titre: 'text-bon', icone: 'Validé' },
};

export interface ProprietesAlerte {
  niveau: NiveauAlerteUi;
  titre: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Bandeau d'alerte : le niveau est écrit en toutes lettres, pas seulement coloré. */
export function Alerte({ niveau, titre, children, className }: ProprietesAlerte) {
  const style = STYLES[niveau];
  return (
    <div
      role={niveau === 'critique' ? 'alert' : 'status'}
      className={classes('rounded-[var(--radius-champ)] border px-4 py-3', style.cadre, className)}
    >
      <p className={classes('text-[14px] font-semibold', style.titre)}>
        <span className="mr-1.5 rounded-sm border border-current px-1 text-[11px] uppercase tracking-wide">
          {style.icone}
        </span>
        {titre}
      </p>
      {children && <div className="mt-1.5 text-[14px] leading-snug text-encre">{children}</div>}
    </div>
  );
}
