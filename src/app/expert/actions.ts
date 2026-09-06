'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { exigerExpert } from '@/lib/auth/session';
import { journaliserErreur } from '@/lib/journal';
import type { EtudeSaisie } from '@/lib/moteur';
import {
  archiverClient,
  creerClient,
  modifierClient,
  restaurerClient,
} from '@/lib/services/clients';
import { ErreurValidation, messageUtilisateur } from '@/lib/services/erreurs';
import {
  archiverEtude,
  creerEtude,
  dupliquerEtude,
  enregistrerSaisie,
  finaliserEtude,
  rattacherClient,
  restaurerEtude,
  rouvrirEtude,
} from '@/lib/services/etudes';
import { ajouterPreuve, supprimerPreuve } from '@/lib/services/preuves';

/**
 * Actions serveur de l'espace Expert. Chacune commence par exigerExpert() :
 * sans session valide, la requête est redirigée vers la connexion avant tout
 * accès aux données.
 */

export type ReponseAction<T = object> =
  ({ ok: true } & T) | { ok: false; erreur: string; erreurs?: Record<string, string> };

export interface EtatFormulaire {
  erreur?: string;
  erreurs?: Record<string, string>;
  succes?: string;
}

function reponseErreur(
  contexte: string,
  erreur: unknown,
): { ok: false; erreur: string; erreurs?: Record<string, string> } {
  if (!(erreur instanceof ErreurValidation)) journaliserErreur(contexte, erreur);
  return {
    ok: false,
    erreur: messageUtilisateur(erreur),
    ...(erreur instanceof ErreurValidation ? { erreurs: erreur.erreurs } : {}),
  };
}

function texte(formulaire: FormData, cle: string): string {
  return String(formulaire.get(cle) ?? '').trim();
}

/* Études ------------------------------------------------------------------ */

export async function enregistrerSaisieAction(
  etudeId: string,
  saisie: EtudeSaisie,
  etapeAtteinte: number,
): Promise<ReponseAction<{ misAJourLe: string }>> {
  await exigerExpert();
  try {
    const { misAJourLe } = await enregistrerSaisie(etudeId, saisie, etapeAtteinte);
    revalidatePath(`/expert/etudes/${etudeId}`);
    return { ok: true, misAJourLe: misAJourLe.toISOString() };
  } catch (erreur) {
    return reponseErreur('enregistrerSaisie', erreur);
  }
}

export async function finaliserEtudeAction(etudeId: string): Promise<ReponseAction> {
  await exigerExpert();
  try {
    await finaliserEtude(etudeId);
    revalidatePath('/expert');
    revalidatePath(`/expert/etudes/${etudeId}`);
    return { ok: true };
  } catch (erreur) {
    return reponseErreur('finaliserEtude', erreur);
  }
}

export async function rouvrirEtudeAction(etudeId: string): Promise<ReponseAction> {
  await exigerExpert();
  try {
    await rouvrirEtude(etudeId);
    revalidatePath('/expert');
    revalidatePath(`/expert/etudes/${etudeId}`);
    return { ok: true };
  } catch (erreur) {
    return reponseErreur('rouvrirEtude', erreur);
  }
}

export async function archiverEtudeAction(formulaire: FormData): Promise<void> {
  await exigerExpert();
  const etudeId = texte(formulaire, 'etudeId');
  try {
    await archiverEtude(etudeId);
  } catch (erreur) {
    journaliserErreur('archiverEtude', erreur);
  }
  revalidatePath('/expert');
  redirect('/expert');
}

export async function restaurerEtudeAction(formulaire: FormData): Promise<void> {
  await exigerExpert();
  const etudeId = texte(formulaire, 'etudeId');
  try {
    await restaurerEtude(etudeId);
  } catch (erreur) {
    journaliserErreur('restaurerEtude', erreur);
  }
  revalidatePath('/expert');
  redirect(`/expert/etudes/${etudeId}`);
}

