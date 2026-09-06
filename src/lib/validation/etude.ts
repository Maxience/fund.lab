/**
 * Schémas Zod d'une étude, partagés entre les formulaires et les actions
 * serveur. Ils portent la forme, les champs obligatoires et les bornes de
 * chaque étape. Les règles métier transversales (somme des poids, zone sans
 * demande, données manquantes) sont du ressort du moteur.
 */

import { z } from 'zod';

const NOTE_MAX = 3;
const TEXTE_COURT = 120;
const TEXTE_LONG = 500;

export const schemaNote = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)], {
  error: `La note doit être un entier de 0 à ${NOTE_MAX}.`,
});

export const schemaNotation = z.object({
  note: schemaNote.nullable(),
  nonApplicable: z.boolean().optional(),
  commentaire: z.string().max(TEXTE_LONG, `Au plus ${TEXTE_LONG} caractères.`).optional(),
});

export const schemaModeDeplacement = z.enum(
  ['A_PIED', 'DEUX_ROUES', 'VOITURE', 'TRANSPORT_COMMUN'],
  {
    error: 'Choisissez un mode de déplacement.',
  },
);

export const schemaRelation = z.enum(['DIRECTE', 'INDIRECTE'], {
  error: 'Indiquez si le concurrent est direct ou indirect.',
});

export const schemaStatutMarche = z.enum(['ABSENT', 'MAL_SERVI', 'CORRECT'], {
  error: 'Choisissez un statut pour ce besoin.',
});

const texteObligatoire = (libelle: string) =>
  z
    .string({ error: `${libelle} est obligatoire.` })
    .trim()
    .min(2, `${libelle} doit compter au moins 2 caractères.`)
    .max(TEXTE_COURT, `${libelle} doit compter au plus ${TEXTE_COURT} caractères.`);

const texteFacultatif = (max: number) =>
  z.string().trim().max(max, `Au plus ${max} caractères.`).optional();

const nombreObligatoire = (libelle: string) =>
  z.number({ error: `${libelle} est obligatoire.` }).finite(`${libelle} doit être un nombre.`);

export const schemaProjet = z.object({
  nom: texteObligatoire('Le nom du projet'),
  localite: texteObligatoire('La localité'),
  concept: texteObligatoire('Le concept'),
  horaires: texteFacultatif(200),
  capaciteCouverts: z
    .number({ error: 'La capacité doit être un nombre de couverts.' })
    .int('La capacité doit être un nombre entier de couverts.')
    .positive('La capacité doit être supérieure à zéro.')
    .max(2000, 'La capacité paraît trop élevée : vérifiez la valeur.')
    .nullable()
    .optional(),
  modesService: z.array(z.string().max(40)).max(10).optional(),
});

export const schemaHypotheses = z.object({
  clientsParJour: nombreObligatoire('Le nombre de clients par jour')
    .positive('Indiquez un nombre de clients par jour supérieur à zéro.')
    .max(10_000, 'Plus de 10 000 clients par jour paraît irréaliste : vérifiez la valeur.'),
  ticketMoyenFcfa: nombreObligatoire('Le ticket moyen')
    .positive('Indiquez un ticket moyen supérieur à zéro, en FCFA.')
    .max(
      1_000_000,
      'Un ticket moyen au-delà de 1 000 000 FCFA paraît irréaliste : vérifiez la valeur.',
    ),
  joursOuvertureParMois: nombreObligatoire("Le nombre de jours d'ouverture")
    .int("Indiquez un nombre entier de jours d'ouverture par mois.")
    .min(1, "Au moins 1 jour d'ouverture par mois.")
    .max(31, "Au plus 31 jours d'ouverture par mois."),
  partLoyerCible: nombreObligatoire('La part de loyer cible')
    .gt(0, 'La part de loyer doit être supérieure à 0 %.')
    .max(0.5, "La part de loyer ne peut pas dépasser 50 % du chiffre d'affaires."),
  loyerMensuelEnvisageFcfa: z
    .number({ error: 'Le loyer envisagé doit être un montant en FCFA.' })
    .min(0, 'Le loyer envisagé ne peut pas être négatif.')
    .nullable()
    .optional(),
  clienteleCible: texteFacultatif(200),
});

