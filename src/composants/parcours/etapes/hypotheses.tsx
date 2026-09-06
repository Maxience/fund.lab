'use client';

import { useMemo } from 'react';

import { Carte } from '@/composants/ui/carte';
import { ChampNombre } from '@/composants/ui/champ-nombre';
import { ChampTexte } from '@/composants/ui/champ-texte';
import { Pastille } from '@/composants/ui/pastille';
import {
  calculerCaMensuel,
  calculerLoyerMaximal,
  CONFIG_COURANTE,
  formaterFcfa,
  formaterPourcentage,
} from '@/lib/moteur';

import { useEtude } from '../contexte-etude';
import { EnTeteEtape, ResumeValidation } from '../en-tete-etape';
import { NavigationEtape } from '../navigation-etape';
import { useValidationEtape } from '../use-validation-etape';

export function EtapeHypotheses() {
  const { etude, modifierEtude } = useEtude();
  const validation = useValidationEtape('hypotheses');
  const h = etude.hypotheses;

  const modifier = (champ: Partial<typeof h>) =>
    modifierEtude((e) => ({ ...e, hypotheses: { ...e.hypotheses, ...champ } }));

  // Projection immédiate, calculée par le moteur et jamais réécrite ici.
  const projection = useMemo(() => {
    const ca = calculerCaMensuel(h.clientsParJour, h.ticketMoyenFcfa, h.joursOuvertureParMois);
    const part = h.partLoyerCible ?? CONFIG_COURANTE.loyer.partCibleParDefaut;
    const loyerMax = calculerLoyerMaximal(ca, part);
    const ecart =
      loyerMax !== null && h.loyerMensuelEnvisageFcfa != null
        ? h.loyerMensuelEnvisageFcfa - loyerMax
        : null;
    return { ca, part, loyerMax, ecart };
  }, [h]);

  const partEnPourcent =
    h.partLoyerCible === null ? null : Math.round(h.partLoyerCible * 10000) / 100;

  return (
    <>
      <EnTeteEtape slug="hypotheses" />
      <ResumeValidation
        visible={validation.tentative}
        erreursChamps={validation.tentative ? validation.erreursChamps : {}}
        bloquantes={validation.tentative ? validation.bloquantes : []}
        avertissements={validation.avertissements}
      />

      <div className="flex flex-col gap-5">
        <Carte
          titre="Fréquentation et ticket"
          description="Ces trois hypothèses déterminent le chiffre d'affaires indicatif. Elles sont les plus sensibles : notez d'où elles viennent."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <ChampNombre
              id="hyp-clients"
              libelle="Clients par jour"
              valeur={h.clientsParJour}
              onChange={(clientsParJour) => modifier({ clientsParJour })}
              unite="clients"
              obligatoire
              aide="Nombre moyen de clients servis un jour d'ouverture."
              min={1}
              step={1}
              placeholder="120"
              erreur={validation.erreur('clientsParJour')}
            />
            <ChampNombre
              id="hyp-ticket"
              libelle="Ticket moyen"
              valeur={h.ticketMoyenFcfa}
              onChange={(ticketMoyenFcfa) => modifier({ ticketMoyenFcfa })}
              unite="FCFA"
              obligatoire
              aide="Dépense moyenne par client et par visite."
              min={1}
              step={1}
              placeholder="2 500"
              erreur={validation.erreur('ticketMoyenFcfa')}
            />
            <ChampNombre
              id="hyp-jours"
              libelle="Jours d'ouverture"
              valeur={h.joursOuvertureParMois}
              onChange={(joursOuvertureParMois) => modifier({ joursOuvertureParMois })}
              unite="jours / mois"
              obligatoire
              aide="De 1 à 31."
              min={1}
              max={31}
              step={1}
              placeholder="26"
              erreur={validation.erreur('joursOuvertureParMois')}
            />
          </div>
        </Carte>

        <Carte
          titre="Loyer"
          description="Le loyer soutenable est une part du chiffre d'affaires. Comparez-le au loyer envisagé."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <ChampNombre
              id="hyp-part-loyer"
              libelle="Part de loyer cible"
              valeur={partEnPourcent}
              onChange={(pourcent) =>
                modifier({ partLoyerCible: pourcent === null ? null : pourcent / 100 })
              }
              unite="% du CA"
              obligatoire
              aide={`Part du chiffre d'affaires que le loyer ne devrait pas dépasser. Méthode FUND.lab : ${formaterPourcentage(CONFIG_COURANTE.loyer.partCibleParDefaut)} par défaut.`}
              min={1}
              max={50}
              step={0.5}
              erreur={validation.erreur('partLoyerCible')}
            />
            <ChampNombre
              id="hyp-loyer"
              libelle="Loyer mensuel envisagé"
              valeur={h.loyerMensuelEnvisageFcfa ?? null}
              onChange={(loyerMensuelEnvisageFcfa) => modifier({ loyerMensuelEnvisageFcfa })}
              unite="FCFA"
              aide="Loyer demandé ou négocié pour le local, charges comprises si possible."
              min={0}
              step={1}
              placeholder="600 000"
              erreur={validation.erreur('loyerMensuelEnvisageFcfa')}
            />
          </div>
        </Carte>

        <Carte
          titre="Projection indicative"
          description="Calculée à l'instant à partir des hypothèses ci-dessus."
        >
          {projection.ca === null ? (
            <p className="text-[14px] text-encre-secondaire">
              Renseignez la fréquentation, le ticket moyen et les jours d&apos;ouverture pour voir
              la projection.
            </p>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[var(--radius-champ)] bg-surface-appui p-4">
                <dt className="text-[12px] font-semibold uppercase tracking-wide text-encre-attenuee">
                  CA mensuel indicatif
                </dt>
                <dd className="chiffres mt-1 text-[22px] font-semibold text-encre">
                  {formaterFcfa(projection.ca)}
                </dd>
                <dd className="mt-0.5 text-[12.5px] text-encre-secondaire">
                  clients × ticket × jours
                </dd>
              </div>
              <div className="rounded-[var(--radius-champ)] bg-surface-appui p-4">
                <dt className="text-[12px] font-semibold uppercase tracking-wide text-encre-attenuee">
                  Loyer soutenable
                </dt>
                <dd className="chiffres mt-1 text-[22px] font-semibold text-encre">
                  {projection.loyerMax === null
                    ? 'Non calculable'
                    : formaterFcfa(projection.loyerMax)}
                </dd>
                <dd className="mt-0.5 text-[12.5px] text-encre-secondaire">
                  {formaterPourcentage(projection.part, 1)} du CA
                </dd>
              </div>
              <div className="rounded-[var(--radius-champ)] bg-surface-appui p-4">
                <dt className="text-[12px] font-semibold uppercase tracking-wide text-encre-attenuee">
                  Loyer envisagé
                </dt>
                <dd className="chiffres mt-1 text-[22px] font-semibold text-encre">
                  {h.loyerMensuelEnvisageFcfa == null
                    ? 'Non renseigné'
                    : formaterFcfa(h.loyerMensuelEnvisageFcfa)}
                </dd>
                <dd className="mt-1.5">
                  {projection.ecart === null ? (
                    <span className="text-[12.5px] text-encre-secondaire">
                      Indiquez-le pour comparer.
                    </span>
                  ) : projection.ecart > 0 ? (
                    <Pastille ton="vigilance">Dépasse de {formaterFcfa(projection.ecart)}</Pastille>
                  ) : (
                    <Pastille ton="bon">Sous le loyer soutenable</Pastille>
                  )}
                </dd>
              </div>
            </dl>
          )}
        </Carte>

        <Carte
          titre="Clientèle visée"
          description="Facultatif. Sert à la lecture du résultat et au positionnement."
        >
          <ChampTexte
            id="hyp-clientele"
            libelle="Clientèle cible"
            valeur={h.clienteleCible ?? ''}
            onChange={(clienteleCible) => modifier({ clienteleCible })}
            placeholder="Salariés du quartier et étudiants"
            erreur={validation.erreur('clienteleCible')}
            maxLength={200}
          />
        </Carte>
      </div>

      <NavigationEtape slug="hypotheses" onContinuer={validation.tenter} />
    </>
  );
}
