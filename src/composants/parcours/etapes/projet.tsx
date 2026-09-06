'use client';

import { Carte } from '@/composants/ui/carte';
import { ChampNombre } from '@/composants/ui/champ-nombre';
import { ChampTexte } from '@/composants/ui/champ-texte';

import { useEtude } from '../contexte-etude';
import { EnTeteEtape, ResumeValidation } from '../en-tete-etape';
import { NavigationEtape } from '../navigation-etape';
import { useValidationEtape } from '../use-validation-etape';

const CONCEPTS = [
  'Restaurant',
  'Snack',
  'Salon de thé',
  'Maquis',
  'Fast-food',
  'Café',
  'Pâtisserie et boulangerie',
  'Grill et braiserie',
  'Restaurant de cuisine locale',
  'Cafétéria',
];

const MODES_SERVICE = ['Sur place', 'À emporter', 'Livraison'];

export function EtapeProjet() {
  const { etude, modifierEtude } = useEtude();
  const validation = useValidationEtape('projet');
  const { projet } = etude;

  const modifier = (champ: Partial<typeof projet>) =>
    modifierEtude((e) => ({ ...e, projet: { ...e.projet, ...champ } }));

  const basculerMode = (mode: string) => {
    const actuels = projet.modesService ?? [];
    modifier({
      modesService: actuels.includes(mode) ? actuels.filter((m) => m !== mode) : [...actuels, mode],
    });
  };

  return (
    <>
      <EnTeteEtape slug="projet" />
      <ResumeValidation
        visible={validation.tentative}
        erreursChamps={validation.tentative ? validation.erreursChamps : {}}
        bloquantes={validation.tentative ? validation.bloquantes : []}
        avertissements={validation.avertissements}
      />

      <div className="flex flex-col gap-5">
        <Carte
          titre="Le projet"
          description="Ces informations identifient l'étude et apparaissent sur la synthèse."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <ChampTexte
              id="projet-nom"
              libelle="Nom du projet"
              valeur={projet.nom}
              onChange={(nom) => modifier({ nom })}
              obligatoire
              placeholder="Snack Le Carrefour"
              erreur={validation.erreur('nom')}
              maxLength={120}
            />
            <ChampTexte
              id="projet-localite"
              libelle="Localité"
              valeur={projet.localite}
              onChange={(localite) => modifier({ localite })}
              obligatoire
              aide="Ville et quartier du site envisagé."
              placeholder="Cotonou, quartier Fidjrossè"
              erreur={validation.erreur('localite')}
              maxLength={120}
            />
            <ChampTexte
              id="projet-concept"
              libelle="Concept"
              valeur={projet.concept}
              onChange={(concept) => modifier({ concept })}
              obligatoire
              aide="Type d'établissement et positionnement en quelques mots."
              placeholder="Snack et petit-déjeuner"
              suggestions={CONCEPTS}
              erreur={validation.erreur('concept')}
              maxLength={120}
              className="sm:col-span-2"
            />
          </div>
        </Carte>

        <Carte
          titre="Le service"
          description="Facultatif à ce stade, utile pour vérifier la cohérence des hypothèses."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <ChampTexte
              id="projet-horaires"
              libelle="Horaires"
              valeur={projet.horaires ?? ''}
              onChange={(horaires) => modifier({ horaires })}
              aide="Par exemple : 7 h à 21 h, du lundi au samedi."
              placeholder="7 h à 21 h, du lundi au samedi"
              erreur={validation.erreur('horaires')}
              maxLength={200}
            />
            <ChampNombre
              id="projet-capacite"
              libelle="Capacité"
              valeur={projet.capaciteCouverts ?? null}
              onChange={(capaciteCouverts) => modifier({ capaciteCouverts })}
              unite="couverts"
              aide="Places assises ou couverts servis en même temps."
              min={1}
              step={1}
              placeholder="40"
              erreur={validation.erreur('capaciteCouverts')}
            />
            <fieldset className="sm:col-span-2">
              <legend className="text-[15px] font-medium text-encre">
                Modes de service
                <span className="ml-1.5 text-[13px] font-normal text-encre-attenuee">
                  (facultatif)
                </span>
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {MODES_SERVICE.map((mode) => {
                  const actif = (projet.modesService ?? []).includes(mode);
                  return (
                    <label
                      key={mode}
                      className={
                        actif
                          ? 'flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-accent bg-accent-clair px-3.5 text-[14px] font-medium text-accent-fonce'
                          : 'flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-bordure-forte bg-surface px-3.5 text-[14px] text-encre hover:bg-surface-appui'
                      }
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-accent"
                        checked={actif}
                        onChange={() => basculerMode(mode)}
                      />
                      {mode}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </Carte>
      </div>

      <NavigationEtape slug="projet" onContinuer={validation.tenter} />
    </>
  );
}
