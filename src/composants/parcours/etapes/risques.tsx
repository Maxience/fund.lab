'use client';

import { useMemo } from 'react';

import { Alerte } from '@/composants/ui/alerte';
import { Carte } from '@/composants/ui/carte';
import { ChampTexte } from '@/composants/ui/champ-texte';
import { SelecteurNote } from '@/composants/ui/selecteur-note';
import { CONFIG_COURANTE, evaluerEtude, formaterDecimal, type RisqueSaisi } from '@/lib/moteur';

import { useEtude } from '../contexte-etude';
import { EnTeteEtape, ResumeValidation } from '../en-tete-etape';
import { NavigationEtape } from '../navigation-etape';
import { useValidationEtape } from '../use-validation-etape';

const LIBELLES_NOTES: [string, string, string, string] = [
  'Absent',
  'Faible',
  'Sérieux',
  'Critique',
];

export function EtapeRisques() {
  const { etude, modifierEtude } = useEtude();
  const validation = useValidationEtape('risques');
  const config = CONFIG_COURANTE;
  const resultat = useMemo(() => evaluerEtude(etude), [etude]);

  const risqueDe = (code: string): RisqueSaisi =>
    etude.risques.find((r) => r.risqueCode === code) ?? {
      risqueCode: code,
      notation: { note: null },
    };

  const modifier = (code: string, champ: Partial<RisqueSaisi>) =>
    modifierEtude((e) => {
      const existe = e.risques.some((r) => r.risqueCode === code);
      const base = risqueDe(code);
      return {
        ...e,
        risques: existe
          ? e.risques.map((r) => (r.risqueCode === code ? { ...r, ...champ } : r))
          : [...e.risques, { ...base, ...champ }],
      };
    });

  const critiques = resultat.decision.redFlags;

  return (
    <>
      <EnTeteEtape
        slug="risques"
        complement={
          <p className="mt-2 max-w-2xl text-[14px] leading-snug text-encre-secondaire">
            {config.libelles.aideEchelleRisque}
          </p>
        }
      />
      <ResumeValidation
        visible={validation.tentative}
        erreursChamps={{}}
        bloquantes={validation.tentative ? validation.bloquantes : []}
        avertissements={validation.avertissements.filter((a) => a.code !== 'DONNEE_MANQUANTE')}
      />

      <div className="flex flex-col gap-5">
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[var(--radius-carte)] border border-bordure bg-surface px-4 py-3"
          aria-live="polite"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide text-encre-attenuee">
            Score de risque
          </span>
          <span className="chiffres text-[22px] font-semibold text-encre">
            {resultat.scores.scoreRisque === null
              ? 'à évaluer'
              : `${formaterDecimal(resultat.scores.scoreRisque, 1)} / 100`}
          </span>
          <span className="text-[13px] text-encre-secondaire">
            Plus il est bas, mieux les risques sont maîtrisés.
          </span>
        </div>

        {critiques.length > 0 && (
          <Alerte niveau="critique" titre="Signal critique détecté">
            <ul className="list-disc space-y-1 pl-5">
              {critiques.map((f) => (
                <li key={f.code}>
                  {f.libelle}. {f.effet}
                </li>
              ))}
            </ul>
          </Alerte>
        )}

        <Carte
          titre="Risques d'exécution"
          description="Notez chaque catégorie, puis décrivez la mesure prévue pour les risques sérieux ou critiques."
        >
          <div className="divide-y divide-bordure">
            {config.risques.map((categorie) => {
              const risque = risqueDe(categorie.code);
              const note = risque.notation.note;
              const mesureAttendue =
                note !== null &&
                note >= config.redFlags.noteVigilance &&
                !risque.notation.nonApplicable;
              return (
                <div key={categorie.code} className="py-1">
                  <SelecteurNote
                    id={`risque-${categorie.code}`}
                    libelle={categorie.libelle}
                    aide={categorie.aide}
                    notation={risque.notation}
                    onChange={(notation) => modifier(categorie.code, { notation })}
                    libellesNotes={LIBELLES_NOTES}
                  />
                  {mesureAttendue && (
                    <div className="mb-3 grid gap-4 rounded-[var(--radius-champ)] bg-surface-appui p-4 sm:grid-cols-[2fr_1fr]">
                      <ChampTexte
                        id={`risque-${categorie.code}-mesure`}
                        libelle={
                          note >= config.redFlags.noteCritique
                            ? 'Mesure de traitement (indispensable pour un risque critique)'
                            : 'Mesure de traitement'
                        }
                        valeur={risque.mesure ?? ''}
                        onChange={(mesure) => modifier(categorie.code, { mesure })}
                        obligatoire={note >= config.redFlags.noteCritique}
                        placeholder="Négocier un bail de cinq ans avec clause de sortie"
                        maxLength={300}
                      />
                      <ChampTexte
                        id={`risque-${categorie.code}-responsable`}
                        libelle="Responsable"
                        valeur={risque.responsable ?? ''}
                        onChange={(responsable) => modifier(categorie.code, { responsable })}
                        placeholder="Promoteur"
                        maxLength={80}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Carte>
      </div>

      <NavigationEtape
        slug="risques"
        onContinuer={validation.tenter}
        libelleSuivant="Voir le résultat"
      />
    </>
  );
}
