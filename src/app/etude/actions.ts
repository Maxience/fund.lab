'use server';

import { journaliserErreur } from '@/lib/journal';
import type { EtudeSaisie } from '@/lib/moteur';
import { ErreurMetier } from '@/lib/services/erreurs';
import { sauvegarderEtudePme } from '@/lib/services/etudes';

/**
 * Persistance serveur du parcours PME par identifiant temporaire. Le
 * navigateur reste la référence de l'utilisateur ; la copie serveur permet
 * à un Expert de reprendre l'étude et couvre la reprise après actualisation.
 */
export async function sauvegarderEtudePmeAction(
  jeton: string,
  etude: EtudeSaisie,
  etapeAtteinte: number,
  statut: 'BROUILLON' | 'COMPLETE',
): Promise<{ ok: true; misAJourLe: string } | { ok: false; erreur: string }> {
  try {
    const { misAJourLe } = await sauvegarderEtudePme(jeton, etude, etapeAtteinte, statut);
    return { ok: true, misAJourLe: misAJourLe.toISOString() };
  } catch (erreur) {
    if (!(erreur instanceof ErreurMetier)) journaliserErreur('sauvegarderEtudePme', erreur);
    return {
      ok: false,
      erreur: erreur instanceof ErreurMetier ? erreur.message : 'Sauvegarde serveur indisponible.',
    };
  }
}
