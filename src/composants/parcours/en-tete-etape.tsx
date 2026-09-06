import type { ReactNode } from 'react';

import { Alerte } from '@/composants/ui/alerte';
import type { Alerte as AlerteMoteur } from '@/lib/moteur';
import { etapeParSlug, NOMBRE_ETAPES, type SlugEtape } from '@/lib/parcours/etapes';

export function EnTeteEtape({ slug, complement }: { slug: SlugEtape; complement?: ReactNode }) {
  const etape = etapeParSlug(slug);
  if (!etape) return null;
  return (
    <header className="mb-5">
      <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">
        Étape {etape.numero} sur {NOMBRE_ETAPES}
      </p>
      <h1 className="text-[26px] font-bold leading-tight tracking-tight text-encre sm:text-[30px]">
        {etape.titre}
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-snug text-encre-secondaire">
        {etape.description}
      </p>
      {complement}
    </header>
  );
}

export interface ProprietesResumeValidation {
  /** Affiché seulement après une tentative de passage à l'étape suivante. */
  visible: boolean;
  erreursChamps: Record<string, string>;
  bloquantes: AlerteMoteur[];
  avertissements: AlerteMoteur[];
}

/** Résumé des erreurs de l'étape, placé en haut du formulaire. */
export function ResumeValidation({
  visible,
  erreursChamps,
  bloquantes,
  avertissements,
}: ProprietesResumeValidation) {
  const nombreErreurs = Object.keys(erreursChamps).length + bloquantes.length;
  return (
    <div className="mb-5 flex flex-col gap-3 empty:hidden">
      {visible && nombreErreurs > 0 && (
        <Alerte
          niveau="critique"
          titre={
            nombreErreurs === 1
              ? 'Un point empêche de continuer'
              : `${nombreErreurs} points empêchent de continuer`
          }
        >
          <ul className="list-disc space-y-1 pl-5">
            {Object.values(erreursChamps).map((message, i) => (
              <li key={`champ-${i}`}>{message}</li>
            ))}
            {bloquantes.map((a, i) => (
              <li key={`alerte-${i}`}>{a.message}</li>
            ))}
          </ul>
        </Alerte>
      )}
      {avertissements.length > 0 && (
        <Alerte
          niveau="vigilance"
          titre={
            avertissements.length === 1
              ? 'Un point à vérifier'
              : `${avertissements.length} points à vérifier`
          }
        >
          <ul className="list-disc space-y-1 pl-5">
            {avertissements.map((a, i) => (
              <li key={i}>{a.message}</li>
            ))}
          </ul>
          <p className="mt-1.5 text-[13px] text-encre-secondaire">
            Vous pouvez continuer : la synthèse signalera ces points.
          </p>
        </Alerte>
      )}
    </div>
  );
}
