import { describe, expect, it } from 'vitest';

import { CAS_NOMINAL } from '../cas-reference';
import { CONFIG_V1 } from '../config';
import type { EtudeSaisie, Note } from '../types';
import { calculerCompletude, statutNotation, validerEtude } from '../validation';

function etude(modifier: (e: EtudeSaisie) => void = () => {}): EtudeSaisie {
  const copie = structuredClone(CAS_NOMINAL);
  modifier(copie);
  return copie;
}

function codes(e: EtudeSaisie, niveau?: 'BLOQUANTE' | 'AVERTISSEMENT'): string[] {
  return validerEtude(e, CONFIG_V1)
    .filter((a) => niveau === undefined || a.niveau === niveau)
    .map((a) => a.code);
}

describe('statutNotation', () => {
  it('distingue renseignée, manquante et non applicable', () => {
    expect(statutNotation({ note: 2 })).toBe('RENSEIGNEE');
    expect(statutNotation({ note: 0 })).toBe('RENSEIGNEE');
    expect(statutNotation({ note: null })).toBe('MANQUANTE');
    expect(statutNotation(undefined)).toBe('MANQUANTE');
    expect(statutNotation({ note: null, nonApplicable: true })).toBe('NON_APPLICABLE');
  });
});

describe('validerEtude : cas nominal', () => {
  it('ne produit aucune alerte bloquante ni avertissement', () => {
    expect(validerEtude(CAS_NOMINAL, CONFIG_V1)).toEqual([]);
  });
});

describe('validerEtude : notes hors échelle (R02)', () => {
  it.each([4, -1, 2.5])('refuse une note de demande de %s', (valeur) => {
    const e = etude((x) => {
      x.demande[0].notation.note = valeur as Note;
    });
    const alertes = validerEtude(e, CONFIG_V1).filter((a) => a.code === 'NOTE_HORS_ECHELLE');
    expect(alertes).toHaveLength(1);
    expect(alertes[0].niveau).toBe('BLOQUANTE');
    expect(alertes[0].cible).toBe('Z1:RESIDENTIEL');
    expect(alertes[0].message).toContain('entier de 0 à 3');
  });

  it('refuse une note de concurrent et une note de risque hors échelle', () => {
    const e = etude((x) => {
      x.concurrents[0].affluence.note = 5 as Note;
      x.risques[0].notation.note = -2 as Note;
    });
    const alertes = validerEtude(e, CONFIG_V1).filter((a) => a.code === 'NOTE_HORS_ECHELLE');
    expect(alertes.map((a) => a.cible)).toEqual(['C1:affluence', 'SITE']);
  });
});

describe('validerEtude : pondérations des zones (R03)', () => {
  it('bloque une somme différente de 100 % et signale l’écart', () => {
    const e = etude((x) => {
      x.zones[1].poids = 0.5;
    });
    const alerte = validerEtude(e, CONFIG_V1).find((a) => a.code === 'POIDS_ZONES_INVALIDE');
    expect(alerte?.niveau).toBe('BLOQUANTE');
    expect(alerte?.message).toContain('110,00 %');
    expect(alerte?.message).toContain('10,00 point');
  });

  it('accepte un écart dans la tolérance de 0,01 point et refuse au-delà', () => {
    expect(codes(etude((x) => void (x.zones[1].poids = 0.39995)))).not.toContain(
      'POIDS_ZONES_INVALIDE',
    );
    expect(codes(etude((x) => void (x.zones[1].poids = 0.3998)))).toContain('POIDS_ZONES_INVALIDE');
  });

  it('bloque un poids manquant ou hors plage', () => {
    expect(codes(etude((x) => void (x.zones[0].poids = null)))).toContain('POIDS_ZONE_MANQUANT');
    expect(codes(etude((x) => void (x.zones[0].poids = 1.4)))).toContain('POIDS_ZONE_HORS_PLAGE');
    expect(codes(etude((x) => void (x.zones[0].poids = -0.1)))).toContain('POIDS_ZONE_HORS_PLAGE');
  });

  it('bloque l’absence de zone et l’excès de zones', () => {
    expect(codes(etude((x) => void (x.zones = [])))).toContain('ZONES_ABSENTES');
    const trop = etude((x) => {
      for (let i = 3; i <= 5; i += 1) {
        x.zones.push({
          id: `Z${i}`,
          libelle: `Zone ${i}`,
          rayonKm: 1,
          tempsAccesMin: 5,
          mode: 'A_PIED',
          poids: 0,
        });
      }
    });
    expect(codes(trop)).toContain('ZONES_TROP_NOMBREUSES');
  });

  it('avertit quand une zone est incomplètement décrite et bloque une valeur aberrante', () => {
    expect(
      codes(
        etude((x) => void (x.zones[0].rayonKm = null)),
        'AVERTISSEMENT',
      ),
    ).toContain('ZONE_DESCRIPTION_INCOMPLETE');
    expect(
      codes(
        etude((x) => void (x.zones[0].tempsAccesMin = -3)),
        'BLOQUANTE',
      ),
    ).toContain('VALEUR_ABERRANTE');
  });
});

