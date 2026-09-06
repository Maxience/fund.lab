/**
 * Contrôles métier d'une étude : champs obligatoires, valeurs hors échelle
 * ou aberrantes, pondérations, cohérence, complétude. Produit des alertes
 * bloquantes (finalisation impossible), des avertissements et des
 * informations. La même logique s'exécute côté serveur quel que soit le
 * parcours ; les schémas Zod des formulaires la précèdent côté client.
 */

import type { ConfigurationMethodologie } from './config/types';
import { formaterDecimal } from './formatage';
import {
  ecartSomme,
  estNoteValide,
  estPositif,
  estPositifOuNul,
  sommeConforme,
} from './primitives';
import type {
  Alerte,
  Completude,
  ComposanteMenace,
  ConcurrentSaisi,
  EtudeSaisie,
  NiveauAlerte,
  Notation,
  Rubrique,
  StatutDonnee,
} from './types';

export const COMPOSANTES_MENACE: ComposanteMenace[] = [
  'proximite',
  'affluence',
  'qualite',
  'vitesse',
  'differenciation',
];

/** Statut d'une notation au sens du brief. */
export function statutNotation(notation: Notation | undefined): StatutDonnee {
  if (notation?.nonApplicable) return 'NON_APPLICABLE';
  if (notation && notation.note !== null) return 'RENSEIGNEE';
  return 'MANQUANTE';
}

function nouvelleAlerte(
  niveau: NiveauAlerte,
  code: string,
  rubrique: Rubrique,
  message: string,
  cible?: string,
): Alerte {
  return cible === undefined
    ? { code, niveau, rubrique, message }
    : { code, niveau, rubrique, message, cible };
}

function doublons(valeurs: string[]): string[] {
  const vus = new Set<string>();
  const repetes = new Set<string>();
  for (const v of valeurs) {
    if (vus.has(v)) repetes.add(v);
    vus.add(v);
  }
  return [...repetes];
}

function estVide(texte: string | undefined): boolean {
  return texte === undefined || texte.trim().length === 0;
}

