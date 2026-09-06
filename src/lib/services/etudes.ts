import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import { bd } from '@/lib/bd';
import {
  CONFIG_COURANTE,
  evaluerEtude,
  obtenirConfiguration,
  type EtudeSaisie,
  type ResultatEtude,
} from '@/lib/moteur';
import { nouvelleEtude } from '@/lib/parcours/etude-vide';
import { schemaEtude, valider } from '@/lib/validation/etude';

import { ErreurEtat, ErreurIntrouvable, ErreurValidation } from './erreurs';
import {
  champsScalaires,
  enfantsACreer,
  enfantsARemplacer,
  INCLUSION_SAISIE,
  versSaisie,
} from './etudes/conversion';

/**
 * Couche service des études. Chaque écriture enchaîne validation de forme,
 * transaction, calcul par le moteur et enregistrement du résultat versionné.
 * Le contrôle d'accès (exigerExpert) est fait par l'appelant pour les
 * fonctions Expert ; les fonctions PME sont limitées par le jeton temporaire.
 */

const INCLUSION_DOSSIER = {
  ...INCLUSION_SAISIE,
  client: true,
  proprietaire: { select: { id: true, nom: true, email: true } },
  etudeSource: { select: { id: true, nomProjet: true, libelleScenario: true } },
  variantes: {
    where: { archiveeLe: null },
    orderBy: { creeLe: 'asc' },
    select: {
      id: true,
      libelleScenario: true,
      statut: true,
      misAJourLe: true,
      resultats: { orderBy: { creeLe: 'desc' }, take: 1 },
    },
  },
  preuves: { orderBy: { creeLe: 'desc' }, include: { auteur: { select: { nom: true } } } },
  resultats: { orderBy: { creeLe: 'desc' }, take: 5 },
} satisfies Prisma.EtudeInclude;

export type Dossier = Prisma.EtudeGetPayload<{ include: typeof INCLUSION_DOSSIER }>;

export interface FiltresListe {
  statut?: 'BROUILLON' | 'COMPLETE' | 'ARCHIVEE';
  clientId?: string;
  origine?: 'PME' | 'EXPERT';
  recherche?: string;
  tri?: 'modification' | 'projet' | 'client' | 'score';
}

/**
 * Valide une saisie complète pour la finalisation : forme par les schémas,
 * règles métier par le moteur.
 */
function controlerFinalisation(saisie: EtudeSaisie, resultat: ResultatEtude): void {
  const forme = valider(schemaEtude, saisie);
  const bloquantes = resultat.alertes.filter((a) => a.niveau === 'BLOQUANTE');
  if (!forme.ok || bloquantes.length > 0 || !resultat.finalisable) {
    const messages = [...Object.values(forme.erreurs), ...bloquantes.map((a) => a.message)];
    throw new ErreurValidation(
      messages.length > 0 ? messages : ["L'étude n'est pas finalisable en l'état."],
      forme.erreurs,
    );
  }
}

/** Convertit un résultat du moteur en ligne de la table des résultats. */
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

/* ------------------------------------------------------------------------ */
/* Lecture                                                                   */
/* ------------------------------------------------------------------------ */

export async function listerEtudes(filtres: FiltresListe = {}) {
  const where: Prisma.EtudeWhereInput = {};
  if (filtres.statut === 'ARCHIVEE') where.archiveeLe = { not: null };
  else {
    where.archiveeLe = null;
    if (filtres.statut) where.statut = filtres.statut;
  }
  if (filtres.clientId) where.clientId = filtres.clientId;
  if (filtres.origine) where.origine = filtres.origine;
  if (filtres.recherche?.trim()) {
    const texte = filtres.recherche.trim();
    where.OR = [
      { nomProjet: { contains: texte, mode: 'insensitive' } },
      { localite: { contains: texte, mode: 'insensitive' } },
      { client: { nom: { contains: texte, mode: 'insensitive' } } },
    ];
  }
  const orderBy: Prisma.EtudeOrderByWithRelationInput =
    filtres.tri === 'projet'
      ? { nomProjet: 'asc' }
      : filtres.tri === 'client'
        ? { client: { nom: 'asc' } }
        : { misAJourLe: 'desc' };

  const etudes = await bd.etude.findMany({
    where,
    orderBy,
    include: {
      client: { select: { id: true, nom: true } },
      resultats: { orderBy: { creeLe: 'desc' }, take: 1 },
      etudeSource: { select: { id: true, nomProjet: true } },
    },
  });

  if (filtres.tri === 'score') {
    etudes.sort(
      (a, b) => (b.resultats[0]?.scoreGlobal ?? -1) - (a.resultats[0]?.scoreGlobal ?? -1),
    );
  }
  return etudes;
}

export type LigneEtude = Awaited<ReturnType<typeof listerEtudes>>[number];

export async function obtenirDossier(id: string): Promise<Dossier> {
  const etude = await bd.etude.findUnique({ where: { id }, include: INCLUSION_DOSSIER });
  if (!etude) throw new ErreurIntrouvable('Étude');
  return etude;
}

