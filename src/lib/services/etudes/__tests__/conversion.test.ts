import { describe, expect, it } from 'vitest';

import { CAS_NOMINAL, CAS_RISQUES_CRITIQUES, evaluerEtude, type EtudeSaisie } from '@/lib/moteur';
import { nouvelleEtude } from '@/lib/parcours/etude-vide';

import {
  champsScalaires,
  concurrentsACreer,
  gapsACreer,
  risquesACreer,
  versSaisie,
  zonesACreer,
  type EtudeAvecSaisie,
} from '../conversion';

let compteur = 0;
const id = () => `id-${(compteur += 1)}`;

/**
 * Simule ce que la base renverrait après l'écriture d'une saisie : les lignes
 * créées, avec identifiants et valeurs par défaut. Permet de tester
 * l'aller-retour sans base.
 */
function simulerBase(saisie: EtudeSaisie): EtudeAvecSaisie {
  const scalaires = champsScalaires(saisie);
  const maintenant = new Date('2026-09-06T12:00:00.000Z');
  const etudeId = id();
  return {
    id: etudeId,
    origine: 'EXPERT',
    jetonPme: null,
    statut: 'BROUILLON',
    typeScenario: 'REFERENCE',
    libelleScenario: null,
    etudeSourceId: null,
    clientId: null,
    proprietaireId: null,
    ...scalaires,
    etapeAtteinte: 1,
    versionMethodologie: '1.0',
    creeLe: maintenant,
    misAJourLe: maintenant,
    finaliseeLe: null,
    archiveeLe: null,
    zones: zonesACreer(saisie).map((z) => {
      const zoneId = id();
      const evaluations = z.evaluations?.create;
      const liste = Array.isArray(evaluations) ? evaluations : evaluations ? [evaluations] : [];
      return {
        id: zoneId,
        etudeId,
        cle: z.cle,
        ordre: z.ordre,
        libelle: z.libelle,
        rayonKm: z.rayonKm ?? null,
        tempsAccesMin: z.tempsAccesMin ?? null,
        mode: z.mode ?? null,
        poids: z.poids ?? null,
        evaluations: liste.map((e) => ({
          id: id(),
          zoneId,
          driverCode: e.driverCode,
          note: e.note ?? null,
          nonApplicable: e.nonApplicable ?? false,
          commentaire: e.commentaire ?? null,
        })),
      };
    }),
    concurrents: concurrentsACreer(saisie).map((c) => ({
      id: id(),
      etudeId,
      cle: c.cle,
      ordre: c.ordre,
      nom: c.nom,
      typeOffre: c.typeOffre,
      relation: c.relation ?? null,
      ticketMoyenFcfa: c.ticketMoyenFcfa ?? null,
      proximite: c.proximite ?? null,
      affluence: c.affluence ?? null,
      qualite: c.qualite ?? null,
      vitesse: c.vitesse ?? null,
      differenciation: c.differenciation ?? null,
      composantesNonApplicables: Array.isArray(c.composantesNonApplicables)
        ? c.composantesNonApplicables
        : [],
      observation: c.observation ?? null,
    })),
    gaps: gapsACreer(saisie).map((g) => ({
      id: id(),
      etudeId,
      besoinCode: g.besoinCode,
      statutMarche: g.statutMarche ?? null,
      importance: g.importance ?? null,
      nonApplicable: g.nonApplicable ?? false,
    })),
    risques: risquesACreer(saisie).map((r) => ({
      id: id(),
      etudeId,
      risqueCode: r.risqueCode,
      note: r.note ?? null,
      nonApplicable: r.nonApplicable ?? false,
      commentaire: r.commentaire ?? null,
      mesure: r.mesure ?? null,
      responsable: r.responsable ?? null,
    })),
  };
}

describe('conversion saisie et base', () => {
  it('reconstitue exactement le cas nominal après un aller-retour', () => {
    expect(versSaisie(simulerBase(CAS_NOMINAL))).toEqual(CAS_NOMINAL);
  });

  it('reconstitue exactement le cas à risques critiques après un aller-retour', () => {
    expect(versSaisie(simulerBase(CAS_RISQUES_CRITIQUES))).toEqual(CAS_RISQUES_CRITIQUES);
  });

  it('donne le même résultat de moteur avant et après conversion', () => {
    const horloge = () => new Date(0);
    for (const cas of [CAS_NOMINAL, CAS_RISQUES_CRITIQUES]) {
      const avant = evaluerEtude(cas, undefined, horloge);
      const apres = evaluerEtude(versSaisie(simulerBase(cas)), undefined, horloge);
      expect(apres.scores).toEqual(avant.scores);
      expect(apres.decision).toEqual(avant.decision);
      expect(apres.alertes).toEqual(avant.alertes);
    }
  });

  it('conserve les états non applicable et les commentaires', () => {
    const saisie = structuredClone(CAS_NOMINAL);
    saisie.demande[0].notation = { note: null, nonApplicable: true };
    saisie.concurrents[0].vitesse = { note: null, nonApplicable: true };
    saisie.gaps[2] = { ...saisie.gaps[2], statutMarche: null, nonApplicable: true };
    saisie.risques[1].notation = { note: 2, commentaire: 'Un seul grossiste' };
    const relu = versSaisie(simulerBase(saisie));
    expect(relu.demande[0].notation).toEqual({ note: null, nonApplicable: true });
    expect(relu.concurrents[0].vitesse).toEqual({ note: null, nonApplicable: true });
    expect(relu.gaps[2].nonApplicable).toBe(true);
    expect(relu.risques[1].notation).toEqual({ note: 2, commentaire: 'Un seul grossiste' });
  });

  it('accepte une étude vierge, avec ses listes préremplies', () => {
    const vierge = nouvelleEtude();
    const relu = versSaisie(simulerBase(vierge));
    expect(relu.gaps).toHaveLength(vierge.gaps.length);
    expect(relu.risques).toHaveLength(vierge.risques.length);
    expect(relu.zones[0].poids).toBe(1);
    expect(relu.hypotheses.partLoyerCible).toBe(0.1);
  });

  it('nettoie les textes vides et refuse les entiers non entiers', () => {
    const saisie = structuredClone(CAS_NOMINAL);
    saisie.projet.horaires = '   ';
    saisie.projet.capaciteCouverts = 40.5;
    saisie.hypotheses.joursOuvertureParMois = 26.4;
    const scalaires = champsScalaires(saisie);
    expect(scalaires.horaires).toBeNull();
    expect(scalaires.capaciteCouverts).toBeNull();
    expect(scalaires.joursOuvertureParMois).toBeNull();
  });
});
