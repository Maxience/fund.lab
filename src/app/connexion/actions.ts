'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { CHEMIN_CONNEXION, PREFIXE_ESPACE_EXPERT } from '@/lib/auth/constantes';
import { enregistrerEchec, estBloque, reinitialiserTentatives } from '@/lib/auth/limitation';
import { verifierMotDePasse } from '@/lib/auth/mot-de-passe';
import { fermerSession, ouvrirSession, purgerSessionsExpirees } from '@/lib/auth/session';
import { bd } from '@/lib/bd';

export interface EtatConnexion {
  erreur?: string;
}

// Hachage factice vérifié quand le compte n'existe pas, pour que le temps de
// réponse ne révèle pas l'existence d'une adresse.
const HACHE_FACTICE =
  'scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

/** Destination après connexion : uniquement une route de l'espace Expert. */
function destinationSure(suite: unknown): string {
  return (typeof suite === 'string' && suite.startsWith(`${PREFIXE_ESPACE_EXPERT}/`)) ||
    suite === PREFIXE_ESPACE_EXPERT
    ? suite
    : PREFIXE_ESPACE_EXPERT;
}

export async function seConnecter(
  _etat: EtatConnexion,
  formulaire: FormData,
): Promise<EtatConnexion> {
  const email = String(formulaire.get('email') ?? '')
    .trim()
    .toLowerCase();
  const motDePasse = String(formulaire.get('motDePasse') ?? '');
  const suite = destinationSure(formulaire.get('suite'));

  if (!email || !motDePasse) {
    return { erreur: 'Indiquez votre adresse e-mail et votre mot de passe.' };
  }

  const adresse = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'locale';
  const cle = `${email}|${adresse}`;
  if (estBloque(cle)) {
    return { erreur: 'Trop de tentatives. Réessayez dans quelques minutes.' };
  }

  const utilisateur = await bd.utilisateur.findUnique({ where: { email } });
  const valide = await verifierMotDePasse(
    motDePasse,
    utilisateur?.motDePasseHache ?? HACHE_FACTICE,
  );

  if (!utilisateur || !valide || utilisateur.etat !== 'ACTIF') {
    enregistrerEchec(cle);
    return { erreur: 'Identifiants incorrects.' };
  }

  reinitialiserTentatives(cle);
  await purgerSessionsExpirees();
  await ouvrirSession(utilisateur.id);
  redirect(suite);
}

export async function seDeconnecter(): Promise<void> {
  await fermerSession();
  redirect(CHEMIN_CONNEXION);
}
