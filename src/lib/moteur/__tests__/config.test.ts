import { describe, expect, it } from 'vitest';

import {
  CONFIG_COURANTE,
  CONFIG_V1,
  extraireParametres,
  listerVersionsMethodologie,
  obtenirConfiguration,
  validerConfiguration,
} from '../config';

describe('configuration méthodologique v1', () => {
  it('est valide selon ses propres règles de cohérence', () => {
    expect(validerConfiguration(CONFIG_V1)).toEqual([]);
  });

  it('reprend les coefficients du brief', () => {
    expect(CONFIG_V1.menace.composantes).toEqual({
      proximite: 0.2,
      affluence: 0.35,
      qualite: 0.25,
      vitesse: 0.1,
      differenciation: 0.1,
    });
    expect(CONFIG_V1.menace.facteurRelation).toEqual({ DIRECTE: 1, INDIRECTE: 0.7 });
    expect(CONFIG_V1.gaps.partMalServi).toBe(0.5);
    expect(CONFIG_V1.attractivite).toEqual({ demande: 0.5, gaps: 0.3, concurrence: 0.2 });
    expect(CONFIG_V1.scoreGlobal).toEqual({ attractivite: 0.7, risque: 0.3 });
    expect(CONFIG_V1.seuils).toEqual({ noGoStrict: 55, goInclus: 70 });
    expect(CONFIG_V1.redFlags).toEqual({
      noteCritique: 3,
      noteVigilance: 2,
      nombreRisquesVigilance: 3,
    });
    expect(CONFIG_V1.echelleNote).toEqual({ min: 0, max: 3 });
    expect(CONFIG_V1.limites.zonesMax).toBe(4);
    expect(CONFIG_V1.limites.concurrentsMax).toBe(50);
    expect(CONFIG_V1.tolerancePoids).toBe(0.0001);
  });

  it('porte les listes proposées dans la note de cadrage', () => {
    expect(CONFIG_V1.drivers).toHaveLength(7);
    expect(CONFIG_V1.risques).toHaveLength(7);
    expect(CONFIG_V1.besoins).toHaveLength(10);
    expect(CONFIG_V1.loyer.partCibleParDefaut).toBe(0.1);
    const sommeDrivers = CONFIG_V1.drivers.reduce((acc, d) => acc + d.poids, 0);
    const sommeRisques = CONFIG_V1.risques.reduce((acc, r) => acc + r.poids, 0);
    expect(sommeDrivers).toBeCloseTo(1, 10);
    expect(sommeRisques).toBeCloseTo(1, 10);
  });

  it('associe une aide à chaque élément à noter', () => {
    for (const element of [...CONFIG_V1.drivers, ...CONFIG_V1.risques, ...CONFIG_V1.besoins]) {
      expect(element.aide.length).toBeGreaterThan(10);
    }
  });
});

describe('registre des configurations', () => {
  it('expose la version courante et la retrouve par son numéro', () => {
    expect(CONFIG_COURANTE).toBe(CONFIG_V1);
    expect(listerVersionsMethodologie()).toContain('1.0');
    expect(obtenirConfiguration('1.0')).toBe(CONFIG_V1);
  });

  it('refuse une version inconnue', () => {
    expect(() => obtenirConfiguration('9.9')).toThrow(/inconnue/);
  });

  it('extrait un instantané numérique sans libellés ni aides', () => {
    const parametres = extraireParametres(CONFIG_V1);
    expect(parametres.versionMethodologie).toBe('1.0');
    expect(parametres.drivers).toEqual(
      CONFIG_V1.drivers.map(({ code, poids }) => ({ code, poids })),
    );
    expect(parametres.seuils).toEqual(CONFIG_V1.seuils);
    expect(JSON.stringify(parametres)).not.toContain('aide');
    expect(JSON.stringify(parametres)).not.toContain('libelle');
  });

  it('retourne une copie indépendante de la configuration', () => {
    const parametres = extraireParametres(CONFIG_V1);
    parametres.menace.composantes.affluence = 0.99;
    expect(CONFIG_V1.menace.composantes.affluence).toBe(0.35);
  });
});

