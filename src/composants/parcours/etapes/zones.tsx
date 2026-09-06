'use client';

import { Alerte } from '@/composants/ui/alerte';
import { Bouton } from '@/composants/ui/bouton';
import { Carte } from '@/composants/ui/carte';
import { ChampNombre } from '@/composants/ui/champ-nombre';
import { ChampTexte } from '@/composants/ui/champ-texte';
import { Selecteur } from '@/composants/ui/selecteur';
import {
  CONFIG_COURANTE,
  formaterDecimal,
  type ModeDeplacement,
  type ZoneSaisie,
} from '@/lib/moteur';
import { nouvelleZone } from '@/lib/parcours/etude-vide';
import { classes } from '@/lib/utilitaires/classes';

import { useEtude } from '../contexte-etude';
import { EnTeteEtape, ResumeValidation } from '../en-tete-etape';
import { NavigationEtape } from '../navigation-etape';
import { useValidationEtape } from '../use-validation-etape';

const MODES = (Object.keys(CONFIG_COURANTE.libelles.modesDeplacement) as ModeDeplacement[]).map(
  (valeur) => ({
    valeur,
    libelle: CONFIG_COURANTE.libelles.modesDeplacement[valeur],
  }),
);

function pourcent(fraction: number | null): number | null {
  return fraction === null ? null : Math.round(fraction * 10000) / 100;
}

export function EtapeZones() {
  const { etude, modifierEtude } = useEtude();
  const validation = useValidationEtape('zones');
  const { zones } = etude;
  const zonesMax = CONFIG_COURANTE.limites.zonesMax;

  const modifierZone = (id: string, champ: Partial<ZoneSaisie>) =>
    modifierEtude((e) => ({
      ...e,
      zones: e.zones.map((z) => (z.id === id ? { ...z, ...champ } : z)),
    }));

  const ajouterZone = () =>
    modifierEtude((e) =>
      e.zones.length >= zonesMax
        ? e
        : { ...e, zones: [...e.zones, nouvelleZone(e.zones.length + 1)] },
    );

  const supprimerZone = (id: string) =>
    modifierEtude((e) => ({
      ...e,
      zones: e.zones.filter((z) => z.id !== id),
      demande: e.demande.filter((d) => d.zoneId !== id),
    }));

  const totalPoids = zones.reduce((acc, z) => acc + (z.poids ?? 0), 0);
  const totalPourcent = Math.round(totalPoids * 10000) / 100;
  const totalConforme = Math.abs(totalPoids - 1) <= CONFIG_COURANTE.tolerancePoids;

  return (
    <>
      <EnTeteEtape
        slug="zones"
        complement={
          <p className="mt-2 max-w-2xl text-[14px] leading-snug text-encre-secondaire">
            Une zone est un périmètre d&apos;où viennent vos clients : le voisinage immédiat à pied,
            puis des couronnes plus larges en deux-roues ou en voiture. Le poids est la part de
            clientèle attendue de chaque zone ; le total doit faire 100 %.
          </p>
        }
      />
      <ResumeValidation
        visible={validation.tentative}
        erreursChamps={validation.tentative ? validation.erreursChamps : {}}
        bloquantes={validation.tentative ? validation.bloquantes : []}
        avertissements={validation.avertissements}
      />

      <div className="flex flex-col gap-5">
        {zones.map((zone, index) => (
          <Carte
            key={zone.id}
            balise="article"
            titre={`Zone ${index + 1}`}
            actions={
              zones.length > 1 && (
                <Bouton variante="danger" taille="petite" onClick={() => supprimerZone(zone.id)}>
                  Supprimer
                </Bouton>
              )
            }
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <ChampTexte
                id={`zone-${zone.id}-libelle`}
                libelle="Nom de la zone"
                valeur={zone.libelle}
                onChange={(libelle) => modifierZone(zone.id, { libelle })}
                obligatoire
                placeholder={index === 0 ? 'Cœur de quartier' : 'Périphérie'}
                erreur={validation.erreur(`${index}.libelle`)}
                maxLength={120}
              />
              <ChampNombre
                id={`zone-${zone.id}-poids`}
                libelle="Poids"
                valeur={pourcent(zone.poids)}
                onChange={(p) => modifierZone(zone.id, { poids: p === null ? null : p / 100 })}
                unite="%"
                obligatoire
                aide="Part de la clientèle attendue venant de cette zone."
                min={0}
                max={100}
                step={1}
                erreur={validation.erreur(`${index}.poids`)}
              />
              <ChampNombre
                id={`zone-${zone.id}-rayon`}
                libelle="Rayon"
                valeur={zone.rayonKm}
                onChange={(rayonKm) => modifierZone(zone.id, { rayonKm })}
                unite="km"
                aide="Distance depuis le site."
                min={0.1}
                step={0.1}
                placeholder="0,5"
                erreur={validation.erreur(`${index}.rayonKm`)}
              />
              <ChampNombre
                id={`zone-${zone.id}-temps`}
                libelle="Temps d'accès"
                valeur={zone.tempsAccesMin}
                onChange={(tempsAccesMin) => modifierZone(zone.id, { tempsAccesMin })}
                unite="min"
                aide="Temps pour rejoindre le site avec le mode indiqué."
                min={1}
                step={1}
                placeholder="5"
                erreur={validation.erreur(`${index}.tempsAccesMin`)}
              />
              <Selecteur
                id={`zone-${zone.id}-mode`}
                libelle="Mode de déplacement"
                valeur={zone.mode}
                onChange={(mode) => modifierZone(zone.id, { mode })}
                options={MODES}
                libelleVide="Choisir un mode"
                erreur={validation.erreur(`${index}.mode`)}
                className="sm:col-span-2"
              />
            </div>
          </Carte>
        ))}

        <div
          className={classes(
            'flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-carte)] border px-4 py-3',
            totalConforme ? 'border-bon bg-bon-clair' : 'border-vigilance bg-vigilance-clair',
          )}
          aria-live="polite"
        >
          <p className="text-[15px]">
            <span className="font-semibold">Total des poids : </span>
            <span className="chiffres font-semibold">
              {formaterDecimal(totalPourcent, totalPourcent % 1 === 0 ? 0 : 2)} %
            </span>
            <span className="ml-2 text-[13.5px] text-encre-secondaire">
              {totalConforme
                ? 'Le total fait bien 100 %.'
                : 'Le total doit faire 100 % pour continuer.'}
            </span>
          </p>
          {zones.length < zonesMax && (
            <Bouton variante="secondaire" taille="petite" onClick={ajouterZone}>
              Ajouter une zone ({zones.length} sur {zonesMax})
            </Bouton>
          )}
        </div>

        {zones.length >= zonesMax && (
          <Alerte niveau="info" titre={`Nombre maximal de zones atteint (${zonesMax})`}>
            La méthode retient au plus {zonesMax} zones : regroupez les périmètres les moins
            distincts.
          </Alerte>
        )}
      </div>

      <NavigationEtape slug="zones" onContinuer={validation.tenter} />
    </>
  );
}
