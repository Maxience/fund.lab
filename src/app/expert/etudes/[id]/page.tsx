import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { supprimerPreuveAction } from '@/app/expert/actions';
import { SyntheseEtude } from '@/composants/synthese/synthese-etude';
import { Carte } from '@/composants/ui/carte';
import { Pastille, type TonPastille } from '@/composants/ui/pastille';
import {
  calculerCaMensuel,
  calculerLoyerMaximal,
  formaterDecimal,
  formaterFcfa,
  obtenirConfiguration,
  type Orientation,
  type ResultatEtude,
} from '@/lib/moteur';
import { ETAPES } from '@/lib/parcours/etapes';
import { listerClients } from '@/lib/services/clients';
import { ErreurIntrouvable } from '@/lib/services/erreurs';
import { obtenirSaisie } from '@/lib/services/etudes';
import { LIBELLES_NIVEAU_PREUVE } from '@/lib/services/preuves';
import { formaterDate, formaterDateHeure } from '@/lib/utilitaires/dates';

import { ActionsDossier, FormulaireRattachement, FormulaireScenario } from './actions-dossier';
import { FormulairePreuve } from './formulaire-preuve';

export const metadata: Metadata = { title: 'Dossier' };

const TON_ORIENTATION: Record<Orientation, TonPastille> = {
  GO: 'bon',
  GO_SOUS_CONDITIONS: 'vigilance',
  NO_GO: 'critique',
};

const LIBELLE_RUBRIQUE: Record<string, string> = {
  PROJET: 'Projet et site',
  HYPOTHESES: 'Hypothèses commerciales',
  ZONES: 'Zones de chalandise',
  DEMANDE: 'Demande',
  CONCURRENCE: 'Concurrence',
  GAPS: 'Vides commerciaux',
  RISQUES: 'Risques',
  SYNTHESE: 'Synthèse',
};

const VARIATIONS = [-0.2, -0.1, 0, 0.1, 0.2];

function libelleOrientation(
  resultat:
    { orientationFinale: Orientation | null; conditionsCritiques: boolean } | null | undefined,
  config: ReturnType<typeof obtenirConfiguration>,
): { texte: string; ton: TonPastille } | null {
  if (!resultat?.orientationFinale) return null;
  return {
    texte: resultat.conditionsCritiques
      ? config.libelles.orientationCritique
      : config.libelles.orientations[resultat.orientationFinale],
    ton: TON_ORIENTATION[resultat.orientationFinale],
  };
}

