import type { Metadata } from 'next';

import { Carte } from '@/composants/ui/carte';
import { listerClients } from '@/lib/services/clients';

import { FormulaireNouvelleEtude } from './formulaire-nouvelle-etude';

export const metadata: Metadata = { title: 'Nouvelle étude' };

export default async function PageNouvelleEtude({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;
  const clients = await listerClients();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">
        Espace Expert
      </p>
      <h1 className="text-[26px] font-bold tracking-tight text-encre sm:text-[30px]">
        Nouvelle étude
      </h1>
      <p className="mt-1 text-[14px] text-encre-secondaire">
        L&apos;étude suit les mêmes huit étapes que le parcours PME, avec en plus les preuves, les
        scénarios et la restitution détaillée.
      </p>
      <Carte className="mt-5">
        <FormulaireNouvelleEtude
          clients={clients.map((c) => ({ id: c.id, nom: c.nom }))}
          clientInitial={client}
        />
      </Carte>
    </main>
  );
}
