/** Formats de date déterministes, sans dépendre de la locale du système. */

function deuxChiffres(valeur: number): string {
  return String(valeur).padStart(2, '0');
}

/** « 06/09/2026 » */
export function formaterDate(valeur: Date | string): string {
  const d = typeof valeur === 'string' ? new Date(valeur) : valeur;
  return `${deuxChiffres(d.getDate())}/${deuxChiffres(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** « 06/09/2026 à 19:13 » */
export function formaterDateHeure(valeur: Date | string): string {
  const d = typeof valeur === 'string' ? new Date(valeur) : valeur;
  return `${formaterDate(d)} à ${deuxChiffres(d.getHours())}:${deuxChiffres(d.getMinutes())}`;
}
