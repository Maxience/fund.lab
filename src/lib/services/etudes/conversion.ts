/**
 * Conversion entre la saisie d'une étude (entrée du moteur, format des
 * formulaires) et les lignes de la base. Module pur, sans accès à la base,
 * testable en isolation. La base ne stocke aucun résultat de formule dans
 * ces tables : seuls les résultats du moteur sont enregistrés à part.
 */

import type { Prisma } from '@/generated/prisma/client';
import {
  COMPOSANTES_MENACE,
  type ComposanteMenace,
  type EtudeSaisie,
  type Notation,
  type Note,
} from '@/lib/moteur';

/** Relations à charger pour reconstituer une saisie. */
export const INCLUSION_SAISIE = {
  zones: { include: { evaluations: true }, orderBy: { ordre: 'asc' } },
  concurrents: { orderBy: { ordre: 'asc' } },
  gaps: true,
  risques: true,
} satisfies Prisma.EtudeInclude;

export type EtudeAvecSaisie = Prisma.EtudeGetPayload<{ include: typeof INCLUSION_SAISIE }>;

function noteDepuisBase(valeur: number | null): Note | null {
  return valeur !== null && Number.isInteger(valeur) && valeur >= 0 && valeur <= 3
    ? (valeur as Note)
    : null;
}

function notation(
  note: number | null,
  nonApplicable: boolean,
  commentaire?: string | null,
): Notation {
  const resultat: Notation = { note: noteDepuisBase(note) };
  if (nonApplicable) resultat.nonApplicable = true;
  if (commentaire) resultat.commentaire = commentaire;
  return resultat;
}

function texteOuAbsent<T extends string>(valeur: string | null): T | undefined {
  return valeur ? (valeur as T) : undefined;
}

/** Reconstitue la saisie d'une étude à partir de ses lignes. */
export function versSaisie(etude: EtudeAvecSaisie): EtudeSaisie {
  const projet: EtudeSaisie['projet'] = {
    nom: etude.nomProjet,
    localite: etude.localite,
    concept: etude.concept,
    capaciteCouverts: etude.capaciteCouverts,
    modesService: etude.modesService,
  };
  const horaires = texteOuAbsent(etude.horaires);
  if (horaires !== undefined) projet.horaires = horaires;

  const hypotheses: EtudeSaisie['hypotheses'] = {
    clientsParJour: etude.clientsParJour,
    ticketMoyenFcfa: etude.ticketMoyenFcfa,
    joursOuvertureParMois: etude.joursOuvertureParMois,
    partLoyerCible: etude.partLoyerCible,
    loyerMensuelEnvisageFcfa: etude.loyerMensuelEnvisageFcfa,
  };
  const clientele = texteOuAbsent(etude.clienteleCible);
  if (clientele !== undefined) hypotheses.clienteleCible = clientele;

  return {
    projet,
    hypotheses,
    zones: etude.zones.map((z) => ({
      id: z.cle,
      libelle: z.libelle,
      rayonKm: z.rayonKm,
      tempsAccesMin: z.tempsAccesMin,
      mode: z.mode,
      poids: z.poids,
    })),
    demande: etude.zones.flatMap((z) =>
      z.evaluations.map((e) => ({
        zoneId: z.cle,
        driverCode: e.driverCode,
        notation: notation(e.note, e.nonApplicable, e.commentaire),
      })),
    ),
    concurrents: etude.concurrents.map((c) => {
      const nonApplicables = new Set(c.composantesNonApplicables);
      const concurrent: EtudeSaisie['concurrents'][number] = {
        id: c.cle,
        nom: c.nom,
        typeOffre: c.typeOffre,
        relation: c.relation,
        ticketMoyenFcfa: c.ticketMoyenFcfa,
        proximite: notation(c.proximite, nonApplicables.has('proximite')),
        affluence: notation(c.affluence, nonApplicables.has('affluence')),
        qualite: notation(c.qualite, nonApplicables.has('qualite')),
        vitesse: notation(c.vitesse, nonApplicables.has('vitesse')),
        differenciation: notation(c.differenciation, nonApplicables.has('differenciation')),
      };
      const observation = texteOuAbsent(c.observation);
      if (observation !== undefined) concurrent.observation = observation;
      return concurrent;
    }),
    gaps: etude.gaps.map((g) => {
      const gap: EtudeSaisie['gaps'][number] = {
        besoinCode: g.besoinCode,
        statutMarche: g.statutMarche,
        importance: g.importance,
      };
      if (g.nonApplicable) gap.nonApplicable = true;
      return gap;
    }),
    risques: etude.risques.map((r) => {
      const risque: EtudeSaisie['risques'][number] = {
        risqueCode: r.risqueCode,
        notation: notation(r.note, r.nonApplicable, r.commentaire),
      };
      const mesure = texteOuAbsent(r.mesure);
      if (mesure !== undefined) risque.mesure = mesure;
      const responsable = texteOuAbsent(r.responsable);
      if (responsable !== undefined) risque.responsable = responsable;
      return risque;
    }),
  };
}

