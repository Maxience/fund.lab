'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ETAPES, NOMBRE_ETAPES, type Etape } from '@/lib/parcours/etapes';
import { classes } from '@/lib/utilitaires/classes';

import { useEtude } from './contexte-etude';

function etatEtape(etape: Etape, courante: number, atteinte: number) {
  if (etape.numero === courante) return 'courante' as const;
  if (etape.numero <= atteinte) return 'accessible' as const;
  return 'verrouillee' as const;
}

/**
 * Progression du parcours : liste complète sur grand écran, résumé compact
 * avec barre de progression sur mobile. Les étapes déjà atteintes restent
 * accessibles ; les suivantes se déverrouillent en avançant.
 */
export function BarreEtapes() {
  const pathname = usePathname();
  const { locale, chemin } = useEtude();
  const courante = ETAPES.find((e) => pathname === chemin(e.slug))?.numero ?? 1;
  const atteinte = Math.max(locale.etapeAtteinte, courante);
  const etapeCourante = ETAPES[courante - 1];
  const progression = Math.round((courante / NOMBRE_ETAPES) * 100);

  const liste = (
    <ol className="flex flex-col gap-1">
      {ETAPES.map((etape) => {
        const etat = etatEtape(etape, courante, atteinte);
        const contenu = (
          <>
            <span
              className={classes(
                'chiffres flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold',
                etat === 'courante' && 'border-accent bg-accent text-white',
                etat === 'accessible' && 'border-accent bg-accent-clair text-accent-fonce',
                etat === 'verrouillee' && 'border-bordure-forte bg-surface text-encre-attenuee',
              )}
              aria-hidden="true"
            >
              {etape.numero}
            </span>
            <span
              className={classes(
                'text-[14px]',
                etat === 'verrouillee' ? 'text-encre-attenuee' : 'text-encre',
              )}
            >
              {etape.court}
            </span>
          </>
        );
        const classesLigne = classes(
          'flex items-center gap-3 rounded-[10px] px-2 py-1.5',
          etat === 'courante' && 'bg-surface font-semibold shadow-[0_1px_2px_rgba(20,20,20,0.06)]',
        );
        return (
          <li key={etape.slug}>
            {etat === 'verrouillee' ? (
              <span className={classesLigne} aria-disabled="true">
                {contenu}
              </span>
            ) : (
              <Link
                href={chemin(etape.slug)}
                className={classes(classesLigne, 'hover:bg-surface')}
                aria-current={etat === 'courante' ? 'step' : undefined}
              >
                {contenu}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );

  return (
    <nav aria-label="Étapes du parcours" className="sans-impression">
      <div className="hidden lg:block">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-encre-attenuee">
          Parcours en {NOMBRE_ETAPES} étapes
        </p>
        {liste}
      </div>

      <details className="group rounded-[var(--radius-carte)] border border-bordure bg-surface px-4 py-3 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="block text-[12px] font-semibold uppercase tracking-wide text-encre-attenuee">
              Étape {courante} sur {NOMBRE_ETAPES}
            </span>
            <span className="block truncate text-[15px] font-semibold text-encre">
              {etapeCourante.titre}
            </span>
          </span>
          <span className="shrink-0 text-[13px] text-accent group-open:hidden">
            Toutes les étapes
          </span>
          <span className="hidden shrink-0 text-[13px] text-accent group-open:inline">Réduire</span>
        </summary>
        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-appui"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={NOMBRE_ETAPES}
          aria-valuenow={courante}
          aria-label={`Progression : étape ${courante} sur ${NOMBRE_ETAPES}`}
        >
          <div className="h-full rounded-full bg-accent" style={{ width: `${progression}%` }} />
        </div>
        <div className="mt-3 border-t border-bordure pt-3">{liste}</div>
      </details>
    </nav>
  );
}
