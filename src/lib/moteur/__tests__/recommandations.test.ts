import { describe, expect, it } from 'vitest';

import { CAS_NOMINAL, CAS_RISQUES_CRITIQUES } from '../cas-reference';
import { CONFIG_V1 } from '../config';
import { evaluerEtude } from '../index';
import type { EtudeSaisie } from '../types';

function etude(base: EtudeSaisie, modifier: (e: EtudeSaisie) => void): EtudeSaisie {
  const copie = structuredClone(base);
  modifier(copie);
  return copie;
}

const codes = (liste: { code: string }[]) => liste.map((r) => r.code);

describe('recommandations : cas nominal', () => {
  const { recommandations } = evaluerEtude(CAS_NOMINAL);

  it('retient trois forces classées par priorité', () => {
    expect(codes(recommandations.forces)).toEqual([
      'DEMANDE_FORTE',
      'ZONE_PORTEUSE',
      'BESOINS_NON_SERVIS',
    ]);
    expect(recommandations.forces[0].texte).toContain('79,0 sur 100');
    expect(recommandations.forces[1].texte).toContain('Cœur de quartier');
  });

  it('garde des vigilances de fond même sans signal fort', () => {
    expect(codes(recommandations.vigilances)).toEqual([
      'CONCURRENCE_PRESENTE',
      'RISQUES_A_SUIVRE',
      'HYPOTHESES_DECLARATIVES',
    ]);
    expect(recommandations.vigilances[0].texte).toContain('3 concurrents dont 2 directs');
  });

  it('propose de positionner l’offre sur les besoins absents les plus importants', () => {
    expect(codes(recommandations.actions)).toEqual(['ACTION_POSITIONNEMENT', 'ACTION_HYPOTHESES']);
    expect(recommandations.actions[0].texte).toContain(
      'déjeuner rapide à prix maîtrisé, vente à emporter et livraison, petit-déjeuner matinal',
    );
  });
});

describe('recommandations : cas à risques critiques', () => {
  const { recommandations } = evaluerEtude(CAS_RISQUES_CRITIQUES);

  it('met le risque critique et le loyer en tête des vigilances', () => {
    expect(codes(recommandations.vigilances)).toEqual([
      'RISQUE_CRITIQUE',
      'LOYER_EXCESSIF',
      'RISQUES_MULTIPLES',
    ]);
    expect(recommandations.vigilances[0].texte).toContain('Site et local');
    expect(recommandations.vigilances[1].texte).toContain('3 000 000 FCFA');
    expect(recommandations.vigilances[1].texte).toContain('2 400 000 FCFA');
  });

  it('ordonne les actions : risque critique, loyer, plan de risques, positionnement', () => {
    expect(codes(recommandations.actions)).toEqual([
      'ACTION_RISQUE_CRITIQUE',
      'ACTION_LOYER',
      'ACTION_PLAN_RISQUES',
      'ACTION_POSITIONNEMENT',
      'ACTION_HYPOTHESES',
    ]);
    expect(recommandations.actions[0].texte).toContain('Mener à terme la mesure prévue');
  });

  it('reconnaît les forces commerciales malgré le risque', () => {
    expect(codes(recommandations.forces)).toEqual([
      'DEMANDE_FORTE',
      'ZONE_PORTEUSE',
      'CONCURRENCE_CONTENUE',
    ]);
  });
});

describe('recommandations : règles ciblées', () => {
  it('signale une concurrence forte et un concurrent majeur, avec un levier de différenciation', () => {
    const forte = etude(CAS_NOMINAL, (x) => {
      for (const c of x.concurrents) {
        c.relation = 'DIRECTE';
        c.proximite = { note: 3 };
        c.affluence = { note: 3 };
        c.qualite = { note: 3 };
        c.vitesse = { note: 1 };
        c.differenciation = { note: 2 };
      }
    });
    const { recommandations, scores } = evaluerEtude(forte);
    expect(scores.pressionConcurrentielle).toBeGreaterThanOrEqual(
      CONFIG_V1.recommandations.pressionForte,
    );
    expect(codes(recommandations.vigilances)).toContain('CONCURRENCE_FORTE');
    expect(codes(recommandations.vigilances)).toContain('CONCURRENT_MAJEUR');
    const action = recommandations.actions.find((a) => a.code === 'ACTION_CONCURRENT_MAJEUR');
    expect(action?.texte).toContain('la vitesse de service');
  });

  it('signale un ticket décalé de la moyenne des concurrents', () => {
    const cher = etude(CAS_NOMINAL, (x) => void (x.hypotheses.ticketMoyenFcfa = 5000));
    const { recommandations } = evaluerEtude(cher);
    const vigilance = recommandations.vigilances.find((v) => v.code === 'TICKET_DECALE');
    expect(vigilance?.texte).toContain('supérieur de 131 %');
    expect(codes(recommandations.actions)).toContain('ACTION_TICKET');
  });

  it('signale une demande faible et une zone faible', () => {
    const faible = etude(CAS_NOMINAL, (x) => {
      for (const d of x.demande) d.notation = { note: 1 };
    });
    const { recommandations } = evaluerEtude(faible);
    expect(codes(recommandations.vigilances)).toContain('DEMANDE_FAIBLE');
    expect(codes(recommandations.vigilances)).toContain('ZONE_FAIBLE');
    expect(codes(recommandations.actions)).toContain('ACTION_DEMANDE');
  });

  it('signale les données manquantes et demande de compléter', () => {
    const incomplet = etude(CAS_NOMINAL, (x) => {
      x.demande[0].notation = { note: null };
      x.risques[0].notation = { note: null };
    });
    const { recommandations } = evaluerEtude(incomplet);
    const vigilance = recommandations.vigilances.find((v) => v.code === 'DONNEES_MANQUANTES');
    expect(vigilance?.texte).toContain('2 données non renseignées fragilisent');
    expect(codes(recommandations.actions)).toContain('ACTION_COMPLETER');
  });

  it('signale un marché déjà bien servi', () => {
    const servi = etude(CAS_NOMINAL, (x) => {
      for (const g of x.gaps) g.statutMarche = 'CORRECT';
    });
    const { recommandations } = evaluerEtude(servi);
    expect(codes(recommandations.vigilances)).toContain('MARCHE_SERVI');
    expect(codes(recommandations.actions)).not.toContain('ACTION_POSITIONNEMENT');
  });

  it('respecte les nombres maximaux de la configuration', () => {
    const { recommandations } = evaluerEtude(CAS_RISQUES_CRITIQUES);
    expect(recommandations.forces.length).toBeLessThanOrEqual(
      CONFIG_V1.recommandations.nombreForces,
    );
    expect(recommandations.vigilances.length).toBeLessThanOrEqual(
      CONFIG_V1.recommandations.nombreVigilances,
    );
    expect(recommandations.actions.length).toBeLessThanOrEqual(
      CONFIG_V1.recommandations.nombreActions,
    );
  });
});
