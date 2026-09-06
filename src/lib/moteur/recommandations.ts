/**
 * Recommandations déterministes : trois forces, trois points de vigilance
 * et des actions prioritaires, déduits des scores par des règles simples
 * dont les seuils vivent en configuration. Aucune génération par
 * intelligence artificielle.
 */

import type { ConfigurationMethodologie } from './config/types';
import { formaterDecimal, formaterFcfa } from './formatage';
import { moyenne } from './primitives';
import type {
  Alerte,
  ComposanteMenace,
  Decision,
  EtudeSaisie,
  Projection,
  Recommandation,
  Recommandations,
  Scores,
} from './types';
import { statutNotation } from './validation';

export interface ContexteRecommandation {
  etude: EtudeSaisie;
  scores: Scores;
  projection: Projection;
  decision: Decision;
  alertes: Alerte[];
}

interface Candidat extends Recommandation {
  priorite: number;
}

function retenir(candidats: Candidat[], nombre: number): Recommandation[] {
  return [...candidats]
    .sort((a, b) => b.priorite - a.priorite)
    .slice(0, nombre)
    .map(({ code, rubrique, texte }) => ({ code, rubrique, texte }));
}

export function recommander(
  contexte: ContexteRecommandation,
  config: ConfigurationMethodologie,
): Recommandations {
  const { etude, scores, projection, decision, alertes } = contexte;
  const s = config.recommandations;
  const decimales = config.arrondi.decimalesAffichees;
  const sur100 = (valeur: number) => `${formaterDecimal(valeur, decimales)} sur 100`;
  const forces: Candidat[] = [];
  const vigilances: Candidat[] = [];
  const actions: Candidat[] = [];

  /* Demande ---------------------------------------------------------------- */
  if (scores.demandeGlobale !== null) {
    if (scores.demandeGlobale >= s.demandeForte) {
      forces.push({
        code: 'DEMANDE_FORTE',
        rubrique: 'DEMANDE',
        texte: `Demande accessible élevée : ${sur100(scores.demandeGlobale)}.`,
        priorite: 100,
      });
    } else if (scores.demandeGlobale <= s.demandeFaible) {
      vigilances.push({
        code: 'DEMANDE_FAIBLE',
        rubrique: 'DEMANDE',
        texte: `Demande accessible faible : ${sur100(scores.demandeGlobale)}.`,
        priorite: 70,
      });
      actions.push({
        code: 'ACTION_DEMANDE',
        rubrique: 'DEMANDE',
        texte:
          'Vérifier sur le terrain les générateurs de flux aux heures de service, ou envisager un autre emplacement.',
        priorite: 70,
      });
    }
  }

  const zonesCalculees = etude.zones
    .map((z) => ({ zone: z, demande: scores.demandeParZone[z.id] ?? null }))
    .filter(
      (z): z is { zone: (typeof etude.zones)[number]; demande: number } => z.demande !== null,
    );
  if (zonesCalculees.length > 1) {
    const meilleure = zonesCalculees.reduce((m, z) => (z.demande > m.demande ? z : m));
    const faible = zonesCalculees.reduce((m, z) => (z.demande < m.demande ? z : m));
    if (meilleure.demande >= s.demandeForte) {
      forces.push({
        code: 'ZONE_PORTEUSE',
        rubrique: 'ZONES',
        texte: `La zone « ${meilleure.zone.libelle} » porte la demande : ${sur100(meilleure.demande)}.`,
        priorite: 90,
      });
    }
    if (faible.demande <= s.demandeFaible && (faible.zone.poids ?? 0) >= 0.25) {
      vigilances.push({
        code: 'ZONE_FAIBLE',
        rubrique: 'ZONES',
        texte: `La zone « ${faible.zone.libelle} » pèse ${formaterDecimal((faible.zone.poids ?? 0) * 100, 0)} % de la chalandise avec une demande faible : ${sur100(faible.demande)}.`,
        priorite: 65,
      });
      actions.push({
        code: 'ACTION_ZONE',
        rubrique: 'ZONES',
        texte: `Revoir le poids de la zone « ${faible.zone.libelle} » ou prévoir un canal dédié (livraison, communication) pour l'atteindre.`,
        priorite: 65,
      });
    }
  }

  /* Concurrence ------------------------------------------------------------ */
  if (scores.pressionConcurrentielle !== null) {
    if (scores.pressionConcurrentielle <= s.pressionFaible) {
      forces.push({
        code: 'CONCURRENCE_CONTENUE',
        rubrique: 'CONCURRENCE',
        texte: `Pression concurrentielle contenue : ${sur100(scores.pressionConcurrentielle)}.`,
        priorite: 85,
      });
    } else if (scores.pressionConcurrentielle >= s.pressionForte) {
      vigilances.push({
        code: 'CONCURRENCE_FORTE',
        rubrique: 'CONCURRENCE',
        texte: `Pression concurrentielle forte : ${sur100(scores.pressionConcurrentielle)}.`,
        priorite: 80,
      });
      actions.push({
        code: 'ACTION_DIFFERENCIATION',
        rubrique: 'CONCURRENCE',
        texte: "Différencier l'offre (produit, prix, horaires ou service) avant l'ouverture.",
        priorite: 80,
      });
    }
  }
  const concurrentsEvalues = etude.concurrents
    .map((c) => ({ concurrent: c, menace: scores.menaceParConcurrent[c.id] ?? null }))
    .filter(
      (c): c is { concurrent: (typeof etude.concurrents)[number]; menace: number } =>
        c.menace !== null,
    );
  if (concurrentsEvalues.length > 0) {
    const majeur = concurrentsEvalues.reduce((m, c) => (c.menace > m.menace ? c : m));
    if (majeur.menace >= s.menaceForte) {
      const relation = majeur.concurrent.relation
        ? config.libelles.relations[majeur.concurrent.relation].toLowerCase()
        : 'concurrent';
      vigilances.push({
        code: 'CONCURRENT_MAJEUR',
        rubrique: 'CONCURRENCE',
        texte: `Le ${relation} « ${majeur.concurrent.nom} » pèse fortement : menace de ${formaterDecimal(majeur.menace, decimales)} sur ${config.echelleNote.max}.`,
        priorite: 75,
      });
      const levier = levierDifferenciation(majeur.concurrent, config);
      actions.push({
        code: 'ACTION_CONCURRENT_MAJEUR',
        rubrique: 'CONCURRENCE',
        texte: `Se démarquer de « ${majeur.concurrent.nom} »${levier ? ` sur ${levier}` : ''}.`,
        priorite: 75,
      });
    }
  }

  /* Vides commerciaux ------------------------------------------------------ */
  if (scores.scoreGaps !== null) {
    const besoinsAbsents = etude.gaps
      .filter((g) => !g.nonApplicable && g.statutMarche === 'ABSENT')
      .flatMap((g) => {
        const besoin = config.besoins.find((b) => b.code === g.besoinCode);
        if (!besoin) return [];
        return [
          { libelle: besoin.libelle, importance: g.importance ?? besoin.importanceParDefaut },
        ];
      })
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 3)
      .map((g) => g.libelle.toLowerCase());
    if (scores.scoreGaps >= s.gapsEleves) {
      forces.push({
        code: 'BESOINS_NON_SERVIS',
        rubrique: 'GAPS',
        texte: `Des besoins restent à servir (score de gaps ${sur100(scores.scoreGaps)})${besoinsAbsents.length ? ` : ${besoinsAbsents.join(', ')}` : ''}.`,
        priorite: 80,
      });
    } else if (scores.scoreGaps <= s.gapsFaibles) {
      vigilances.push({
        code: 'MARCHE_SERVI',
        rubrique: 'GAPS',
        texte: `Marché déjà bien servi : score de gaps ${sur100(scores.scoreGaps)}.`,
        priorite: 50,
      });
    }
    if (besoinsAbsents.length > 0) {
      actions.push({
        code: 'ACTION_POSITIONNEMENT',
        rubrique: 'GAPS',
        texte: `Positionner l'offre sur les besoins absents : ${besoinsAbsents.join(', ')}.`,
        priorite: 60,
      });
    }
  }

  /* Risques ---------------------------------------------------------------- */
  const critiques = etude.risques.filter(
    (r) =>
      statutNotation(r.notation) === 'RENSEIGNEE' &&
      (r.notation.note ?? 0) >= config.redFlags.noteCritique,
  );
  for (const risque of critiques) {
    const libelle =
      config.risques.find((c) => c.code === risque.risqueCode)?.libelle ?? risque.risqueCode;
    const sansMesure = !risque.mesure || risque.mesure.trim().length === 0;
    vigilances.push({
      code: 'RISQUE_CRITIQUE',
      rubrique: 'RISQUES',
      texte: `Risque critique : ${libelle}${sansMesure ? ', sans mesure de traitement' : ''}.`,
      priorite: 100,
    });
    actions.push({
      code: 'ACTION_RISQUE_CRITIQUE',
      rubrique: 'RISQUES',
      texte: sansMesure
        ? `Définir et engager une mesure de traitement pour « ${libelle} » avant toute décision.`
        : `Mener à terme la mesure prévue pour « ${libelle} » avant l'ouverture.`,
      priorite: 100,
    });
  }
  if (decision.redFlags.some((f) => f.code === 'RISQUES_MULTIPLES')) {
    vigilances.push({
      code: 'RISQUES_MULTIPLES',
      rubrique: 'RISQUES',
      texte: `Plusieurs risques sérieux se cumulent (${decision.redFlags.find((f) => f.code === 'RISQUES_MULTIPLES')?.risques.length ?? 0} notés ${config.redFlags.noteVigilance} ou plus).`,
      priorite: 85,
    });
    actions.push({
      code: 'ACTION_PLAN_RISQUES',
      rubrique: 'RISQUES',
      texte: `Établir un plan de traitement, avec responsable et échéance, pour chaque risque noté ${config.redFlags.noteVigilance} ou plus.`,
      priorite: 85,
    });
  }
  if (scores.scoreRisque !== null) {
    const aucunSerieux = !etude.risques.some(
      (r) =>
        statutNotation(r.notation) === 'RENSEIGNEE' &&
        (r.notation.note ?? 0) >= config.redFlags.noteVigilance,
    );
    if (scores.scoreRisque <= s.risqueFaible && aucunSerieux) {
      forces.push({
        code: 'RISQUES_MAITRISES',
        rubrique: 'RISQUES',
        texte: `Risques d'exécution maîtrisés : score de risque ${sur100(scores.scoreRisque)}.`,
        priorite: 75,
      });
    } else if (scores.scoreRisque >= s.risqueEleve && critiques.length === 0) {
      vigilances.push({
        code: 'RISQUE_ELEVE',
        rubrique: 'RISQUES',
        texte: `Niveau de risque élevé : ${sur100(scores.scoreRisque)}.`,
        priorite: 78,
      });
    }
  }

  /* Loyer et hypothèses ---------------------------------------------------- */
  if (projection.ecartLoyerFcfa !== null && projection.loyerMaximalFcfa !== null) {
    if (projection.ecartLoyerFcfa > 0) {
      vigilances.push({
        code: 'LOYER_EXCESSIF',
        rubrique: 'HYPOTHESES',
        texte: `Le loyer envisagé (${formaterFcfa(projection.loyerMensuelEnvisageFcfa ?? 0)}) dépasse le loyer soutenable (${formaterFcfa(projection.loyerMaximalFcfa)}).`,
        priorite: 90,
      });
      actions.push({
        code: 'ACTION_LOYER',
        rubrique: 'HYPOTHESES',
        texte: `Négocier le loyer sous ${formaterFcfa(projection.loyerMaximalFcfa)} ou revoir les hypothèses de chiffre d'affaires.`,
        priorite: 90,
      });
    } else if (projection.ecartLoyerFcfa <= -0.2 * projection.loyerMaximalFcfa) {
      forces.push({
        code: 'LOYER_SOUTENABLE',
        rubrique: 'HYPOTHESES',
        texte: `Loyer envisagé nettement sous le loyer soutenable (${formaterFcfa(projection.loyerMaximalFcfa)}).`,
        priorite: 70,
      });
    }
  }

  const ticketsConcurrents = etude.concurrents
    .map((c) => c.ticketMoyenFcfa)
    .filter((t): t is number => typeof t === 'number' && t > 0);
  const ticketMoyenConcurrents = moyenne(ticketsConcurrents);
  const ticketProjet = etude.hypotheses.ticketMoyenFcfa;
  if (ticketMoyenConcurrents !== null && ticketProjet !== null && ticketProjet > 0) {
    const ecart = (ticketProjet - ticketMoyenConcurrents) / ticketMoyenConcurrents;
    if (Math.abs(ecart) > s.ecartTicketRelatif) {
      const sens = ecart > 0 ? 'supérieur' : 'inférieur';
      vigilances.push({
        code: 'TICKET_DECALE',
        rubrique: 'HYPOTHESES',
        texte: `Ticket moyen ${sens} de ${formaterDecimal(Math.abs(ecart) * 100, 0)} % à la moyenne des concurrents (${formaterFcfa(ticketMoyenConcurrents)}).`,
        priorite: 60,
      });
      actions.push({
        code: 'ACTION_TICKET',
        rubrique: 'HYPOTHESES',
        texte:
          ecart > 0
            ? "Justifier le positionnement prix par la qualité, le service ou l'expérience, et le tester avant l'ouverture."
            : "Vérifier que le ticket couvre les coûts, ou relever l'offre vers le niveau de prix du marché.",
        priorite: 60,
      });
    }
  }

  if (alertes.some((a) => a.code === 'FREQUENTATION_SUPERIEURE_A_CAPACITE')) {
    vigilances.push({
      code: 'CAPACITE_INSUFFISANTE',
      rubrique: 'HYPOTHESES',
      texte: 'La fréquentation supposée dépasse ce que la capacité du local permet de servir.',
      priorite: 55,
    });
    actions.push({
      code: 'ACTION_CAPACITE',
      rubrique: 'HYPOTHESES',
      texte:
        'Ajuster la fréquentation attendue à la capacité, ou prévoir la vente à emporter pour absorber le surplus.',
      priorite: 55,
    });
  }

  /* Données manquantes ----------------------------------------------------- */
  const manquantes = alertes.filter((a) => a.code === 'DONNEE_MANQUANTE').length;
  if (manquantes > 0) {
    vigilances.push({
      code: 'DONNEES_MANQUANTES',
      rubrique: 'SYNTHESE',
      texte: `${manquantes} donnée${manquantes > 1 ? 's' : ''} non renseignée${manquantes > 1 ? 's' : ''} fragilise${manquantes > 1 ? 'nt' : ''} le résultat.`,
      priorite: 40,
    });
    actions.push({
      code: 'ACTION_COMPLETER',
      rubrique: 'SYNTHESE',
      texte: 'Compléter les données manquantes pour consolider le résultat.',
      priorite: 45,
    });
  }

  /* Vigilances de fond : le résultat reste une indication ------------------ */
  if (
    scores.pressionConcurrentielle !== null &&
    scores.pressionConcurrentielle > s.pressionFaible &&
    scores.pressionConcurrentielle < s.pressionForte
  ) {
    const total = etude.concurrents.length;
    const directs = etude.concurrents.filter((c) => c.relation === 'DIRECTE').length;
    vigilances.push({
      code: 'CONCURRENCE_PRESENTE',
      rubrique: 'CONCURRENCE',
      texte: `Concurrence présente : pression de ${sur100(scores.pressionConcurrentielle)}, ${total} concurrent${total > 1 ? 's' : ''} dont ${directs} direct${directs > 1 ? 's' : ''}.`,
      priorite: 20,
    });
  }
  if (critiques.length === 0) {
    const aSuivre = etude.risques
      .filter(
        (r) =>
          statutNotation(r.notation) === 'RENSEIGNEE' &&
          (r.notation.note ?? 0) >= 1 &&
          (r.notation.note ?? 0) < config.redFlags.noteVigilance,
      )
      .map((r) => config.risques.find((c) => c.code === r.risqueCode)?.libelle ?? r.risqueCode);
    if (aSuivre.length > 0) {
      vigilances.push({
        code: 'RISQUES_A_SUIVRE',
        rubrique: 'RISQUES',
        texte: `Risques faibles à suivre : ${aSuivre.map((l) => l.toLowerCase()).join(', ')}.`,
        priorite: 15,
      });
    }
  }
  vigilances.push({
    code: 'HYPOTHESES_DECLARATIVES',
    rubrique: 'HYPOTHESES',
    texte:
      'Le résultat repose sur des hypothèses déclaratives de fréquentation et de ticket moyen, à vérifier sur le terrain.',
    priorite: 10,
  });

  actions.push({
    code: 'ACTION_HYPOTHESES',
    rubrique: 'HYPOTHESES',
    texte:
      "Vérifier sur le terrain la fréquentation et le ticket moyen, les deux hypothèses les plus sensibles du chiffre d'affaires.",
    priorite: 30,
  });

  return {
    forces: retenir(forces, s.nombreForces),
    vigilances: retenir(vigilances, s.nombreVigilances),
    actions: retenir(actions, s.nombreActions),
  };
}

/** Composante la moins bien notée d'un concurrent, sur laquelle se démarquer. */
function levierDifferenciation(
  concurrent: EtudeSaisie['concurrents'][number],
  config: ConfigurationMethodologie,
): string | null {
  const leviers: ComposanteMenace[] = ['qualite', 'vitesse', 'differenciation'];
  let meilleur: { composante: ComposanteMenace; note: number } | null = null;
  for (const composante of leviers) {
    const notation = concurrent[composante];
    if (statutNotation(notation) !== 'RENSEIGNEE' || notation.note === null) continue;
    if (meilleur === null || notation.note < meilleur.note) {
      meilleur = { composante, note: notation.note };
    }
  }
  if (meilleur === null || meilleur.note >= config.echelleNote.max) return null;
  const libelles: Record<ComposanteMenace, string> = {
    proximite: 'la proximité',
    affluence: "l'affluence",
    qualite: 'la qualité',
    vitesse: 'la vitesse de service',
    differenciation: 'la différenciation',
  };
  return libelles[meilleur.composante];
}
