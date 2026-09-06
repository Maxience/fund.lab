import 'server-only';

import { z } from 'zod';

import { bd } from '@/lib/bd';

import { ErreurIntrouvable, ErreurValidation } from './erreurs';

/**
 * Clients FUND.lab : nom ou raison sociale, contact facultatif, notes
 * internes. Toute fonction est appelée après exigerExpert() par l'appelant.
 */

export const schemaClient = z.object({
  nom: z
    .string({ error: 'Le nom du client est obligatoire.' })
    .trim()
    .min(2, 'Le nom du client doit compter au moins 2 caractères.')
    .max(120, 'Le nom du client doit compter au plus 120 caractères.'),
  contact: z.string().trim().max(200, 'Au plus 200 caractères.').optional(),
  notesInternes: z.string().trim().max(2000, 'Au plus 2 000 caractères.').optional(),
});

export type SaisieClient = z.infer<typeof schemaClient>;

function validerSaisieClient(valeur: unknown): SaisieClient {
  const resultat = schemaClient.safeParse(valeur);
  if (!resultat.success) {
    const erreurs: Record<string, string> = {};
    for (const issue of resultat.error.issues) {
      const chemin = issue.path.map(String).join('.');
      if (!(chemin in erreurs)) erreurs[chemin] = issue.message;
    }
    throw new ErreurValidation(Object.values(erreurs), erreurs);
  }
  return resultat.data;
}

export async function listerClients(options: { archives?: boolean } = {}) {
  return bd.client.findMany({
    where: options.archives ? {} : { archiveLe: null },
    orderBy: { nom: 'asc' },
    include: { _count: { select: { etudes: true } } },
  });
}

export async function obtenirClient(id: string) {
  const client = await bd.client.findUnique({
    where: { id },
    include: {
      etudes: {
        where: { archiveeLe: null },
        orderBy: { misAJourLe: 'desc' },
        include: { resultats: { orderBy: { creeLe: 'desc' }, take: 1 } },
      },
    },
  });
  if (!client) throw new ErreurIntrouvable('Client');
  return client;
}

export async function creerClient(saisie: unknown) {
  const donnees = validerSaisieClient(saisie);
  return bd.client.create({
    data: {
      nom: donnees.nom,
      contact: donnees.contact || null,
      notesInternes: donnees.notesInternes || null,
    },
  });
}

export async function modifierClient(id: string, saisie: unknown) {
  const donnees = validerSaisieClient(saisie);
  const existant = await bd.client.findUnique({ where: { id }, select: { id: true } });
  if (!existant) throw new ErreurIntrouvable('Client');
  return bd.client.update({
    where: { id },
    data: {
      nom: donnees.nom,
      contact: donnees.contact || null,
      notesInternes: donnees.notesInternes || null,
    },
  });
}

export async function archiverClient(id: string) {
  const existant = await bd.client.findUnique({ where: { id }, select: { id: true } });
  if (!existant) throw new ErreurIntrouvable('Client');
  return bd.client.update({ where: { id }, data: { archiveLe: new Date() } });
}

export async function restaurerClient(id: string) {
  const existant = await bd.client.findUnique({ where: { id }, select: { id: true } });
  if (!existant) throw new ErreurIntrouvable('Client');
  return bd.client.update({ where: { id }, data: { archiveLe: null } });
}
