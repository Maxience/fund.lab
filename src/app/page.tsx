import Link from 'next/link';

import { RepriseEtude } from '@/composants/accueil/reprise-etude';
import { LienBouton } from '@/composants/ui/bouton';
import { CONFIG_COURANTE } from '@/lib/moteur';
import { cheminEtape, ETAPES } from '@/lib/parcours/etapes';

const RESULTATS = [
  {
    titre: 'Un score global sur 100 et une orientation',
    texte: 'GO, GO sous conditions ou NO GO, avec le détail de la règle qui a tranché.',
  },
  {
    titre: 'Quatre indicateurs expliqués',
    texte: "Demande accessible, vides commerciaux, pression concurrentielle, risques d'exécution.",
  },
  {
    titre: "Une projection de chiffre d'affaires et de loyer",
    texte: 'Le loyer que votre activité peut soutenir, comparé au loyer envisagé.',
  },
  {
    titre: 'Forces, vigilances et actions prioritaires',
    texte: "Trois forces, trois points de vigilance et les actions à mener avant d'ouvrir.",
  },
];

export default function Accueil() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-bordure bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-accent">
            FUND.lab
          </p>
          <p className="text-[13px] text-encre-secondaire">Outil d&apos;étude de chalandise</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
        <section className="grid gap-8 lg:grid-cols-[3fr_2fr] lg:items-center">
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-accent">
              Restaurant, snack, salon de thé
            </p>
            <h1 className="text-[34px] font-bold leading-[1.1] tracking-tight text-encre sm:text-[44px]">
              Testez un emplacement avant de vous engager.
            </h1>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-encre-secondaire">
              En huit étapes guidées, transformez vos observations de terrain en une lecture
              structurée : demande accessible, concurrence, besoins mal servis, loyer soutenable et
              risques. Vous obtenez un score, une orientation argumentée et des actions
              prioritaires.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <LienBouton href={cheminEtape('projet')} taille="grande">
                Commencer une étude
              </LienBouton>
              <p className="text-[13.5px] text-encre-secondaire">
                Sans compte. Environ 20 minutes. Enregistrée dans votre navigateur.
              </p>
            </div>
            <div className="mt-5 max-w-xl">
              <RepriseEtude />
            </div>
            <p className="mt-4 text-[13.5px] text-encre-secondaire">
              Vous voulez voir le résultat avant de commencer ?{' '}
              <Link
                href="/etude/exemple"
                className="font-medium text-accent underline-offset-2 hover:underline"
              >
                Ouvrir un exemple de synthèse
              </Link>{' '}
              avec des données fictives.
            </p>
          </div>
          <div className="rounded-[var(--radius-carte)] border border-bordure bg-surface p-5 shadow-[0_1px_2px_rgba(20,20,20,0.04)]">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-encre-attenuee">
              Ce que vous obtenez
            </p>
            <ul className="mt-3 divide-y divide-bordure">
              {RESULTATS.map((r) => (
                <li key={r.titre} className="py-3">
                  <p className="text-[15px] font-semibold text-encre">{r.titre}</p>
                  <p className="mt-0.5 text-[13.5px] leading-snug text-encre-secondaire">
                    {r.texte}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-[22px] font-bold tracking-tight text-encre">Les huit étapes</h2>
          <p className="mt-1 max-w-2xl text-[15px] text-encre-secondaire">
            Chaque étape pose des questions simples, avec des repères de saisie. Vous pouvez revenir
            en arrière à tout moment sans rien perdre.
          </p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ETAPES.map((etape) => (
              <li
                key={etape.slug}
                className="rounded-[var(--radius-carte)] border border-bordure bg-surface p-4"
              >
                <p className="chiffres text-[12px] font-semibold text-accent">
                  Étape {etape.numero}
                </p>
                <p className="mt-1 text-[15px] font-semibold text-encre">{etape.titre}</p>
                <p className="mt-1 text-[13px] leading-snug text-encre-secondaire">
                  {etape.description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16 rounded-[var(--radius-carte)] bg-surface-appui p-6">
          <h2 className="text-[17px] font-semibold text-encre">
            Une aide à la décision, pas une certitude
          </h2>
          <p className="mt-2 max-w-3xl text-[14.5px] leading-relaxed text-encre-secondaire">
            Le résultat est construit à partir des données que vous saisissez et des règles de la
            méthode FUND.lab (version {CONFIG_COURANTE.version}). Il ne remplace ni une étude
            géomarketing complète ni une décision d&apos;investissement. Même un résultat favorable
            demande de traiter les risques critiques et de vérifier sur le terrain les hypothèses
            les plus sensibles : la fréquentation et le ticket moyen.
          </p>
        </section>
      </main>

      <footer className="border-t border-bordure">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-[12.5px] text-encre-attenuee sm:px-6">
          <p>FUND.lab, outil d&apos;étude de chalandise. Méthodologie {CONFIG_COURANTE.version}.</p>
          <p>Espace Expert : bientôt disponible.</p>
        </div>
      </footer>
    </div>
  );
}
