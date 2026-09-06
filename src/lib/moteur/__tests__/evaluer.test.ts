import { describe, expect, it } from 'vitest';

import { CAS_NOMINAL } from '../cas-reference';
import { CONFIG_V1 } from '../config';
import { evaluerEtude } from '../index';
import type { EtudeSaisie, Note } from '../types';
import { VERSION_MOTEUR } from '../version';

function etude(modifier: (e: EtudeSaisie) => void = () => {}): EtudeSaisie {
  const copie = structuredClone(CAS_NOMINAL);
  modifier(copie);
  return copie;
}

const ETUDE_VIDE: EtudeSaisie = {
  projet: { nom: '', localite: '', concept: '' },
  hypotheses: {
    clientsParJour: null,
    ticketMoyenFcfa: null,
    joursOuvertureParMois: null,
    partLoyerCible: null,
  },
  zones: [],
  demande: [],
  concurrents: [],
  gaps: [],
  risques: [],
};

describe('evaluerEtude : traçabilité', () => {
  it('porte la version du moteur, la version de la méthodologie et l’horodatage', () => {
    const horloge = () => new Date('2026-09-06T10:00:00.000Z');
    const resultat = evaluerEtude(CAS_NOMINAL, CONFIG_V1, horloge);
    expect(resultat.versionMoteur).toBe(VERSION_MOTEUR);
    expect(resultat.versionMethodologie).toBe('1.0');
    expect(resultat.calculeLe).toBe('2026-09-06T10:00:00.000Z');
  });

  it('conserve un instantané des paramètres utilisés', () => {
    const resultat = evaluerEtude(CAS_NOMINAL);
    expect(resultat.parametres.versionMethodologie).toBe(CONFIG_V1.version);
    expect(resultat.parametres.seuils).toEqual(CONFIG_V1.seuils);
    expect(resultat.parametres.drivers).toHaveLength(7);
  });

  it('est déterministe : deux évaluations identiques donnent le même résultat', () => {
    const horloge = () => new Date(0);
    expect(evaluerEtude(CAS_NOMINAL, CONFIG_V1, horloge)).toEqual(
      evaluerEtude(CAS_NOMINAL, CONFIG_V1, horloge),
    );
  });
});

describe('evaluerEtude : données manquantes et cas limites', () => {
  it('ne lève jamais d’exception sur une étude vide et rend tout non calculable', () => {
    const resultat = evaluerEtude(ETUDE_VIDE);
    expect(resultat.scores.scoreGlobal).toBeNull();
    expect(resultat.scores.demandeGlobale).toBeNull();
    expect(resultat.scores.scoreGaps).toBeNull();
    expect(resultat.scores.scoreRisque).toBeNull();
    expect(resultat.projection.caMensuelFcfa).toBeNull();
    expect(resultat.decision.libelle).toBe('Non calculable');
    expect(resultat.decomposition).toEqual([]);
    expect(resultat.finalisable).toBe(false);
    expect(resultat.alertes.some((a) => a.niveau === 'BLOQUANTE')).toBe(true);
  });

  it('applique la part de loyer par défaut quand elle n’est pas saisie', () => {
    const resultat = evaluerEtude(etude((x) => void (x.hypotheses.partLoyerCible = null)));
    expect(resultat.projection.partLoyerCible).toBe(0.1);
    expect(resultat.projection.loyerMaximalFcfa).toBe(780_000);
  });

  it('signale un loyer envisagé supérieur au loyer soutenable', () => {
    const resultat = evaluerEtude(
      etude((x) => void (x.hypotheses.loyerMensuelEnvisageFcfa = 900_000)),
    );
    expect(resultat.projection.ecartLoyerFcfa).toBe(120_000);
    expect(resultat.alertes).toContainEqual(
      expect.objectContaining({ code: 'LOYER_SUPERIEUR_AU_SOUTENABLE' }),
    );
  });

  it('considère la pression nulle sans concurrent, avec une alerte de vérification', () => {
    const resultat = evaluerEtude(etude((x) => void (x.concurrents = [])));
    expect(resultat.scores.pressionConcurrentielle).toBe(0);
    expect(resultat.alertes).toContainEqual(expect.objectContaining({ code: 'AUCUN_CONCURRENT' }));
    expect(resultat.finalisable).toBe(true);
  });

  it('renormalise une note manquante au lieu de la compter pour zéro', () => {
    const avecNote = evaluerEtude(CAS_NOMINAL);
    const sansNote = evaluerEtude(
      etude((x) => {
        x.demande.find((d) => d.zoneId === 'Z2' && d.driverCode === 'ENSEIGNEMENT')!.notation.note =
          null;
      }),
    );
    // Le driver retiré était noté 1, sous la moyenne de la zone : la zone monte.
    expect(sansNote.scores.demandeParZone.Z2!).toBeGreaterThan(avecNote.scores.demandeParZone.Z2!);
    expect(sansNote.finalisable).toBe(true);
    expect(sansNote.completude.manquantes).toBe(1);
  });

  it('exclut un besoin non applicable de l’importance totale', () => {
    const resultat = evaluerEtude(
      etude((x) => {
        x.gaps[3] = {
          besoinCode: 'CUISINE_LOCALE',
          statutMarche: null,
          importance: null,
          nonApplicable: true,
        };
      }),
    );
    // Sans le besoin CUISINE_LOCALE (importance 3, correct) : 14 ÷ 18 × 100.
    expect(resultat.scores.scoreGaps).toBeCloseTo(77.78, 2);
    expect(resultat.completude.nonApplicables).toBe(1);
  });

  it('traite une note hors échelle comme manquante et bloque la finalisation', () => {
    const resultat = evaluerEtude(etude((x) => void (x.risques[0].notation.note = 7 as Note)));
    expect(resultat.alertes).toContainEqual(expect.objectContaining({ code: 'NOTE_HORS_ECHELLE' }));
    expect(resultat.finalisable).toBe(false);
    expect(resultat.scores.scoreRisque).not.toBeNull();
  });

  it('bloque la finalisation quand les poids des zones ne font pas 100 %', () => {
    const resultat = evaluerEtude(etude((x) => void (x.zones[1].poids = 0.5)));
    expect(resultat.finalisable).toBe(false);
    expect(resultat.scores.scoreGlobal).not.toBeNull();
  });

  it('applique une configuration modifiée sans changement de code', () => {
    const config = structuredClone(CONFIG_V1);
    config.version = '1.1-test';
    config.seuils = { noGoStrict: 60, goInclus: 80 };
    const resultat = evaluerEtude(CAS_NOMINAL, config);
    expect(resultat.versionMethodologie).toBe('1.1-test');
    expect(resultat.decision.orientationCalculee).toBe('GO_SOUS_CONDITIONS');
    expect(resultat.parametres.seuils.goInclus).toBe(80);
  });
});
