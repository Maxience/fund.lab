import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { archiverClientAction } from '@/app/expert/actions';
import { Carte } from '@/composants/ui/carte';
import { Pastille } from '@/composants/ui/pastille';
import { CONFIG_COURANTE, formaterDecimal } from '@/lib/moteur';
import { obtenirClient } from '@/lib/services/clients';
import { ErreurIntrouvable } from '@/lib/services/erreurs';
import { formaterDateHeure } from '@/lib/utilitaires/dates';

import { FormulaireClient } from '../formulaire-client';

export const metadata: Metadata = { title: 'Client' };

export default async function PageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let client: Awaited<ReturnType<typeof obtenirClient>>;
  try {
    client = await obtenirClient(id);
  } catch (erreur) {
    if (erreur instanceof ErreurIntrouvable) notFound();
    throw erreur;
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">
        <Link href="/expert/clients" className="hover:underline">
          Clients
        </Link>
      </p>
      <h1 className="text-[26px] font-bold tracking-tight text-encre sm:text-[30px]">
        {client.nom}
      </h1>
      {client.archiveLe && (
        <Pastille ton="info" className="mt-2">
          Client archivé
        </Pastille>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-start">
        <div className="flex flex-col gap-5">
          <Carte titre="Fiche client">
            <FormulaireClient
              client={{
                id: client.id,
                nom: client.nom,
                contact: client.contact,
                notesInternes: client.notesInternes,
              }}
            />
          </Carte>
          <Carte titre={client.archiveLe ? 'Restaurer' : 'Archiver'}>
            <p className="text-[14px] text-encre-secondaire">
              {client.archiveLe
                ? 'Le client réapparaîtra dans les listes et les filtres.'
                : 'Le client disparaît des listes ; ses études restent consultables.'}
            </p>
            <form action={archiverClientAction} className="mt-3">
              <input type="hidden" name="clientId" value={client.id} />
              {client.archiveLe && <input type="hidden" name="restaurer" value="1" />}
              <button
                type="submit"
                className="min-h-10 rounded-[var(--radius-champ)] border border-bordure-forte bg-surface px-3 text-[14px] font-medium text-encre hover:bg-surface-appui"
              >
                {client.archiveLe ? 'Restaurer le client' : 'Archiver le client'}
              </button>
            </form>
          </Carte>
        </div>

        <Carte
          titre={`${client.etudes.length} étude${client.etudes.length > 1 ? 's' : ''}`}
          actions={
            <Link
              href={`/expert/etudes/nouvelle?client=${client.id}`}
              className="text-[13px] font-medium text-accent underline-offset-2 hover:underline"
            >
              Nouvelle étude pour ce client
            </Link>
          }
        >
          {client.etudes.length === 0 ? (
            <p className="text-[14px] text-encre-secondaire">Aucune étude pour ce client.</p>
          ) : (
            <ul className="divide-y divide-bordure">
              {client.etudes.map((etude) => {
                const resultat = etude.resultats[0];
                return (
                  <li
                    key={etude.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <Link
                        href={`/expert/etudes/${etude.id}`}
                        className="font-semibold text-encre underline-offset-2 hover:underline"
                      >
                        {etude.nomProjet || 'Projet sans nom'}
                        {etude.typeScenario === 'VARIANTE' && etude.libelleScenario
                          ? ` (scénario : ${etude.libelleScenario})`
                          : ''}
                      </Link>
                      <p className="text-[13px] text-encre-secondaire">
                        {etude.statut === 'COMPLETE' ? 'Complète' : 'Brouillon'} · modifiée le{' '}
                        {formaterDateHeure(etude.misAJourLe)}
                      </p>
                    </div>
                    <span className="chiffres text-[14px] text-encre">
                      {resultat?.scoreGlobal !== null && resultat?.scoreGlobal !== undefined
                        ? `${formaterDecimal(resultat.scoreGlobal, CONFIG_COURANTE.arrondi.decimalesAffichees)} / 100`
                        : 'Non calculable'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Carte>
      </div>
    </main>
  );
}
