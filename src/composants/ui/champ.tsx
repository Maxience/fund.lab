import type { ReactNode } from 'react';

import { classes } from '@/lib/utilitaires/classes';

export interface ProprietesChamp {
  id: string;
  libelle: string;
  /** Texte d'aide affiché sous le libellé, relié au contrôle par aria-describedby. */
  aide?: ReactNode;
  erreur?: string;
  obligatoire?: boolean;
  className?: string;
  children: ReactNode;
}

export function idAide(id: string) {
  return `${id}-aide`;
}

export function idErreur(id: string) {
  return `${id}-erreur`;
}

/** Attributs ARIA à poser sur le contrôle d'un champ. */
export function attributsControle(id: string, aide?: ReactNode, erreur?: string) {
  const decrits = [aide ? idAide(id) : null, erreur ? idErreur(id) : null].filter(Boolean);
  return {
    id,
    'aria-describedby': decrits.length > 0 ? decrits.join(' ') : undefined,
    'aria-invalid': erreur ? true : undefined,
  } as const;
}

/**
 * Enveloppe d'un champ : libellé, mention obligatoire ou facultatif, aide,
 * contrôle et message d'erreur placé juste sous le contrôle.
 */
export function Champ({
  id,
  libelle,
  aide,
  erreur,
  obligatoire,
  className,
  children,
}: ProprietesChamp) {
  return (
    <div className={classes('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[15px] font-medium text-encre">
        {libelle}
        {obligatoire ? (
          <span className="ml-1 text-critique" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1.5 text-[13px] font-normal text-encre-attenuee">(facultatif)</span>
        )}
      </label>
      {aide && (
        <p id={idAide(id)} className="text-[13px] leading-snug text-encre-secondaire">
          {aide}
        </p>
      )}
      {children}
      {erreur && (
        <p id={idErreur(id)} role="alert" className="text-[13px] font-medium text-critique">
          {erreur}
        </p>
      )}
    </div>
  );
}

export const CLASSES_CONTROLE =
  'w-full min-h-11 rounded-[var(--radius-champ)] border border-bordure-forte bg-surface px-3 text-[16px] text-encre placeholder:text-encre-attenuee focus:border-accent aria-[invalid=true]:border-critique';
