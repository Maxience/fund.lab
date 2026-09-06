import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { seDeconnecter } from '@/app/connexion/actions';
import { exigerExpert } from '@/lib/auth/session';

import { NavigationExpert } from './navigation-expert';

export const metadata: Metadata = {
  title: { default: 'Espace Expert', template: '%s | Espace Expert FUND.lab' },
};

/**
 * Coquille de l'espace Expert : barre latérale fixe sur grand écran (marque,
 * navigation, identité et déconnexion), repliée en bandeau sur mobile. La
 * garde exigerExpert() s'exécute côté serveur à chaque rendu : sans session
 * valide, redirection vers la connexion, quel que soit l'état du cookie.
 */
export default async function MiseEnPageExpert({ children }: { children: ReactNode }) {
  const session = await exigerExpert();

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside className="sans-impression sticky top-0 z-10 border-b border-bordure bg-surface lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex flex-col gap-3 px-4 py-3 lg:h-full lg:gap-6 lg:px-3 lg:py-4">
          <Link
            href="/expert"
            className="px-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-accent"
          >
            FUND.lab
          </Link>
          <NavigationExpert />
          <div className="mt-auto hidden flex-col gap-2 border-t border-bordure pt-4 lg:flex">
            <p className="truncate px-1 text-[13px] text-encre-secondaire">
              {session.utilisateur.nom}
            </p>
            <form action={seDeconnecter}>
              <button
                type="submit"
                className="w-full rounded-[8px] border border-bordure-forte px-2.5 py-1.5 text-[13px] font-medium text-encre hover:bg-surface-appui"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sans-impression flex items-center justify-between gap-3 border-b border-bordure bg-surface px-4 py-2 text-[13px] text-encre-secondaire lg:hidden">
          <span className="truncate">{session.utilisateur.nom}</span>
          <form action={seDeconnecter}>
            <button
              type="submit"
              className="shrink-0 rounded-[8px] border border-bordure-forte px-2.5 py-1 text-[13px] font-medium text-encre hover:bg-surface-appui"
            >
              Se déconnecter
            </button>
          </form>
        </div>
        {children}
      </div>
    </div>
  );
}
