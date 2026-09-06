/**
 * Cas de référence construits par le candidat en attendant les jeux de
 * recette officiels de FUND.lab (arbitrage H9). Ce sont des entrées du
 * moteur, jamais des résultats : les valeurs attendues, calculées à la main,
 * vivent dans les tests (reference.test.ts). Ces cas servent aussi de
 * données de démonstration. Toutes les enseignes et localités sont fictives.
 */

import type { EtudeSaisie, Note } from './types';

const note = (valeur: Note) => ({ note: valeur });

/**
 * Cas nominal : snack de quartier en zone mixte, deux zones de chalandise,
 * trois concurrents, risques faibles. Résultat attendu : GO.
 */
export const CAS_NOMINAL: EtudeSaisie = {
  projet: {
    nom: 'Snack Le Carrefour',
    localite: 'Cotonou, quartier Fidjrossè',
    concept: 'Snack et petit-déjeuner',
    horaires: '7 h à 21 h, du lundi au samedi',
    capaciteCouverts: 40,
    modesService: ['sur place', 'à emporter'],
  },
  hypotheses: {
    clientsParJour: 120,
    ticketMoyenFcfa: 2500,
    joursOuvertureParMois: 26,
    partLoyerCible: 0.1,
    loyerMensuelEnvisageFcfa: 600_000,
    clienteleCible: 'Salariés du quartier et étudiants',
  },
  zones: [
    {
      id: 'Z1',
      libelle: 'Cœur de quartier',
      rayonKm: 0.5,
      tempsAccesMin: 5,
      mode: 'A_PIED',
      poids: 0.6,
    },
    {
      id: 'Z2',
      libelle: 'Périphérie',
      rayonKm: 2,
      tempsAccesMin: 10,
      mode: 'DEUX_ROUES',
      poids: 0.4,
    },
  ],
  demande: [
    { zoneId: 'Z1', driverCode: 'RESIDENTIEL', notation: note(3) },
    { zoneId: 'Z1', driverCode: 'BUREAUX', notation: note(3) },
    { zoneId: 'Z1', driverCode: 'COMMERCES', notation: note(2) },
    { zoneId: 'Z1', driverCode: 'AXES', notation: note(3) },
    { zoneId: 'Z1', driverCode: 'ENSEIGNEMENT', notation: note(2) },
    { zoneId: 'Z1', driverCode: 'LOISIRS', notation: note(2) },
    { zoneId: 'Z1', driverCode: 'SOLVABILITE', notation: note(3) },
    { zoneId: 'Z2', driverCode: 'RESIDENTIEL', notation: note(2) },
    { zoneId: 'Z2', driverCode: 'BUREAUX', notation: note(2) },
    { zoneId: 'Z2', driverCode: 'COMMERCES', notation: note(3) },
    { zoneId: 'Z2', driverCode: 'AXES', notation: note(2) },
    { zoneId: 'Z2', driverCode: 'ENSEIGNEMENT', notation: note(1) },
    { zoneId: 'Z2', driverCode: 'LOISIRS', notation: note(1) },
    { zoneId: 'Z2', driverCode: 'SOLVABILITE', notation: note(2) },
  ],
  concurrents: [
    {
      id: 'C1',
      nom: 'Chez Mariam',
      typeOffre: 'Snack',
      relation: 'DIRECTE',
      ticketMoyenFcfa: 2000,
      proximite: note(2),
      affluence: note(2),
      qualite: note(1),
      vitesse: note(2),
      differenciation: note(1),
      observation: 'Clientèle fidèle le midi, carte courte.',
    },
    {
      id: 'C2',
      nom: 'Fast Food Express',
      typeOffre: 'Fast-food',
      relation: 'DIRECTE',
      ticketMoyenFcfa: 3000,
      proximite: note(1),
      affluence: note(2),
      qualite: note(1),
      vitesse: note(2),
      differenciation: note(2),
    },
    {
      id: 'C3',
      nom: 'Boulangerie du Marché',
      typeOffre: 'Boulangerie',
      relation: 'INDIRECTE',
      ticketMoyenFcfa: 1500,
      proximite: note(3),
      affluence: note(3),
      qualite: note(3),
      vitesse: note(1),
      differenciation: note(3),
    },
  ],
  gaps: [
    { besoinCode: 'PETIT_DEJEUNER', statutMarche: 'ABSENT', importance: null },
    { besoinCode: 'DEJEUNER_RAPIDE', statutMarche: 'ABSENT', importance: null },
    { besoinCode: 'DINER_SOIREE', statutMarche: 'MAL_SERVI', importance: null },
    { besoinCode: 'CUISINE_LOCALE', statutMarche: 'CORRECT', importance: null },
    { besoinCode: 'CUISINE_SPECIALISEE', statutMarche: 'ABSENT', importance: null },
    { besoinCode: 'OFFRE_SAINE', statutMarche: 'MAL_SERVI', importance: null },
    { besoinCode: 'EMPORTER_LIVRAISON', statutMarche: 'ABSENT', importance: null },
    { besoinCode: 'ESPACE_TRAVAIL', statutMarche: 'ABSENT', importance: null },
    { besoinCode: 'ESPACE_FAMILIAL', statutMarche: 'CORRECT', importance: null },
    { besoinCode: 'BOISSONS_PATISSERIE', statutMarche: 'MAL_SERVI', importance: null },
  ],
  risques: [
    { risqueCode: 'SITE', notation: note(1), mesure: 'Bail de trois ans signé' },
    { risqueCode: 'APPROVISIONNEMENT', notation: note(1), mesure: 'Deux fournisseurs identifiés' },
    { risqueCode: 'RESSOURCES_HUMAINES', notation: note(0) },
    { risqueCode: 'CONFORMITE', notation: note(0) },
    {
      risqueCode: 'FINANCEMENT',
      notation: note(1),
      mesure: 'Apport personnel couvrant trois mois',
    },
    { risqueCode: 'SECURITE_ENVIRONNEMENT', notation: note(1) },
    { risqueCode: 'DEPENDANCE_EXTERNE', notation: note(0) },
  ],
};

