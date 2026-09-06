import type { Metadata } from 'next';
import Link from 'next/link';

import { LienBouton } from '@/composants/ui/bouton';
import { Pastille, type TonPastille } from '@/composants/ui/pastille';
import { CONFIG_COURANTE, formaterDecimal, type Orientation } from '@/lib/moteur';
import { listerClients } from '@/lib/services/clients';
import { listerEtudes, type FiltresListe } from '@/lib/services/etudes';
import { formaterDateHeure } from '@/lib/utilitaires/dates';

export const metadata: Metadata = { title: 'Tableau de bord' };

const TON_ORIENTATION: Record<Orientation, TonPastille> = {
  GO: 'bon',
  GO_SOUS_CONDITIONS: 'vigilance',
  NO_GO: 'critique',
};

const LIBELLE_STATUT: Record<string, { texte: string; ton: TonPastille }> = {
  BROUILLON: { texte: 'Brouillon', ton: 'neutre' },
  COMPLETE: { texte: 'Complète', ton: 'bon' },
  ARCHIVEE: { texte: 'Archivée', ton: 'info' },
};

const STATUTS: { valeur: string; libelle: string }[] = [
  { valeur: '', libelle: 'Actives (brouillons et complètes)' },
  { valeur: 'BROUILLON', libelle: 'Brouillons' },
  { valeur: 'COMPLETE', libelle: 'Complètes' },
  { valeur: 'ARCHIVEE', libelle: 'Archivées' },
];

