import { describe, expect, it } from 'vitest';

import { CAS_NOMINAL, CONFIG_V1 } from '@/lib/moteur';

import { cheminEtape, ETAPES, etapeParSlug, etapePrecedente, etapeSuivante } from '../etapes';
import { nouvelIdentifiant, nouvelleEtude, nouvelleZone } from '../etude-vide';
import {
  CLE_STOCKAGE,
  creerEtudeLocale,
  ecrireEtudeLocale,
  effacerEtudeLocale,
  lireEtudeLocale,
  type StockageMinimal,
} from '../stockage-local';
import { premiereEtapeInvalide, validerEtape } from '../validation-etape';

function stockageMemoire(defaillant = false): StockageMinimal & { contenu: Map<string, string> } {
  const contenu = new Map<string, string>();
  return {
    contenu,
    getItem: (cle) => {
      if (defaillant) throw new Error('indisponible');
      return contenu.get(cle) ?? null;
    },
    setItem: (cle, valeur) => {
      if (defaillant) throw new Error('quota');
      contenu.set(cle, valeur);
    },
    removeItem: (cle) => {
      if (defaillant) throw new Error('indisponible');
      contenu.delete(cle);
    },
  };
}

describe('étapes du parcours', () => {
  it('compte huit étapes dans l’ordre du brief, chacune avec un chemin', () => {
    expect(ETAPES).toHaveLength(8);
    expect(ETAPES.map((e) => e.slug)).toEqual([
      'projet',
      'hypotheses',
      'zones',
      'demande',
      'concurrence',
      'vides',
      'risques',
      'synthese',
    ]);
    expect(ETAPES.map((e) => e.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(cheminEtape('zones')).toBe('/etude/zones');
  });

  it('navigue vers la précédente et la suivante', () => {
    expect(etapeSuivante('projet')?.slug).toBe('hypotheses');
    expect(etapeSuivante('synthese')).toBeUndefined();
    expect(etapePrecedente('projet')).toBeUndefined();
    expect(etapePrecedente('synthese')?.slug).toBe('risques');
    expect(etapeParSlug('inconnue')).toBeUndefined();
  });
});

describe('étude vierge', () => {
  it('préremplit les besoins et les risques de la méthode, sans note', () => {
    const etude = nouvelleEtude();
    expect(etude.gaps.map((g) => g.besoinCode)).toEqual(CONFIG_V1.besoins.map((b) => b.code));
    expect(etude.risques.map((r) => r.risqueCode)).toEqual(CONFIG_V1.risques.map((r) => r.code));
    expect(etude.risques.every((r) => r.notation.note === null)).toBe(true);
    expect(etude.zones).toHaveLength(1);
    expect(etude.zones[0].poids).toBe(1);
    expect(etude.hypotheses.partLoyerCible).toBe(CONFIG_V1.loyer.partCibleParDefaut);
  });

  it('produit des identifiants uniques', () => {
    const ids = new Set(Array.from({ length: 50 }, () => nouvelIdentifiant('zone')));
    expect(ids.size).toBe(50);
    expect(nouvelleZone(2).libelle).toBe('Zone 2');
    expect(nouvelleZone(2).poids).toBe(0);
  });
});

describe('sauvegarde locale', () => {
  it('écrit puis relit une étude locale', () => {
    const stockage = stockageMemoire();
    const locale = creerEtudeLocale(() => new Date('2026-09-06T08:00:00.000Z'));
    expect(ecrireEtudeLocale(stockage, locale)).toBe(true);
    expect(stockage.contenu.has(CLE_STOCKAGE)).toBe(true);
    expect(lireEtudeLocale(stockage)).toEqual(locale);
    effacerEtudeLocale(stockage);
    expect(lireEtudeLocale(stockage)).toBeNull();
  });

  it('ignore un contenu corrompu ou d’une autre version', () => {
    const stockage = stockageMemoire();
    stockage.setItem(CLE_STOCKAGE, '{pas du json');
    expect(lireEtudeLocale(stockage)).toBeNull();
    stockage.setItem(CLE_STOCKAGE, JSON.stringify({ version: 99, etude: {} }));
    expect(lireEtudeLocale(stockage)).toBeNull();
  });

  it('ne lève jamais d’exception quand le stockage est indisponible', () => {
    const defaillant = stockageMemoire(true);
    expect(lireEtudeLocale(defaillant)).toBeNull();
    expect(ecrireEtudeLocale(defaillant, creerEtudeLocale())).toBe(false);
    expect(() => effacerEtudeLocale(defaillant)).not.toThrow();
    expect(lireEtudeLocale(null)).toBeNull();
    expect(ecrireEtudeLocale(undefined, creerEtudeLocale())).toBe(false);
  });
});

describe('validation par étape', () => {
  it('valide toutes les étapes du cas nominal', () => {
    expect(premiereEtapeInvalide(CAS_NOMINAL)).toBeNull();
    for (const slug of [
      'projet',
      'hypotheses',
      'zones',
      'demande',
      'concurrence',
      'vides',
      'risques',
    ] as const) {
      expect(validerEtape(slug, CAS_NOMINAL).ok).toBe(true);
    }
  });

  it('signale la première étape en erreur d’une étude vierge', () => {
    expect(premiereEtapeInvalide(nouvelleEtude())).toBe('projet');
  });

  it('combine les erreurs de forme et les alertes bloquantes du moteur sans doublon', () => {
    const etude = structuredClone(CAS_NOMINAL);
    etude.zones[1].poids = 0.5;
    etude.zones[0].libelle = '';
    const resultat = validerEtape('zones', etude);
    expect(resultat.ok).toBe(false);
    expect(resultat.erreursChamps['0.libelle']).toBeDefined();
    expect(resultat.bloquantes.map((a) => a.code)).toEqual(['POIDS_ZONES_INVALIDE']);
  });

  it('remonte les avertissements de la rubrique sans bloquer', () => {
    const etude = structuredClone(CAS_NOMINAL);
    etude.concurrents = [];
    const resultat = validerEtape('concurrence', etude);
    expect(resultat.ok).toBe(true);
    expect(resultat.avertissements.map((a) => a.code)).toEqual(['AUCUN_CONCURRENT']);
  });

  it('bloque une zone sans aucun générateur noté à l’étape demande', () => {
    const etude = structuredClone(CAS_NOMINAL);
    etude.demande = etude.demande.filter((d) => d.zoneId !== 'Z2');
    const resultat = validerEtape('demande', etude);
    expect(resultat.ok).toBe(false);
    expect(resultat.bloquantes.map((a) => a.code)).toEqual(['ZONE_SANS_DEMANDE']);
  });
});
