# Audit de sécurité du 2026-09-07

Vérification manuelle des points Q-05 de la checklist de livraison, contre
les exigences du brief (Sécurité et qualité, p.8, et cas de recette R06/R07).

## Garde des routes Expert

- `src/proxy.ts` redirige toute requête sous `/expert/*` sans cookie de
  session vers la connexion (contrôle optimiste, avant même le rendu).
- `src/app/expert/layout.tsx` appelle `exigerExpert()` à chaque rendu :
  toute page Expert dépend de ce layout, donc aucune page ne peut y échapper
  (contrôle réel, décision 0005).
- Les 13 actions serveur de `src/app/expert/actions.ts` appellent chacune
  `exigerExpert()` en première ligne : vérifié fonction par fonction, aucune
  exception.
- Aucune route d'API (`route.ts`) dans le projet : toute la logique passe
  par des actions serveur ou la couche service, donc par les mêmes gardes.
- Conclusion : défense en profondeur conforme au cas R07, deux couches
  indépendantes (proxy et exigerExpert), la seconde faisant foi.

## Secrets

- Aucun fichier `.env` dans l'historique git (vérifié sur toutes les
  branches).
- Aucun motif de secret (URL de connexion avec mot de passe en dur, clé
  d'API, mot de passe) trouvé dans le code source ou les scripts.
- Les identifiants du compte Expert de démonstration viennent des variables
  d'environnement (`EXPERT_EMAIL_INITIAL`, `EXPERT_MOT_DE_PASSE_INITIAL`),
  jamais du code.

## En-têtes de sécurité

Absents avant cet audit. Ajoutés dans `next.config.ts`, appliqués à toutes
les routes :

- `X-Frame-Options: DENY` (protection contre le clickjacking).
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` : caméra, microphone et géolocalisation désactivés
  (non utilisés par l'application).
- `Strict-Transport-Security` (effective une fois servie en HTTPS ;
  ignorée par les navigateurs en HTTP local, donc sans effet en
  développement).

Pas de `Content-Security-Policy` stricte pour ce MVP : aucun script tiers ni
contenu externe embarqué, le risque principal est déjà couvert par les
en-têtes ci-dessus. À revoir si des scripts tiers sont ajoutés (registre des
écarts).

## Gestion des erreurs

- `src/lib/services/erreurs.ts` : erreurs métier typées
  (`ErreurValidation`, `ErreurAcces`, `ErreurIntrouvable`, `ErreurEtat`),
  chacune avec un message destiné à l'utilisateur.
- `messageUtilisateur()` retombe sur un message générique pour toute erreur
  non métier : aucune trace technique (stack, requête SQL, chemin de
  fichier) ne peut atteindre l'utilisateur.

## Authentification

- Mots de passe hachés avec scrypt (Node natif), jamais en clair.
- Sessions opaques : jeton aléatoire de 32 octets, seule l'empreinte
  SHA-256 est stockée en base, cookie httpOnly, sameSite lax, secure en
  production, expiration à date fixe.
- Limitation des tentatives de connexion en mémoire du processus (limite
  déjà consignée au registre des écarts à venir : ne survit pas à un
  redémarrage, non partagée entre instances si déploiement multi-instance).

## Constat global

Aucune faille bloquante trouvée. Un seul écart corrigé sur place (en-têtes
de sécurité absents). Le point de vigilance restant (limitation des
tentatives non persistée) est un choix assumé pour le MVP, à documenter au
registre des écarts (tâche L-04).
