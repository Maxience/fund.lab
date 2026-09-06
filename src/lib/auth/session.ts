import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { bd } from '@/lib/bd';

import { CHEMIN_CONNEXION, NOM_COOKIE_SESSION } from './constantes';

/**
 * Sessions Expert : jeton aléatoire porté par un cookie httpOnly, dont seule
 * l'empreinte SHA-256 est enregistrée en base. Une session expire à date
 * fixe ; une déconnexion la supprime.
 */

const DUREE_JOURS_PAR_DEFAUT = 7;

function dureeSessionMs(): number {
  const jours = Number(process.env.SESSION_DUREE_JOURS ?? DUREE_JOURS_PAR_DEFAUT);
  return (Number.isFinite(jours) && jours > 0 ? jours : DUREE_JOURS_PAR_DEFAUT) * 24 * 3600 * 1000;
}

function hacherJeton(jeton: string): string {
  return createHash('sha256').update(jeton).digest('hex');
}

export interface UtilisateurConnecte {
  id: string;
  email: string;
  nom: string;
  role: 'EXPERT';
}

export interface SessionExpert {
  utilisateur: UtilisateurConnecte;
  expireLe: Date;
}

/** Crée une session en base et pose le cookie. */
export async function ouvrirSession(utilisateurId: string): Promise<void> {
  const jeton = randomBytes(32).toString('base64url');
  const expireLe = new Date(Date.now() + dureeSessionMs());
  await bd.session.create({
    data: { jetonHache: hacherJeton(jeton), utilisateurId, expireLe },
  });
  const magasin = await cookies();
  magasin.set(NOM_COOKIE_SESSION, jeton, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expireLe,
  });
}

/**
 * Session courante, ou null. Mise en cache par requête : plusieurs
 * composants d'une même page ne déclenchent qu'une lecture en base.
 */
export const obtenirSession = cache(async (): Promise<SessionExpert | null> => {
  const jeton = (await cookies()).get(NOM_COOKIE_SESSION)?.value;
  if (!jeton) return null;
  const session = await bd.session.findUnique({
    where: { jetonHache: hacherJeton(jeton) },
    include: { utilisateur: true },
  });
  if (!session || session.expireLe.getTime() <= Date.now()) return null;
  if (session.utilisateur.etat !== 'ACTIF') return null;
  return {
    utilisateur: {
      id: session.utilisateur.id,
      email: session.utilisateur.email,
      nom: session.utilisateur.nom,
      role: session.utilisateur.role,
    },
    expireLe: session.expireLe,
  };
});

/**
 * Garde de la couche serveur : toute fonction Expert commence par cet
 * appel. Sans session valide, redirige vers la connexion (pages) ; dans une
 * action, la redirection interrompt aussi le traitement.
 */
export async function exigerExpert(): Promise<SessionExpert> {
  const session = await obtenirSession();
  if (!session || session.utilisateur.role !== 'EXPERT') {
    redirect(CHEMIN_CONNEXION);
  }
  return session;
}

/** Supprime la session courante en base et efface le cookie. */
export async function fermerSession(): Promise<void> {
  const magasin = await cookies();
  const jeton = magasin.get(NOM_COOKIE_SESSION)?.value;
  if (jeton) {
    await bd.session.deleteMany({ where: { jetonHache: hacherJeton(jeton) } });
  }
  magasin.delete(NOM_COOKIE_SESSION);
}

/** Ménage des sessions expirées, appelé à la connexion. */
export async function purgerSessionsExpirees(): Promise<void> {
  await bd.session.deleteMany({ where: { expireLe: { lt: new Date() } } });
}
