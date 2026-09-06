# Plan d'implémentation ordonné

Outil d'étude de chalandise FUND.lab. Reprise de zéro sur la stack conservée :
Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, Vitest 5,
Prisma 7, PostgreSQL.

L'ordre suit deux contraintes : les dépendances techniques (configuration
avant moteur, moteur avant services, services avant interfaces) et les jalons
du brief (jour 2 moteur et squelette, jour 4 parcours PME, jour 6 parcours
Expert, jour 7 livraison). Chaque point est terminé quand son test ou sa
preuve existe et que typecheck, lint et tests passent.

Règle transversale : un point d'avancement écrit chaque soir (réalisé,
prochain objectif, blocage), un commit par point terminé, message en
français, aucun tiret cadratin ni demi-cadratin nulle part.

## Phase 0. Fondations du dépôt (jour 0)

1. Dépôt propre : nouvelle arborescence, premier commit « squelette »,
   .gitignore, .env.example avec placeholders, branche main et branches par
   phase. Historique lisible (livrable L3).
2. Outillage qualité dès le premier jour : scripts typecheck, lint, test,
   test:coverage, un script « verifier » qui enchaîne tout, un contrôle
   anti-tirets (échec si U+2014 ou U+2013 dans src, docs, prisma), formatage
   automatique.
3. Conventions écrites dans docs/conventions.md : français partout
   (fichiers, types, routes, base), arborescence cible, invariants du
   moteur, flux de travail, journal des décisions d'architecture dans
   docs/decisions.

## Phase 1. Cadrage (jour 1)

4. Note de cadrage L1 (2 à 4 pages) : reformulation du besoin, hypothèses,
   arbitrages sur chaque ambiguïté relevée, architecture, risques, backlog
   priorisé.
5. Message groupé de questions à FUND.lab, chaque question accompagnée de
   l'arbitrage proposé : jeux de recette, drivers et poids, catégories de
   risques et poids, besoins de la grille de gaps, pourcentage de loyer,
   dépôt et accès, jour 0, statut de « GO sous conditions critiques »,
   sens du mot « chatbot ».
6. Matrice de traçabilité : chaque exigence du brief (fonctions A à H,
   cas R01 à R12, livrables L1 à L10, motifs de non-recevabilité) reliée au
   module et au test qui la couvre. Tenue à jour jusqu'à la livraison.

## Phase 2. Configuration méthodologique et moteur (jour 2)

7. Contrat de configuration versionnée : drivers de demande et poids,
   catégories de risques et poids, besoins de marché et importance par
   défaut, poids des composantes de menace, facteurs de relation, poids
   d'attractivité et de score global, seuils, red flags, pourcentage de
   loyer par défaut, libellés. Fichier config/v1.ts, registre des versions,
   test qui valide la configuration elle-même (sommes de poids, bornes).
8. Types métier du moteur : entrée (étude saisie) et sortie (résultat), avec
   statut de donnée renseignée, manquante ou non applicable. Un null n'est
   jamais coercé en zéro.
9. Primitives mathématiques : somme pondérée avec renormalisation sur les
   composantes renseignées, arrondi documenté, contrôle de somme des poids à
   100 % avec tolérance de 0,01 point.
10. Formules une par une, chacune une fonction pure nommée comme dans le
    brief, avec test dédié : CA mensuel, loyer maximal, demande d'une zone,
    demande globale, menace d'un concurrent, pression concurrentielle,
    points de gap, score de gaps, score de risque, attractivité, score
    global.
11. Décision : seuils, orientation calculée, red flags (un risque à 3, trois
    risques à 2 ou 3), orientation finale, indicateur de conditions
    critiques, justification textuelle. Tests aux frontières (54,99, 55,
    69,99, 70) et pour chaque red flag.
12. Validation métier : notes hors de 0 à 3 refusées, poids de zones
    différents de 100 % bloquants, champs obligatoires, valeurs aberrantes
    (ticket négatif, jours au-delà de 31, rayon nul), alertes de
    complétude. Distinction entre bloquant et avertissement.