/**
 * Cas à risques critiques : restaurant très bien placé, demande et vides
 * commerciaux élevés, mais un risque de site noté 3 et deux risques
 * sérieux. Le score dépasse le seuil de GO ; l'orientation est plafonnée à
 * GO sous conditions critiques (cas de recette R05). Le loyer envisagé
 * dépasse le loyer soutenable.
 */
export const CAS_RISQUES_CRITIQUES: EtudeSaisie = {
  projet: {
    nom: 'Restaurant La Terrasse',
    localite: 'Abomey-Calavi, centre-ville',
    concept: 'Restaurant de cuisine locale et grillades',
    horaires: '11 h à 23 h, tous les jours',
    capaciteCouverts: 60,
    modesService: ['sur place', 'livraison'],
  },
  hypotheses: {
    clientsParJour: 200,
    ticketMoyenFcfa: 4000,
    joursOuvertureParMois: 30,
    partLoyerCible: null,
    loyerMensuelEnvisageFcfa: 3_000_000,
    clienteleCible: 'Cadres, familles et étudiants',
  },
  zones: [
    {
      id: 'Z1',
      libelle: 'Centre-ville',
      rayonKm: 1,
      tempsAccesMin: 10,
      mode: 'A_PIED',
      poids: 0.5,
    },
    {
      id: 'Z2',
      libelle: 'Quartier résidentiel',
      rayonKm: 3,
      tempsAccesMin: 15,
      mode: 'VOITURE',
      poids: 0.3,
    },
    {
      id: 'Z3',
      libelle: 'Zone universitaire',
      rayonKm: 4,
      tempsAccesMin: 20,
      mode: 'TRANSPORT_COMMUN',
      poids: 0.2,
    },
  ],
  demande: [
    { zoneId: 'Z1', driverCode: 'RESIDENTIEL', notation: note(3) },
    { zoneId: 'Z1', driverCode: 'BUREAUX', notation: note(3) },
    { zoneId: 'Z1', driverCode: 'COMMERCES', notation: note(3) },
    { zoneId: 'Z1', driverCode: 'AXES', notation: note(3) },
    { zoneId: 'Z1', driverCode: 'ENSEIGNEMENT', notation: note(2) },
    { zoneId: 'Z1', driverCode: 'LOISIRS', notation: note(2) },
    { zoneId: 'Z1', driverCode: 'SOLVABILITE', notation: note(3) },
    { zoneId: 'Z2', driverCode: 'RESIDENTIEL', notation: note(3) },
    { zoneId: 'Z2', driverCode: 'BUREAUX', notation: note(2) },
    { zoneId: 'Z2', driverCode: 'COMMERCES', notation: note(2) },
    { zoneId: 'Z2', driverCode: 'AXES', notation: note(3) },
    { zoneId: 'Z2', driverCode: 'ENSEIGNEMENT', notation: note(1) },
    { zoneId: 'Z2', driverCode: 'LOISIRS', notation: note(2) },
    { zoneId: 'Z2', driverCode: 'SOLVABILITE', notation: note(2) },
    { zoneId: 'Z3', driverCode: 'RESIDENTIEL', notation: note(2) },
    { zoneId: 'Z3', driverCode: 'BUREAUX', notation: note(2) },
    { zoneId: 'Z3', driverCode: 'COMMERCES', notation: note(2) },
    { zoneId: 'Z3', driverCode: 'AXES', notation: note(2) },
    { zoneId: 'Z3', driverCode: 'ENSEIGNEMENT', notation: note(2) },
    { zoneId: 'Z3', driverCode: 'LOISIRS', notation: note(2) },
    { zoneId: 'Z3', driverCode: 'SOLVABILITE', notation: note(2) },
  ],
  concurrents: [
    {
      id: 'C1',
      nom: 'Maquis du Lac',
      typeOffre: 'Maquis',
      relation: 'INDIRECTE',
      ticketMoyenFcfa: 3500,
      proximite: note(1),
      affluence: note(1),
      qualite: note(2),
      vitesse: note(1),
      differenciation: note(1),
    },
    {
      id: 'C2',
      nom: 'Le Gourmet',
      typeOffre: 'Restaurant',
      relation: 'DIRECTE',
      ticketMoyenFcfa: 4500,
      proximite: note(1),
      affluence: note(1),
      qualite: note(1),
      vitesse: note(2),
      differenciation: note(1),
    },
  ],
  gaps: [
    { besoinCode: 'PETIT_DEJEUNER', statutMarche: 'ABSENT', importance: 3 },
    { besoinCode: 'DEJEUNER_RAPIDE', statutMarche: 'ABSENT', importance: 3 },
    { besoinCode: 'DINER_SOIREE', statutMarche: 'ABSENT', importance: 2 },
    { besoinCode: 'CUISINE_LOCALE', statutMarche: 'MAL_SERVI', importance: 2 },
    { besoinCode: 'CUISINE_SPECIALISEE', statutMarche: 'MAL_SERVI', importance: 2 },
    { besoinCode: 'OFFRE_SAINE', statutMarche: 'CORRECT', importance: 1 },
    { besoinCode: 'EMPORTER_LIVRAISON', statutMarche: 'ABSENT', importance: 3 },
    { besoinCode: 'ESPACE_TRAVAIL', statutMarche: 'ABSENT', importance: 2 },
    { besoinCode: 'ESPACE_FAMILIAL', statutMarche: 'MAL_SERVI', importance: 2 },
    { besoinCode: 'BOISSONS_PATISSERIE', statutMarche: 'ABSENT', importance: 1 },
  ],
  risques: [
    {
      risqueCode: 'SITE',
      notation: { note: 3, commentaire: 'Bail précaire de six mois, propriétaire en litige' },
      mesure: 'Négocier un bail de cinq ans avec clause de sortie',
      responsable: 'Promoteur',
    },
    {
      risqueCode: 'APPROVISIONNEMENT',
      notation: note(2),
      mesure: 'Contrat cadre avec un grossiste',
    },
    {
      risqueCode: 'RESSOURCES_HUMAINES',
      notation: note(2),
      mesure: 'Recrutement anticipé du chef',
    },
    { risqueCode: 'CONFORMITE', notation: note(1) },
    { risqueCode: 'FINANCEMENT', notation: note(1) },
    { risqueCode: 'SECURITE_ENVIRONNEMENT', notation: note(0) },
    { risqueCode: 'DEPENDANCE_EXTERNE', notation: note(0) },
  ],
};