/** Saisie et résultat courant d'une étude, recalculé à la lecture. */
export async function obtenirSaisie(id: string): Promise<{
  etude: Dossier;
  saisie: EtudeSaisie;
  resultat: ResultatEtude;
}> {
  const etude = await obtenirDossier(id);
  const saisie = versSaisie(etude);
  const config = obtenirConfiguration(etude.versionMethodologie);
  return { etude, saisie, resultat: evaluerEtude(saisie, config) };
}

/* ------------------------------------------------------------------------ */
/* Écriture Expert                                                           */
/* ------------------------------------------------------------------------ */

export async function creerEtude(options: {
  proprietaireId: string;
  clientId?: string | null;
  nomProjet?: string;
}) {
  const saisie = nouvelleEtude();
  if (options.nomProjet?.trim()) saisie.projet.nom = options.nomProjet.trim();
  if (options.clientId) {
    const client = await bd.client.findUnique({
      where: { id: options.clientId },
      select: { id: true },
    });
    if (!client) throw new ErreurIntrouvable('Client');
  }
  const resultat = evaluerEtude(saisie);
  return bd.etude.create({
    data: {
      origine: 'EXPERT',
      proprietaireId: options.proprietaireId,
      clientId: options.clientId ?? null,
      versionMethodologie: CONFIG_COURANTE.version,
      ...champsScalaires(saisie),
      ...enfantsACreer(saisie),
      resultats: { create: ligneResultat(resultat, false) },
    },
  });
}

/**
 * Remplace la saisie d'une étude et recalcule son résultat courant. Une
 * étude finalisée ou archivée n'est pas modifiable : la rouvrir d'abord.
 */
export async function enregistrerSaisie(
  id: string,
  saisieBrute: unknown,
  etapeAtteinte?: number,
): Promise<{ misAJourLe: Date; resultat: ResultatEtude }> {
  const existante = await bd.etude.findUnique({
    where: { id },
    select: { statut: true, archiveeLe: true, versionMethodologie: true, etapeAtteinte: true },
  });
  if (!existante) throw new ErreurIntrouvable('Étude');
  if (existante.archiveeLe) throw new ErreurEtat('Une étude archivée ne peut pas être modifiée.');
  if (existante.statut === 'COMPLETE') {
    throw new ErreurEtat("L'étude est finalisée : rouvrez-la pour la modifier.");
  }

  const saisie = controlerFormeBrouillon(saisieBrute);
  const config = obtenirConfiguration(existante.versionMethodologie);
  const resultat = evaluerEtude(saisie, config);
  const etape = Math.max(existante.etapeAtteinte, etapeAtteinte ?? 1);

  const etude = await bd.etude.update({
    where: { id },
    data: {
      ...champsScalaires(saisie),
      ...enfantsARemplacer(saisie),
      etapeAtteinte: etape,
      resultats: { deleteMany: { fige: false }, create: ligneResultat(resultat, false) },
    },
    select: { misAJourLe: true },
  });
  return { misAJourLe: etude.misAJourLe, resultat };
}

/**
 * Un brouillon accepte des champs vides : seule la structure est contrôlée
 * ici, les bornes le sont par le moteur (alertes) et à la finalisation.
 */
function controlerFormeBrouillon(valeur: unknown): EtudeSaisie {
  if (
    typeof valeur !== 'object' ||
    valeur === null ||
    !('projet' in valeur) ||
    !('hypotheses' in valeur) ||
    !Array.isArray((valeur as EtudeSaisie).zones) ||
    !Array.isArray((valeur as EtudeSaisie).demande) ||
    !Array.isArray((valeur as EtudeSaisie).concurrents) ||
    !Array.isArray((valeur as EtudeSaisie).gaps) ||
    !Array.isArray((valeur as EtudeSaisie).risques)
  ) {
    throw new ErreurValidation(['La saisie reçue est incomplète.']);
  }
  return valeur as EtudeSaisie;
}

export async function finaliserEtude(id: string): Promise<ResultatEtude> {
  const { etude, saisie, resultat } = await obtenirSaisie(id);
  if (etude.archiveeLe) throw new ErreurEtat('Une étude archivée ne peut pas être finalisée.');
  controlerFinalisation(saisie, resultat);
  await bd.etude.update({
    where: { id },
    data: {
      statut: 'COMPLETE',
      finaliseeLe: new Date(),
      etapeAtteinte: 8,
      resultats: { create: ligneResultat(resultat, true) },
    },
  });
  return resultat;
}

export async function rouvrirEtude(id: string): Promise<void> {
  const existante = await bd.etude.findUnique({ where: { id }, select: { archiveeLe: true } });
  if (!existante) throw new ErreurIntrouvable('Étude');
  if (existante.archiveeLe) throw new ErreurEtat("Restaurez l'étude avant de la rouvrir.");
  await bd.etude.update({ where: { id }, data: { statut: 'BROUILLON', finaliseeLe: null } });
}

export async function archiverEtude(id: string): Promise<void> {
  const existante = await bd.etude.findUnique({ where: { id }, select: { id: true } });
  if (!existante) throw new ErreurIntrouvable('Étude');
  await bd.etude.update({ where: { id }, data: { statut: 'ARCHIVEE', archiveeLe: new Date() } });
}

