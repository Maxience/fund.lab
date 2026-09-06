/**
 * Création ou mise à jour d'un compte Expert depuis la ligne de commande.
 * Il n'existe pas d'inscription dans l'application : les comptes sont créés
 * ici par l'administrateur du dépôt.
 *
 * Usage :
 *   npm run auth:creer -- --email prenom.nom@exemple.test --nom "Prénom Nom" --mot-de-passe "..."
 *   Option --forcer : accepte un mot de passe sous le minimum de robustesse
 *   (à réserver aux environnements de test, jamais en production).
 *
 * Le mot de passe est haché avant enregistrement et n'est jamais affiché.
 */

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';
import { controlerRobustesse, hacherMotDePasse } from '../src/lib/auth/mot-de-passe';

try {
  process.loadEnvFile('.env');
} catch {
  // Variables déjà dans l'environnement.
}

function argument(nom: string): string | undefined {
  const index = process.argv.indexOf(`--${nom}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const email = (argument('email') ?? '').trim().toLowerCase();
const nom = (argument('nom') ?? '').trim();
const motDePasse = argument('mot-de-passe') ?? '';
const forcer = process.argv.includes('--forcer');

if (!email || !nom || !motDePasse) {
  console.error('Usage : --email <adresse> --nom <nom> --mot-de-passe <mot de passe> [--forcer]');
  process.exit(2);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Adresse e-mail invalide.');
  process.exit(2);
}
const robustesse = controlerRobustesse(motDePasse);
if (!robustesse.ok && !forcer) {
  console.error(
    `Mot de passe refusé : ${robustesse.message} Ajoutez --forcer pour un environnement de test.`,
  );
  process.exit(2);
}
if (!robustesse.ok && forcer) {
  console.warn(`Avertissement : ${robustesse.message} Compte créé malgré tout (--forcer).`);
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL est absente.');
const bd = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

hacherMotDePasse(motDePasse)
  .then((motDePasseHache) =>
    bd.utilisateur.upsert({
      where: { email },
      update: { nom, motDePasseHache, etat: 'ACTIF' },
      create: { email, nom, motDePasseHache, role: 'EXPERT' },
    }),
  )
  .then((compte) => {
    console.log(`Compte Expert prêt : ${compte.email} (${compte.nom}).`);
  })
  .catch((erreur: unknown) => {
    console.error(erreur instanceof Error ? erreur.message : String(erreur));
    process.exitCode = 1;
  })
  .finally(() => bd.$disconnect());
