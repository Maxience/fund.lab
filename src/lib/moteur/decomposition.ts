/**
 * Décomposition du score global en contributions additives, pour expliquer
 * d'où viennent les points. Les poids composés sont dérivés de la
 * configuration, jamais écrits en dur. La somme des contributions arrondies
 * reconstitue exactement le score global arrondi.
 */

import type { ConfigurationMethodologie } from './config/types';
import { arrondir } from './primitives';
import type { Contribution, Scores } from './types';

/**
 * Décompose un jeu de scores en précision complète. Retourne une liste vide
 * si le score global n'est pas calculable.
 */
export function decomposerScoreGlobal(
  scores: Scores,
  config: ConfigurationMethodologie,
): Contribution[] {
  const { demandeGlobale, scoreGaps, pressionConcurrentielle, scoreRisque, scoreGlobal } = scores;
  if (
    scoreGlobal === null ||
    demandeGlobale === null ||
    scoreGaps === null ||
    pressionConcurrentielle === null ||
    scoreRisque === null
  ) {
    return [];
  }

  const a = config.attractivite;
  const g = config.scoreGlobal;
  const decimales = config.arrondi.decimalesConservees;

  const brutes: Contribution[] = [
    {
      code: 'DEMANDE',
      libelle: 'Demande accessible',
      points: g.attractivite * a.demande * demandeGlobale,
      potentielMax: g.attractivite * a.demande * 100,
    },
    {
      code: 'GAPS',
      libelle: 'Vides commerciaux',
      points: g.attractivite * a.gaps * scoreGaps,
      potentielMax: g.attractivite * a.gaps * 100,
    },
    {
      code: 'CONCURRENCE',
      libelle: 'Marge face à la concurrence',
      points: g.attractivite * a.concurrence * (100 - pressionConcurrentielle),
      potentielMax: g.attractivite * a.concurrence * 100,
    },
    {
      code: 'RISQUE',
      libelle: 'Maîtrise des risques',
      points: g.risque * (100 - scoreRisque),
      potentielMax: g.risque * 100,
    },
  ];

  const contributions = brutes.map((c) => ({
    ...c,
    points: arrondir(c.points, decimales),
    potentielMax: arrondir(c.potentielMax, decimales),
  }));

  // Le résidu d'arrondi est porté par la plus grosse contribution pour que
  // la somme affichée reconstitue exactement le score global affiché.
  const total = arrondir(scoreGlobal, decimales);
  const sommeArrondie = contributions.reduce((acc, c) => acc + c.points, 0);
  const residu = arrondir(total - sommeArrondie, decimales);
  if (residu !== 0) {
    const indexMax = contributions.reduce(
      (meilleur, c, i) => (c.points > contributions[meilleur].points ? i : meilleur),
      0,
    );
    contributions[indexMax] = {
      ...contributions[indexMax],
      points: arrondir(contributions[indexMax].points + residu, decimales),
    };
  }

  return contributions;
}