describe('validerEtude : hypothèses commerciales', () => {
  it('bloque une hypothèse manquante', () => {
    const alertes = validerEtude(
      etude((x) => void (x.hypotheses.ticketMoyenFcfa = null)),
      CONFIG_V1,
    );
    expect(alertes).toContainEqual(
      expect.objectContaining({ code: 'HYPOTHESE_MANQUANTE', cible: 'ticketMoyenFcfa' }),
    );
  });

  it('bloque des valeurs aberrantes', () => {
    expect(codes(etude((x) => void (x.hypotheses.clientsParJour = -5)))).toContain(
      'VALEUR_ABERRANTE',
    );
    expect(codes(etude((x) => void (x.hypotheses.joursOuvertureParMois = 32)))).toContain(
      'VALEUR_ABERRANTE',
    );
    expect(codes(etude((x) => void (x.hypotheses.joursOuvertureParMois = 2.5)))).toContain(
      'VALEUR_ABERRANTE',
    );
    expect(codes(etude((x) => void (x.hypotheses.partLoyerCible = 0.8)))).toContain(
      'VALEUR_ABERRANTE',
    );
    expect(codes(etude((x) => void (x.hypotheses.loyerMensuelEnvisageFcfa = -1)))).toContain(
      'VALEUR_ABERRANTE',
    );
    expect(codes(etude((x) => void (x.projet.capaciteCouverts = 0)))).toContain('VALEUR_ABERRANTE');
  });

  it('avertit quand la fréquentation dépasse ce que la capacité permet', () => {
    const e = etude((x) => {
      x.projet.capaciteCouverts = 20;
    });
    expect(codes(e, 'AVERTISSEMENT')).toContain('FREQUENTATION_SUPERIEURE_A_CAPACITE');
    expect(codes(e, 'BLOQUANTE')).toEqual([]);
  });

  it('bloque un projet sans nom, localité ou concept', () => {
    const e = etude((x) => {
      x.projet.nom = '  ';
      x.projet.localite = '';
      x.projet.concept = '';
    });
    const alertes = validerEtude(e, CONFIG_V1).filter((a) => a.code === 'PROJET_INCOMPLET');
    expect(alertes.map((a) => a.cible)).toEqual(['nom', 'localite', 'concept']);
  });
});

describe('validerEtude : demande', () => {
  it('signale une donnée manquante sans la confondre avec zéro', () => {
    const e = etude((x) => {
      x.demande.find((d) => d.zoneId === 'Z1' && d.driverCode === 'LOISIRS')!.notation.note = null;
    });
    const alertes = validerEtude(e, CONFIG_V1);
    expect(alertes).toContainEqual(
      expect.objectContaining({
        code: 'DONNEE_MANQUANTE',
        niveau: 'AVERTISSEMENT',
        cible: 'Z1:LOISIRS',
      }),
    );
    expect(alertes.filter((a) => a.niveau === 'BLOQUANTE')).toEqual([]);
  });

  it('n’alerte pas sur un critère non applicable', () => {
    const e = etude((x) => {
      const d = x.demande.find((d) => d.zoneId === 'Z1' && d.driverCode === 'LOISIRS')!;
      d.notation = { note: null, nonApplicable: true };
    });
    expect(codes(e)).toEqual([]);
  });

  it('bloque une zone sans aucun générateur noté', () => {
    const e = etude((x) => {
      x.demande = x.demande.filter((d) => d.zoneId !== 'Z2');
    });
    expect(validerEtude(e, CONFIG_V1)).toContainEqual(
      expect.objectContaining({ code: 'ZONE_SANS_DEMANDE', cible: 'Z2' }),
    );
  });

  it('bloque une zone ou un générateur inconnu', () => {
    expect(codes(etude((x) => void (x.demande[0].zoneId = 'Z9')))).toContain('ZONE_INCONNUE');
    expect(codes(etude((x) => void (x.demande[0].driverCode = 'METEO')))).toContain(
      'DRIVER_INCONNU',
    );
  });
});