describe('validerConfiguration', () => {
  it('détecte des poids qui ne font pas 1', () => {
    const cassee = structuredClone(CONFIG_V1);
    cassee.drivers[0].poids = 0.5;
    expect(validerConfiguration(cassee)).toContainEqual(
      expect.stringContaining('générateurs de demande'),
    );
  });

  it('détecte des seuils inversés', () => {
    const cassee = structuredClone(CONFIG_V1);
    cassee.seuils = { noGoStrict: 70, goInclus: 55 };
    expect(validerConfiguration(cassee)).toContainEqual(expect.stringContaining('seuil'));
  });

  it('détecte des codes dupliqués', () => {
    const cassee = structuredClone(CONFIG_V1);
    cassee.risques[1].code = cassee.risques[0].code;
    expect(validerConfiguration(cassee)).toContainEqual(expect.stringContaining('dupliqués'));
  });

  it('détecte un facteur de relation hors plage', () => {
    const cassee = structuredClone(CONFIG_V1);
    cassee.menace.facteurRelation.INDIRECTE = 1.5;
    expect(validerConfiguration(cassee)).toContainEqual(expect.stringContaining('Facteur'));
  });

  it('détecte des listes vides', () => {
    const cassee = structuredClone(CONFIG_V1);
    cassee.drivers = [];
    cassee.risques = [];
    cassee.besoins = [];
    const problemes = validerConfiguration(cassee);
    expect(problemes).toContainEqual(expect.stringContaining('Aucun générateur'));
    expect(problemes).toContainEqual(expect.stringContaining('Aucune catégorie'));
    expect(problemes).toContainEqual(expect.stringContaining('Aucun besoin'));
  });

  it('détecte des poids de menace, d’attractivité ou de score global qui ne font pas 1', () => {
    const cassee = structuredClone(CONFIG_V1);
    cassee.menace.composantes.affluence = 0.5;
    cassee.attractivite.demande = 0.6;
    cassee.scoreGlobal.risque = 0.5;
    const problemes = validerConfiguration(cassee);
    expect(problemes).toContainEqual(expect.stringContaining('composantes de menace'));
    expect(problemes).toContainEqual(expect.stringContaining("l'attractivité"));
    expect(problemes).toContainEqual(expect.stringContaining('score global'));
  });

  it('détecte un poids individuel hors plage', () => {
    const cassee = structuredClone(CONFIG_V1);
    cassee.risques[0].poids = 0;
    cassee.risques[1].poids = 1.15;
    expect(validerConfiguration(cassee)).toContainEqual(expect.stringContaining('Poids hors de'));
  });

  it('détecte une échelle vide, des seuils hors bornes et des red flags incohérents', () => {
    const cassee = structuredClone(CONFIG_V1);
    cassee.echelleNote = { min: 3, max: 3 };
    cassee.seuils = { noGoStrict: -5, goInclus: 120 };
    cassee.redFlags = { noteCritique: 4, noteVigilance: 2, nombreRisquesVigilance: 0 };
    const problemes = validerConfiguration(cassee);
    expect(problemes).toContainEqual(expect.stringContaining('échelle des notes est vide'));
    expect(problemes).toContainEqual(expect.stringContaining('entre 0 et 100'));
    expect(problemes).toContainEqual(expect.stringContaining('red flag'));
    expect(problemes).toContainEqual(expect.stringContaining('au moins 1'));
  });

  it('détecte une part de gap, des parts de loyer, un arrondi ou des seuils de recommandation incohérents', () => {
    const cassee = structuredClone(CONFIG_V1);
    cassee.gaps.partMalServi = 1.5;
    cassee.loyer = { partCibleParDefaut: 0.6, partCibleMax: 0.5 };
    cassee.arrondi = { decimalesConservees: 1, decimalesAffichees: 2 };
    cassee.recommandations.demandeFaible = 90;
    const problemes = validerConfiguration(cassee);
    expect(problemes).toContainEqual(expect.stringContaining('mal servi'));
    expect(problemes).toContainEqual(expect.stringContaining('parts de loyer'));
    expect(problemes).toContainEqual(expect.stringContaining('décimales'));
    expect(problemes).toContainEqual(expect.stringContaining('recommandation'));
  });
});
