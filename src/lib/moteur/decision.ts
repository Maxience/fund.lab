/**
 * Règles de décision : seuils sur le score global, red flags sur les risques,
 * orientation calculée puis orientation finale. Les red flags priment sur le
 * score agrégé ; les deux orientations sont toujours exposées.
 */

import type { ConfigurationMethodologie } from './config/types';
import { formaterDecimal } from './formatage';
import type { Decision, Note, Orientation, RedFlag } from './types';

/** Orientation issue des seuls seuils. */
export function deciderOrientation(
  scoreGlobal: number,
  seuils: ConfigurationMethodologie['seuils'],
): Orientation {
  if (scoreGlobal < seuils.noGoStrict) return 'NO_GO';
  if (scoreGlobal < seuils.goInclus) return 'GO_SOUS_CONDITIONS';
  return 'GO';
}

export interface RisqueNote {
  code: string;
  libelle: string;
  note: Note | null;
}

/** Détecte les signaux critiques définis par la méthodologie. */
export function detecterRedFlags(
  risques: RisqueNote[],
  config: ConfigurationMethodologie,
): RedFlag[] {
  const { noteCritique, noteVigilance, nombreRisquesVigilance } = config.redFlags;
  const redFlags: RedFlag[] = [];

  const critiques = risques.filter((r) => r.note !== null && r.note >= noteCritique);
  if (critiques.length > 0) {
    redFlags.push({
      code: 'RISQUE_CRITIQUE',
      libelle:
        critiques.length === 1
          ? `Risque noté ${noteCritique} : ${critiques[0].libelle}`
          : `Risques notés ${noteCritique} : ${critiques.map((r) => r.libelle).join(', ')}`,
      risques: critiques.map((r) => r.code),
      effet:
        'La décision ne peut pas rester GO : GO sous conditions critiques, ou NO GO si le score est sous le seuil.',
    });
  }

  const vigilance = risques.filter((r) => r.note !== null && r.note >= noteVigilance);
  if (vigilance.length >= nombreRisquesVigilance) {
    redFlags.push({
      code: 'RISQUES_MULTIPLES',
      libelle: `${vigilance.length} risques notés ${noteVigilance} ou plus`,
      risques: vigilance.map((r) => r.code),
      effet: 'La décision ne peut pas rester GO : GO sous conditions.',
    });
  }

  return redFlags;
}

/** Applique les red flags à l'orientation calculée. */
export function appliquerRedFlags(
  orientationCalculee: Orientation,
  redFlags: RedFlag[],
): { orientationFinale: Orientation; conditionsCritiques: boolean } {
  const critique = redFlags.some((f) => f.code === 'RISQUE_CRITIQUE');
  const multiples = redFlags.some((f) => f.code === 'RISQUES_MULTIPLES');

  let orientationFinale = orientationCalculee;
  if ((critique || multiples) && orientationFinale === 'GO') {
    orientationFinale = 'GO_SOUS_CONDITIONS';
  }

  return {
    orientationFinale,
    conditionsCritiques: critique && orientationFinale !== 'NO_GO',
  };
}

/** Libellé affiché d'une orientation, avec la variante critique. */
export function libellerOrientation(
  orientation: Orientation | null,
  conditionsCritiques: boolean,
  config: ConfigurationMethodologie,
): string {
  if (orientation === null) return config.libelles.orientationNonCalculable;
  if (orientation === 'GO_SOUS_CONDITIONS' && conditionsCritiques) {
    return config.libelles.orientationCritique;
  }
  return config.libelles.orientations[orientation];
}

/** Décision complète : orientations, red flags et justification lisible. */
export function evaluerDecision(
  scoreGlobal: number | null,
  risques: RisqueNote[],
  config: ConfigurationMethodologie,
): Decision {
  const redFlags = detecterRedFlags(risques, config);

  if (scoreGlobal === null) {
    return {
      orientationCalculee: null,
      orientationFinale: null,
      conditionsCritiques: false,
      libelle: libellerOrientation(null, false, config),
      redFlags,
      justification: [
        'Le score global ne peut pas être calculé : des données indispensables manquent.',
        ...redFlags.map((f) => `${f.libelle}. ${f.effet}`),
      ],
    };
  }

  const orientationCalculee = deciderOrientation(scoreGlobal, config.seuils);
  const { orientationFinale, conditionsCritiques } = appliquerRedFlags(
    orientationCalculee,
    redFlags,
  );
  const { noGoStrict, goInclus } = config.seuils;
  const decimales = config.arrondi.decimalesAffichees;
  const libelleCalculee = config.libelles.orientations[orientationCalculee];
  const libelleFinale = libellerOrientation(orientationFinale, conditionsCritiques, config);

  const justification: string[] = [];
  const score = formaterDecimal(scoreGlobal, decimales);
  if (orientationCalculee === 'NO_GO') {
    justification.push(
      `Score global de ${score} sur 100, sous le seuil de ${noGoStrict} : ${libelleCalculee}.`,
    );
  } else if (orientationCalculee === 'GO_SOUS_CONDITIONS') {
    justification.push(
      `Score global de ${score} sur 100, entre ${noGoStrict} et ${goInclus} : ${libelleCalculee}.`,
    );
  } else {
    justification.push(
      `Score global de ${score} sur 100, au moins ${goInclus} : ${libelleCalculee}.`,
    );
  }
  for (const flag of redFlags) {
    justification.push(`${flag.libelle}. ${flag.effet}`);
  }
  if (orientationFinale !== orientationCalculee) {
    justification.push(`Orientation ramenée de ${libelleCalculee} à ${libelleFinale}.`);
  } else if (conditionsCritiques) {
    justification.push(
      `Orientation finale : ${libelleFinale}. Le risque critique doit être traité avant toute décision.`,
    );
  } else if (redFlags.length > 0) {
    justification.push(
      `Orientation finale : ${libelleFinale}, inchangée par les signaux critiques.`,
    );
  } else {
    justification.push(`Aucun signal critique : orientation finale ${libelleFinale}.`);
  }

  return {
    orientationCalculee,
    orientationFinale,
    conditionsCritiques,
    libelle: libelleFinale,
    redFlags,
    justification,
  };
}
