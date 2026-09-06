/**
 * Données de démonstration. Aucune donnée réelle de client FUND.lab : les
 * enseignes, localités et personnes sont fictives.
 *
 * Crée ou met à jour :
 * - un compte Expert dont l'identité et le mot de passe viennent de .env ;
 * - deux clients fictifs ;
 * - les deux études de référence du moteur, finalisées, avec résultat figé ;
 * - un scénario dérivé de l'étude nominale ;
 * - quelques preuves.
 *
 * Rejouable : les études de démonstration existantes sont remplacées.
 * Lancement : npm run db:semer
 */

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient, type Prisma } from '../src/generated/prisma/client';
import { controlerRobustesse, hacherMotDePasse } from '../src/lib/auth/mot-de-passe';
import { evaluerEtude, type EtudeSaisie, type ResultatEtude } from '../src/lib/moteur';
// Sous tsx, les fichiers .ts du projet sont chargés en CommonJS : les noms
// réexportés par « export * » ne sont pas visibles depuis ce module ESM.
// D'où les imports depuis les modules d'origine.
import { CAS_NOMINAL, CAS_RISQUES_CRITIQUES } from '../src/lib/moteur/cas-reference';
import { CONFIG_COURANTE } from '../src/lib/moteur/config';
import { champsScalaires, enfantsACreer } from '../src/lib/services/etudes/conversion';

