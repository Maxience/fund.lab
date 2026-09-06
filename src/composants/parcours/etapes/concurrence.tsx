'use client';

import { useMemo, useState } from 'react';

import { Alerte } from '@/composants/ui/alerte';
import { Bouton } from '@/composants/ui/bouton';
import { Carte } from '@/composants/ui/carte';
import { ChampNombre } from '@/composants/ui/champ-nombre';
import { ChampTexte } from '@/composants/ui/champ-texte';
import { Pastille } from '@/composants/ui/pastille';
import { Selecteur } from '@/composants/ui/selecteur';
import { SelecteurNote } from '@/composants/ui/selecteur-note';
import {
  COMPOSANTES_MENACE,
  CONFIG_COURANTE,
  evaluerEtude,
  formaterDecimal,
  type ComposanteMenace,
  type ConcurrentSaisi,
  type RelationConcurrentielle,
} from '@/lib/moteur';
import { nouveauConcurrent } from '@/lib/parcours/etude-vide';

import { useEtude } from '../contexte-etude';
import { EnTeteEtape, ResumeValidation } from '../en-tete-etape';
import { NavigationEtape } from '../navigation-etape';
import { useValidationEtape } from '../use-validation-etape';

const TYPES_OFFRE = [
  'Snack',
  'Restaurant',
  'Fast-food',
  'Maquis',
  'Salon de thé',
  'Café',
  'Boulangerie',
  'Pâtisserie',
  'Grill',
  'Crêperie',
  'Vendeur ambulant',
];

const RELATIONS = (
  Object.keys(CONFIG_COURANTE.libelles.relations) as RelationConcurrentielle[]
).map((valeur) => ({
  valeur,
  libelle: CONFIG_COURANTE.libelles.relations[valeur],
}));

const LIBELLES_NOTES: [string, string, string, string] = ['Nulle', 'Faible', 'Moyenne', 'Forte'];

const AIDES: Record<ComposanteMenace, string> = {
  proximite: 'Distance au site : 3 pour un voisin immédiat, 0 pour un concurrent éloigné.',
  affluence: 'Fréquentation observée aux heures de service.',
  qualite: 'Qualité perçue des produits et du service par la clientèle.',
  vitesse: 'Rapidité du service, importante pour la clientèle pressée.',
  differenciation: 'Force de son identité : offre, ambiance, prix, notoriété.',
};

