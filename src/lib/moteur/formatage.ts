/**
 * Formatage des nombres pour les textes produits par le moteur
 * (justifications, recommandations). Indépendant de la locale du système
 * pour rester déterministe dans les tests.
 */

/** Sépare les milliers par une espace : 7800000 devient « 7 800 000 ». */
export function formaterEntier(valeur: number): string {
  const entier = Math.round(Math.abs(valeur));
  const chiffres = String(entier).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return valeur < 0 ? `-${chiffres}` : chiffres;
}

/** Montant en francs CFA, sans décimale. */
export function formaterFcfa(valeur: number): string {
  return `${formaterEntier(valeur)} FCFA`;
}

/** Nombre décimal avec virgule française et un nombre fixe de décimales. */
export function formaterDecimal(valeur: number, decimales: number): string {
  return valeur.toFixed(decimales).replace('.', ',');
}

/** Pourcentage à partir d'une fraction : 0,1 devient « 10 % ». */
export function formaterPourcentage(fraction: number, decimales = 0): string {
  return `${formaterDecimal(fraction * 100, decimales)} %`;
}
