/**
 * Validation d'une étape du parcours : forme et bornes par les schémas Zod,
 * règles métier par les alertes du moteur filtrées sur la rubrique de
 * l'étape. Aucune règle n'est réécrite ici.
 */

import {
  CONFIG_COURANTE,
  validerEtude,
  type Alerte,
  type ConfigurationMethodologie,
  type EtudeSaisie,
} from '@/lib/moteur';
import {
  schemaConcurrents,
  schemaHypotheses,
  schemaProjet,
  schemaZones,
  valider,
  type ErreursChamps,
} from '@/lib/validation/etude';

import { etapeParSlug, type SlugEtape } from './etapes';

export interface ResultatValidationEtape {
  /** Vrai quand aucune erreur de champ ni alerte bloquante ne subsiste. */
  ok: boolean;
  /** Erreurs de forme, par chemin de champ relatif à l'étape. */
  erreursChamps: ErreursChamps;
  /** Alertes bloquantes du moteur pour la rubrique de l'étape. */
  bloquantes: Alerte[];
  /** Avertissements du moteur pour la rubrique de l'étape. */
  avertissements: Alerte[];
}

function erreursDeForme(slug: SlugEtape, etude: EtudeSaisie): ErreursChamps {
  switch (slug) {
    case 'projet':
      return valider(schemaProjet, etude.projet).erreurs;
    case 'hypotheses':
      return valider(schemaHypotheses, etude.hypotheses).erreurs;
    case 'zones':
      return valider(schemaZones, etude.zones).erreurs;
    case 'concurrence':
      return valider(schemaConcurrents, etude.concurrents).erreurs;
    default:
      return {};
  }
}

/** Valide l'étape demandée sur l'étude complète. */
export function validerEtape(
  slug: SlugEtape,
  etude: EtudeSaisie,
  config: ConfigurationMethodologie = CONFIG_COURANTE,
): ResultatValidationEtape {
  const etape = etapeParSlug(slug);
  const erreursChamps = erreursDeForme(slug, etude);
  const alertes = etape?.rubrique
    ? validerEtude(etude, config).filter((a) => a.rubrique === etape.rubrique)
    : [];

  // Une alerte du moteur qui vise un champ déjà en erreur de forme est
  // redondante : le message du formulaire suffit.
  const bloquantes = alertes.filter(
    (a) => a.niveau === 'BLOQUANTE' && !(a.cible !== undefined && a.cible in erreursChamps),
  );
  const avertissements = alertes.filter((a) => a.niveau === 'AVERTISSEMENT');

  return {
    ok: Object.keys(erreursChamps).length === 0 && bloquantes.length === 0,
    erreursChamps,
    bloquantes,
    avertissements,
  };
}

/** Numéro de la première étape en erreur, ou null si tout est valide. */
export function premiereEtapeInvalide(
  etude: EtudeSaisie,
  config: ConfigurationMethodologie = CONFIG_COURANTE,
): SlugEtape | null {
  const slugs: SlugEtape[] = [
    'projet',
    'hypotheses',
    'zones',
    'demande',
    'concurrence',
    'vides',
    'risques',
  ];
  for (const slug of slugs) {
    if (!validerEtape(slug, etude, config).ok) return slug;
  }
  return null;
}
