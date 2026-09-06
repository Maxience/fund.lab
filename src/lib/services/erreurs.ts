/**
 * Erreurs métier de la couche service. Les pages et actions les traduisent
 * en messages pour l'utilisateur ; aucune trace technique ne remonte.
 */

export class ErreurMetier extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ErreurMetier';
    this.code = code;
  }
}

export class ErreurIntrouvable extends ErreurMetier {
  constructor(objet: string) {
    super('INTROUVABLE', `${objet} introuvable.`);
    this.name = 'ErreurIntrouvable';
  }
}

export class ErreurAcces extends ErreurMetier {
  constructor(message = 'Accès refusé.') {
    super('ACCES_REFUSE', message);
    this.name = 'ErreurAcces';
  }
}

export class ErreurValidation extends ErreurMetier {
  readonly erreurs: Record<string, string>;
  readonly messages: string[];

  constructor(messages: string[], erreurs: Record<string, string> = {}) {
    super('VALIDATION', messages[0] ?? 'Données invalides.');
    this.name = 'ErreurValidation';
    this.messages = messages;
    this.erreurs = erreurs;
  }
}

export class ErreurEtat extends ErreurMetier {
  constructor(message: string) {
    super('ETAT_INVALIDE', message);
    this.name = 'ErreurEtat';
  }
}

/** Message affichable à l'utilisateur pour toute erreur, sans détail technique. */
export function messageUtilisateur(erreur: unknown): string {
  if (erreur instanceof ErreurMetier) return erreur.message;
  return "Une erreur est survenue. Réessayez ; si le problème persiste, prévenez l'équipe.";
}
