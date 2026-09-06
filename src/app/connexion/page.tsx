import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { PREFIXE_ESPACE_EXPERT } from '@/lib/auth/constantes';
import { obtenirSession } from '@/lib/auth/session';

import { FormulaireConnexion } from './formulaire-connexion';

export const metadata: Metadata = { title: 'Connexion Expert' };

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  const session = await obtenirSession();
  if (session) redirect(PREFIXE_ESPACE_EXPERT);
  const { suite } = await searchParams;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-bordure bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="text-[12px] font-semibold uppercase tracking-[0.16em] text-accent"
          >
            FUND.lab
          </Link>
          <p className="text-[13px] text-encre-secondaire">Espace Expert</p>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="rounded-[var(--radius-carte)] border border-bordure bg-surface p-6 shadow-[0_1px_2px_rgba(20,20,20,0.04)] sm:p-8">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">
            Espace Expert
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight text-encre">Connexion</h1>
          <p className="mt-2 text-[14px] text-encre-secondaire">
            Réservé aux consultants FUND.lab. Les comptes sont créés par l&apos;administrateur du
            dépôt.
          </p>
          <div className="mt-6">
            <FormulaireConnexion suite={suite} />
          </div>
        </div>
        <p className="mt-5 text-center text-[13px] text-encre-secondaire">
          Vous êtes un porteur de projet ?{' '}
          <Link
            href="/etude/projet"
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            Commencer une étude sans compte
          </Link>
        </p>
      </main>
    </div>
  );
}
