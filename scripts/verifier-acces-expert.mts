/**
 * Contrôle de l'accès Expert de bout en bout, sans navigateur.
 *
 * 1. Le compte initial existe en base et son mot de passe (.env) est vérifié
 *    par le même module que la page de connexion.
 * 2. Les données de démonstration sont présentes.
 * 3. Avec une session temporaire, le tableau de bord, la liste des clients,
 *    un dossier et une étape de saisie répondent 200 (cas R06).
 * 4. Sans session, l'espace Expert redirige vers la connexion (cas R07).
 *
 * Usage : npm run auth:verifier [-- http://localhost:3001]
 * La session de test est supprimée à la fin.
 */

import { createHash, randomBytes } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';
import { NOM_COOKIE_SESSION } from '../src/lib/auth/constantes';
import { verifierMotDePasse } from '../src/lib/auth/mot-de-passe';

try {
  process.loadEnvFile('.env');
} catch {
  // Variables déjà dans l'environnement.
}

const base = process.argv[2] ?? 'http://localhost:3001';
const url = process.env.DATABASE_URL;
const email = (process.env.EXPERT_EMAIL_INITIAL ?? '').trim().toLowerCase();
const motDePasse = process.env.EXPERT_MOT_DE_PASSE_INITIAL ?? '';
if (!url || !email || !motDePasse) {
  throw new Error('DATABASE_URL, EXPERT_EMAIL_INITIAL et EXPERT_MOT_DE_PASSE_INITIAL sont requis.');
}

const bd = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
let echecs = 0;
const constater = (ok: boolean, libelle: string) => {
  console.log(`${ok ? 'OK    ' : 'ECHEC '} ${libelle}`);
  if (!ok) echecs += 1;
};

async function principal() {
  const compte = await bd.utilisateur.findUnique({ where: { email } });
  constater(compte !== null, `compte Expert ${email} présent`);
  if (!compte) return;
  constater(
    await verifierMotDePasse(motDePasse, compte.motDePasseHache),
    'mot de passe initial vérifié par le module de connexion',
  );
  constater(compte.etat === 'ACTIF', 'compte actif');

  const [clients, etudes, resultats] = await Promise.all([
    bd.client.count(),
    bd.etude.count(),
    bd.resultat.count(),
  ]);
  constater(
    clients >= 2 && etudes >= 3 && resultats >= 3,
    `données de démonstration : ${clients} clients, ${etudes} études, ${resultats} résultats`,
  );

  const jeton = randomBytes(32).toString('base64url');
  const session = await bd.session.create({
    data: {
      jetonHache: createHash('sha256').update(jeton).digest('hex'),
      utilisateurId: compte.id,
      expireLe: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  const entetes = { cookie: `${NOM_COOKIE_SESSION}=${jeton}` };
  try {
    const tableau = await fetch(`${base}/expert`, { headers: entetes, redirect: 'manual' });
    const html = await tableau.text();
    constater(
      tableau.status === 200 && html.includes('Tableau de bord'),
      `GET /expert avec session : ${tableau.status}`,
    );
    constater(
      html.includes('Snack Le Carrefour'),
      'étude de démonstration listée dans le tableau de bord',
    );

    const listeClients = await fetch(`${base}/expert/clients`, {
      headers: entetes,
      redirect: 'manual',
    });
    constater(
      listeClients.status === 200,
      `GET /expert/clients avec session : ${listeClients.status}`,
    );

    const reference = await bd.etude.findFirst({
      where: { typeScenario: 'REFERENCE' },
      orderBy: { creeLe: 'asc' },
    });
    if (reference) {
      const dossier = await fetch(`${base}/expert/etudes/${reference.id}`, {
        headers: entetes,
        redirect: 'manual',
      });
      const htmlDossier = await dossier.text();
      constater(
        dossier.status === 200 &&
          htmlDossier.includes('Lecture de sensibilité') &&
          htmlDossier.includes('Preuves et commentaires'),
        `GET dossier avec session : ${dossier.status}`,
      );
      const saisie = await fetch(`${base}/expert/etudes/${reference.id}/zones`, {
        headers: entetes,
        redirect: 'manual',
      });
      constater(
        saisie.status === 200,
        `GET étape de saisie Expert avec session : ${saisie.status}`,
      );
    }

    const sansSession = await fetch(`${base}/expert`, { redirect: 'manual' });
    const destination = sansSession.headers.get('location') ?? '';
    constater(
      sansSession.status === 307 && destination.includes('/connexion'),
      `GET /expert sans session : ${sansSession.status} vers ${destination || '(aucune)'}`,
    );
  } finally {
    await bd.session.delete({ where: { id: session.id } });
  }
}

principal()
  .catch((erreur: unknown) => {
    console.error(erreur instanceof Error ? erreur.message : String(erreur));
    echecs += 1;
  })
  .finally(async () => {
    await bd.$disconnect();
    console.log(
      echecs === 0
        ? 'Accès Expert : tous les contrôles passent.'
        : `Accès Expert : ${echecs} contrôle(s) en échec.`,
    );
    process.exitCode = echecs === 0 ? 0 : 1;
  });
