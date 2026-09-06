import Link from 'next/link';

import { Alerte } from '@/composants/ui/alerte';
import { Carte } from '@/composants/ui/carte';
import { Pastille, type TonPastille } from '@/composants/ui/pastille';
import {
  formaterDecimal,
  formaterFcfa,
  formaterPourcentage,
  type ConfigurationMethodologie,
  type EtudeSaisie,
  type Orientation,
  type ResultatEtude,
  type Rubrique,
} from '@/lib/moteur';
import { cheminEtape, ETAPES } from '@/lib/parcours/etapes';

import { BarreIndicateur, JaugeScore } from './jauge-score';

const TON_ORIENTATION: Record<Orientation, TonPastille> = {
  GO: 'bon',
  GO_SOUS_CONDITIONS: 'vigilance',
  NO_GO: 'critique',
};

function cheminRubrique(rubrique: Rubrique): string {
  const etape = ETAPES.find((e) => e.rubrique === rubrique);
  return cheminEtape(etape?.slug ?? 'projet');
}

function dateLongue(iso: string): string {
  const d = new Date(iso);
  const jour = String(d.getDate()).padStart(2, '0');
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  return `${jour}/${mois}/${d.getFullYear()} à ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export interface ProprietesSyntheseEtude {
  etude: EtudeSaisie;
  resultat: ResultatEtude;
  config: ConfigurationMethodologie;
  statut: 'BROUILLON' | 'COMPLETE';
}

/**
 * Restitution PME : résumé, projection, scores, décision, recommandations.
 * Composant sans état, réutilisé par la version imprimable et, plus tard, par
 * la restitution Expert.
 */
export function SyntheseEtude({ etude, resultat, config, statut }: ProprietesSyntheseEtude) {
  const { scores, decision, projection, recommandations, decomposition, alertes, completude } =
    resultat;
  const bloquantes = alertes.filter((a) => a.niveau === 'BLOQUANTE');
  const avertissements = alertes.filter((a) => a.niveau === 'AVERTISSEMENT');
  const orientationFinale = decision.orientationFinale;
  const libelleCalculee = decision.orientationCalculee
    ? config.libelles.orientations[decision.orientationCalculee]
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Résumé du projet -------------------------------------------------- */}
      <Carte>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">
              Étude de chalandise
            </p>
            <h2 className="mt-1 text-[24px] font-bold leading-tight text-encre">
              {etude.projet.nom || 'Projet sans nom'}
            </h2>
            <p className="mt-1 text-[15px] text-encre-secondaire">
              {[etude.projet.concept, etude.projet.localite].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 text-right">
            <Pastille ton={statut === 'COMPLETE' ? 'bon' : 'neutre'}>
              {statut === 'COMPLETE' ? 'Étude finalisée' : 'Brouillon'}
            </Pastille>
            <p className="text-[12.5px] text-encre-attenuee">
              Calculé le {dateLongue(resultat.calculeLe)}
              <br />
              Moteur {resultat.versionMoteur}, méthodologie {resultat.versionMethodologie}
            </p>
          </div>
        </div>
      </Carte>

      {/* Blocages ------------------------------------------------------------ */}
      {bloquantes.length > 0 && (
        <Alerte
          niveau="critique"
          titre={`${bloquantes.length} point${bloquantes.length > 1 ? 's' : ''} à corriger avant de finaliser`}
        >
          <ul className="list-disc space-y-1 pl-5">
            {bloquantes.map((a, i) => (
              <li key={i}>
                {a.message}{' '}
                <Link
                  href={cheminRubrique(a.rubrique)}
                  className="sans-impression font-medium text-accent underline-offset-2 hover:underline"
                >
                  Corriger
                </Link>
              </li>
            ))}
          </ul>
        </Alerte>
      )}

      {/* Décision ------------------------------------------------------------ */}
      <Carte>
        <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-encre-attenuee">
              Score global
            </p>
            {scores.scoreGlobal === null ? (
              <p className="mt-1 text-[28px] font-semibold text-encre-secondaire">Non calculable</p>
            ) : (
              <p className="chiffres mt-1 text-[56px] font-semibold leading-none tracking-tight text-encre">
                {formaterDecimal(scores.scoreGlobal, config.arrondi.decimalesAffichees)}
                <span className="ml-1.5 text-[18px] font-normal text-encre-attenuee">sur 100</span>
              </p>
            )}
            <div className="mt-4 flex flex-col items-start gap-2">
              <Pastille
                ton={orientationFinale ? TON_ORIENTATION[orientationFinale] : 'neutre'}
                grande
              >
                {decision.libelle}
              </Pastille>
              {libelleCalculee && (
                <p className="text-[13.5px] text-encre-secondaire">
                  Orientation calculée par les seuils :{' '}
                  <span className="font-medium text-encre">{libelleCalculee}</span>
                  {decision.orientationFinale !== decision.orientationCalculee ||
                  decision.conditionsCritiques
                    ? ' ; orientation finale après application des règles critiques ci-dessus.'
                    : ' ; aucune règle critique ne la modifie.'}
                </p>
              )}
            </div>
          </div>
          <div className="min-w-0">
            {scores.scoreGlobal !== null && (
              <JaugeScore
                score={scores.scoreGlobal}
                seuils={config.seuils}
                libelles={{
                  noGo: config.libelles.orientations.NO_GO,
                  sousConditions: config.libelles.orientations.GO_SOUS_CONDITIONS,
                  go: config.libelles.orientations.GO,
                }}
              />
            )}
            <ol className="mt-4 list-decimal space-y-1 pl-5 text-[14px] text-encre-secondaire">
              {decision.justification.map((phrase, i) => (
                <li key={i}>{phrase}</li>
              ))}
            </ol>
          </div>
        </div>
        {decision.redFlags.length > 0 && (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {decision.redFlags.map((flag) => (
              <li
                key={flag.code}
                className="rounded-[var(--radius-champ)] border border-critique bg-critique-clair p-3"
              >
                <p className="text-[14px] font-semibold text-critique">{flag.libelle}</p>
                <p className="mt-0.5 text-[13px] text-encre">{flag.effet}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-5 rounded-[var(--radius-champ)] bg-surface-appui px-4 py-3 text-[13.5px] leading-snug text-encre-secondaire">
          Ce score est une aide à la décision construite à partir des données saisies. Il ne
          remplace ni une étude de marché complète ni une décision d&apos;investissement. Un
          résultat favorable ne dispense pas de traiter les risques critiques ni de vérifier les
          hypothèses les plus sensibles.
        </p>
      </Carte>

      {/* Projection ---------------------------------------------------------- */}
      <Carte
        titre="Projection commerciale"
        description="Indicative, calculée à partir de vos hypothèses."
      >
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tuile
            libelle="CA mensuel indicatif"
            valeur={
              projection.caMensuelFcfa === null
                ? 'Non calculable'
                : formaterFcfa(projection.caMensuelFcfa)
            }
            precision={`${etude.hypotheses.clientsParJour ?? '?'} clients × ${etude.hypotheses.ticketMoyenFcfa ?? '?'} FCFA × ${etude.hypotheses.joursOuvertureParMois ?? '?'} jours`}
          />
          <Tuile
            libelle="Loyer soutenable"
            valeur={
              projection.loyerMaximalFcfa === null
                ? 'Non calculable'
                : formaterFcfa(projection.loyerMaximalFcfa)
            }
            precision={`${formaterPourcentage(projection.partLoyerCible, 1)} du CA`}
          />
          <Tuile
            libelle="Loyer envisagé"
            valeur={
              projection.loyerMensuelEnvisageFcfa === null
                ? 'Non renseigné'
                : formaterFcfa(projection.loyerMensuelEnvisageFcfa)
            }
            precision={
              projection.ecartLoyerFcfa === null
                ? undefined
                : projection.ecartLoyerFcfa > 0
                  ? `Dépasse de ${formaterFcfa(projection.ecartLoyerFcfa)}`
                  : `Marge de ${formaterFcfa(-projection.ecartLoyerFcfa)}`
            }
            alerte={projection.ecartLoyerFcfa !== null && projection.ecartLoyerFcfa > 0}
          />
          <Tuile
            libelle="Clientèle visée"
            valeur={etude.hypotheses.clienteleCible?.trim() || 'Non précisée'}
          />
        </dl>
      </Carte>

      {/* Indicateurs --------------------------------------------------------- */}
      <Carte
        titre="Les quatre indicateurs"
        description="Chaque indicateur est noté de 0 à 100 et expliqué. Les couleurs ne remplacent jamais les valeurs."
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <Indicateur
            libelle="Demande accessible"
            valeur={scores.demandeGlobale}
            favorableSiEleve
            explication="Générateurs de flux et solvabilité, pondérés par le poids de chaque zone. Plus c'est haut, plus la clientèle potentielle est dense."
          />
          <Indicateur
            libelle="Vides commerciaux"
            valeur={scores.scoreGaps}
            favorableSiEleve
            explication="Part des besoins absents ou mal servis autour du site. Plus c'est haut, plus il reste de place pour une nouvelle offre."
          />
          <Indicateur
            libelle="Pression concurrentielle"
            valeur={scores.pressionConcurrentielle}
            favorableSiEleve={false}
            explication="Menace moyenne des concurrents recensés, les indirects comptant pour 70 %. Plus c'est bas, plus la marge de manœuvre est grande."
          />
          <Indicateur
            libelle="Risque d'exécution"
            valeur={scores.scoreRisque}
            favorableSiEleve={false}
            explication="Risques du site, d'approvisionnement, humains, de conformité et financiers, pondérés. Plus c'est bas, mieux ils sont maîtrisés."
          />
        </dl>
        {scores.attractivite !== null && (
          <p className="mt-4 text-[13.5px] text-encre-secondaire">
            Attractivité commerciale :{' '}
            <span className="chiffres font-semibold text-encre">
              {formaterDecimal(scores.attractivite, 1)} sur 100
            </span>{' '}
            ({formaterPourcentage(config.attractivite.demande)} demande,{' '}
            {formaterPourcentage(config.attractivite.gaps)} vides commerciaux,{' '}
            {formaterPourcentage(config.attractivite.concurrence)} marge face à la concurrence). Le
            score global combine {formaterPourcentage(config.scoreGlobal.attractivite)}{' '}
            d&apos;attractivité et {formaterPourcentage(config.scoreGlobal.risque)} de maîtrise des
            risques.
          </p>
        )}
      </Carte>

      {/* Décomposition ------------------------------------------------------ */}
      {decomposition.length > 0 && (
        <Carte
          titre="D'où viennent les points"
          description="Les quatre contributions s'additionnent exactement au score global."
        >
          <ul className="flex flex-col gap-3">
            {decomposition.map((c) => (
              <li key={c.code}>
                <div className="flex items-baseline justify-between gap-3 text-[14px]">
                  <span className="text-encre">{c.libelle}</span>
                  <span className="chiffres text-encre-secondaire">
                    <span className="font-semibold text-encre">{formaterDecimal(c.points, 1)}</span>{' '}
                    sur {formaterDecimal(c.potentielMax, 0)} points
                  </span>
                </div>
                <div
                  className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-surface-appui"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(c.points / c.potentielMax) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Carte>
      )}

      {/* Recommandations ----------------------------------------------------- */}
      <div className="grid gap-5 lg:grid-cols-3">
        <ListeRecommandations
          titre="Forces"
          ton="bon"
          elements={recommandations.forces.map((r) => r.texte)}
          vide="Aucune force marquée ne ressort des données saisies."
        />
        <ListeRecommandations
          titre="Points de vigilance"
          ton="vigilance"
          elements={recommandations.vigilances.map((r) => r.texte)}
          vide="Aucun point de vigilance particulier."
        />
        <ListeRecommandations
          titre="Actions prioritaires"
          ton="accent"
          elements={recommandations.actions.map((r) => r.texte)}
          vide="Aucune action particulière."
          numerotee
        />
      </div>

      {/* Données et hypothèses ---------------------------------------------- */}
      <Carte
        titre="Données et hypothèses"
        description="Ce qui a servi au calcul, et ce qui manque."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <h3 className="text-[14px] font-semibold text-encre">Hypothèses principales</h3>
            <ul className="mt-2 space-y-1 text-[14px] text-encre-secondaire">
              <li>
                Fréquentation :{' '}
                <span className="chiffres text-encre">
                  {etude.hypotheses.clientsParJour ?? 'non renseignée'}
                </span>{' '}
                clients par jour, ticket moyen{' '}
                <span className="chiffres text-encre">
                  {etude.hypotheses.ticketMoyenFcfa === null
                    ? 'non renseigné'
                    : formaterFcfa(etude.hypotheses.ticketMoyenFcfa)}
                </span>
                ,{' '}
                <span className="chiffres text-encre">
                  {etude.hypotheses.joursOuvertureParMois ?? '?'}
                </span>{' '}
                jours par mois.
              </li>
              <li>
                Zones :{' '}
                {etude.zones.map((z, i) => (
                  <span key={z.id}>
                    {i > 0 && ', '}
                    {z.libelle || `Zone ${i + 1}`} ({formaterDecimal((z.poids ?? 0) * 100, 0)} %
                    {z.rayonKm !== null ? `, ${z.rayonKm} km` : ''}
                    {z.tempsAccesMin !== null ? `, ${z.tempsAccesMin} min` : ''})
                  </span>
                ))}
                .
              </li>
              <li>
                Concurrents recensés :{' '}
                <span className="chiffres text-encre">{etude.concurrents.length}</span>, dont{' '}
                <span className="chiffres text-encre">
                  {etude.concurrents.filter((c) => c.relation === 'DIRECTE').length}
                </span>{' '}
                directs.
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-encre">Complétude des observations</h3>
            <p className="mt-2 text-[14px] text-encre-secondaire">
              <span className="chiffres font-semibold text-encre">{completude.renseignees}</span>{' '}
              données renseignées,{' '}
              <span className="chiffres font-semibold text-encre">{completude.manquantes}</span>{' '}
              manquantes,{' '}
              <span className="chiffres font-semibold text-encre">{completude.nonApplicables}</span>{' '}
              non applicables.
            </p>
            {avertissements.length > 0 && (
              <details className="mt-2 text-[13.5px]">
                <summary className="cursor-pointer text-accent">
                  {avertissements.length} point{avertissements.length > 1 ? 's' : ''} signalé
                  {avertissements.length > 1 ? 's' : ''}
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-encre-secondaire">
                  {avertissements.map((a, i) => (
                    <li key={i}>{a.message}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      </Carte>
    </div>
  );
}

function Tuile({
  libelle,
  valeur,
  precision,
  alerte,
}: {
  libelle: string;
  valeur: string;
  precision?: string;
  alerte?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-champ)] bg-surface-appui p-4">
      <dt className="text-[12px] font-semibold uppercase tracking-wide text-encre-attenuee">
        {libelle}
      </dt>
      <dd
        className={
          valeur.length > 16
            ? 'mt-1 text-[15px] font-semibold leading-snug text-encre'
            : 'chiffres mt-1 text-[19px] font-semibold leading-tight text-encre'
        }
      >
        {valeur}
      </dd>
      {precision && (
        <dd
          className={
            alerte
              ? 'mt-1 text-[12.5px] font-medium text-vigilance'
              : 'mt-1 text-[12.5px] text-encre-secondaire'
          }
        >
          {precision}
        </dd>
      )}
    </div>
  );
}

function Indicateur({
  libelle,
  valeur,
  explication,
  favorableSiEleve,
}: {
  libelle: string;
  valeur: number | null;
  explication: string;
  favorableSiEleve: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-champ)] border border-bordure p-4">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-[15px] font-semibold text-encre">{libelle}</dt>
        <dd className="chiffres text-[20px] font-semibold text-encre">
          {valeur === null ? 'Non calculable' : `${formaterDecimal(valeur, 1)} / 100`}
        </dd>
      </div>
      <BarreIndicateur valeur={valeur} favorableSiEleve={favorableSiEleve} />
      <dd className="mt-2 text-[13px] leading-snug text-encre-secondaire">{explication}</dd>
    </div>
  );
}

function ListeRecommandations({
  titre,
  ton,
  elements,
  vide,
  numerotee,
}: {
  titre: string;
  ton: TonPastille;
  elements: string[];
  vide: string;
  numerotee?: boolean;
}) {
  const Liste = numerotee ? 'ol' : 'ul';
  return (
    <Carte titre={<Pastille ton={ton}>{titre}</Pastille>}>
      {elements.length === 0 ? (
        <p className="text-[14px] text-encre-secondaire">{vide}</p>
      ) : (
        <Liste
          className={
            numerotee
              ? 'list-decimal space-y-2 pl-5 text-[14px] text-encre'
              : 'list-disc space-y-2 pl-5 text-[14px] text-encre'
          }
        >
          {elements.map((texte, i) => (
            <li key={i}>{texte}</li>
          ))}
        </Liste>
      )}
    </Carte>
  );
}
