'use client';

import type { ReactNode } from 'react';

import { classes } from '@/lib/utilitaires/classes';

import { attributsControle, Champ, CLASSES_CONTROLE } from './champ';

export interface ProprietesChampTexte {
  id: string;
  libelle: string;
  valeur: string;
  onChange: (valeur: string) => void;
  aide?: ReactNode;
  erreur?: string;
  obligatoire?: boolean;
  placeholder?: string;
  maxLength?: number;
  /** Suggestions proposées dans une liste déroulante native. */
  suggestions?: string[];
  multiligne?: boolean;
  className?: string;
}

export function ChampTexte({
  id,
  libelle,
  valeur,
  onChange,
  aide,
  erreur,
  obligatoire,
  placeholder,
  maxLength,
  suggestions,
  multiligne,
  className,
}: ProprietesChampTexte) {
  const attributs = attributsControle(id, aide, erreur);
  const idListe = suggestions ? `${id}-suggestions` : undefined;
  return (
    <Champ
      id={id}
      libelle={libelle}
      aide={aide}
      erreur={erreur}
      obligatoire={obligatoire}
      className={className}
    >
      {multiligne ? (
        <textarea
          {...attributs}
          className={classes(CLASSES_CONTROLE, 'min-h-24 py-2.5 leading-snug')}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
        />
      ) : (
        <input
          {...attributs}
          type="text"
          className={CLASSES_CONTROLE}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          list={idListe}
          autoComplete="off"
        />
      )}
      {suggestions && (
        <datalist id={idListe}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </Champ>
  );
}