export function EtapeConcurrence() {
  const { etude, modifierEtude } = useEtude();
  const validation = useValidationEtape('concurrence');
  const config = CONFIG_COURANTE;
  const [ouverts, setOuverts] = useState<Set<string>>(() => new Set());

  // Pression et menaces recalculées par le moteur à chaque ajout, modification ou suppression.
  const scores = useMemo(() => evaluerEtude(etude).scores, [etude]);

  const basculer = (id: string) =>
    setOuverts((s) => {
      const suivant = new Set(s);
      if (suivant.has(id)) suivant.delete(id);
      else suivant.add(id);
      return suivant;
    });

  const ajouter = () => {
    const concurrent = nouveauConcurrent();
    modifierEtude((e) => ({ ...e, concurrents: [...e.concurrents, concurrent] }));
    setOuverts((s) => new Set(s).add(concurrent.id));
  };

  const modifier = (id: string, champ: Partial<ConcurrentSaisi>) =>
    modifierEtude((e) => ({
      ...e,
      concurrents: e.concurrents.map((c) => (c.id === id ? { ...c, ...champ } : c)),
    }));

  const supprimer = (concurrent: ConcurrentSaisi) => {
    const nom = concurrent.nom.trim() || 'ce concurrent';
    if (!window.confirm(`Supprimer ${nom} de la liste ?`)) return;
    modifierEtude((e) => ({
      ...e,
      concurrents: e.concurrents.filter((c) => c.id !== concurrent.id),
    }));
  };

  const pression = scores.pressionConcurrentielle;

  return (
    <>
      <EnTeteEtape slug="concurrence" />
      <ResumeValidation
        visible={validation.tentative}
        erreursChamps={validation.tentative ? validation.erreursChamps : {}}
        bloquantes={validation.tentative ? validation.bloquantes : []}
        avertissements={validation.avertissements.filter(
          (a) => a.code !== 'AUCUN_CONCURRENT' && a.code !== 'DONNEE_MANQUANTE',
        )}
      />

      <div className="flex flex-col gap-5">
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-carte)] border border-bordure bg-surface px-4 py-3"
          aria-live="polite"
        >
          <p>
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-encre-attenuee">
              Pression concurrentielle
            </span>
            <span className="chiffres text-[22px] font-semibold text-encre">
              {pression === null ? 'à noter' : `${formaterDecimal(pression, 1)} / 100`}
            </span>
            <span className="ml-2 text-[13px] text-encre-secondaire">
              {etude.concurrents.length === 0
                ? 'Aucun concurrent recensé : considérée nulle.'
                : `${etude.concurrents.length} concurrent${etude.concurrents.length > 1 ? 's' : ''} recensé${etude.concurrents.length > 1 ? 's' : ''}.`}
            </span>
          </p>
          {etude.concurrents.length < config.limites.concurrentsMax && (
            <Bouton onClick={ajouter}>Ajouter un concurrent</Bouton>
          )}
        </div>

        {etude.concurrents.length === 0 && (
          <Alerte niveau="vigilance" titre="Aucun concurrent recensé">
            Sans concurrent, la pression concurrentielle est considérée nulle. Vérifiez sur le
            terrain les établissements qui servent la même clientèle, même avec une offre
            différente.
          </Alerte>
        )}

        {etude.concurrents.map((c, index) => {
          const ouvert = ouverts.has(c.id);
          const menace = scores.menaceParConcurrent[c.id] ?? null;
          const nom = c.nom.trim() || `Concurrent ${index + 1}`;
          return (
            <Carte
              key={c.id}
              balise="article"
              titre={nom}
              description={
                <span className="flex flex-wrap items-center gap-2">
                  {c.typeOffre.trim() && <span>{c.typeOffre}</span>}
                  {c.relation && (
                    <Pastille ton={c.relation === 'DIRECTE' ? 'critique' : 'neutre'}>
                      {config.libelles.relations[c.relation]}
                    </Pastille>
                  )}
                  <span className="chiffres">
                    Menace :{' '}
                    {menace === null
                      ? 'à noter'
                      : `${formaterDecimal(menace, 2)} / ${config.echelleNote.max}`}
                  </span>
                </span>
              }
              actions={
                <div className="flex gap-2">
                  <Bouton
                    variante="secondaire"
                    taille="petite"
                    onClick={() => basculer(c.id)}
                    aria-expanded={ouvert}
                  >
                    {ouvert ? 'Réduire' : 'Modifier'}
                  </Bouton>
                  <Bouton variante="danger" taille="petite" onClick={() => supprimer(c)}>
                    Supprimer
                  </Bouton>
                </div>
              }
            >
              {ouvert && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <ChampTexte
                    id={`conc-${c.id}-nom`}
                    libelle="Nom"
                    valeur={c.nom}
                    onChange={(nom) => modifier(c.id, { nom })}
                    obligatoire
                    placeholder="Chez Mariam"
                    erreur={validation.erreur(`${index}.nom`)}
                    maxLength={120}
                  />
                  <ChampTexte
                    id={`conc-${c.id}-type`}
                    libelle="Type d'offre"
                    valeur={c.typeOffre}
                    onChange={(typeOffre) => modifier(c.id, { typeOffre })}
                    obligatoire
                    suggestions={TYPES_OFFRE}
                    placeholder="Snack"
                    erreur={validation.erreur(`${index}.typeOffre`)}
                    maxLength={120}
                  />
                  <Selecteur
                    id={`conc-${c.id}-relation`}
                    libelle="Relation avec votre projet"
                    valeur={c.relation}
                    onChange={(relation) => modifier(c.id, { relation })}
                    options={RELATIONS}
                    obligatoire
                    aide="Direct : même type d'offre pour la même clientèle. Indirect : autre offre qui capte une partie des mêmes occasions de consommation."
                    erreur={validation.erreur(`${index}.relation`)}
                  />
                  <ChampNombre
                    id={`conc-${c.id}-ticket`}
                    libelle="Ticket moyen observé"
                    valeur={c.ticketMoyenFcfa ?? null}
                    onChange={(ticketMoyenFcfa) => modifier(c.id, { ticketMoyenFcfa })}
                    unite="FCFA"
                    min={1}
                    step={1}
                    placeholder="2 000"
                    erreur={validation.erreur(`${index}.ticketMoyenFcfa`)}
                  />
                  <div className="sm:col-span-2">
                    <p className="mb-1 text-[13px] text-encre-secondaire">
                      {config.libelles.aideEchelleMenace}
                    </p>
                    <div className="divide-y divide-bordure">
                      {COMPOSANTES_MENACE.map((composante) => (
                        <SelecteurNote
                          key={composante}
                          id={`conc-${c.id}-${composante}`}
                          libelle={config.libelles.composantesMenace[composante]}
                          aide={AIDES[composante]}
                          notation={c[composante]}
                          onChange={(notation) => modifier(c.id, { [composante]: notation })}
                          libellesNotes={LIBELLES_NOTES}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                  <ChampTexte
                    id={`conc-${c.id}-observation`}
                    libelle="Observation"
                    valeur={c.observation ?? ''}
                    onChange={(observation) => modifier(c.id, { observation })}
                    multiligne
                    placeholder="Clientèle fidèle le midi, carte courte."
                    erreur={validation.erreur(`${index}.observation`)}
                    maxLength={500}
                    className="sm:col-span-2"
                  />
                </div>
              )}
            </Carte>
          );
        })}
      </div>

      <NavigationEtape slug="concurrence" onContinuer={validation.tenter} />
    </>
  );
}