export async function restaurerEtude(id: string): Promise<void> {
  const existante = await bd.etude.findUnique({ where: { id }, select: { finaliseeLe: true } });
  if (!existante) throw new ErreurIntrouvable('Étude');
  await bd.etude.update({
    where: { id },
    data: { statut: existante.finaliseeLe ? 'COMPLETE' : 'BROUILLON', archiveeLe: null },
  });
}

/** Rattache une étude (par exemple reçue du parcours PME) à un client. */
export async function rattacherClient(
  id: string,
  clientId: string | null,
  proprietaireId?: string,
) {
  const existante = await bd.etude.findUnique({ where: { id }, select: { id: true } });
  if (!existante) throw new ErreurIntrouvable('Étude');
  if (clientId) {
    const client = await bd.client.findUnique({ where: { id: clientId }, select: { id: true } });
    if (!client) throw new ErreurIntrouvable('Client');
  }
  await bd.etude.update({
    where: { id },
    data: { clientId, ...(proprietaireId ? { proprietaireId } : {}) },
  });
}

/**
 * Crée un scénario : copie complète de l'étude, de type variante, liée à sa
 * référence. L'étude source reste inchangée (cas R08).
 */
export async function dupliquerEtude(
  id: string,
  options: { libelleScenario: string; proprietaireId: string },
) {
  const libelle = options.libelleScenario.trim();
  if (libelle.length < 2)
    throw new ErreurValidation(['Donnez un nom au scénario (2 caractères au moins).']);
  const source = await bd.etude.findUnique({ where: { id }, include: INCLUSION_SAISIE });
  if (!source) throw new ErreurIntrouvable('Étude');
  const saisie = versSaisie(source);
  const config = obtenirConfiguration(source.versionMethodologie);
  const resultat = evaluerEtude(saisie, config);
  // Un scénario dérive toujours de la référence, jamais d'une autre variante.
  const referenceId =
    source.typeScenario === 'VARIANTE' && source.etudeSourceId ? source.etudeSourceId : source.id;
  return bd.etude.create({
    data: {
      origine: 'EXPERT',
      typeScenario: 'VARIANTE',
      libelleScenario: libelle,
      etudeSourceId: referenceId,
      clientId: source.clientId,
      proprietaireId: options.proprietaireId,
      versionMethodologie: source.versionMethodologie,
      etapeAtteinte: source.etapeAtteinte,
      ...champsScalaires(saisie),
      ...enfantsACreer(saisie),
      resultats: { create: ligneResultat(resultat, false) },
    },
  });
}

/* ------------------------------------------------------------------------ */
/* Parcours PME : persistance par identifiant temporaire                     */
/* ------------------------------------------------------------------------ */

const JETON_PME = /^[A-Za-z0-9_-]{16,80}$/;

/**
 * Enregistre ou met à jour l'étude d'un navigateur sans compte, identifiée
 * par son jeton temporaire. Une étude PME rattachée à un client par un
 * Expert n'est plus modifiable par le navigateur d'origine.
 */
export async function sauvegarderEtudePme(
  jeton: string,
  saisieBrute: unknown,
  etapeAtteinte: number,
  statut: 'BROUILLON' | 'COMPLETE',
): Promise<{ misAJourLe: Date }> {
  if (!JETON_PME.test(jeton)) throw new ErreurValidation(['Identifiant temporaire invalide.']);
  const saisie = controlerFormeBrouillon(saisieBrute);
  const resultat = evaluerEtude(saisie);
  const statutEffectif = statut === 'COMPLETE' && resultat.finalisable ? 'COMPLETE' : 'BROUILLON';
  const etape = Math.min(Math.max(Math.trunc(etapeAtteinte) || 1, 1), 8);

  const existante = await bd.etude.findUnique({
    where: { jetonPme: jeton },
    select: { id: true, clientId: true, archiveeLe: true },
  });
  if (existante?.clientId || existante?.archiveeLe) {
    throw new ErreurEtat(
      "Cette étude a été reprise par un Expert : elle n'est plus modifiable ici.",
    );
  }

  const donnees = {
    ...champsScalaires(saisie),
    statut: statutEffectif,
    finaliseeLe: statutEffectif === 'COMPLETE' ? new Date() : null,
    etapeAtteinte: etape,
  } as const;

  if (existante) {
    const etude = await bd.etude.update({
      where: { id: existante.id },
      data: {
        ...donnees,
        ...enfantsARemplacer(saisie),
        resultats: {
          deleteMany: { fige: false },
          create: ligneResultat(resultat, statutEffectif === 'COMPLETE'),
        },
      },
      select: { misAJourLe: true },
    });
    return { misAJourLe: etude.misAJourLe };
  }
  const etude = await bd.etude.create({
    data: {
      origine: 'PME',
      jetonPme: jeton,
      versionMethodologie: CONFIG_COURANTE.version,
      ...donnees,
      ...enfantsACreer(saisie),
      resultats: { create: ligneResultat(resultat, statutEffectif === 'COMPLETE') },
    },
    select: { misAJourLe: true },
  });
  return { misAJourLe: etude.misAJourLe };
}