export const schemaZone = z.object({
  id: z.string().min(1),
  libelle: texteObligatoire('Le nom de la zone'),
  rayonKm: z
    .number({ error: 'Le rayon doit être un nombre de kilomètres.' })
    .positive('Le rayon doit être supérieur à zéro, en kilomètres.')
    .max(100, 'Un rayon au-delà de 100 km ne correspond pas à une zone de chalandise.')
    .nullable(),
  tempsAccesMin: z
    .number({ error: "Le temps d'accès doit être un nombre de minutes." })
    .positive("Le temps d'accès doit être supérieur à zéro, en minutes.")
    .max(240, "Un temps d'accès au-delà de 4 heures ne correspond pas à une zone de chalandise.")
    .nullable(),
  mode: schemaModeDeplacement.nullable(),
  poids: z
    .number({ error: 'Indiquez le poids de la zone, en pourcentage.' })
    .min(0, 'Le poids ne peut pas être négatif.')
    .max(1, 'Le poids ne peut pas dépasser 100 %.'),
});

export const schemaZones = z
  .array(schemaZone)
  .min(1, 'Définissez au moins une zone de chalandise.')
  .max(4, 'Au plus quatre zones de chalandise.');

export const schemaEvaluationDemande = z.object({
  zoneId: z.string().min(1),
  driverCode: z.string().min(1),
  notation: schemaNotation,
});

export const schemaConcurrent = z.object({
  id: z.string().min(1),
  nom: texteObligatoire('Le nom du concurrent'),
  typeOffre: texteObligatoire("Le type d'offre"),
  relation: schemaRelation,
  ticketMoyenFcfa: z
    .number({ error: 'Le ticket moyen doit être un montant en FCFA.' })
    .positive('Le ticket moyen doit être supérieur à zéro.')
    .nullable()
    .optional(),
  proximite: schemaNotation,
  affluence: schemaNotation,
  qualite: schemaNotation,
  vitesse: schemaNotation,
  differenciation: schemaNotation,
  observation: texteFacultatif(TEXTE_LONG),
});

export const schemaConcurrents = z
  .array(schemaConcurrent)
  .max(50, 'Au plus cinquante concurrents peuvent être recensés.');

export const schemaGap = z.object({
  besoinCode: z.string().min(1),
  statutMarche: schemaStatutMarche.nullable(),
  importance: z
    .number({ error: "L'importance doit être 1, 2 ou 3." })
    .int("L'importance doit être 1, 2 ou 3.")
    .min(1, "L'importance doit être 1, 2 ou 3.")
    .max(3, "L'importance doit être 1, 2 ou 3.")
    .nullable(),
  nonApplicable: z.boolean().optional(),
});

export const schemaRisque = z.object({
  risqueCode: z.string().min(1),
  notation: schemaNotation,
  mesure: texteFacultatif(300),
  responsable: texteFacultatif(80),
});

export const schemaEtude = z.object({
  projet: schemaProjet,
  hypotheses: schemaHypotheses,
  zones: schemaZones,
  demande: z.array(schemaEvaluationDemande),
  concurrents: schemaConcurrents,
  gaps: z.array(schemaGap),
  risques: z.array(schemaRisque),
});

export type EtudeValidee = z.infer<typeof schemaEtude>;

/** Erreurs de validation indexées par chemin de champ (« zones.0.poids »). */
export type ErreursChamps = Record<string, string>;

/**
 * Aplatit les problèmes Zod en un dictionnaire chemin vers message, en ne
 * gardant que le premier message par champ.
 */
export function erreursParChamp(issues: readonly z.core.$ZodIssue[]): ErreursChamps {
  const erreurs: ErreursChamps = {};
  for (const issue of issues) {
    const chemin = issue.path.map(String).join('.');
    if (!(chemin in erreurs)) erreurs[chemin] = issue.message;
  }
  return erreurs;
}

/** Valide une valeur avec un schéma et retourne les erreurs par champ. */
export function valider<T extends z.ZodType>(
  schema: T,
  valeur: unknown,
):
  | { ok: true; donnees: z.infer<T>; erreurs: ErreursChamps }
  | { ok: false; donnees: null; erreurs: ErreursChamps } {
  const resultat = schema.safeParse(valeur);
  if (resultat.success) return { ok: true, donnees: resultat.data, erreurs: {} };
  return { ok: false, donnees: null, erreurs: erreursParChamp(resultat.error.issues) };
}
