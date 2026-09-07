/**
 * Tests de recette sur la persistance PME, contre la base de test dédiée
 * (chalandise_test). Un fichier par groupe de scénarios cohérent ; chaque
 * `it` correspond à un cas de la table de recette du brief.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { CAS_NOMINAL, CAS_RISQUES_CRITIQUES } from '@/lib/moteur';
import { nouvelIdentifiant } from '@/lib/parcours/etude-vide';
import { nettoyerBaseTest } from '@/lib/test/bd-test';

import { bd } from '../../bd';
import { sauvegarderEtudePme } from '../etudes';

function jetonDeTest(): string {
  return nouvelIdentifiant('pme-recette');
}

async function etudeParJeton(jeton: string) {
  const etude = await bd.etude.findUnique({ where: { jetonPme: jeton } });
  if (!etude) throw new Error(`Étude introuvable pour le jeton ${jeton}`);
  return etude;
}

beforeAll(async () => {
  await nettoyerBaseTest();
});

beforeEach(async () => {
  await nettoyerBaseTest();
});

describe('R01 : compléter un parcours PME avec des données valides', () => {
  it('produit une synthèse et laisse une étude récupérable', async () => {
    const jeton = jetonDeTest();
    const reponse = await sauvegarderEtudePme(jeton, CAS_NOMINAL, 8, 'COMPLETE');
    expect(reponse.misAJourLe).toBeInstanceOf(Date);

    const etude = await etudeParJeton(jeton);
    expect(etude.statut).toBe('COMPLETE');
    expect(etude.origine).toBe('PME');
    expect(etude.nomProjet).toBe(CAS_NOMINAL.projet.nom);

    const resultat = await bd.resultat.findFirst({ where: { etudeId: etude.id, fige: true } });
    expect(resultat?.orientationFinale).toBe('GO');
    expect(resultat?.scoreGlobal).toBeCloseTo(71.62, 1);
  });
});

describe('R02 : note hors de 0 à 3', () => {
  it('empêche la finalisation tant que la note reste hors échelle', async () => {
    const jeton = jetonDeTest();
    const invalide = structuredClone(CAS_NOMINAL);
    // @ts-expect-error : valeur hors échelle volontaire pour le test.
    invalide.demande[0].notation.note = 7;

    const reponse = await sauvegarderEtudePme(jeton, invalide, 8, 'COMPLETE');
    expect(reponse.misAJourLe).toBeInstanceOf(Date);

    const etude = await etudeParJeton(jeton);
    expect(etude.statut).toBe('BROUILLON');
    const resultat = await bd.resultat.findFirst({ where: { etudeId: etude.id } });
    const detail = resultat?.detail as { alertes: { code: string }[] };
    expect(detail.alertes.map((a) => a.code)).toContain('NOTE_HORS_ECHELLE');
  });
});

describe('R03 : poids de zones dont la somme diffère de 100 %', () => {
  it('bloque la finalisation et signale l’écart', async () => {
    const jeton = jetonDeTest();
    const invalide = structuredClone(CAS_NOMINAL);
    invalide.zones[1].poids = 0.5; // total 1,1 au lieu de 1.

    const reponse = await sauvegarderEtudePme(jeton, invalide, 8, 'COMPLETE');
    expect(reponse.misAJourLe).toBeInstanceOf(Date);

    const etude = await etudeParJeton(jeton);
    expect(etude.statut).toBe('BROUILLON');
    const resultat = await bd.resultat.findFirst({ where: { etudeId: etude.id } });
    const detail = resultat?.detail as { alertes: { code: string; message: string }[] };
    const alerte = detail.alertes.find((a) => a.code === 'POIDS_ZONES_INVALIDE');
    expect(alerte?.message).toContain('100 %');
  });
});

describe('R04 : ajouter, modifier puis supprimer un concurrent', () => {
  it('actualise la liste et la pression concurrentielle à chaque étape', async () => {
    const jeton = jetonDeTest();
    const base = structuredClone(CAS_NOMINAL);
    base.concurrents = [];

    // Sans concurrent : pression nulle (arbitrage H6).
    await sauvegarderEtudePme(jeton, base, 5, 'BROUILLON');
    let resultat = (await bd.resultat.findFirst({ where: { etude: { jetonPme: jeton } } }))!
      .detail as { scores: { pressionConcurrentielle: number | null } };
    expect(resultat.scores.pressionConcurrentielle).toBe(0);

    // Ajout d'un concurrent direct fortement menaçant.
    const concurrent = {
      id: 'C1',
      nom: 'Chez Mariam',
      typeOffre: 'Snack',
      relation: 'DIRECTE' as const,
      ticketMoyenFcfa: 2000,
      proximite: { note: 3 as const },
      affluence: { note: 3 as const },
      qualite: { note: 3 as const },
      vitesse: { note: 3 as const },
      differenciation: { note: 3 as const },
    };
    const avecConcurrent = { ...base, concurrents: [concurrent] };
    await sauvegarderEtudePme(jeton, avecConcurrent, 5, 'BROUILLON');
    const etudeApresAjout = await etudeParJeton(jeton);
    expect(await bd.concurrent.count({ where: { etudeId: etudeApresAjout.id } })).toBe(1);
    resultat = (await bd.resultat.findFirst({
      where: { etudeId: etudeApresAjout.id },
      orderBy: { creeLe: 'desc' },
    }))!.detail as { scores: { pressionConcurrentielle: number | null } };
    expect(resultat.scores.pressionConcurrentielle).toBe(100);

    // Modification : devient indirect, menace pondérée à 70 %.
    const modifie = {
      ...avecConcurrent,
      concurrents: [{ ...concurrent, relation: 'INDIRECTE' as const }],
    };
    await sauvegarderEtudePme(jeton, modifie, 5, 'BROUILLON');
    resultat = (await bd.resultat.findFirst({
      where: { etudeId: etudeApresAjout.id },
      orderBy: { creeLe: 'desc' },
    }))!.detail as { scores: { pressionConcurrentielle: number | null } };
    expect(resultat.scores.pressionConcurrentielle).toBeCloseTo(70, 5);

    // Suppression : retour à une pression nulle.
    await sauvegarderEtudePme(jeton, base, 5, 'BROUILLON');
    expect(await bd.concurrent.count({ where: { etudeId: etudeApresAjout.id } })).toBe(0);
    resultat = (await bd.resultat.findFirst({
      where: { etudeId: etudeApresAjout.id },
      orderBy: { creeLe: 'desc' },
    }))!.detail as { scores: { pressionConcurrentielle: number | null } };
    expect(resultat.scores.pressionConcurrentielle).toBe(0);
  });
});

describe('R09 : actualiser la page après sauvegarde', () => {
  it('conserve les données à la relecture, comme le ferait une actualisation du navigateur', async () => {
    const jeton = jetonDeTest();
    await sauvegarderEtudePme(jeton, CAS_RISQUES_CRITIQUES, 6, 'BROUILLON');

    // « Actualiser » : relire depuis la base, comme le ferait le serveur
    // au chargement suivant de la page, sans repasser par le navigateur.
    const etude = await etudeParJeton(jeton);
    expect(etude.nomProjet).toBe(CAS_RISQUES_CRITIQUES.projet.nom);
    expect(etude.etapeAtteinte).toBe(6);
    const zones = await bd.zone.findMany({ where: { etudeId: etude.id } });
    expect(zones).toHaveLength(CAS_RISQUES_CRITIQUES.zones.length);
    const risques = await bd.risque.findMany({ where: { etudeId: etude.id } });
    expect(risques).toHaveLength(CAS_RISQUES_CRITIQUES.risques.length);
  });
});
