'use client';

import type { ReactNode } from 'react';

import { classes } from '@/lib/utilitaires/classes';

import { attributsControle, Champ, CLASSES_CONTROLE } from './champ';

export interface ProprietesChampNombre {
  id: string;
  libelle: string;
  valeur: number | null;
  onChange: (valeur: number | null) => void;
  /** Unité affichée à droite du champ : FCFA, km, min, %, clients. */
  unite?: string;
  aide?: ReactNode;
  erreur?: string;
  obligatoire?: boolean;
  min?: number;
  max?: number;
  step?: number | 'any';
  placeholder?: string;
  className?: string;
}

/** Convertit la saisie en nombre ; vide ou invalide donne null, jamais zéro. */
export function analyserNombre(texte: string): number | null {
  const normalise = texte.replace(/\s/g, '').replace(',', '.');
  if (normalise === '') return null;
  const valeur = Number(normalise);
  return Number.isFinite(valeur) ? valeur : null;
}

export function ChampNombre({
  id,
  libelle,
  valeur,
  onChange,
  unite,
  aide,
  erreur,
  obligatoire,
  min,
  max,
  step = 'any',
  placeholder,
  className,
}: ProprietesChampNombre) {
  return (
    <Champ
      id={id}
      libelle={libelle}
      aide={aide}
      erreur={erreur}
      obligatoire={obligatoire}
      className={className}
    >
      <div className="relative">
        <input
          {...attributsControle(id, aide, erreur)}
          type="number"
          inputMode="decimal"
          className={classes(CLASSES_CONTROLE, 'chiffres', unite && 'pr-20')}
          value={valeur ?? ''}
          onChange={(e) => onChange(analyserNombre(e.target.value))}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
        />
        {unite && (
          <span
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[14px] text-encre-secondaire"
            aria-hidden="true"
          >
            {unite}
          </span>
        )}
      </div>
    </Champ>
  );
}
