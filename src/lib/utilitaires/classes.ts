/** Concatène des classes CSS en ignorant les valeurs vides ou fausses. */
export function classes(...valeurs: (string | false | null | undefined)[]): string {
  return valeurs.filter(Boolean).join(' ');
}