export async function creerEtudeAction(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  const session = await exigerExpert();
  let id: string;
  try {
    const clientId = texte(formulaire, 'clientId');
    const etude = await creerEtude({
      proprietaireId: session.utilisateur.id,
      clientId: clientId || null,
      nomProjet: texte(formulaire, 'nomProjet'),
    });
    id = etude.id;
  } catch (erreur) {
    return reponseErreur('creerEtude', erreur);
  }
  revalidatePath('/expert');
  redirect(`/expert/etudes/${id}/projet`);
}

export async function dupliquerEtudeAction(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  const session = await exigerExpert();
  const etudeId = texte(formulaire, 'etudeId');
  let id: string;
  try {
    const variante = await dupliquerEtude(etudeId, {
      libelleScenario: texte(formulaire, 'libelleScenario'),
      proprietaireId: session.utilisateur.id,
    });
    id = variante.id;
  } catch (erreur) {
    return reponseErreur('dupliquerEtude', erreur);
  }
  revalidatePath('/expert');
  revalidatePath(`/expert/etudes/${etudeId}`);
  redirect(`/expert/etudes/${id}`);
}

export async function rattacherClientAction(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  const session = await exigerExpert();
  const etudeId = texte(formulaire, 'etudeId');
  const clientId = texte(formulaire, 'clientId');
  try {
    await rattacherClient(etudeId, clientId || null, session.utilisateur.id);
  } catch (erreur) {
    return reponseErreur('rattacherClient', erreur);
  }
  revalidatePath('/expert');
  revalidatePath(`/expert/etudes/${etudeId}`);
  return { succes: clientId ? 'Étude rattachée au client.' : 'Étude détachée du client.' };
}

/* Preuves ----------------------------------------------------------------- */

export async function ajouterPreuveAction(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  const session = await exigerExpert();
  const etudeId = texte(formulaire, 'etudeId');
  try {
    await ajouterPreuve(etudeId, session.utilisateur.id, {
      rubrique: texte(formulaire, 'rubrique'),
      niveau: texte(formulaire, 'niveau'),
      source: texte(formulaire, 'source'),
      commentaire: texte(formulaire, 'commentaire'),
      dateObservation: texte(formulaire, 'dateObservation'),
    });
  } catch (erreur) {
    return reponseErreur('ajouterPreuve', erreur);
  }
  revalidatePath(`/expert/etudes/${etudeId}`);
  return { succes: 'Preuve enregistrée.' };
}

export async function supprimerPreuveAction(formulaire: FormData): Promise<void> {
  await exigerExpert();
  const etudeId = texte(formulaire, 'etudeId');
  try {
    await supprimerPreuve(texte(formulaire, 'preuveId'));
  } catch (erreur) {
    journaliserErreur('supprimerPreuve', erreur);
  }
  revalidatePath(`/expert/etudes/${etudeId}`);
}

/* Clients ----------------------------------------------------------------- */

export async function creerClientAction(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  await exigerExpert();
  let id: string;
  try {
    const client = await creerClient({
      nom: texte(formulaire, 'nom'),
      contact: texte(formulaire, 'contact'),
      notesInternes: texte(formulaire, 'notesInternes'),
    });
    id = client.id;
  } catch (erreur) {
    return reponseErreur('creerClient', erreur);
  }
  revalidatePath('/expert/clients');
  redirect(`/expert/clients/${id}`);
}

export async function modifierClientAction(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  await exigerExpert();
  const id = texte(formulaire, 'clientId');
  try {
    await modifierClient(id, {
      nom: texte(formulaire, 'nom'),
      contact: texte(formulaire, 'contact'),
      notesInternes: texte(formulaire, 'notesInternes'),
    });
  } catch (erreur) {
    return reponseErreur('modifierClient', erreur);
  }
  revalidatePath('/expert/clients');
  revalidatePath(`/expert/clients/${id}`);
  return { succes: 'Client enregistré.' };
}

export async function archiverClientAction(formulaire: FormData): Promise<void> {
  await exigerExpert();
  const id = texte(formulaire, 'clientId');
  const restaurer = texte(formulaire, 'restaurer') === '1';
  try {
    if (restaurer) await restaurerClient(id);
    else await archiverClient(id);
  } catch (erreur) {
    journaliserErreur('archiverClient', erreur);
  }
  revalidatePath('/expert/clients');
  redirect('/expert/clients');
}
