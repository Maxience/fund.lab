/**
 * Point d'entrée unique du moteur de calcul.
 *
 * Les parcours PME et Expert appellent `evaluerEtude` et rien d'autre. Le
 * résultat porte la version du moteur, la version de la méthodologie et
 * l'instantané des paramètres qui ont servi au calcul.
 */

import { CONFIG_COURANTE, extraireParametres } from './config';
import type { ConfigurationMethodologie } from './config/types';
import { evaluerDecision, type RisqueNote } from './decision';
import { decomposerScoreGlobal } from './decomposition';
import {
  calculerAttractivite,
  calculerCaMensuel,
  calculerDemandeGlobale,
  calculerDemandeZone,
  calculerLoyerMaximal,
  calculerMenaceConcurrent,
  calculerPressionConcurrentielle,
  calculerScoreGaps,
  calculerScoreGlobal,
  calculerScoreRisque,
  type NotesMenace,
} from './formules';
import { arrondir, estNoteValide } from './primitives';
import { recommander } from './recommandations';
import type {
  Alerte,
  ComposanteMenace,
  EtudeSaisie,
  Notation,
  Note,
  Projection,
  ResultatEtude,
  Scores,
} from './types';
import { calculerCompletude, COMPOSANTES_MENACE, validerEtude } from './validation';
import { VERSION_MOTEUR } from './version';

export * from './types';
export * from './config';
export * from './formules';
export * from './decision';
export * from './validation';
export * from './decomposition';
export * from './recommandations';
export * from './formatage';
export { arrondir } from './primitives';
export { VERSION_MOTEUR } from './version';

/** Note utilisable dans un calcul : null si absente, non applicable ou hors échelle. */
function noteExploitable(
  notation: Notation | undefined,
  config: ConfigurationMethodologie,
): Note | null {
  if (!notation || notation.nonApplicable || notation.note === null) return null;
  return estNoteValide(notation.note, config.echelleNote) ? notation.note : null;
}

function arrondirOuNull(valeur: number | null, decimales: number): number | null {
  return valeur === null ? null : arrondir(valeur, decimales);
}

/**
 * Évalue une étude complète. Ne lève jamais d'exception sur des données
 * incomplètes : les manques deviennent des alertes et des résultats null.
 */
