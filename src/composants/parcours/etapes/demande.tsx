'use client';

import { useMemo } from 'react';

import { Alerte } from '@/composants/ui/alerte';
import { Carte } from '@/composants/ui/carte';
import { SelecteurNote } from '@/composants/ui/selecteur-note';
import { CONFIG_COURANTE, evaluerEtude, formaterDecimal, type Notation } from '@/lib/moteur';

import { useEtude } from '../contexte-etude';
import { EnTeteEtape, ResumeValidation } from '../en-tete-etape';
import { NavigationEtape } from '../navigation-etape';
import { useValidationEtape } from '../use-validation-etape';

const LIBELLES_NOTES: [string, string, string, string] = ['Absent', 'Faible', 'Moyen', 'Fort'];

export function EtapeDemande() {
  const { etude, modifierEtude } = useEtude();
  const validation = useValidationEtape('demande');
  const config = CONFIG_COURANTE;

  // Indices calculés par le moteur à chaque changement, pour un retour immédiat.
  const scores = useMemo(() => evaluerEtude(etude).scores, [etude]);

  const notationDe = (zoneId: string, driverCode: string): Notation =>
    etude.demande.find((d) => d.zoneId === zoneId && d.driverCode === driverCode)?.notation ?? {
      note: null,
    };

  const noter = (zoneId: string, driverCode: string, notation: Notation) =>
    modifierEtude((e) => {
      const existe = e.demande.some((d) => d.zoneId === zoneId && d.driverCode === driverCode);
      return {
        ...e,
        demande: existe
          ? e.demande.map((d) =>
              d.zoneId === zoneId && d.driverCode === driverCode ? { ...d, notation } : d,
            )
          : [...e.demande, { zoneId, driverCode, notation }],
      };
    });

  return (
    <>
      <EnTeteEtape
        slug="demande"
        complement={
          <p className="mt-2 max-w-2xl text-[14px] leading-snug text-encre-secondaire">
            {config.libelles.aideEchelleDemande}
          </p>
        }
      />
      <ResumeValidation
        visible={validation.tentative}
        erreursChamps={{}}
        bloquantes={validation.tentative ? validation.bloquantes : []}
        avertissements={[]}
      />

      {etude.zones.length === 0 && (
        <Alerte niveau="critique" titre="Aucune zone définie">
          Revenez à l&apos;étape des zones pour en définir au moins une.
        </Alerte>
      )}

      <div className="flex flex-col gap-5">
        {etude.zones.map((zone, index) => {
          const indice = scores.demandeParZone[zone.id] ?? null;
          return (
            <Carte
              key={zone.id}
              balise="article"
              titre={zone.libelle.trim() || `Zone ${index + 1}`}
              description={`Poids ${formaterDecimal((zone.poids ?? 0) * 100, 0)} % de la chalandise`}
              actions={
                <p className="text-right">
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-encre-attenuee">
                    Indice de demande
                  </span>
                  <span className="chiffres block text-[22px] font-semibold text-encre">
                    {indice === null ? 'à noter' : `${formaterDecimal(indice, 1)} / 100`}
                  </span>
                </p>
              }
            >
              <div className="divide-y divide-bordure">
                {config.drivers.map((driver) => (
                  <SelecteurNote
                    key={driver.code}
                    id={`demande-${zone.id}-${driver.code}`}
                    libelle={driver.libelle}
                    aide={driver.aide}
                    notation={notationDe(zone.id, driver.code)}
                    onChange={(notation) => noter(zone.id, driver.code, notation)}
                    libellesNotes={LIBELLES_NOTES}
                  />
                ))}
              </div>
            </Carte>
          );
        })}

        {validation.avertissements.length > 0 && (
          <Alerte
            niveau="info"
            titre={`${validation.avertissements.length} générateur${validation.avertissements.length > 1 ? 's' : ''} non noté${validation.avertissements.length > 1 ? 's' : ''}`}
          >
            Vous pouvez continuer : les générateurs non notés sont exclus du calcul et la synthèse
            le signalera. Cochez « Non applicable » quand un générateur n&apos;existe pas autour du
            site.
          </Alerte>
        )}
      </div>

      <NavigationEtape slug="demande" onContinuer={validation.tenter} />
    </>
  );
}