export default async function TableauDeBordExpert({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filtres: FiltresListe = {
    statut: ['BROUILLON', 'COMPLETE', 'ARCHIVEE'].includes(params.statut ?? '')
      ? (params.statut as FiltresListe['statut'])
      : undefined,
    origine: params.origine === 'PME' || params.origine === 'EXPERT' ? params.origine : undefined,
    clientId: params.client || undefined,
    recherche: params.q || undefined,
    tri: ['modification', 'projet', 'client', 'score'].includes(params.tri ?? '')
      ? (params.tri as FiltresListe['tri'])
      : 'modification',
  };
  const [etudes, clients] = await Promise.all([listerEtudes(filtres), listerClients()]);
  const decimales = CONFIG_COURANTE.arrondi.decimalesAffichees;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">
            Espace Expert
          </p>
          <h1 className="text-[26px] font-bold tracking-tight text-encre sm:text-[30px]">
            Tableau de bord
          </h1>
          <p className="mt-1 text-[14px] text-encre-secondaire">
            {etudes.length} étude{etudes.length > 1 ? 's' : ''} affichée
            {etudes.length > 1 ? 's' : ''}.
          </p>
        </div>
        <LienBouton href="/expert/etudes/nouvelle">Nouvelle étude</LienBouton>
      </div>

      <form
        method="get"
        className="mt-5 grid gap-3 rounded-[var(--radius-carte)] border border-bordure bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <label className="flex flex-col gap-1 text-[13px] text-encre-secondaire lg:col-span-2">
          Recherche
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ''}
            placeholder="Projet, localité ou client"
            className="min-h-10 rounded-[var(--radius-champ)] border border-bordure-forte bg-surface px-3 text-[14px] text-encre"
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-encre-secondaire">
          Statut
          <select
            name="statut"
            defaultValue={filtres.statut ?? ''}
            className="min-h-10 rounded-[var(--radius-champ)] border border-bordure-forte bg-surface px-2 text-[14px] text-encre"
          >
            {STATUTS.map((s) => (
              <option key={s.valeur} value={s.valeur}>
                {s.libelle}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-encre-secondaire">
          Client
          <select
            name="client"
            defaultValue={filtres.clientId ?? ''}
            className="min-h-10 rounded-[var(--radius-champ)] border border-bordure-forte bg-surface px-2 text-[14px] text-encre"
          >
            <option value="">Tous les clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <label className="flex flex-1 flex-col gap-1 text-[13px] text-encre-secondaire">
            Tri
            <select
              name="tri"
              defaultValue={filtres.tri}
              className="min-h-10 rounded-[var(--radius-champ)] border border-bordure-forte bg-surface px-2 text-[14px] text-encre"
            >
              <option value="modification">Dernière modification</option>
              <option value="projet">Projet</option>
              <option value="client">Client</option>
              <option value="score">Score global</option>
            </select>
          </label>
          <button
            type="submit"
            className="min-h-10 rounded-[var(--radius-champ)] border border-bordure-forte bg-surface px-3 text-[14px] font-medium text-encre hover:bg-surface-appui"
          >
            Filtrer
          </button>
        </div>
        <div className="flex flex-wrap gap-2 text-[13px] lg:col-span-5">
          <Link
            href="/expert?origine=PME"
            className="rounded-full border border-bordure-forte px-3 py-1 text-encre hover:bg-surface-appui"
          >
            Études reçues du parcours PME
          </Link>
          <Link
            href="/expert"
            className="rounded-full border border-bordure-forte px-3 py-1 text-encre hover:bg-surface-appui"
          >
            Réinitialiser
          </Link>
        </div>
      </form>

      <div className="mt-5 overflow-x-auto rounded-[var(--radius-carte)] border border-bordure bg-surface">
        <table className="w-full min-w-[760px] text-[14px]">
          <thead className="bg-surface-appui text-left text-[12px] uppercase tracking-wide text-encre-attenuee">
            <tr>
              <th className="px-4 py-3 font-semibold">Projet</th>
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 font-semibold">Résultat</th>
              <th className="px-4 py-3 font-semibold">Modifiée le</th>
              <th className="px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bordure">
            {etudes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-encre-secondaire">
                  Aucune étude ne correspond à ces filtres.
                </td>
              </tr>
            )}
            {etudes.map((etude) => {
              const resultat = etude.resultats[0];
              const statut = LIBELLE_STATUT[etude.statut] ?? LIBELLE_STATUT.BROUILLON;
              return (
                <tr key={etude.id} className="align-top hover:bg-surface-appui/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/expert/etudes/${etude.id}`}
                      className="font-semibold text-encre underline-offset-2 hover:underline"
                    >
                      {etude.nomProjet || 'Projet sans nom'}
                    </Link>
                    <p className="text-[13px] text-encre-secondaire">
                      {[etude.concept, etude.localite].filter(Boolean).join(' · ') || 'À compléter'}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-1.5">
                      {etude.origine === 'PME' && (
                        <Pastille ton="info">Reçue du parcours PME</Pastille>
                      )}
                      {etude.typeScenario === 'VARIANTE' && (
                        <Pastille ton="accent">
                          Scénario{etude.libelleScenario ? ` : ${etude.libelleScenario}` : ''}
                        </Pastille>
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-encre">
                    {etude.client ? (
                      <Link
                        href={`/expert/clients/${etude.client.id}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {etude.client.nom}
                      </Link>
                    ) : (
                      <span className="text-encre-attenuee">Sans client</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Pastille ton={statut.ton}>{statut.texte}</Pastille>
                  </td>
                  <td className="px-4 py-3">
                    {resultat?.scoreGlobal !== null && resultat?.scoreGlobal !== undefined ? (
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="chiffres font-semibold text-encre">
                          {formaterDecimal(resultat.scoreGlobal, decimales)}
                        </span>
                        {resultat.orientationFinale && (
                          <Pastille ton={TON_ORIENTATION[resultat.orientationFinale]}>
                            {resultat.conditionsCritiques
                              ? CONFIG_COURANTE.libelles.orientationCritique
                              : CONFIG_COURANTE.libelles.orientations[resultat.orientationFinale]}
                          </Pastille>
                        )}
                      </span>
                    ) : (
                      <span className="text-encre-attenuee">Non calculable</span>
                    )}
                  </td>
                  <td className="chiffres px-4 py-3 text-encre-secondaire">
                    {formaterDateHeure(etude.misAJourLe)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/expert/etudes/${etude.id}`}
                      className="font-medium text-accent underline-offset-2 hover:underline"
                    >
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