/** Contrôle une étude et retourne toutes les alertes, sans en masquer aucune. */
export function validerEtude(etude: EtudeSaisie, config: ConfigurationMethodologie): Alerte[] {
  const alertes: Alerte[] = [];
  const bloquante = (code: string, rubrique: Rubrique, message: string, cible?: string) =>
    alertes.push(nouvelleAlerte('BLOQUANTE', code, rubrique, message, cible));
  const avertissement = (code: string, rubrique: Rubrique, message: string, cible?: string) =>
    alertes.push(nouvelleAlerte('AVERTISSEMENT', code, rubrique, message, cible));

  const echelle = config.echelleNote;
  const noteInvalide = (notation: Notation | undefined) =>
    notation !== undefined && notation.note !== null && !estNoteValide(notation.note, echelle);
  const messageEchelle = `La note doit être un entier de ${echelle.min} à ${echelle.max}.`;

  /* Projet ---------------------------------------------------------------- */
  const { projet } = etude;
  if (estVide(projet.nom))
    bloquante('PROJET_INCOMPLET', 'PROJET', 'Le nom du projet est obligatoire.', 'nom');
  if (estVide(projet.localite)) {
    bloquante('PROJET_INCOMPLET', 'PROJET', 'La localité du projet est obligatoire.', 'localite');
  }
  if (estVide(projet.concept))
    bloquante('PROJET_INCOMPLET', 'PROJET', 'Le concept est obligatoire.', 'concept');
  if (projet.capaciteCouverts != null && !estPositif(projet.capaciteCouverts)) {
    bloquante(
      'VALEUR_ABERRANTE',
      'PROJET',
      'La capacité doit être un nombre de couverts strictement positif.',
      'capaciteCouverts',
    );
  }

  /* Hypothèses commerciales ------------------------------------------------ */
  const h = etude.hypotheses;
  const controlerPositif = (valeur: number | null, cible: string, libelle: string) => {
    if (valeur === null) {
      bloquante('HYPOTHESE_MANQUANTE', 'HYPOTHESES', `${libelle} est obligatoire.`, cible);
    } else if (!estPositif(valeur)) {
      bloquante(
        'VALEUR_ABERRANTE',
        'HYPOTHESES',
        `${libelle} doit être un nombre strictement positif.`,
        cible,
      );
    }
  };
  controlerPositif(h.clientsParJour, 'clientsParJour', 'Le nombre de clients par jour');
  controlerPositif(h.ticketMoyenFcfa, 'ticketMoyenFcfa', 'Le ticket moyen');
  if (h.joursOuvertureParMois === null) {
    bloquante(
      'HYPOTHESE_MANQUANTE',
      'HYPOTHESES',
      "Le nombre de jours d'ouverture par mois est obligatoire.",
      'joursOuvertureParMois',
    );
  } else if (
    !Number.isInteger(h.joursOuvertureParMois) ||
    h.joursOuvertureParMois < 1 ||
    h.joursOuvertureParMois > config.limites.joursOuvertureMax
  ) {
    bloquante(
      'VALEUR_ABERRANTE',
      'HYPOTHESES',
      `Les jours d'ouverture doivent être un entier de 1 à ${config.limites.joursOuvertureMax}.`,
      'joursOuvertureParMois',
    );
  }
  if (
    h.partLoyerCible !== null &&
    (!estPositif(h.partLoyerCible) || h.partLoyerCible > config.loyer.partCibleMax)
  ) {
    bloquante(
      'VALEUR_ABERRANTE',
      'HYPOTHESES',
      `La part de loyer cible doit être comprise entre 0 et ${config.loyer.partCibleMax * 100} % du chiffre d'affaires.`,
      'partLoyerCible',
    );
  }
  if (h.loyerMensuelEnvisageFcfa != null && !estPositifOuNul(h.loyerMensuelEnvisageFcfa)) {
    bloquante(
      'VALEUR_ABERRANTE',
      'HYPOTHESES',
      'Le loyer envisagé doit être un montant positif ou nul.',
      'loyerMensuelEnvisageFcfa',
    );
  }
  if (
    projet.capaciteCouverts != null &&
    estPositif(projet.capaciteCouverts) &&
    h.clientsParJour !== null &&
    estPositif(h.clientsParJour) &&
    h.clientsParJour > projet.capaciteCouverts * config.limites.rotationsMaxParCouvert
  ) {
    avertissement(
      'FREQUENTATION_SUPERIEURE_A_CAPACITE',
      'HYPOTHESES',
      `${h.clientsParJour} clients par jour supposent plus de ${config.limites.rotationsMaxParCouvert} rotations par couvert pour ${projet.capaciteCouverts} couverts. Vérifier la fréquentation ou la capacité.`,
      'clientsParJour',
    );
  }

  /* Zones ------------------------------------------------------------------ */
  const zones = etude.zones;
  if (zones.length === 0) {
    bloquante('ZONES_ABSENTES', 'ZONES', 'Au moins une zone de chalandise est nécessaire.');
  }
  if (zones.length > config.limites.zonesMax) {
    bloquante(
      'ZONES_TROP_NOMBREUSES',
      'ZONES',
      `Au plus ${config.limites.zonesMax} zones peuvent être définies.`,
    );
  }
  for (const id of doublons(zones.map((z) => z.id))) {
    bloquante(
      'ZONE_DUPLIQUEE',
      'ZONES',
      `L'identifiant de zone ${id} est utilisé plusieurs fois.`,
      id,
    );
  }
  for (const zone of zones) {
    const nom = estVide(zone.libelle) ? zone.id : zone.libelle;
    if (zone.poids === null) {
      bloquante(
        'POIDS_ZONE_MANQUANT',
        'ZONES',
        `Le poids de la zone « ${nom} » est obligatoire.`,
        zone.id,
      );
    } else if (!estPositifOuNul(zone.poids) || zone.poids > 1) {
      bloquante(
        'POIDS_ZONE_HORS_PLAGE',
        'ZONES',
        `Le poids de la zone « ${nom} » doit être compris entre 0 et 100 %.`,
        zone.id,
      );
    }
    if (zone.rayonKm !== null && !estPositif(zone.rayonKm)) {
      bloquante(
        'VALEUR_ABERRANTE',
        'ZONES',
        `Le rayon de la zone « ${nom} » doit être strictement positif, en kilomètres.`,
        zone.id,
      );
    }
    if (zone.tempsAccesMin !== null && !estPositif(zone.tempsAccesMin)) {
      bloquante(
        'VALEUR_ABERRANTE',
        'ZONES',
        `Le temps d'accès de la zone « ${nom} » doit être strictement positif, en minutes.`,
        zone.id,
      );
    }
    if (zone.rayonKm === null || zone.tempsAccesMin === null || zone.mode === null) {
      avertissement(
        'ZONE_DESCRIPTION_INCOMPLETE',
        'ZONES',
        `La zone « ${nom} » n'est pas complètement décrite (rayon, temps d'accès, mode de déplacement).`,
        zone.id,
      );
    }
  }
  const poidsZones = zones.map((z) => z.poids);
  if (
    zones.length > 0 &&
    poidsZones.every((p): p is number => p !== null && estPositifOuNul(p) && p <= 1)
  ) {
    if (!sommeConforme(poidsZones, 1, config.tolerancePoids)) {
      const ecartPoints = ecartSomme(poidsZones, 1) * 100;
      const total = formaterDecimal((1 + ecartPoints / 100) * 100, 2);
      bloquante(
        'POIDS_ZONES_INVALIDE',
        'ZONES',
        `La somme des poids des zones fait ${total} % au lieu de 100 % (écart de ${formaterDecimal(ecartPoints, 2)} point).`,
      );
    }
  }

  /* Demande ---------------------------------------------------------------- */
  const zoneIds = new Set(zones.map((z) => z.id));
  const driversParCode = new Map(config.drivers.map((d) => [d.code, d]));
  const zonesNotees = new Set<string>();
  for (const evaluation of etude.demande) {
    const cible = `${evaluation.zoneId}:${evaluation.driverCode}`;
    if (!zoneIds.has(evaluation.zoneId)) {
      bloquante(
        'ZONE_INCONNUE',
        'DEMANDE',
        `L'évaluation de demande vise une zone inconnue (${evaluation.zoneId}).`,
        cible,
      );
      continue;
    }
    if (!driversParCode.has(evaluation.driverCode)) {
      bloquante(
        'DRIVER_INCONNU',
        'DEMANDE',
        `Générateur de demande inconnu : ${evaluation.driverCode}.`,
        cible,
      );
      continue;
    }
    if (noteInvalide(evaluation.notation)) {
      bloquante('NOTE_HORS_ECHELLE', 'DEMANDE', messageEchelle, cible);
      continue;
    }
    if (statutNotation(evaluation.notation) === 'RENSEIGNEE') zonesNotees.add(evaluation.zoneId);
  }
  for (const zone of zones) {
    const nom = estVide(zone.libelle) ? zone.id : zone.libelle;
    for (const driver of config.drivers) {
      const evaluation = etude.demande.find(
        (e) => e.zoneId === zone.id && e.driverCode === driver.code,
      );
      if (statutNotation(evaluation?.notation) === 'MANQUANTE') {
        avertissement(
          'DONNEE_MANQUANTE',
          'DEMANDE',
          `Générateur « ${driver.libelle} » non noté pour la zone « ${nom} ».`,
          `${zone.id}:${driver.code}`,
        );
      }
    }
    if (!zonesNotees.has(zone.id)) {
      bloquante(
        'ZONE_SANS_DEMANDE',
        'DEMANDE',
        `Aucun générateur de demande n'est noté pour la zone « ${nom} ».`,
        zone.id,
      );
    }
  }

  /* Concurrence ------------------------------------------------------------ */
  const concurrents = etude.concurrents;
  if (concurrents.length > config.limites.concurrentsMax) {
    bloquante(
      'CONCURRENTS_TROP_NOMBREUX',
      'CONCURRENCE',
      `Au plus ${config.limites.concurrentsMax} concurrents peuvent être recensés.`,
    );
  }
  if (concurrents.length === 0) {
    avertissement(
      'AUCUN_CONCURRENT',
      'CONCURRENCE',
      'Aucun concurrent recensé : la pression concurrentielle est considérée nulle. À vérifier sur le terrain.',
    );
  }
  for (const id of doublons(concurrents.map((c) => c.id))) {
    bloquante(
      'CONCURRENT_DUPLIQUE',
      'CONCURRENCE',
      `L'identifiant de concurrent ${id} est utilisé plusieurs fois.`,
      id,
    );
  }
  for (const concurrent of concurrents) {
    validerConcurrent(concurrent, config, bloquante, avertissement, noteInvalide, messageEchelle);
  }

  /* Vides commerciaux ------------------------------------------------------ */
  const besoinsParCode = new Map(config.besoins.map((b) => [b.code, b]));
  for (const code of doublons(etude.gaps.map((g) => g.besoinCode))) {
    bloquante('GAP_DUPLIQUE', 'GAPS', `Le besoin ${code} est qualifié plusieurs fois.`, code);
  }
  let besoinsQualifies = 0;
  for (const gap of etude.gaps) {
    if (!besoinsParCode.has(gap.besoinCode)) {
      bloquante(
        'BESOIN_INCONNU',
        'GAPS',
        `Besoin de marché inconnu : ${gap.besoinCode}.`,
        gap.besoinCode,
      );
      continue;
    }
    if (
      gap.importance !== null &&
      !(Number.isInteger(gap.importance) && gap.importance >= 1 && gap.importance <= 3)
    ) {
      bloquante(
        'IMPORTANCE_HORS_PLAGE',
        'GAPS',
        "L'importance d'un besoin doit être un entier de 1 à 3.",
        gap.besoinCode,
      );
    }
    if (!gap.nonApplicable && gap.statutMarche !== null) besoinsQualifies += 1;
  }
  for (const besoin of config.besoins) {
    const gap = etude.gaps.find((g) => g.besoinCode === besoin.code);
    if (!gap?.nonApplicable && (gap === undefined || gap.statutMarche === null)) {
      avertissement(
        'DONNEE_MANQUANTE',
        'GAPS',
        `Besoin « ${besoin.libelle} » non qualifié.`,
        besoin.code,
      );
    }
  }
  if (besoinsQualifies === 0) {
    bloquante(
      'GAPS_ABSENTS',
      'GAPS',
      "Aucun besoin de marché n'est qualifié : le score de gaps ne peut pas être calculé.",
    );
  }

  /* Risques ---------------------------------------------------------------- */
  const risquesParCode = new Map(config.risques.map((r) => [r.code, r]));
  for (const code of doublons(etude.risques.map((r) => r.risqueCode))) {
    bloquante('RISQUE_DUPLIQUE', 'RISQUES', `Le risque ${code} est noté plusieurs fois.`, code);
  }
  let risquesNotes = 0;
  for (const risque of etude.risques) {
    const categorie = risquesParCode.get(risque.risqueCode);
    if (!categorie) {
      bloquante(
        'RISQUE_INCONNU',
        'RISQUES',
        `Catégorie de risque inconnue : ${risque.risqueCode}.`,
        risque.risqueCode,
      );
      continue;
    }
    if (noteInvalide(risque.notation)) {
      bloquante('NOTE_HORS_ECHELLE', 'RISQUES', messageEchelle, risque.risqueCode);
      continue;
    }
    if (statutNotation(risque.notation) === 'RENSEIGNEE') {
      risquesNotes += 1;
      if (
        risque.notation.note !== null &&
        risque.notation.note >= config.redFlags.noteCritique &&
        estVide(risque.mesure)
      ) {
        avertissement(
          'RISQUE_CRITIQUE_SANS_MESURE',
          'RISQUES',
          `Le risque « ${categorie.libelle} » est noté ${risque.notation.note} sans mesure de traitement.`,
          risque.risqueCode,
        );
      }
    }
  }
  for (const categorie of config.risques) {
    const risque = etude.risques.find((r) => r.risqueCode === categorie.code);
    if (statutNotation(risque?.notation) === 'MANQUANTE') {
      avertissement(
        'DONNEE_MANQUANTE',
        'RISQUES',
        `Risque « ${categorie.libelle} » non évalué.`,
        categorie.code,
      );
    }
  }
  if (risquesNotes === 0) {
    bloquante(
      'RISQUES_ABSENTS',
      'RISQUES',
      "Aucun risque n'est évalué : le score de risque ne peut pas être calculé.",
    );
  }

  return alertes;
}