export default async function PageDossier({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let donnees: Awaited<ReturnType<typeof obtenirSaisie>>;
  try {
    donnees = await obtenirSaisie(id);
  } catch (erreur) {
    if (erreur instanceof ErreurIntrouvable) notFound();
    throw erreur;
  }
  const { etude, saisie, resultat } = donnees;
  const config = obtenirConfiguration(etude.versionMethodologie);
  const decimales = config.arrondi.decimalesAffichees;
  const clients = await listerClients();
  const cheminEtape = (slug: string) => `/expert/etudes/${etude.id}/${slug}`;
  const slugAtteint = ETAPES[Math.min(Math.max(etude.etapeAtteinte, 1), ETAPES.length) - 1].slug;
  const statutAffiche = etude.archiveeLe
    ? 'ARCHIVEE'
    : etude.statut === 'COMPLETE'
      ? 'COMPLETE'
      : 'BROUILLON';

  // Résultat de la référence, pour comparer un scénario à sa source.
  let source: { saisie: typeof saisie; resultat: ResultatEtude; nom: string } | null = null;
  if (etude.typeScenario === 'VARIANTE' && etude.etudeSourceId) {
    try {
      const donneesSource = await obtenirSaisie(etude.etudeSourceId);
      source = {
        saisie: donneesSource.saisie,
        resultat: donneesSource.resultat,
        nom: donneesSource.etude.nomProjet,
      };
    } catch {
      source = null;
    }
  }

  const resultatsFiges = etude.resultats.filter((r) => r.fige);
  const preuvesParRubrique = new Map<string, typeof etude.preuves>();
  for (const preuve of etude.preuves) {
    const liste = preuvesParRubrique.get(preuve.rubrique) ?? [];
    liste.push(preuve);
    preuvesParRubrique.set(preuve.rubrique, liste);
  }

  const h = saisie.hypotheses;
  const sensibilite = (variable: 'ticket' | 'clients') =>
    VARIATIONS.map((v) => {
      const clients = variable === 'clients' ? (h.clientsParJour ?? 0) * (1 + v) : h.clientsParJour;
      const ticket = variable === 'ticket' ? (h.ticketMoyenFcfa ?? 0) * (1 + v) : h.ticketMoyenFcfa;
      const ca = calculerCaMensuel(clients, ticket, h.joursOuvertureParMois);
      const loyer = calculerLoyerMaximal(ca, resultat.projection.partLoyerCible);
      return { variation: v, ca, loyer };
    });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <p className="sans-impression text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">
        <Link href="/expert" className="hover:underline">
          Tableau de bord
        </Link>
        <span className="mx-1.5 text-encre-attenuee">/</span>
        Dossier
      </p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-encre sm:text-[30px]">
            {etude.nomProjet || 'Projet sans nom'}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[14px] text-encre-secondaire">
            <Pastille
              ton={
                statutAffiche === 'COMPLETE'
                  ? 'bon'
                  : statutAffiche === 'ARCHIVEE'
                    ? 'info'
                    : 'neutre'
              }
            >
              {statutAffiche === 'COMPLETE'
                ? 'Complète'
                : statutAffiche === 'ARCHIVEE'
                  ? 'Archivée'
                  : 'Brouillon'}
            </Pastille>
            {etude.origine === 'PME' && <Pastille ton="info">Reçue du parcours PME</Pastille>}
            {etude.typeScenario === 'VARIANTE' && (
              <Pastille ton="accent">
                Scénario{etude.libelleScenario ? ` : ${etude.libelleScenario}` : ''}
              </Pastille>
            )}
            <span>
              Créée le {formaterDate(etude.creeLe)}, modifiée le{' '}
              {formaterDateHeure(etude.misAJourLe)}
              {etude.proprietaire ? ` par ${etude.proprietaire.nom}` : ''}. Méthodologie{' '}
              {etude.versionMethodologie}.
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5">
        <ActionsDossier
          etudeId={etude.id}
          statut={statutAffiche}
          finalisable={resultat.finalisable}
          etapeAtteinte={etude.etapeAtteinte}
          slugEtapeAtteinte={slugAtteint}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Carte
          titre="Client"
          description="Le dossier est classé par client dans le tableau de bord."
          className="sans-impression"
        >
          {etude.client ? (
            <p className="mb-3 text-[14px] text-encre">
              Rattachée à{' '}
              <Link
                href={`/expert/clients/${etude.client.id}`}
                className="font-semibold text-accent underline-offset-2 hover:underline"
              >
                {etude.client.nom}
              </Link>
              .
            </p>
          ) : (
            <p className="mb-3 text-[14px] text-encre-secondaire">Aucun client rattaché.</p>
          )}
          <FormulaireRattachement
            etudeId={etude.id}
            clientId={etude.clientId}
            clients={clients.map((c) => ({ id: c.id, nom: c.nom }))}
          />
        </Carte>

        <Carte
          titre="Scénarios"
          description="Un scénario copie l'étude pour tester d'autres hypothèses sans toucher à la référence."
          className="sans-impression"
        >
          {etude.typeScenario === 'VARIANTE' && etude.etudeSource ? (
            <p className="mb-3 text-[14px] text-encre">
              Dérivé de{' '}
              <Link
                href={`/expert/etudes/${etude.etudeSource.id}`}
                className="font-semibold text-accent underline-offset-2 hover:underline"
              >
                {etude.etudeSource.nomProjet || "l'étude de référence"}
              </Link>
              .
            </p>
          ) : etude.variantes.length > 0 ? (
            <ul className="mb-3 divide-y divide-bordure">
              {etude.variantes.map((v) => {
                const orientation = libelleOrientation(v.resultats[0], config);
                return (
                  <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <Link
                      href={`/expert/etudes/${v.id}`}
                      className="font-medium text-accent underline-offset-2 hover:underline"
                    >
                      {v.libelleScenario || 'Scénario'}
                    </Link>
                    <span className="flex items-center gap-2 text-[13px] text-encre-secondaire">
                      {v.resultats[0]?.scoreGlobal !== null &&
                        v.resultats[0]?.scoreGlobal !== undefined && (
                          <span className="chiffres font-semibold text-encre">
                            {formaterDecimal(v.resultats[0].scoreGlobal, decimales)}
                          </span>
                        )}
                      {orientation && (
                        <Pastille ton={orientation.ton}>{orientation.texte}</Pastille>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mb-3 text-[14px] text-encre-secondaire">
              Aucun scénario pour l&apos;instant.
            </p>
          )}
          {statutAffiche !== 'ARCHIVEE' && <FormulaireScenario etudeId={etude.id} />}
        </Carte>
      </div>

      {source && (
        <Carte
          titre="Scénario et référence côte à côte"
          description="Les mêmes indicateurs, calculés par le même moteur."
          className="mt-5"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-[14px]">
              <thead className="text-left text-[12px] uppercase tracking-wide text-encre-attenuee">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Indicateur</th>
                  <th className="py-2 pr-4 font-semibold">
                    Référence : {source.nom || 'étude source'}
                  </th>
                  <th className="py-2 pr-4 font-semibold">Scénario : {etude.libelleScenario}</th>
                  <th className="py-2 font-semibold">Écart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordure">
                {(
                  [
                    [
                      'Score global',
                      source.resultat.scores.scoreGlobal,
                      resultat.scores.scoreGlobal,
                    ],
                    [
                      'Attractivité',
                      source.resultat.scores.attractivite,
                      resultat.scores.attractivite,
                    ],
                    [
                      'Demande accessible',
                      source.resultat.scores.demandeGlobale,
                      resultat.scores.demandeGlobale,
                    ],
                    [
                      'Vides commerciaux',
                      source.resultat.scores.scoreGaps,
                      resultat.scores.scoreGaps,
                    ],
                    [
                      'Pression concurrentielle',
                      source.resultat.scores.pressionConcurrentielle,
                      resultat.scores.pressionConcurrentielle,
                    ],
                    [
                      "Risque d'exécution",
                      source.resultat.scores.scoreRisque,
                      resultat.scores.scoreRisque,
                    ],
                  ] as [string, number | null, number | null][]
                ).map(([libelle, a, b]) => (
                  <tr key={libelle}>
                    <td className="py-2 pr-4 text-encre">{libelle}</td>
                    <td className="chiffres py-2 pr-4">
                      {a === null ? 'Non calculable' : formaterDecimal(a, decimales)}
                    </td>
                    <td className="chiffres py-2 pr-4 font-semibold">
                      {b === null ? 'Non calculable' : formaterDecimal(b, decimales)}
                    </td>
                    <td className="chiffres py-2">
                      {a === null || b === null
                        ? ''
                        : `${b - a >= 0 ? '+' : ''}${formaterDecimal(b - a, decimales)}`}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 pr-4 text-encre">CA mensuel indicatif</td>
                  <td className="chiffres py-2 pr-4">
                    {source.resultat.projection.caMensuelFcfa === null
                      ? 'Non calculable'
                      : formaterFcfa(source.resultat.projection.caMensuelFcfa)}
                  </td>
                  <td className="chiffres py-2 pr-4 font-semibold">
                    {resultat.projection.caMensuelFcfa === null
                      ? 'Non calculable'
                      : formaterFcfa(resultat.projection.caMensuelFcfa)}
                  </td>
                  <td className="py-2"></td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-encre">Orientation finale</td>
                  <td className="py-2 pr-4">{source.resultat.decision.libelle}</td>
                  <td className="py-2 pr-4 font-semibold">{resultat.decision.libelle}</td>
                  <td className="py-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Carte>
      )}

      <div className="mt-5">
        <SyntheseEtude
          etude={saisie}
          resultat={resultat}
          config={config}
          statut={statutAffiche === 'COMPLETE' ? 'COMPLETE' : 'BROUILLON'}
          cheminEtape={cheminEtape}
        />
      </div>

      <Carte
        titre="Lecture de sensibilité"
        description="Effet d'une variation du ticket moyen ou de la fréquentation sur le chiffre d'affaires et le loyer soutenable. Le score global ne dépend pas de ces deux hypothèses."
        className="mt-5"
      >
        {resultat.projection.caMensuelFcfa === null ? (
          <p className="text-[14px] text-encre-secondaire">
            Renseignez les hypothèses commerciales pour lire la sensibilité.
          </p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {(['ticket', 'clients'] as const).map((variable) => (
              <div key={variable} className="overflow-x-auto">
                <p className="mb-2 text-[14px] font-semibold text-encre">
                  {variable === 'ticket'
                    ? 'Variation du ticket moyen'
                    : 'Variation de la fréquentation'}
                </p>
                <table className="w-full min-w-[360px] text-[14px]">
                  <thead className="text-left text-[12px] uppercase tracking-wide text-encre-attenuee">
                    <tr>
                      <th className="py-1.5 pr-3 font-semibold">Variation</th>
                      <th className="py-1.5 pr-3 font-semibold">CA mensuel</th>
                      <th className="py-1.5 pr-3 font-semibold">Loyer soutenable</th>
                      <th className="py-1.5 font-semibold">Écart au loyer envisagé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bordure">
                    {sensibilite(variable).map(({ variation, ca, loyer }) => {
                      const envisage = resultat.projection.loyerMensuelEnvisageFcfa;
                      const ecart = loyer !== null && envisage !== null ? envisage - loyer : null;
                      return (
                        <tr
                          key={variation}
                          className={variation === 0 ? 'bg-surface-appui font-semibold' : ''}
                        >
                          <td className="chiffres py-1.5 pr-3">
                            {variation === 0
                              ? 'Hypothèse saisie'
                              : `${variation > 0 ? '+' : ''}${Math.round(variation * 100)} %`}
                          </td>
                          <td className="chiffres py-1.5 pr-3">
                            {ca === null ? '' : formaterFcfa(ca)}
                          </td>
                          <td className="chiffres py-1.5 pr-3">
                            {loyer === null ? '' : formaterFcfa(loyer)}
                          </td>
                          <td
                            className={
                              ecart !== null && ecart > 0
                                ? 'chiffres py-1.5 text-vigilance'
                                : 'chiffres py-1.5 text-encre-secondaire'
                            }
                          >
                            {ecart === null
                              ? 'Loyer envisagé non renseigné'
                              : ecart > 0
                                ? `Dépasse de ${formaterFcfa(ecart)}`
                                : `Marge de ${formaterFcfa(-ecart)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </Carte>

      <Carte
        titre="Preuves et commentaires"
        description="Sources et niveau de preuve par rubrique. Une donnée déclarative n'a pas le poids d'une donnée observée ou documentée."
        className="mt-5"
      >
        {etude.preuves.length === 0 ? (
          <p className="text-[14px] text-encre-secondaire">Aucune preuve enregistrée.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {[...preuvesParRubrique.entries()].map(([rubrique, preuves]) => (
              <div key={rubrique}>
                <h3 className="text-[14px] font-semibold text-encre">
                  {LIBELLE_RUBRIQUE[rubrique] ?? rubrique}
                </h3>
                <ul className="mt-1 divide-y divide-bordure">
                  {preuves.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-start justify-between gap-3 py-2 text-[14px]"
                    >
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2">
                          <Pastille
                            ton={
                              p.niveau === 'DOCUMENTEE'
                                ? 'bon'
                                : p.niveau === 'OBSERVEE'
                                  ? 'accent'
                                  : p.niveau === 'DECLARATIVE'
                                    ? 'vigilance'
                                    : 'neutre'
                            }
                          >
                            {LIBELLES_NIVEAU_PREUVE[p.niveau]}
                          </Pastille>
                          {p.source && <span className="text-encre">{p.source}</span>}
                        </p>
                        {p.commentaire && (
                          <p className="mt-1 text-encre-secondaire">{p.commentaire}</p>
                        )}
                        <p className="mt-1 text-[12.5px] text-encre-attenuee">
                          {p.dateObservation
                            ? `Observé le ${formaterDate(p.dateObservation)}. `
                            : ''}
                          Ajouté le {formaterDate(p.creeLe)}
                          {p.auteur ? ` par ${p.auteur.nom}` : ''}.
                        </p>
                      </div>
                      <form action={supprimerPreuveAction} className="sans-impression">
                        <input type="hidden" name="etudeId" value={etude.id} />
                        <input type="hidden" name="preuveId" value={p.id} />
                        <button
                          type="submit"
                          className="text-[13px] text-critique underline-offset-2 hover:underline"
                        >
                          Supprimer
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {statutAffiche !== 'ARCHIVEE' && (
          <div className="sans-impression mt-5 border-t border-bordure pt-5">
            <h3 className="mb-3 text-[14px] font-semibold text-encre">Ajouter une preuve</h3>
            <FormulairePreuve etudeId={etude.id} />
          </div>
        )}
      </Carte>

      <Carte
        titre="Résultats figés"
        description="Chaque finalisation enregistre le résultat avec la version du moteur et les paramètres utilisés."
        className="mt-5"
      >
        {resultatsFiges.length === 0 ? (
          <p className="text-[14px] text-encre-secondaire">Aucune finalisation enregistrée.</p>
        ) : (
          <ul className="divide-y divide-bordure text-[14px]">
            {resultatsFiges.map((r) => {
              const orientation = libelleOrientation(r, config);
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="text-encre">
                    {formaterDateHeure(r.calculeLe)} · moteur {r.versionMoteur}, méthodologie{' '}
                    {r.versionMethodologie}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="chiffres font-semibold text-encre">
                      {r.scoreGlobal === null
                        ? 'Non calculable'
                        : formaterDecimal(r.scoreGlobal, decimales)}
                    </span>
                    {orientation && <Pastille ton={orientation.ton}>{orientation.texte}</Pastille>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Carte>
    </main>
  );
}
