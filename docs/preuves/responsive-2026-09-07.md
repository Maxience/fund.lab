# Vérification responsive à 360 px (Q-01)

Exigence du brief : « conception responsive, utilisable au minimum sur un
écran mobile de 360 px de large et sur ordinateur ».

## Méthode

Les outils de capture habituels de ce poste (Edge en mode sans interface,
fenêtre native) imposent une largeur plancher de 492 px quelle que soit la
taille demandée : `window.innerWidth` vaut 492 même pour
`--window-size=360,900`, mesuré avec une page de contrôle dédiée. Une
capture à 360 px par ce biais donne une image tronquée à droite, qui aurait
pu passer pour un défaut de l'application alors qu'il s'agit d'une
limite de l'outil.

Contournement : le protocole DevTools (CDP) de Chromium expose
`Emulation.setDeviceMetricsOverride`, qui force la largeur de rendu
indépendamment de la fenêtre du système d'exploitation. Un petit script
Node pilote Edge en mode sans interface via ce protocole (port de
débogage local, `Page.navigate`, capture native après chargement), sans
dépendance ajoutée au projet. Vérifié une fois sur une page de contrôle :
`document.documentElement.clientWidth` renvoie bien 360 avec cette méthode.

## Pages vérifiées à 360 px de large, session Expert incluse

| Page                                                             | Constat                                                                                                                                                                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accueil                                                          | Titre, texte et bouton centrés, aucun débordement.                                                                                                                                                                  |
| Connexion                                                        | Formulaire et carte centrés, aucun débordement.                                                                                                                                                                     |
| Parcours PME, étape Projet                                       | Champs et libellés lisibles.                                                                                                                                                                                        |
| Parcours PME, étape Hypothèses                                   | Champs à unité (FCFA, %, jours) lisibles, projection en une colonne.                                                                                                                                                |
| Parcours PME, étape Zones                                        | Bandeau du total des poids et bouton d'ajout bien lisibles.                                                                                                                                                         |
| Parcours PME, étape Demande                                      | Grille de notation à quatre colonnes (0 à 3) sans tassement.                                                                                                                                                        |
| Parcours PME, étape Concurrence (fermée et un concurrent ouvert) | Formulaire complet, grille de notation à quatre colonnes lisible.                                                                                                                                                   |
| Parcours PME, étape Vides commerciaux                            | Grille de statut à trois colonnes (Absent, Mal servi, Correct) lisible.                                                                                                                                             |
| Parcours PME, étape Risques                                      | Sept catégories, grille à quatre colonnes lisible.                                                                                                                                                                  |
| Synthèse complète (cas de référence)                             | Jauge, quatre indicateurs, décomposition, forces, vigilances, actions : tout en une colonne, rien de coupé.                                                                                                         |
| Espace Expert, tableau de bord                                   | Barre latérale repliée en bandeau horizontal, filtres en une colonne. Le tableau des études, plus large que l'écran, défile horizontalement dans son propre cadre (comportement voulu, pas un débordement de page). |
| Espace Expert, dossier d'une étude                               | Actions, client, scénarios, synthèse, tout lisible en une colonne.                                                                                                                                                  |

Aucun débordement de page trouvé. Le seul défilement horizontal observé est
volontaire et contenu (le tableau du tableau de bord), conforme à la règle
de conception des tableaux larges.

## Ordinateur

Déjà vérifié à 1280 px lors des phases précédentes (captures de chaque
étape et de la synthèse). Aucune reprise nécessaire : aucun changement de
mise en page depuis n'affecte la largeur de bureau.

## Navigateurs

Vérifié sur Edge (Chromium). Chrome partage le même moteur de rendu
(Chromium) : aucun écart attendu. Non vérifié sur un Chrome distinct faute
d'accès à un second poste ; à confirmer lors de la recette si FUND.lab
dispose d'un poste Chrome.

## Conclusion

Q-01 satisfait pour toutes les pages testées, aux deux largeurs demandées
par le brief.
