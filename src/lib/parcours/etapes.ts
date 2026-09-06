/**
 * Les huit étapes du parcours, dans l'ordre du brief. Chaque étape est
 * rattachée à la rubrique du moteur dont elle affiche les alertes.
 */

import type { Rubrique } from '@/lib/moteur';

export type SlugEtape =
  'projet' | 'hypotheses' | 'zones' | 'demande' | 'concurrence' | 'vides' | 'risques' | 'synthese';

export interface Etape {
  slug: SlugEtape;
  numero: number;
  titre: string;
  court: string;
  description: string;
  rubrique: Rubrique | null;
}

export const ETAPES: readonly Etape[] = [
  {
    slug: 'projet',
    numero: 1,
    titre: 'Cadrer le projet',
    court: 'Projet',
    description: 'Nom du projet, localité, concept, horaires, capacité et modes de service.',
    rubrique: 'PROJET',
  },
  {
    slug: 'hypotheses',
    numero: 2,
    titre: 'Poser les hypothèses commerciales',
    court: 'Hypothèses',
    description: "Ticket moyen, fréquentation, jours d'ouverture, loyer envisagé et part cible.",
    rubrique: 'HYPOTHESES',
  },
  {
    slug: 'zones',
    numero: 3,
    titre: "Décrire l'aire de chalandise",
    court: 'Zones',
    description: "Jusqu'à quatre zones : rayon, temps d'accès, mode de déplacement et poids.",
    rubrique: 'ZONES',
  },
  {
    slug: 'demande',
    numero: 4,
    titre: 'Observer la demande',
    court: 'Demande',
    description: 'Notation des générateurs de flux et de solvabilité, zone par zone.',
    rubrique: 'DEMANDE',
  },
  {
    slug: 'concurrence',
    numero: 5,
    titre: 'Qualifier la concurrence',
    court: 'Concurrence',
    description: 'Recensement et appréciation structurée des concurrents.',
    rubrique: 'CONCURRENCE',
  },
  {
    slug: 'vides',
    numero: 6,
    titre: 'Identifier les vides commerciaux',
    court: 'Vides',
    description: 'Besoins absents, mal servis ou correctement servis autour du site.',
    rubrique: 'GAPS',
  },
  {
    slug: 'risques',
    numero: 7,
    titre: 'Évaluer les risques',
    court: 'Risques',
    description: 'Contraintes du site, approvisionnement, ressources humaines, conformité.',
    rubrique: 'RISQUES',
  },
  {
    slug: 'synthese',
    numero: 8,
    titre: 'Lire le résultat',
    court: 'Synthèse',
    description: 'Indicateurs, décision, conditions critiques et actions suivantes.',
    rubrique: 'SYNTHESE',
  },
];

export const NOMBRE_ETAPES = ETAPES.length;

export function etapeParSlug(slug: string): Etape | undefined {
  return ETAPES.find((e) => e.slug === slug);
}

export function etapeSuivante(slug: SlugEtape): Etape | undefined {
  const index = ETAPES.findIndex((e) => e.slug === slug);
  return index >= 0 ? ETAPES[index + 1] : undefined;
}

export function etapePrecedente(slug: SlugEtape): Etape | undefined {
  const index = ETAPES.findIndex((e) => e.slug === slug);
  return index > 0 ? ETAPES[index - 1] : undefined;
}

export function cheminEtape(slug: SlugEtape): string {
  return `/etude/${slug}`;
}