try {
  process.loadEnvFile('.env');
} catch {
  // Variables déjà dans l'environnement.
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL est absente.');
const bd = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const EMAIL = (process.env.EXPERT_EMAIL_INITIAL ?? '').trim().toLowerCase();
const NOM = (process.env.EXPERT_NOM_INITIAL ?? 'Expert FUND.lab').trim();
const MOT_DE_PASSE = process.env.EXPERT_MOT_DE_PASSE_INITIAL ?? '';

const MARQUEUR_DEMO = '[démo]';

function ligneResultat(resultat: ResultatEtude, fige: boolean) {
  return {
    versionMoteur: resultat.versionMoteur,
    versionMethodologie: resultat.versionMethodologie,
    calculeLe: new Date(resultat.calculeLe),
    scoreGlobal: resultat.scores.scoreGlobal,
    attractivite: resultat.scores.attractivite,
    demandeGlobale: resultat.scores.demandeGlobale,
    pressionConcurrentielle: resultat.scores.pressionConcurrentielle,
    scoreGaps: resultat.scores.scoreGaps,
    scoreRisque: resultat.scores.scoreRisque,
    orientationCalculee: resultat.decision.orientationCalculee,
    orientationFinale: resultat.decision.orientationFinale,
    conditionsCritiques: resultat.decision.conditionsCritiques,
    finalisable: resultat.finalisable,
    fige,
    detail: resultat as unknown as Prisma.InputJsonValue,
    parametres: resultat.parametres as unknown as Prisma.InputJsonValue,
  };
}

async function creerEtudeDemo(options: {
  saisie: EtudeSaisie;
  clientId: string;
  proprietaireId: string;
  typeScenario?: 'REFERENCE' | 'VARIANTE';
  libelleScenario?: string;
  etudeSourceId?: string;
  finalisee: boolean;
}) {
  const resultat = evaluerEtude(options.saisie);
  const finalisee = options.finalisee && resultat.finalisable;
  return bd.etude.create({
    data: {
      origine: 'EXPERT',
      statut: finalisee ? 'COMPLETE' : 'BROUILLON',
      finaliseeLe: finalisee ? new Date() : null,
      typeScenario: options.typeScenario ?? 'REFERENCE',
      libelleScenario: options.libelleScenario ?? null,
      etudeSourceId: options.etudeSourceId ?? null,
      clientId: options.clientId,
      proprietaireId: options.proprietaireId,
      versionMethodologie: CONFIG_COURANTE.version,
      etapeAtteinte: 8,
      ...champsScalaires(options.saisie),
      ...enfantsACreer(options.saisie),
      resultats: {
        create: finalisee
          ? [ligneResultat(resultat, false), ligneResultat(resultat, true)]
          : [ligneResultat(resultat, false)],
      },
    },
  });
}

async function principal() {
  if (!EMAIL || !MOT_DE_PASSE) {
    throw new Error(
      'EXPERT_EMAIL_INITIAL et EXPERT_MOT_DE_PASSE_INITIAL doivent être définis dans .env.',
    );
  }
  const robustesse = controlerRobustesse(MOT_DE_PASSE);
  if (!robustesse.ok) throw new Error(`Mot de passe initial refusé : ${robustesse.message}`);

  // Compte Expert : créé ou mis à jour (nom et mot de passe).
  const motDePasseHache = await hacherMotDePasse(MOT_DE_PASSE);
  const expert = await bd.utilisateur.upsert({
    where: { email: EMAIL },
    update: { nom: NOM, motDePasseHache, etat: 'ACTIF' },
    create: { email: EMAIL, nom: NOM, motDePasseHache, role: 'EXPERT' },
  });

  // Anciennes données de démonstration : remplacées.
  await bd.etude.deleteMany({ where: { localite: { contains: MARQUEUR_DEMO } } });
  await bd.client.deleteMany({ where: { notesInternes: { contains: MARQUEUR_DEMO } } });

  const clientA = await bd.client.create({
    data: {
      nom: 'Promoteur Fidjrossè (fictif)',
      contact: 'Aïcha K., 01 00 00 00 00',
      notesInternes: `${MARQUEUR_DEMO} Client fictif de démonstration. Projet de snack de quartier.`,
    },
  });
  const clientB = await bd.client.create({
    data: {
      nom: 'La Terrasse SARL (fictive)',
      contact: 'Direction, contact@exemple.test',
      notesInternes: `${MARQUEUR_DEMO} Client fictif de démonstration. Restaurant en centre-ville.`,
    },
  });

  const marquer = (saisie: EtudeSaisie): EtudeSaisie => ({
    ...saisie,
    projet: { ...saisie.projet, localite: `${saisie.projet.localite} ${MARQUEUR_DEMO}` },
  });

  const nominale = await creerEtudeDemo({
    saisie: marquer(CAS_NOMINAL),
    clientId: clientA.id,
    proprietaireId: expert.id,
    finalisee: true,
  });
  const critique = await creerEtudeDemo({
    saisie: marquer(CAS_RISQUES_CRITIQUES),
    clientId: clientB.id,
    proprietaireId: expert.id,
    finalisee: true,
  });

  const scenario = structuredClone(marquer(CAS_NOMINAL));
  scenario.hypotheses.ticketMoyenFcfa = 3000;
  scenario.hypotheses.loyerMensuelEnvisageFcfa = 700_000;
  const variante = await creerEtudeDemo({
    saisie: scenario,
    clientId: clientA.id,
    proprietaireId: expert.id,
    typeScenario: 'VARIANTE',
    libelleScenario: 'Ticket moyen à 3 000 FCFA',
    etudeSourceId: nominale.id,
    finalisee: false,
  });

  await bd.preuve.createMany({
    data: [
      {
        etudeId: nominale.id,
        auteurId: expert.id,
        rubrique: 'DEMANDE',
        niveau: 'OBSERVEE',
        source: 'Comptage de passage devant le local, mardi 12 h à 14 h',
        commentaire: 'Environ 380 passages en deux heures, majorité de salariés.',
        dateObservation: new Date('2026-09-02T00:00:00.000Z'),
      },
      {
        etudeId: nominale.id,
        auteurId: expert.id,
        rubrique: 'HYPOTHESES',
        niveau: 'DECLARATIVE',
        source: 'Entretien avec le promoteur',
        commentaire: 'Ticket moyen de 2 500 FCFA annoncé, à confirmer par un test de carte.',
        dateObservation: new Date('2026-09-01T00:00:00.000Z'),
      },
      {
        etudeId: critique.id,
        auteurId: expert.id,
        rubrique: 'RISQUES',
        niveau: 'DOCUMENTEE',
        source: 'Projet de bail transmis par le propriétaire',
        commentaire:
          'Bail de six mois renouvelable, sans clause de priorité : risque de site confirmé.',
        dateObservation: new Date('2026-09-03T00:00:00.000Z'),
      },
    ],
  });

  console.log(
    JSON.stringify(
      {
        expert: { email: expert.email, nom: expert.nom },
        clients: [clientA.nom, clientB.nom],
        etudes: {
          nominale: nominale.id,
          critique: critique.id,
          scenario: variante.id,
        },
      },
      null,
      2,
    ),
  );
}

principal()
  .catch((erreur: unknown) => {
    console.error(erreur instanceof Error ? erreur.message : String(erreur));
    process.exitCode = 1;
  })
  .finally(() => bd.$disconnect());
