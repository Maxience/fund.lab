'use client';

import type { ReactNode } from 'react';

import { classes } from '@/lib/utilitaires/classes';

import { attributsControle, Champ, CLASSES_CONTROLE } from './champ';

export interface OptionSelecteur<T extends string> {
  valeur: T;
  libelle: string;
}

export interface ProprietesSelecteur<T extends string> {
  id: string;
  libelle: string;
  valeur: T | null;
  onChange: (valeur: T | null) => void;
  options: OptionSelecteur<T>[];
  /** Libellé de l'option vide, affichée tant qu'aucun choix n'est fait. */
  libelleVide?: string;
  aide?: ReactNode;
  erreur?: string;
  obligatoire?: boolean;
  className?: string;
}

export function Selecteur<T extends string>({
  id,
  libelle,
  valeur,
  onChange,
  options,
  libelleVide = 'Choisir',
  aide,
  erreur,
  obligatoire,
  className,
}: ProprietesSelecteur<T>) {
  return (
    <Champ
      id={id}
      libelle={libelle}
      aide={aide}
      erreur={erreur}
      obligatoire={obligatoire}
      className={className}
    >
      <select
        {...attributsControle(id, aide, erreur)}
        className={classes(
          CLASSES_CONTROLE,
          'appearance-none bg-[right_0.75rem_center] bg-no-repeat pr-9',
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 20 20' fill='%234f4f4b'><path d='M5.5 7.5 10 12l4.5-4.5'/></svg>\")",
        }}
        value={valeur ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : (e.target.value as T))}
      >
        <option value="">{libelleVide}</option>
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
    </Champ>
  );
}
