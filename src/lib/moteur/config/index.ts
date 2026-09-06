/**
 * Registre des configurations méthodologiques.
 *
 * Chaque résultat conserve la version qui l'a produit : un calcul ancien peut
 * être rejoué avec sa configuration d'origine.
 */

import type { ConfigurationMethodologie, InstantaneParametres } from './types';
import { CONFIG_V1 } from './v1';

export type { ConfigurationMethodologie, InstantaneParametres } from './types';
export type {
  BesoinMarche,
  CategorieRisque,
  DriverDemande,
  HypotheseAConfirmer,
  SeuilsRecommandations,
} from './types';
export { CONFIG_V1 } from './v1';

const CONFIGURATIONS: Readonly<Record<string, ConfigurationMethodologie>> = {
  [CONFIG_V1.version]: CONFIG_V1,
};

/** Configuration appliquée aux nouveaux calculs. */
export const CONFIG_COURANTE: ConfigurationMethodologie = CONFIG_V1;

export function listerVersionsMethodologie(): string[] {
  return Object.keys(CONFIGURATIONS);
}

export function obtenirConfiguration(version: string): ConfigurationMethodologie {
  const config = CONFIGURATIONS[version];
  if (!config) {
    throw new Error(`Version de méthodologie inconnue : ${version}`);
  }
  return config;
}

/** Extrait les paramètres numériques d'une configuration, pour l'instantané d'un résultat. */
export function extraireParametres(config: ConfigurationMethodologie): InstantaneParametres {
  return {
    versionMethodologie: config.version,
    drivers: config.drivers.map(({ code, poids }) => ({ code, poids })),
    risques: config.risques.map(({ code, poids }) => ({ code, poids })),
    besoins: config.besoins.map(({ code, importanceParDefaut }) => ({ code, importanceParDefaut })),
    menace: structuredClone(config.menace),
    gaps: { ...config.gaps },
    attractivite: { ...config.attractivite },
    scoreGlobal: { ...config.scoreGlobal },
    seuils: { ...config.seuils },
    redFlags: { ...config.redFlags },
    loyer: { ...config.loyer },
    tolerancePoids: config.tolerancePoids,
    arrondi: { ...config.arrondi },
  };
}

function sommeProcheDeUn(valeurs: number[], tolerance: number): boolean {
  const somme = valeurs.reduce((acc, v) => acc + v, 0);
  return Math.abs(somme - 1) <= tolerance;
}

function codesDupliques(codes: string[]): string[] {
  const vus = new Set<string>();
  const doublons = new Set<string>();
  for (const code of codes) {
    if (vus.has(code)) doublons.add(code);
    vus.add(code);
  }
  return [...doublons];
}

/**
 * Contrôle la cohérence interne d'une configuration. Retourne la liste des
 * problèmes ; vide si la configuration est valide. Exécuté par les tests et
 * utilisable au démarrage de l'application.
 */
export function validerConfiguration(config: ConfigurationMethodologie): string[] {
  const problemes: string[] = [];
  const t = config.tolerancePoids;

  if (config.drivers.length === 0) problemes.push('Aucun générateur de demande.');
  if (
    !sommeProcheDeUn(
      config.drivers.map((d) => d.poids),
      t,
    )
  ) {
    problemes.push('La somme des poids des générateurs de demande ne fait pas 1.');
  }
  if (config.risques.length === 0) problemes.push('Aucune catégorie de risque.');
  if (
    !sommeProcheDeUn(
      config.risques.map((r) => r.poids),
      t,
    )
  ) {
    problemes.push('La somme des poids des catégories de risques ne fait pas 1.');
  }
  if (config.besoins.length === 0) problemes.push('Aucun besoin de marché.');
  if (!sommeProcheDeUn(Object.values(config.menace.composantes), t)) {
    problemes.push('La somme des poids des composantes de menace ne fait pas 1.');
  }
  if (!sommeProcheDeUn(Object.values(config.attractivite), t)) {
    problemes.push("La somme des poids de l'attractivité ne fait pas 1.");
  }
  if (!sommeProcheDeUn(Object.values(config.scoreGlobal), t)) {
    problemes.push('La somme des poids du score global ne fait pas 1.');
  }

  for (const [liste, libelle] of [
    [config.drivers, 'générateurs de demande'],
    [config.risques, 'catégories de risques'],
    [config.besoins, 'besoins de marché'],
  ] as const) {
    const doublons = codesDupliques(liste.map((e) => e.code));
    if (doublons.length > 0) {
      problemes.push(`Codes dupliqués parmi les ${libelle} : ${doublons.join(', ')}.`);
    }
    for (const element of liste) {
      if ('poids' in element && (element.poids <= 0 || element.poids > 1)) {
        problemes.push(`Poids hors de ]0 ; 1] pour ${element.code}.`);
      }
    }
  }

  for (const [relation, facteur] of Object.entries(config.menace.facteurRelation)) {
    if (facteur <= 0 || facteur > 1) {
      problemes.push(`Facteur de relation hors de ]0 ; 1] pour ${relation}.`);
    }
  }

  if (config.echelleNote.min >= config.echelleNote.max) {
    problemes.push("L'échelle des notes est vide.");
  }
  if (config.seuils.noGoStrict >= config.seuils.goInclus) {
    problemes.push('Le seuil NO GO doit être strictement inférieur au seuil GO.');
  }
  if (config.seuils.noGoStrict < 0 || config.seuils.goInclus > 100) {
    problemes.push('Les seuils de décision doivent rester entre 0 et 100.');
  }
  if (
    config.redFlags.noteCritique > config.echelleNote.max ||
    config.redFlags.noteVigilance > config.redFlags.noteCritique
  ) {
    problemes.push("Les notes de red flag sont incohérentes avec l'échelle.");
  }
  if (config.redFlags.nombreRisquesVigilance < 1) {
    problemes.push('Le nombre de risques de vigilance doit être au moins 1.');
  }
  if (config.gaps.partMalServi < 0 || config.gaps.partMalServi > 1) {
    problemes.push('La part comptée pour un besoin mal servi doit rester entre 0 et 1.');
  }
  if (
    config.loyer.partCibleParDefaut <= 0 ||
    config.loyer.partCibleParDefaut > config.loyer.partCibleMax ||
    config.loyer.partCibleMax > 1
  ) {
    problemes.push('Les parts de loyer sont incohérentes.');
  }
  if (config.arrondi.decimalesAffichees > config.arrondi.decimalesConservees) {
    problemes.push("On ne peut pas afficher plus de décimales qu'on n'en conserve.");
  }
  const r = config.recommandations;
  if (
    r.demandeFaible >= r.demandeForte ||
    r.pressionFaible >= r.pressionForte ||
    r.gapsFaibles >= r.gapsEleves ||
    r.risqueFaible >= r.risqueEleve
  ) {
    problemes.push('Les seuils de recommandation sont mal ordonnés.');
  }

  return problemes;
}