function texteOuNull(valeur: string | undefined): string | null {
  const nettoye = valeur?.trim();
  return nettoye ? nettoye : null;
}

function entierOuNull(valeur: number | null | undefined): number | null {
  return valeur !== null && valeur !== undefined && Number.isInteger(valeur) ? valeur : null;
}

/** Champs scalaires de l'étude, communs à la création et à la mise à jour. */
export function champsScalaires(saisie: EtudeSaisie) {
  return {
    nomProjet: saisie.projet.nom,
    localite: saisie.projet.localite,
    concept: saisie.projet.concept,
    horaires: texteOuNull(saisie.projet.horaires),
    capaciteCouverts: entierOuNull(saisie.projet.capaciteCouverts),
    modesService: saisie.projet.modesService ?? [],
    clientsParJour: saisie.hypotheses.clientsParJour,
    ticketMoyenFcfa: saisie.hypotheses.ticketMoyenFcfa,
    joursOuvertureParMois: entierOuNull(saisie.hypotheses.joursOuvertureParMois),
    partLoyerCible: saisie.hypotheses.partLoyerCible,
    loyerMensuelEnvisageFcfa: saisie.hypotheses.loyerMensuelEnvisageFcfa ?? null,
    clienteleCible: texteOuNull(saisie.hypotheses.clienteleCible),
  } satisfies Prisma.EtudeUpdateInput;
}

export function zonesACreer(saisie: EtudeSaisie): Prisma.ZoneCreateWithoutEtudeInput[] {
  return saisie.zones.map((z, ordre) => ({
    cle: z.id,
    ordre,
    libelle: z.libelle,
    rayonKm: z.rayonKm,
    tempsAccesMin: z.tempsAccesMin,
    mode: z.mode,
    poids: z.poids,
    evaluations: {
      create: saisie.demande
        .filter((d) => d.zoneId === z.id)
        .map((d) => ({
          driverCode: d.driverCode,
          note: d.notation.note,
          nonApplicable: d.notation.nonApplicable === true,
          commentaire: texteOuNull(d.notation.commentaire),
        })),
    },
  }));
}

export function concurrentsACreer(saisie: EtudeSaisie): Prisma.ConcurrentCreateWithoutEtudeInput[] {
  return saisie.concurrents.map((c, ordre) => ({
    cle: c.id,
    ordre,
    nom: c.nom,
    typeOffre: c.typeOffre,
    relation: c.relation,
    ticketMoyenFcfa: c.ticketMoyenFcfa ?? null,
    proximite: c.proximite.note,
    affluence: c.affluence.note,
    qualite: c.qualite.note,
    vitesse: c.vitesse.note,
    differenciation: c.differenciation.note,
    composantesNonApplicables: COMPOSANTES_MENACE.filter(
      (composante: ComposanteMenace) => c[composante].nonApplicable === true,
    ),
    observation: texteOuNull(c.observation),
  }));
}

export function gapsACreer(saisie: EtudeSaisie): Prisma.GapCreateWithoutEtudeInput[] {
  return saisie.gaps.map((g) => ({
    besoinCode: g.besoinCode,
    statutMarche: g.statutMarche,
    importance: entierOuNull(g.importance),
    nonApplicable: g.nonApplicable === true,
  }));
}

export function risquesACreer(saisie: EtudeSaisie): Prisma.RisqueCreateWithoutEtudeInput[] {
  return saisie.risques.map((r) => ({
    risqueCode: r.risqueCode,
    note: r.notation.note,
    nonApplicable: r.notation.nonApplicable === true,
    commentaire: texteOuNull(r.notation.commentaire),
    mesure: texteOuNull(r.mesure),
    responsable: texteOuNull(r.responsable),
  }));
}

/** Données imbriquées pour une création. */
export function enfantsACreer(saisie: EtudeSaisie) {
  return {
    zones: { create: zonesACreer(saisie) },
    concurrents: { create: concurrentsACreer(saisie) },
    gaps: { create: gapsACreer(saisie) },
    risques: { create: risquesACreer(saisie) },
  } satisfies Prisma.EtudeCreateInput extends infer T ? Partial<T> : never;
}

/** Données imbriquées pour une mise à jour : remplacement complet des enfants. */
export function enfantsARemplacer(saisie: EtudeSaisie) {
  return {
    zones: { deleteMany: {}, create: zonesACreer(saisie) },
    concurrents: { deleteMany: {}, create: concurrentsACreer(saisie) },
    gaps: { deleteMany: {}, create: gapsACreer(saisie) },
    risques: { deleteMany: {}, create: risquesACreer(saisie) },
  } satisfies Prisma.EtudeUpdateInput;
}
