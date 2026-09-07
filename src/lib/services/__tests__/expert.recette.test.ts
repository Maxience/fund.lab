/**
 * Tests de recette sur le parcours Expert, contre la base de test dédiée.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { CAS_RISQUES_CRITIQUES, CONFIG_COURANTE } from '@/lib/moteur';
import { creerExpertTest, nettoyerBaseTest } from '@/lib/test/bd-test';

import { bd } from '../../bd';
import { champsScalaires, enfantsACreer } from '../etudes/conversion';
import { dupliquerEtude, finaliserEtude } from '../etudes';

// Le cas de référence laisse volontairement la part de loyer à null, pour
// tester la valeur par défaut du moteur (reference.test.ts). Finaliser une
// étude exige en revanche une valeur confirmée : ce champ est obligatoire
// dans le formulaire, toujours prérempli avant que l'utilisateur n'avance.
// Ce test de recette part donc d'une étude complète, valeur incluse.
const ETUDE_COMPLETE = {
  ...CAS_RISQUES_CRITIQUES,
  hypotheses: {
    ...CAS_RISQUES_CRITIQUES.hypotheses,
    partLoyerCible: CONFIG_COURANTE.loyer.partCibleParDefaut,
  },
};

async function creerEtudeReference(proprietaireId: string) {
  return bd.etude.create({
    data: {
      origine: 'EXPERT',
      proprietaireId,
      versionMethodologie: '1.0',
      etapeAtteinte: 8,
      ...champsScalaires(ETUDE_COMPLETE),
      ...enfantsACreer(ETUDE_COMPLETE),
    },
  });
}

beforeEach(async () => {
  await nettoyerBaseTest();
});

describe('R05 : finaliser une étude comportant un risque noté 3', () => {
  it('plafonne l’orientation à GO sous conditions critiques', async () => {
    const expert = await creerExpertTest();
    const etude = await creerEtudeReference(expert.id);

    const resultat = await finaliserEtude(etude.id);

    expect(resultat.decision.orientationCalculee).toBe('GO');
    expect(resultat.decision.orientationFinale).toBe('GO_SOUS_CONDITIONS');
    expect(resultat.decision.conditionsCritiques).toBe(true);

    const etudeFinale = await bd.etude.findUniqueOrThrow({ where: { id: etude.id } });
    expect(etudeFinale.statut).toBe('COMPLETE');
    const figes = await bd.resultat.findMany({ where: { etudeId: etude.id, fige: true } });
    expect(figes).toHaveLength(1);
    expect(figes[0].orientationFinale).toBe('GO_SOUS_CONDITIONS');
  });
});

describe('R08 : dupliquer une étude et modifier une hypothèse', () => {
  it('crée un scénario indépendant sans changer l’étude source', async () => {
    const expert = await creerExpertTest();
    const reference = await creerEtudeReference(expert.id);

    const scenario = await dupliquerEtude(reference.id, {
      libelleScenario: 'Ticket à 3 000 FCFA',
      proprietaireId: expert.id,
    });

    expect(scenario.id).not.toBe(reference.id);
    expect(scenario.typeScenario).toBe('VARIANTE');
    expect(scenario.etudeSourceId).toBe(reference.id);
    expect(scenario.ticketMoyenFcfa).toBe(reference.ticketMoyenFcfa);

    // Modification du scénario seul.
    await bd.etude.update({ where: { id: scenario.id }, data: { ticketMoyenFcfa: 3000 } });

    const referenceRelue = await bd.etude.findUniqueOrThrow({ where: { id: reference.id } });
    const scenarioRelu = await bd.etude.findUniqueOrThrow({ where: { id: scenario.id } });
    expect(referenceRelue.ticketMoyenFcfa).toBe(ETUDE_COMPLETE.hypotheses.ticketMoyenFcfa);
    expect(scenarioRelu.ticketMoyenFcfa).toBe(3000);

    // Les données de la référence (zones, concurrents, risques) sont intactes.
    const zonesReference = await bd.zone.count({ where: { etudeId: reference.id } });
    expect(zonesReference).toBe(ETUDE_COMPLETE.zones.length);
  });
});
