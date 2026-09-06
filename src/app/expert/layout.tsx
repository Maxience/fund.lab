import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { seDeconnecter } from '@/app/connexion/actions';
import { exigerExpert } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: { default: 'Espace Expert', template: '%s | Espace Expert FUND.lab' },
};

const NAVIGATION = [
  { href: '/expert', libelle: 'Tableau de bord' },
  { href: '/expert/clients', libelle: 'Clients' },
  { href: '/expert/etudes/nouvelle', libelle: 'Nouvelle étude' },
];

/**
 * Coquille de l'espace Expert. La garde exigerExpert() s'exécute côté
 * serveur à chaque rendu : sans session valide, redirection vers la
 * connexion, quel que soit l'état du cookie.
 */
export default async function MiseEnPageExpert({ children }: { children: ReactNode }) {
  const session = await exigerExpert();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sans-impression border-b border-bordure bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-5">
            <Link
              href="/expert"
              className="text-[12px] font-semibold uppercase tracking-[0.16em] text-accent"
            >
              FUND.lab
            </Link>
            <nav aria-label="Espace Expert" className="flex items-center gap-1">
              {NAVIGATION.map((lien) => (
                <Link
                  key={lien.href}
                  href={lien.href}
                  className="rounded-[8px] px-2.5 py-1.5 text-[13.5px] font-medium text-encre hover:bg-surface-appui"
                >
                  {lien.libelle}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-[13px] text-encre-secondaire">
            <span>{session.utilisateur.nom}</span>
            <form action={seDeconnecter}>
              <button
                type="submit"
                className="rounded-[8px] border border-bordure-forte px-2.5 py-1 text-[13px] font-medium text-encre hover:bg-surface-appui"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
