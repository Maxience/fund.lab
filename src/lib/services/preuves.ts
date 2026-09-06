import 'server-only';

import { z } from 'zod';

import { bd } from '@/lib/bd';

import { ErreurIntrouvable, ErreurValidation } from './erreurs';

/**
 * Preuves et commentaires par rubrique d'une étude : niveau de preuve à
 * quatre états, source ou commentaire, date d'observation, auteur.
 */

export const schemaPreuve = z.object({
  rubrique: z.enum(['PROJET', 'HYPOTHESES', 'ZONES', 'DEMANDE', 'CONCURRENCE', 'GAPS', 'RISQUES'], {
    error: 'Choisissez la rubrique concernée.',
  }),
  niveau: z.enum(['NON_DOCUMENTEE', 'DECLARATIVE', 'OBSERVEE', 'DOCUMENTEE'], {
    error: 'Choisissez un niveau de preuve.',
  }),
  source: z.string().trim().max(300, 'Au plus 300 caractères.').optional(),
  commentaire: z.string().trim().max(2000, 'Au plus 2 000 caractères.').optional(),
  dateObservation: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date au format AAAA-MM-JJ.')
    .optional()
    .or(z.literal('')),
});

export type SaisiePreuve = z.infer<typeof schemaPreuve>;

export const LIBELLES_NIVEAU_PREUVE: Record<SaisiePreuve['niveau'], string> = {
  NON_DOCUMENTEE: 'Non documentée',
  DECLARATIVE: 'Déclarative',
  OBSERVEE: 'Observée',
  DOCUMENTEE: 'Documentée',
};

export async function ajouterPreuve(etudeId: string, auteurId: string, saisie: unknown) {
  const resultat = schemaPreuve.safeParse(saisie);
  if (!resultat.success) {
    throw new ErreurValidation(resultat.error.issues.map((i) => i.message));
  }
  const etude = await bd.etude.findUnique({ where: { id: etudeId }, select: { id: true } });
  if (!etude) throw new ErreurIntrouvable('Étude');
  const { rubrique, niveau, source, commentaire, dateObservation } = resultat.data;
  if (!source && !commentaire && niveau === 'NON_DOCUMENTEE') {
    throw new ErreurValidation(['Indiquez une source ou un commentaire, ou un niveau de preuve.']);
  }
  return bd.preuve.create({
    data: {
      etudeId,
      auteurId,
      rubrique,
      niveau,
      source: source || null,
      commentaire: commentaire || null,
      dateObservation: dateObservation ? new Date(`${dateObservation}T00:00:00.000Z`) : null,
    },
  });
}

export async function supprimerPreuve(id: string) {
  const preuve = await bd.preuve.findUnique({ where: { id }, select: { id: true } });
  if (!preuve) throw new ErreurIntrouvable('Preuve');
  await bd.preuve.delete({ where: { id } });
}
