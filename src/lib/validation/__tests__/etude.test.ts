import { describe, expect, it } from 'vitest';

import { CAS_NOMINAL, CAS_RISQUES_CRITIQUES } from '@/lib/moteur';

import {
  erreursParChamp,
  schemaConcurrent,
  schemaEtude,
  schemaHypotheses,
  schemaProjet,
  schemaZones,
  valider,
} from '../etude';

describe('schémas : cas de référence', () => {
  it('acceptent les deux cas de référence complets', () => {
    expect(valider(schemaEtude, CAS_NOMINAL).erreurs).toEqual({});
    // Le cas critique laisse la part de loyer à sa valeur par défaut (null pour le moteur) ;
    // le formulaire, lui, la préremplit toujours.
    const critique = {
      ...CAS_RISQUES_CRITIQUES,
      hypotheses: { ...CAS_RISQUES_CRITIQUES.hypotheses, partLoyerCible: 0.1 },
    };
    const resultat = valider(schemaEtude, critique);
    expect(resultat.erreurs).toEqual({});
    expect(resultat.ok).toBe(true);
  });
});

describe('schemaProjet', () => {
  it('exige nom, localité et concept avec des messages actionnables', () => {
    const { ok, erreurs } = valider(schemaProjet, { nom: '', localite: ' ', concept: 'X' });
    expect(ok).toBe(false);
    expect(erreurs.nom).toContain('au moins 2 caractères');
    expect(erreurs.localite).toContain('au moins 2 caractères');
    expect(erreurs.concept).toContain('au moins 2 caractères');
  });

  it('refuse une capacité non entière ou nulle', () => {
    expect(
      valider(schemaProjet, { ...CAS_NOMINAL.projet, capaciteCouverts: 2.5 }).erreurs
        .capaciteCouverts,
    ).toContain('entier');
    expect(
      valider(schemaProjet, { ...CAS_NOMINAL.projet, capaciteCouverts: 0 }).erreurs
        .capaciteCouverts,
    ).toContain('supérieure à zéro');
    expect(valider(schemaProjet, { ...CAS_NOMINAL.projet, capaciteCouverts: null }).ok).toBe(true);
  });
});

describe('schemaHypotheses', () => {
  it('signale chaque hypothèse manquante comme obligatoire', () => {
    const { erreurs } = valider(schemaHypotheses, {
      clientsParJour: null,
      ticketMoyenFcfa: null,
      joursOuvertureParMois: null,
      partLoyerCible: null,
    });
    expect(erreurs.clientsParJour).toContain('obligatoire');
    expect(erreurs.ticketMoyenFcfa).toContain('obligatoire');
    expect(erreurs.joursOuvertureParMois).toContain('obligatoire');
    expect(erreurs.partLoyerCible).toContain('obligatoire');
  });

  it('borne les valeurs aberrantes', () => {
    const base = CAS_NOMINAL.hypotheses;
    expect(
      valider(schemaHypotheses, { ...base, clientsParJour: -3 }).erreurs.clientsParJour,
    ).toContain('supérieur à zéro');
    expect(
      valider(schemaHypotheses, { ...base, joursOuvertureParMois: 32 }).erreurs
        .joursOuvertureParMois,
    ).toContain('Au plus 31');
    expect(
      valider(schemaHypotheses, { ...base, joursOuvertureParMois: 2.5 }).erreurs
        .joursOuvertureParMois,
    ).toContain('entier');
    expect(
      valider(schemaHypotheses, { ...base, partLoyerCible: 0.8 }).erreurs.partLoyerCible,
    ).toContain('50 %');
    expect(
      valider(schemaHypotheses, { ...base, loyerMensuelEnvisageFcfa: -1 }).erreurs
        .loyerMensuelEnvisageFcfa,
    ).toContain('négatif');
  });
});

describe('schemaZones', () => {
  it('exige au moins une zone et au plus quatre', () => {
    expect(valider(schemaZones, []).erreurs['']).toContain('au moins une zone');
    const cinq = Array.from({ length: 5 }, (_, i) => ({ ...CAS_NOMINAL.zones[0], id: `Z${i}` }));
    expect(valider(schemaZones, cinq).erreurs['']).toContain('Au plus quatre');
  });

  it('indexe les erreurs par zone et par champ', () => {
    const zones = structuredClone(CAS_NOMINAL.zones);
    zones[1].poids = 1.5;
    zones[1].libelle = '';
    const { erreurs } = valider(schemaZones, zones);
    expect(erreurs['1.poids']).toContain('100 %');
    expect(erreurs['1.libelle']).toContain('au moins 2 caractères');
    expect(erreurs['0.poids']).toBeUndefined();
  });

  it('ne contrôle pas la somme des poids : cette règle appartient au moteur', () => {
    const zones = structuredClone(CAS_NOMINAL.zones);
    zones[1].poids = 0.5;
    expect(valider(schemaZones, zones).ok).toBe(true);
  });
});

describe('schemaConcurrent', () => {
  it('exige la relation et le nom', () => {
    const { erreurs } = valider(schemaConcurrent, {
      ...CAS_NOMINAL.concurrents[0],
      relation: null,
      nom: '',
    });
    expect(erreurs.relation).toContain('direct ou indirect');
    expect(erreurs.nom).toContain('au moins 2 caractères');
  });

  it('refuse une note hors échelle', () => {
    const concurrent = structuredClone(CAS_NOMINAL.concurrents[0]);
    concurrent.affluence = { note: 4 as 3 };
    expect(valider(schemaConcurrent, concurrent).erreurs['affluence.note']).toContain(
      'entier de 0 à 3',
    );
  });
});

describe('erreursParChamp', () => {
  it('ne garde que le premier message par champ', () => {
    const erreurs = erreursParChamp([
      { path: ['a'], message: 'premier', code: 'custom', input: undefined },
      { path: ['a'], message: 'second', code: 'custom', input: undefined },
      { path: ['b', 0], message: 'autre', code: 'custom', input: undefined },
    ]);
    expect(erreurs).toEqual({ a: 'premier', 'b.0': 'autre' });
  });
});
