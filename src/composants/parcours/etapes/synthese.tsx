'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { SyntheseEtude } from '@/composants/synthese/synthese-etude';
import { Alerte } from '@/composants/ui/alerte';
import { Bouton, LienBouton } from '@/composants/ui/bouton';
import { CONFIG_COURANTE, evaluerEtude } from '@/lib/moteur';
import { cheminEtape } from '@/lib/parcours/etapes';
import { premiereEtapeInvalide } from '@/lib/parcours/validation-etape';

import { useEtude } from '../contexte-etude';
import { EnTeteEtape } from '../en-tete-etape';

export function EtapeSynthese() {
  const { etude, locale, finaliser, rouvrir, recommencer } = useEtude();
  const resultat = useMemo(() => evaluerEtude(etude), [etude]);
  const etapeInvalide = useMemo(() => premiereEtapeInvalide(etude), [etude]);
  const finalisee = locale.statut === 'COMPLETE';

  const nouvelleEtude = () => {
    if (
      window.confirm(
        "Commencer une nouvelle étude ? L'étude actuelle sera effacée de ce navigateur.",
      )
    ) {
      recommencer();
    }
  };

  return (
    <>
      <div className="sans-impression">
        <EnTeteEtape slug="synthese" />
      </div>

      <div className="sans-impression mb-5 flex flex-wrap items-center gap-3">
        <Bouton onClick={() => window.print()} variante="secondaire">
          Imprimer la synthèse
        </Bouton>
        {finalisee ? (
          <Bouton onClick={rouvrir} variante="secondaire">
            Reprendre la saisie
          </Bouton>
        ) : (
          <Bouton
            onClick={finaliser}
            disabled={!resultat.finalisable}
            title={
              resultat.finalisable ? undefined : 'Corrigez les points bloquants avant de finaliser.'
            }
          >
            Finaliser l&apos;étude
          </Bouton>
        )}
        <Bouton onClick={nouvelleEtude} variante="discret">
          Nouvelle étude
        </Bouton>
      </div>

      {finalisee && (
        <Alerte niveau="bon" titre="Étude finalisée" className="sans-impression mb-5">
          Le résultat ci-dessous est figé avec la version du moteur et les paramètres utilisés. Pour
          modifier une donnée, reprenez la saisie : la synthèse sera recalculée.
        </Alerte>
      )}

      {!finalisee && etapeInvalide && (
        <Alerte
          niveau="vigilance"
          titre="Certaines étapes sont incomplètes"
          className="sans-impression mb-5"
        >
          Le résultat est calculé avec ce qui est renseigné. Pour finaliser,{' '}
          <Link
            href={cheminEtape(etapeInvalide)}
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            complétez l&apos;étape en erreur
          </Link>
          .
        </Alerte>
      )}

      <SyntheseEtude
        etude={etude}
        resultat={resultat}
        config={CONFIG_COURANTE}
        statut={locale.statut}
      />

      <div className="sans-impression mt-8 flex flex-col-reverse gap-3 border-t border-bordure pt-5 sm:flex-row sm:items-center sm:justify-between">
        <LienBouton href={cheminEtape('risques')} variante="secondaire">
          Précédent : Risques
        </LienBouton>
        <LienBouton href="/" variante="discret">
          Retour à l&apos;accueil
        </LienBouton>
      </div>
    </>
  );
}
