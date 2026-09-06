/**
 * Création d'une étude vierge, prête à être remplie étape par étape. Les
 * listes fermées de la méthode (besoins, risques) sont préremplies avec un
 * statut « non renseigné » pour que chaque ligne existe dès le départ.
 */

import { CONFIG_COURANTE, type ConfigurationMethodologie, type EtudeSaisie } from '@/lib/moteur';

export function nouvelIdentifiant(prefixe = ''): string {
  const aleatoire =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefixe ? `${prefixe}-${aleatoire}` : aleatoire;
}

export function nouvelleZone(numero: number): EtudeSaisie['zones'][number] {
  return {
    id: nouvelIdentifiant('zone'),
    libelle: numero === 1 ? 'Zone principale' : `Zone ${numero}`,
    rayonKm: null,
    tempsAccesMin: null,
    mode: null,
    poids: numero === 1 ? 1 : 0,
  };
}

export function nouveauConcurrent(): EtudeSaisie['concurrents'][number] {
  return {
    id: nouvelIdentifiant('concurrent'),
    nom: '',
    typeOffre: '',
    relation: null,
    ticketMoyenFcfa: null,
    proximite: { note: null },
    affluence: { note: null },
    qualite: { note: null },
    vitesse: { note: null },
    differenciation: { note: null },
    observation: '',
  };
}

export function nouvelleEtude(config: ConfigurationMethodologie = CONFIG_COURANTE): EtudeSaisie {
  return {
    projet: {
      nom: '',
      localite: '',
      concept: '',
      horaires: '',
      capaciteCouverts: null,
      modesService: [],
    },
    hypotheses: {
      clientsParJour: null,
      ticketMoyenFcfa: null,
      joursOuvertureParMois: null,
      partLoyerCible: config.loyer.partCibleParDefaut,
      loyerMensuelEnvisageFcfa: null,
      clienteleCible: '',
    },
    zones: [nouvelleZone(1)],
    demande: [],
    concurrents: [],
    gaps: config.besoins.map((besoin) => ({
      besoinCode: besoin.code,
      statutMarche: null,
      importance: null,
    })),
    risques: config.risques.map((risque) => ({
      risqueCode: risque.code,
      notation: { note: null },
      mesure: '',
      responsable: '',
    })),
  };
}