function validerConcurrent(
  concurrent: ConcurrentSaisi,
  config: ConfigurationMethodologie,
  bloquante: (code: string, rubrique: Rubrique, message: string, cible?: string) => void,
  avertissement: (code: string, rubrique: Rubrique, message: string, cible?: string) => void,
  noteInvalide: (notation: Notation | undefined) => boolean,
  messageEchelle: string,
): void {
  const nom = estVide(concurrent.nom) ? concurrent.id : concurrent.nom;
  if (estVide(concurrent.nom)) {
    bloquante(
      'CONCURRENT_INCOMPLET',
      'CONCURRENCE',
      `Le nom du concurrent ${concurrent.id} est obligatoire.`,
      `${concurrent.id}:nom`,
    );
  }
  if (concurrent.relation === null) {
    bloquante(
      'CONCURRENT_INCOMPLET',
      'CONCURRENCE',
      `La relation (directe ou indirecte) du concurrent « ${nom} » est obligatoire.`,
      `${concurrent.id}:relation`,
    );
  }
  if (concurrent.ticketMoyenFcfa != null && !estPositif(concurrent.ticketMoyenFcfa)) {
    bloquante(
      'VALEUR_ABERRANTE',
      'CONCURRENCE',
      `Le ticket moyen du concurrent « ${nom} » doit être strictement positif.`,
      `${concurrent.id}:ticketMoyenFcfa`,
    );
  }
  let composantesNotees = 0;
  for (const composante of COMPOSANTES_MENACE) {
    const notation = concurrent[composante];
    const cible = `${concurrent.id}:${composante}`;
    if (noteInvalide(notation)) {
      bloquante('NOTE_HORS_ECHELLE', 'CONCURRENCE', messageEchelle, cible);
      continue;
    }
    const statut = statutNotation(notation);
    if (statut === 'RENSEIGNEE') composantesNotees += 1;
    if (statut === 'MANQUANTE') {
      avertissement(
        'DONNEE_MANQUANTE',
        'CONCURRENCE',
        `${config.libelles.composantesMenace[composante]} non notée pour le concurrent « ${nom} ».`,
        cible,
      );
    }
  }
  if (composantesNotees === 0) {
    avertissement(
      'CONCURRENT_SANS_NOTE',
      'CONCURRENCE',
      `Le concurrent « ${nom} » n'a aucune note : il est exclu de la pression concurrentielle.`,
      concurrent.id,
    );
  }
}