describe('validerEtude : concurrence', () => {
  it('avertit sans concurrent, sans bloquer', () => {
    const e = etude((x) => void (x.concurrents = []));
    expect(codes(e, 'AVERTISSEMENT')).toContain('AUCUN_CONCURRENT');
    expect(codes(e, 'BLOQUANTE')).toEqual([]);
  });

  it('bloque au-delà de cinquante concurrents', () => {
    const e = etude((x) => {
      for (let i = 0; i < 49; i += 1)
        x.concurrents.push({ ...structuredClone(x.concurrents[0]), id: `X${i}` });
    });
    expect(codes(e)).toContain('CONCURRENTS_TROP_NOMBREUX');
  });

  it('bloque un concurrent sans relation ou sans nom', () => {
    const alertes = validerEtude(
      etude((x) => {
        x.concurrents[0].relation = null;
        x.concurrents[1].nom = '';
      }),
      CONFIG_V1,
    ).filter((a) => a.code === 'CONCURRENT_INCOMPLET');
    expect(alertes.map((a) => a.cible)).toEqual(['C1:relation', 'C2:nom']);
  });

  it('avertit d’un concurrent sans aucune note et d’une composante manquante', () => {
    const e = etude((x) => {
      for (const c of [
        'proximite',
        'affluence',
        'qualite',
        'vitesse',
        'differenciation',
      ] as const) {
        x.concurrents[0][c] = { note: null };
      }
      x.concurrents[1].vitesse = { note: null };
    });
    const alertes = validerEtude(e, CONFIG_V1);
    expect(alertes).toContainEqual(
      expect.objectContaining({ code: 'CONCURRENT_SANS_NOTE', cible: 'C1' }),
    );
    expect(alertes).toContainEqual(
      expect.objectContaining({ code: 'DONNEE_MANQUANTE', cible: 'C2:vitesse' }),
    );
    expect(alertes.filter((a) => a.niveau === 'BLOQUANTE')).toEqual([]);
  });

  it('bloque un identifiant dupliqué et un ticket aberrant', () => {
    expect(codes(etude((x) => void (x.concurrents[1].id = 'C1')))).toContain('CONCURRENT_DUPLIQUE');
    expect(codes(etude((x) => void (x.concurrents[1].ticketMoyenFcfa = 0)))).toContain(
      'VALEUR_ABERRANTE',
    );
  });
});

describe('validerEtude : vides commerciaux', () => {
  it('bloque sans aucun besoin qualifié', () => {
    const e = etude((x) => {
      for (const g of x.gaps) g.statutMarche = null;
    });
    expect(codes(e, 'BLOQUANTE')).toContain('GAPS_ABSENTS');
    expect(codes(e, 'AVERTISSEMENT').filter((c) => c === 'DONNEE_MANQUANTE')).toHaveLength(10);
  });

  it('bloque une importance hors plage ou un besoin inconnu', () => {
    expect(codes(etude((x) => void (x.gaps[0].importance = 4)))).toContain('IMPORTANCE_HORS_PLAGE');
    expect(codes(etude((x) => void (x.gaps[0].besoinCode = 'INCONNU')))).toContain(
      'BESOIN_INCONNU',
    );
    expect(codes(etude((x) => void (x.gaps[1].besoinCode = x.gaps[0].besoinCode)))).toContain(
      'GAP_DUPLIQUE',
    );
  });

  it('accepte un besoin non applicable sans alerte', () => {
    const e = etude((x) => {
      x.gaps[0] = {
        besoinCode: x.gaps[0].besoinCode,
        statutMarche: null,
        importance: null,
        nonApplicable: true,
      };
    });
    expect(codes(e)).toEqual([]);
  });
});

describe('validerEtude : risques', () => {
  it('bloque sans aucun risque évalué', () => {
    expect(
      codes(
        etude((x) => void (x.risques = [])),
        'BLOQUANTE',
      ),
    ).toContain('RISQUES_ABSENTS');
  });

  it('avertit d’un risque critique sans mesure de traitement', () => {
    const e = etude((x) => {
      x.risques[2].notation.note = 3;
    });
    expect(validerEtude(e, CONFIG_V1)).toContainEqual(
      expect.objectContaining({
        code: 'RISQUE_CRITIQUE_SANS_MESURE',
        cible: 'RESSOURCES_HUMAINES',
      }),
    );
  });

  it('bloque une catégorie inconnue ou dupliquée', () => {
    expect(codes(etude((x) => void (x.risques[0].risqueCode = 'METEO')))).toContain(
      'RISQUE_INCONNU',
    );
    expect(codes(etude((x) => void (x.risques[1].risqueCode = 'SITE')))).toContain(
      'RISQUE_DUPLIQUE',
    );
  });
});

describe('calculerCompletude', () => {
  it('compte les données attendues par la méthode', () => {
    expect(calculerCompletude(CAS_NOMINAL, CONFIG_V1)).toEqual({
      renseignees: 46,
      manquantes: 0,
      nonApplicables: 0,
    });
  });

  it('classe les manquantes et les non applicables', () => {
    const e = etude((x) => {
      x.demande[0].notation = { note: null };
      x.gaps[0].nonApplicable = true;
      x.risques.pop();
    });
    expect(calculerCompletude(e, CONFIG_V1)).toEqual({
      renseignees: 43,
      manquantes: 2,
      nonApplicables: 1,
    });
  });
});
