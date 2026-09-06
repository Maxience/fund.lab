'use client';

import type { ReactNode } from 'react';

import type { Note, Notation } from '@/lib/moteur';
import { classes } from '@/lib/utilitaires/classes';

const NOTES: Note[] = [0, 1, 2, 3];

export interface ProprietesSelecteurNote {
  id: string;
  libelle: string;
  notation: Notation;
  onChange: (notation: Notation) => void;
  /** Description courte de l'échelle, affichée sous le libellé. */
  aide?: ReactNode;
  /** Libellés des quatre notes, du plus faible au plus fort. */
  libellesNotes?: [string, string, string, string];
  permettreNonApplicable?: boolean;
  erreur?: string;
  compact?: boolean;
}

const LIBELLES_PAR_DEFAUT: [string, string, string, string] = ['Nul', 'Faible', 'Moyen', 'Fort'];

/**
 * Notation de 0 à 3 par groupe de boutons radio. L'absence de choix reste
 * « non renseigné » et n'est jamais convertie en zéro. Un critère peut être
 * déclaré non applicable, ce qui l'exclut du calcul sans alerte.
 */
export function SelecteurNote({
  id,
  libelle,
  notation,
  onChange,
  aide,
  libellesNotes = LIBELLES_PAR_DEFAUT,
  permettreNonApplicable = true,
  erreur,
  compact = false,
}: ProprietesSelecteurNote) {
  const nonApplicable = notation.nonApplicable === true;
  const idErreur = `${id}-erreur`;

  return (
    <fieldset
      className={classes('flex flex-col gap-1.5', compact ? 'py-2' : 'py-3')}
      aria-describedby={erreur ? idErreur : undefined}
      aria-invalid={erreur ? true : undefined}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <legend className="text-[15px] font-medium text-encre">{libelle}</legend>
        <span className="text-[12px] text-encre-attenuee">
          {nonApplicable
            ? 'Non applicable'
            : notation.note === null
              ? 'Non renseigné'
              : `Note ${notation.note} sur 3`}
        </span>
      </div>
      {aide && <p className="text-[13px] leading-snug text-encre-secondaire">{aide}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <div
          className={classes(
            'grid flex-1 grid-cols-4 overflow-hidden rounded-[var(--radius-champ)] border border-bordure-forte bg-surface',
            nonApplicable && 'opacity-50',
          )}
          role="presentation"
        >
          {NOTES.map((n) => {
            const idOption = `${id}-${n}`;
            const choisie = notation.note === n && !nonApplicable;
            return (
              <label
                key={n}
                htmlFor={idOption}
                className={classes(
                  'flex min-h-11 cursor-pointer flex-col items-center justify-center border-l border-bordure-forte px-1 text-center first:border-l-0 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-accent',
                  choisie ? 'bg-accent text-white' : 'text-encre hover:bg-surface-appui',
                )}
              >
                <input
                  id={idOption}
                  type="radio"
                  name={id}
                  value={n}
                  className="sr-only"
                  checked={choisie}
                  disabled={nonApplicable}
                  onChange={() => onChange({ ...notation, note: n, nonApplicable: false })}
                />
                <span className="chiffres text-[15px] font-semibold leading-none">{n}</span>
                <span
                  className={classes(
                    'mt-0.5 text-[11px] leading-none',
                    choisie ? 'text-white/90' : 'text-encre-attenuee',
                  )}
                >
                  {libellesNotes[n]}
                </span>
              </label>
            );
          })}
        </div>
        {notation.note !== null && !nonApplicable && (
          <button
            type="button"
            className="text-[13px] text-accent underline-offset-2 hover:underline"
            onClick={() => onChange({ ...notation, note: null })}
          >
            Effacer
          </button>
        )}
        {permettreNonApplicable && (
          <label className="flex items-center gap-1.5 text-[13px] text-encre-secondaire">
            <input
              type="checkbox"
              className="h-4 w-4 accent-accent"
              checked={nonApplicable}
              onChange={(e) =>
                onChange({ ...notation, note: null, nonApplicable: e.target.checked })
              }
            />
            Non applicable
          </label>
        )}
      </div>
      {erreur && (
        <p id={idErreur} role="alert" className="text-[13px] font-medium text-critique">
          {erreur}
        </p>
      )}
    </fieldset>
  );
}