/** Compte les données attendues par la méthode selon leur statut. */
export function calculerCompletude(
  etude: EtudeSaisie,
  config: ConfigurationMethodologie,
): Completude {
  const completude: Completude = { renseignees: 0, manquantes: 0, nonApplicables: 0 };
  const compter = (statut: StatutDonnee) => {
    if (statut === 'RENSEIGNEE') completude.renseignees += 1;
    else if (statut === 'NON_APPLICABLE') completude.nonApplicables += 1;
    else completude.manquantes += 1;
  };

  for (const zone of etude.zones) {
    for (const driver of config.drivers) {
      const evaluation = etude.demande.find(
        (e) => e.zoneId === zone.id && e.driverCode === driver.code,
      );
      compter(statutNotation(evaluation?.notation));
    }
  }
  for (const concurrent of etude.concurrents) {
    for (const composante of COMPOSANTES_MENACE) compter(statutNotation(concurrent[composante]));
  }
  for (const besoin of config.besoins) {
    const gap = etude.gaps.find((g) => g.besoinCode === besoin.code);
    if (gap?.nonApplicable) compter('NON_APPLICABLE');
    else compter(gap !== undefined && gap.statutMarche !== null ? 'RENSEIGNEE' : 'MANQUANTE');
  }
  for (const categorie of config.risques) {
    const risque = etude.risques.find((r) => r.risqueCode === categorie.code);
    compter(statutNotation(risque?.notation));
  }
  return completude;
}