13. Point d'entrée unique evaluerEtude(saisie, config) : scores, décision,
    projection, alertes, version du moteur, version de la méthodologie,
    instantané des paramètres, horodatage. Rien d'autre n'est exporté vers
    les interfaces.
14. Cas de référence : cas nominal et cas à risques critiques calculés à la
    main, test de non-régression à 0,1 point. Emplacement prévu pour
    brancher les jeux officiels de FUND.lab sans modifier le code.
15. Recommandations déterministes : règles produisant trois forces, trois
    points de vigilance et des actions prioritaires à partir des composantes
    (zone faible, concurrent direct à forte affluence, risque à 3 sans
    mesure, loyer envisagé supérieur au loyer soutenable). Règles en
    configuration, testées.
16. Décomposition du score : contribution de chaque composante au score
    global, somme exacte, pour la traçabilité Expert.
17. Couverture du moteur d'au moins 90 %, rapport archivé comme preuve
    d'exécution (livrable L5).

## Phase 3. Données et couche serveur (jours 2 à 3)

18. Schéma Prisma : Utilisateur, Session, Client, Etude, Zone,
    EvaluationDemande, Concurrent, Gap, Risque, Preuve, Resultat, Scenario
    (lien référence et variante). Enums pour tous les états du brief.
    Contraintes d'unicité, cascades, index, archivage logique par date,
    version du moteur sur l'étude et le résultat, instantané JSON des
    paramètres.
19. Migrations initiales et seed de démonstration : un compte Expert dont le
    mot de passe vient d'une variable d'environnement, deux clients fictifs,
    les deux études de référence, un scénario. Aucune donnée réelle.
20. Schémas Zod partagés entre client et serveur, alignés sur les types du
    moteur, un par étape du parcours, messages d'erreur en français et
    actionnables.
21. Couche service marquée server-only : études, clients, scénarios,
    résultats. Chaque écriture enchaîne validation Zod, contrôle d'accès,
    transaction, calcul par evaluerEtude, persistance du résultat versionné.
    Aucune formule dans cette couche.
22. Gestion des erreurs : erreurs métier typées (validation, accès refusé,
    introuvable), traduction en messages utilisateur, journalisation
    serveur structurée sans donnée sensible.
23. Authentification Expert : hachage (scrypt natif de Node), sessions en
    base avec cookie httpOnly, secure et sameSite, expiration, rotation à la
    connexion, déconnexion. Fichier proxy.ts (convention Next 16) qui
    redirige les routes Expert non authentifiées, plus garde exigerExpert()
    dans chaque service. Défense en profondeur pour le cas R07.
24. Limitation des tentatives de connexion et messages neutres, sans révéler
    l'existence d'un compte.

## Phase 4. Parcours PME (jours 3 à 4)

25. Architecture du parcours : routes par étape, machine à huit étapes,
    progression visible, navigation précédente et suivante, verrou de
    finalisation tant qu'une erreur bloquante subsiste.
26. Persistance PME : identifiant temporaire créé au démarrage, étude en
    base au statut Brouillon, identifiant conservé dans le navigateur pour
    la reprise (cas R09). Sauvegarde à chaque étape validée, avertissement
    avant de quitter avec des modifications non enregistrées.
27. Composants de formulaire réutilisables : champ nombre avec unité
    affichée (FCFA, km, min, %, clients), champ note de 0 à 3 avec libellés,
    sélecteur de catégorie, tableau de pondérations avec total en direct et
    écart signalé, aide contextuelle, marquage obligatoire, facultatif ou
    non applicable, message d'erreur sous le champ.
28. Étape A projet et site. Étape B hypothèses commerciales avec affichage
    immédiat du CA mensuel et du loyer soutenable, calculés par le moteur,
    jamais réécrits dans l'interface.
29. Étape C zones : jusqu'à quatre, rayon, temps, mode, poids, contrôle de
    la somme à 100 % (cas R03).
30. Étape D demande : matrice drivers par zones, notes de 0 à 3, état
    « non renseigné » distinct de zéro (cas R02).
