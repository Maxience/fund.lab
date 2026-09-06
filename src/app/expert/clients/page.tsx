import type { Metadata } from 'next';
import Link from 'next/link';

import { Carte } from '@/composants/ui/carte';
import { listerClients } from '@/lib/services/clients';
import { formaterDate } from '@/lib/utilitaires/dates';

import { FormulaireClient } from './formulaire-client';

export const metadata: Metadata = { title: 'Clients' };

export default async function PageClients({
  searchParams,
}: {
  searchParams: Promise<{ archives?: string }>;
}) {
  const { archives } = await searchParams;
  const clients = await listerClients({ archives: archives === '1' });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">
        Espace Expert
      </p>
      <h1 className="text-[26px] font-bold tracking-tight text-encre sm:text-[30px]">Clients</h1>

      <div className="mt-5 grid gap-5 lg:grid-cols-[2fr_1fr] lg:items-start">
        <Carte
          titre={`${clients.length} client${clients.length > 1 ? 's' : ''}`}
          actions={
            <Link
              href={archives === '1' ? '/expert/clients' : '/expert/clients?archives=1'}
              className="text-[13px] font-medium text-accent underline-offset-2 hover:underline"
            >
              {archives === '1' ? 'Masquer les archivés' : 'Afficher les archivés'}
            </Link>
          }
        >
          {clients.length === 0 ? (
            <p className="text-[14px] text-encre-secondaire">Aucun client pour le moment.</p>
          ) : (
            <ul className="divide-y divide-bordure">
              {clients.map((client) => (
                <li
                  key={client.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <Link
                      href={`/expert/clients/${client.id}`}
                      className="font-semibold text-encre underline-offset-2 hover:underline"
                    >
                      {client.nom}
                    </Link>
                    <p className="text-[13px] text-encre-secondaire">
                      {client.contact || 'Sans contact'} · {client._count.etudes} étude
                      {client._count.etudes > 1 ? 's' : ''} · créé le {formaterDate(client.creeLe)}
                      {client.archiveLe ? ' · archivé' : ''}
                    </p>
                  </div>
                  <Link
                    href={`/expert?client=${client.id}`}
                    className="text-[13px] font-medium text-accent underline-offset-2 hover:underline"
                  >
                    Voir ses études
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Carte>
        <Carte titre="Nouveau client">
          <FormulaireClient />
        </Carte>
      </div>
    </main>
  );
}
