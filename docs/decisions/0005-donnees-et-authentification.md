# 0005. Modèle de données relationnel, sessions opaques et scrypt

Date : 2026-09-06
Statut : acceptée

## Contexte

Le brief impose une base persistante pour les comptes Expert, les études,
les scénarios et les résultats, douze objets métier minimaux, des mots de
passe hachés, un contrôle d'accès côté serveur et des résultats rattachés à
une version du moteur et à leurs paramètres. Prisma 7 sort l'URL de
connexion du schéma et impose un adaptateur de driver.

## Décision

**Modèle de données.** Douze tables reprennent les objets du brief :
utilisateurs, sessions, clients, études, zones, évaluations de demande,
concurrents, gaps, risques, preuves, résultats. Le scénario n'est pas une
table à part : c'est une étude de type variante liée à sa référence (décision
0004, arbitrage H11). Les coefficients méthodologiques ne sont pas en base.

- Les enfants d'une étude (zones, évaluations, concurrents, gaps, risques)
  sont **remplacés en bloc** à chaque sauvegarde, dans une seule écriture
  imbriquée, donc atomique. Leur identifiant de saisie est conservé dans une
  colonne `cle`, ce qui rend l'aller-retour navigateur, base, navigateur
  exact (testé sans base par simulation des lignes).
- La table des **résultats** distingue le calcul courant, remplacé à chaque
  sauvegarde, du résultat **figé** à la finalisation, conservé avec la
  version du moteur, la version de la méthodologie, le détail complet et
  l'instantané des paramètres.
- Une étude du parcours PME est persistée sous un **jeton temporaire**
  (identifiant du navigateur), d'origine PME, sans client ni propriétaire ;
  un Expert peut la rattacher à un client, après quoi le navigateur
  d'origine ne la modifie plus.

**Authentification.** Mots de passe hachés avec **scrypt** (Node.js, sans
dépendance), paramètres portés par la chaîne stockée. Sessions **opaques** :
jeton aléatoire dans un cookie httpOnly, sameSite lax, secure en
production, dont seule l'empreinte SHA-256 est en base ; expiration à date
fixe (7 jours par défaut) ; suppression à la déconnexion. Le fichier
`proxy.ts` redirige les routes Expert sans cookie (contrôle optimiste) et
chaque page et chaque action serveur appelle `exigerExpert()` (contrôle
réel). Limitation des tentatives par adresse et e-mail, en mémoire du
processus. Un seul rôle, Expert ; les comptes sont créés par le seed ou par
script, sans interface d'inscription.

**Outillage.** La migration initiale est produite hors ligne par
`prisma migrate diff` et versionnée ; `prisma migrate deploy` l'applique. Le
marqueur `server-only` est remplacé par un module vide dans Vitest pour
tester la couche service.

## Conséquences

- Aucun secret ni mot de passe en clair dans le dépôt ni en base ; le seed
  lit l'identité initiale dans les variables d'environnement.
- Le rejeu d'un calcul ancien est possible à partir du résultat figé.
- La limitation des tentatives ne survit pas à un redémarrage et n'est pas
  partagée entre instances : consigné au registre des écarts.
- Toute évolution du schéma passe par une nouvelle migration versionnée,
  puis par la régénération du client et le redémarrage du serveur.
