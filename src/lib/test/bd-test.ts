/**
 * Utilitaires pour les tests d'intégration qui touchent une vraie base de
 * données : `chalandise_test`, distincte de la base de développement et de
 * démonstration (jamais partagée). Le script `vitest.setup.recette.mts`
 * bascule `DATABASE_URL` sur `DATABASE_URL_TEST` avant que ce module ou tout
 * service ne soit chargé.
 *
 * N'est jamais importé par le moteur ni par les tests unitaires ordinaires :
 * réservé aux fichiers `*.recette.test.ts`.
 */
import { bd } from '@/lib/bd';
import { hacherMotDePasse } from '@/lib/auth/mot-de-passe';

const TABLES = [
  'preuves',
  'resultats',
  'risques',
  'gaps',
  'concurrents',
  'evaluations_demande',
  'zones',
  'etudes',
  'clients',
  'sessions',
  'utilisateurs',
] as const;

/** Vide toutes les tables applicatives de la base de test, sans toucher aux migrations. */
export async function nettoyerBaseTest(): Promise<void> {
  const liste = TABLES.map((t) => `"${t}"`).join(', ');
  await bd.$executeRawUnsafe(`TRUNCATE TABLE ${liste} RESTART IDENTITY CASCADE;`);
}

/** Crée un compte Expert de test, avec un mot de passe haché comme en production. */
export async function creerExpertTest(email = `expert-test-${Date.now()}@exemple.test`) {
  const motDePasseHache = await hacherMotDePasse('mot-de-passe-de-test-1');
  return bd.utilisateur.create({
    data: { email, nom: 'Expert de test', motDePasseHache, role: 'EXPERT' },
  });
}