export function evaluerEtude(
  etude: EtudeSaisie,
  config: ConfigurationMethodologie = CONFIG_COURANTE,
  horloge: () => Date = () => new Date(),
): ResultatEtude {
  const alertes: Alerte[] = validerEtude(etude, config);
  const noteMax = config.echelleNote.max;
  const decimales = config.arrondi.decimalesConservees;

  /* Projection commerciale ------------------------------------------------- */
  const { hypotheses } = etude;
  const partLoyerCible =
    hypotheses.partLoyerCible !== null &&
    hypotheses.partLoyerCible > 0 &&
    hypotheses.partLoyerCible <= config.loyer.partCibleMax
      ? hypotheses.partLoyerCible
      : config.loyer.partCibleParDefaut;
  const caMensuel = calculerCaMensuel(
    hypotheses.clientsParJour,
    hypotheses.ticketMoyenFcfa,
    hypotheses.joursOuvertureParMois,
  );
  const loyerMaximal = calculerLoyerMaximal(caMensuel, partLoyerCible);
  const loyerEnvisage = hypotheses.loyerMensuelEnvisageFcfa ?? null;
  const ecartLoyer =
    loyerMaximal !== null && loyerEnvisage !== null ? loyerEnvisage - loyerMaximal : null;
  if (ecartLoyer !== null && ecartLoyer > 0) {
    alertes.push({
      code: 'LOYER_SUPERIEUR_AU_SOUTENABLE',
      niveau: 'AVERTISSEMENT',
      rubrique: 'HYPOTHESES',
      message:
        "Le loyer envisagé dépasse le loyer maximal indicatif calculé à partir du chiffre d'affaires.",
      cible: 'loyerMensuelEnvisageFcfa',
    });
  }
  const projection: Projection = {
    caMensuelFcfa: arrondirOuNull(caMensuel, 0),
    partLoyerCible,
    loyerMaximalFcfa: arrondirOuNull(loyerMaximal, 0),
    loyerMensuelEnvisageFcfa: loyerEnvisage,
    ecartLoyerFcfa: arrondirOuNull(ecartLoyer, 0),
  };

  /* Demande ---------------------------------------------------------------- */
  const demandeParZone: Record<string, number | null> = {};
  for (const zone of etude.zones) {
    const notes = config.drivers.map((driver) => {
      const evaluation = etude.demande.find(
        (e) => e.zoneId === zone.id && e.driverCode === driver.code,
      );
      return { poids: driver.poids, note: noteExploitable(evaluation?.notation, config) };
    });
    demandeParZone[zone.id] = calculerDemandeZone(notes, noteMax);
  }
  const demandeGlobale = calculerDemandeGlobale(
    etude.zones.map((zone) => ({
      poids: zone.poids !== null && zone.poids >= 0 ? zone.poids : 0,
      demande: demandeParZone[zone.id],
    })),
  );

  /* Concurrence ------------------------------------------------------------ */
  const menaceParConcurrent: Record<string, number | null> = {};
  for (const concurrent of etude.concurrents) {
    if (concurrent.relation === null) {
      menaceParConcurrent[concurrent.id] = null;
      continue;
    }
    const notes = Object.fromEntries(
      COMPOSANTES_MENACE.map((c: ComposanteMenace) => [c, noteExploitable(concurrent[c], config)]),
    ) as NotesMenace;
    menaceParConcurrent[concurrent.id] = calculerMenaceConcurrent(
      notes,
      config.menace.composantes,
      config.menace.facteurRelation[concurrent.relation],
    );
  }
  // Arbitrage H6 : sans aucun concurrent recensé, la pression est nulle et
  // une alerte de vérification est émise par la validation.
  const pressionConcurrentielle =
    etude.concurrents.length === 0
      ? 0
      : calculerPressionConcurrentielle(Object.values(menaceParConcurrent), noteMax);

  /* Vides commerciaux ------------------------------------------------------ */
  const besoinsParCode = new Map(config.besoins.map((b) => [b.code, b]));
  const gapsEvalues = etude.gaps
    .filter((gap) => !gap.nonApplicable && besoinsParCode.has(gap.besoinCode))
    .map((gap) => {
      const besoin = besoinsParCode.get(gap.besoinCode)!;
      const importance =
        gap.importance !== null &&
        Number.isInteger(gap.importance) &&
        gap.importance >= 1 &&
        gap.importance <= 3
          ? gap.importance
          : besoin.importanceParDefaut;
      return { statut: gap.statutMarche, importance };
    });
  const scoreGaps = calculerScoreGaps(gapsEvalues, config.gaps.partMalServi);

  /* Risques ---------------------------------------------------------------- */
  const risquesNotes: (RisqueNote & { poids: number })[] = config.risques.map((categorie) => {
    const saisie = etude.risques.find((r) => r.risqueCode === categorie.code);
    return {
      code: categorie.code,
      libelle: categorie.libelle,
      poids: categorie.poids,
      note: noteExploitable(saisie?.notation, config),
    };
  });
  const scoreRisque = calculerScoreRisque(risquesNotes, noteMax);

  /* Agrégats --------------------------------------------------------------- */
  const attractivite = calculerAttractivite(
    demandeGlobale,
    scoreGaps,
    pressionConcurrentielle,
    config.attractivite,
  );
  const scoreGlobal = calculerScoreGlobal(attractivite, scoreRisque, config.scoreGlobal);

  const scoresBruts: Scores = {
    demandeParZone,
    demandeGlobale,
    menaceParConcurrent,
    pressionConcurrentielle,
    scoreGaps,
    scoreRisque,
    attractivite,
    scoreGlobal,
  };
  const decomposition = decomposerScoreGlobal(scoresBruts, config);

  const scores: Scores = {
    demandeParZone: Object.fromEntries(
      Object.entries(demandeParZone).map(([id, v]) => [id, arrondirOuNull(v, decimales)]),
    ),
    demandeGlobale: arrondirOuNull(demandeGlobale, decimales),
    menaceParConcurrent: Object.fromEntries(
      Object.entries(menaceParConcurrent).map(([id, v]) => [id, arrondirOuNull(v, decimales)]),
    ),
    pressionConcurrentielle: arrondirOuNull(pressionConcurrentielle, decimales),
    scoreGaps: arrondirOuNull(scoreGaps, decimales),
    scoreRisque: arrondirOuNull(scoreRisque, decimales),
    attractivite: arrondirOuNull(attractivite, decimales),
    scoreGlobal: arrondirOuNull(scoreGlobal, decimales),
  };

  /* Décision, recommandations, complétude --------------------------------- */
  const decision = evaluerDecision(scores.scoreGlobal, risquesNotes, config);
  const recommandations = recommander({ etude, scores, projection, decision, alertes }, config);
  const completude = calculerCompletude(etude, config);
  const finalisable = scores.scoreGlobal !== null && !alertes.some((a) => a.niveau === 'BLOQUANTE');

  return {
    versionMoteur: VERSION_MOTEUR,
    versionMethodologie: config.version,
    calculeLe: horloge().toISOString(),
    projection,
    scores,
    decision,
    alertes,
    recommandations,
    decomposition,
    completude,
    finalisable,
    parametres: extraireParametres(config),
  };
}
