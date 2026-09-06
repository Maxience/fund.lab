/**
 * Journalisation minimale des erreurs serveur, sans donnée sensible : ni
 * mot de passe, ni jeton, ni contenu d'étude. Chaque entrée porte un
 * contexte court et, pour une erreur, son nom et son message.
 */

export interface EntreeJournal {
  niveau: 'info' | 'avertissement' | 'erreur';
  contexte: string;
  message: string;
  horodatage: string;
  detail?: Record<string, string | number | boolean | null>;
}

function ecrire(entree: EntreeJournal): void {
  const ligne = JSON.stringify(entree);
  if (entree.niveau === 'erreur') console.error(ligne);
  else if (entree.niveau === 'avertissement') console.warn(ligne);
  else console.info(ligne);
}

export function journaliserInfo(
  contexte: string,
  message: string,
  detail?: EntreeJournal['detail'],
): void {
  ecrire({ niveau: 'info', contexte, message, horodatage: new Date().toISOString(), detail });
}

export function journaliserAvertissement(
  contexte: string,
  message: string,
  detail?: EntreeJournal['detail'],
): void {
  ecrire({
    niveau: 'avertissement',
    contexte,
    message,
    horodatage: new Date().toISOString(),
    detail,
  });
}

/** Journalise une erreur en ne conservant que son nom et son message. */
export function journaliserErreur(
  contexte: string,
  erreur: unknown,
  detail?: EntreeJournal['detail'],
): void {
  const nom = erreur instanceof Error ? erreur.name : 'Erreur';
  const message = erreur instanceof Error ? erreur.message : String(erreur);
  ecrire({
    niveau: 'erreur',
    contexte,
    message: `${nom} : ${message}`,
    horodatage: new Date().toISOString(),
    detail,
  });
}