31. Étape E concurrence : ajout, modification, suppression (cas R04), type
    d'offre libre et relation directe ou indirecte, cinq sous-notes, ticket,
    observation, pression recalculée à chaque changement.
32. Étape F vides commerciaux : besoins avec statut absent, mal servi ou
    correct, et importance.
33. Étape G risques : catégories, note, mesure de traitement, responsable ou
    commentaire.
34. Étape H synthèse : scores avec valeurs numériques et explications
    courtes, orientation calculée et orientation finale affichées
    séparément, avertissement de prudence, trois forces, trois vigilances,
    actions prioritaires, hypothèses principales, données manquantes.
35. Page imprimable : feuille de style d'impression, navigation masquée,
    en-tête avec date et version du moteur (cas R11).
36. Finalisation : passage au statut Complète avec instantané des
    paramètres (cas R01 et R05).

## Phase 5. Parcours Expert (jours 5 à 6)

37. Connexion et déconnexion (cas R06), page accessible, sans fuite
    d'information.
38. Tableau de bord : études par client, statut et date de modification,
    filtres, tri, orientation et score visibles.
39. Clients : création, modification, notes internes.
40. Études : création avec les mêmes étapes que le parcours PME et une
    profondeur supplémentaire, consultation, modification, duplication,
    archivage logique et restauration.
41. Scénarios : variante liée à la référence, modification des hypothèses,
    comparaison côte à côte, étude source inchangée (cas R08).
42. Preuves et commentaires par rubrique (projet, hypothèses, zones,
    demande, concurrence, gaps, risques) : niveau de preuve à quatre états,
    source, date, auteur.
43. Contrôles de cohérence : page listant données manquantes, non
    applicables et alertes avant finalisation.
44. Restitution Expert : résumé et statut du dossier, hypothèses et lecture
    de sensibilité (variation du ticket et de la fréquentation), scores avec
    composantes et décomposition, orientation avec conditions et
    justification, recommandations structurées (positionnement, produit,
    prix, différenciation, risques), preuves par rubrique, version du moteur
    et instantané. Imprimable.
45. Rattachement d'une étude PME anonyme à un client par un Expert, pour
    la reprise et l'audit.

## Phase 6. Qualité transversale

46. Responsive vérifié à 360 px et sur ordinateur, Chrome et Edge.
47. Accessibilité : labels, navigation clavier, focus visible, contraste,
    couleur jamais seule (pastille, libellé et valeur).
48. Performance : rendu serveur, aucune bibliothèque de graphiques lourde,
    calcul sans attente perceptible.
49. Tests d'intégration des services sur base de test, tests des
    validations, un scénario automatisé par cas de recette R01 à R12.
    Preuves d'exécution archivées.
50. Audit de sécurité : aucune route Expert sans garde, scan des secrets,
    en-têtes de sécurité, validation serveur systématique, aucune trace
    technique exposée.
51. Inventaire des dépendances : licence, coût, niveau gratuit,
    réversibilité, pour chaque bibliothèque et service.

## Phase 7. Déploiement et livraison (jours 6 à 7)

52. Déploiement sur une URL stable de recette avec base PostgreSQL
    hébergée, variables d'environnement documentées, migrations appliquées
    au déploiement, seed de démonstration. Déclaration des services
    externes (niveau gratuit, limites, coûts, réversibilité).
53. Documentation technique L6 : installation, variables, architecture,
    moteur, déploiement, procédure d'initialisation. Testée par un
    lancement à froid sur un poste vierge (cas R12).
54. Documentation utilisateur L7 : parcours PME pas à pas, accès Expert,
    opérations principales, captures d'écran.
55. Registre des écarts L9 : bugs connus, limites, dette technique, risques,
    effort de finalisation.
56. Feuille de route L10 : priorités des 30 à 60 jours suivants.
57. Recette interne : dérouler R01 à R12 sur l'URL déployée, comparer aux
    jeux de référence officiels dès réception, corriger.
58. Répétition de la démonstration de 45 minutes dans l'ordre imposé,
    transfert des accès (dépôt, hébergeur, base) à FUND.lab.
