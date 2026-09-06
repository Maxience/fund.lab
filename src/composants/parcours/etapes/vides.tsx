'use client';

import { useMemo } from 'react';

import { Alerte } from '@/composants/ui/alerte';
import { Carte } from '@/composants/ui/carte';
import {
  CONFIG_COURANTE,
  evaluerEtude,
  formaterDecimal,
  type GapSaisi,
  type StatutMarche,
} from '@/lib/moteur';
import { classes } from '@/lib/utilitaires/classes';

import { useEtude } from '../contexte-etude';
import { EnTeteEtape, ResumeValidation } from '../en-tete-etape';
import { NavigationEtape } from '../navigation-etape';
import { useValidationEtape } from '../use-validation-etape';

const STATUTS: { valeur: StatutMarche; libelle: string; aide: string }[] = [
  { valeur: 'ABSENT', libelle: 'Absent', aide: 'Personne ne sert ce besoin autour du site.' },
  {
    valeur: 'MAL_SERVI',
    libelle: 'Mal servi',
    aide: 'Une offre existe mais elle est insuffisante.',
  },
  { valeur: 'CORRECT', libelle: 'Correct', aide: 'Le besoin est bien servi.' },
];

const IMPORTANCES: { valeur: 1 | 2 | 3; libelle: string }[] = [
  { valeur: 1, libelle: 'Faible' },
  { valeur: 2, libelle: 'Moyenne' },
  { valeur: 3, libelle: 'Forte' },
];

export function EtapeVides() {
  const { etude, modifierEtude } = useEtude();
  const validation = useValidationEtape('vides');
  const config = CONFIG_COURANTE;
  const scores = useMemo(() => evaluerEtude(etude).scores, [etude]);

  const gapDe = (code: string): GapSaisi =>
    etude.gaps.find((g) => g.besoinCode === code) ?? {
      besoinCode: code,
      statutMarche: null,
      importance: null,
    };

  const modifier = (code: string, champ: Partial<GapSaisi>) =>
    modifierEtude((e) => {
      const existe = e.gaps.some((g) => g.besoinCode === code);
      const base = gapDe(code);
      return {
        ...e,
        gaps: existe
          ? e.gaps.map((g) => (g.besoinCode === code ? { ...g, ...champ } : g))
          : [...e.gaps, { ...base, ...champ }],
      };
    });

  return (
    <>
      <EnTeteEtape
        slug="vides"
        complement={
          <p className="mt-2 max-w-2xl text-[14px] leading-snug text-encre-secondaire">
            Un besoin absent compte pour toute son importance, un besoin mal servi pour la moitié,
            un besoin correctement servi pour rien. Plus le score est élevé, plus il reste de place
            pour une nouvelle offre.
          </p>
        }
      />
      <ResumeValidation
        visible={validation.tentative}
        erreursChamps={{}}
        bloquantes={validation.tentative ? validation.bloquantes : []}
        avertissements={[]}
      />

      <div className="flex flex-col gap-5">
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[var(--radius-carte)] border border-bordure bg-surface px-4 py-3"
          aria-live="polite"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide text-encre-attenuee">
            Score de vides commerciaux
          </span>
          <span className="chiffres text-[22px] font-semibold text-encre">
            {scores.scoreGaps === null
              ? 'à qualifier'
              : `${formaterDecimal(scores.scoreGaps, 1)} / 100`}
          </span>
        </div>

        <Carte
          titre="Besoins autour du site"
          description="Qualifiez chaque besoin et ajustez son importance pour votre clientèle."
        >
          <ul className="divide-y divide-bordure">
            {config.besoins.map((besoin) => {
              const gap = gapDe(besoin.code);
              const nonApplicable = gap.nonApplicable === true;
              const idBase = `gap-${besoin.code}`;
              return (
                <li key={besoin.code} className={classes('py-4', nonApplicable && 'opacity-60')}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                    <div className="min-w-0 lg:w-2/5">
                      <p className="text-[15px] font-medium text-encre">{besoin.libelle}</p>
                      <p className="mt-0.5 text-[13px] leading-snug text-encre-secondaire">
                        {besoin.aide}
                      </p>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-start">
                      <fieldset className="flex-1" disabled={nonApplicable}>
                        <legend className="sr-only">Statut du besoin {besoin.libelle}</legend>
                        <div className="grid grid-cols-3 overflow-hidden rounded-[var(--radius-champ)] border border-bordure-forte bg-surface">
                          {STATUTS.map((s) => {
                            const choisi = gap.statutMarche === s.valeur && !nonApplicable;
                            const idOption = `${idBase}-${s.valeur}`;
                            return (
                              <label
                                key={s.valeur}
                                htmlFor={idOption}
                                title={s.aide}
                                className={classes(
                                  'flex min-h-11 cursor-pointer items-center justify-center border-l border-bordure-forte px-2 text-center text-[13.5px] font-medium first:border-l-0 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-accent',
                                  choisi
                                    ? 'bg-accent text-white'
                                    : 'text-encre hover:bg-surface-appui',
                                )}
                              >
                                <input
                                  id={idOption}
                                  type="radio"
                                  name={idBase}
                                  className="sr-only"
                                  checked={choisi}
                                  onChange={() =>
                                    modifier(besoin.code, {
                                      statutMarche: s.valeur,
                                      nonApplicable: false,
                                    })
                                  }
                                />
                                {s.libelle}
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                      <div className="flex items-center gap-3 sm:w-52">
                        <label
                          htmlFor={`${idBase}-importance`}
                          className="shrink-0 text-[13px] text-encre-secondaire"
                        >
                          Importance
                        </label>
                        <select
                          id={`${idBase}-importance`}
                          className="min-h-11 flex-1 rounded-[var(--radius-champ)] border border-bordure-forte bg-surface px-2 text-[14px] text-encre"
                          value={gap.importance ?? ''}
                          disabled={nonApplicable}
                          onChange={(e) =>
                            modifier(besoin.code, {
                              importance:
                                e.target.value === ''
                                  ? null
                                  : (Number(e.target.value) as 1 | 2 | 3),
                            })
                          }
                        >
                          <option value="">
                            Par défaut :{' '}
                            {
                              IMPORTANCES.find((i) => i.valeur === besoin.importanceParDefaut)
                                ?.libelle
                            }
                          </option>
                          {IMPORTANCES.map((i) => (
                            <option key={i.valeur} value={i.valeur}>
                              {i.valeur} : {i.libelle}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <label className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-encre-secondaire">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-accent"
                      checked={nonApplicable}
                      onChange={(e) =>
                        modifier(besoin.code, {
                          nonApplicable: e.target.checked,
                          statutMarche: e.target.checked ? null : gap.statutMarche,
                        })
                      }
                    />
                    Non applicable à ce projet
                  </label>
                </li>
              );
            })}
          </ul>
        </Carte>

        {validation.avertissements.length > 0 && (
          <Alerte
            niveau="info"
            titre={`${validation.avertissements.length} besoin${validation.avertissements.length > 1 ? 's' : ''} non qualifié${validation.avertissements.length > 1 ? 's' : ''}`}
          >
            Vous pouvez continuer : les besoins non qualifiés sont exclus du score et la synthèse le
            signalera.
          </Alerte>
        )}
      </div>

      <NavigationEtape slug="vides" onContinuer={validation.tenter} />
    </>
  );
}
