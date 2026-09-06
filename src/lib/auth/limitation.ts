/**
 * Limitation des tentatives de connexion, en mémoire du processus. Suffisant
 * pour un MVP à une instance ; à remplacer par un compteur partagé si
 * l'application est répliquée (consigné au registre des écarts).
 */

const TENTATIVES_MAX = 5;
const FENETRE_MS = 15 * 60 * 1000;
const BLOCAGE_MS = 15 * 60 * 1000;

interface Compteur {
  tentatives: number;
  premiereLe: number;
  bloqueJusqua: number | null;
}

const compteurs = new Map<string, Compteur>();

/** Vrai si la clé (e-mail et adresse) est bloquée à l'instant donné. */
export function estBloque(cle: string, maintenant: number = Date.now()): boolean {
  const compteur = compteurs.get(cle);
  if (!compteur?.bloqueJusqua) return false;
  if (compteur.bloqueJusqua <= maintenant) {
    compteurs.delete(cle);
    return false;
  }
  return true;
}

/** Enregistre un échec ; déclenche le blocage au-delà du maximum dans la fenêtre. */
export function enregistrerEchec(cle: string, maintenant: number = Date.now()): void {
  const compteur = compteurs.get(cle);
  if (!compteur || maintenant - compteur.premiereLe > FENETRE_MS) {
    compteurs.set(cle, { tentatives: 1, premiereLe: maintenant, bloqueJusqua: null });
    return;
  }
  compteur.tentatives += 1;
  if (compteur.tentatives >= TENTATIVES_MAX) {
    compteur.bloqueJusqua = maintenant + BLOCAGE_MS;
  }
}

/** Efface le compteur après une connexion réussie. */
export function reinitialiserTentatives(cle: string): void {
  compteurs.delete(cle);
}

/** Réservé aux tests. */
export function viderLimitation(): void {
  compteurs.clear();
}

export const PARAMETRES_LIMITATION = { TENTATIVES_MAX, FENETRE_MS, BLOCAGE_MS } as const;
