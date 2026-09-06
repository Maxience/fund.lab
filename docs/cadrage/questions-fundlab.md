# Questions groupées à FUND.lab

Le brief demande que les questions soient regroupées et accompagnées d'une
proposition d'arbitrage. Ce document contient le message prêt à envoyer,
puis le suivi des réponses. Chaque arbitrage proposé est déjà appliqué en
configuration versionnée, de sorte qu'aucune réponse ne bloque le
développement.

## Message à envoyer

Bonjour,

J'accuse réception du brief du challenge, lu en intégralité. Le cadrage est
clair et le développement a démarré : dépôt initialisé, outillage de
vérification en place, moteur de calcul en cours. Pour garantir des
résultats conformes à votre méthode, j'ai besoin de quelques précisions.
Pour chacune, j'indique ce que j'applique en attendant votre réponse, afin
de ne rien bloquer.

1. **Jeux de données de recette.** Le brief annonce un cas nominal et un cas
   à risques critiques avec leurs résultats attendus ; ils ne figurent pas
   dans le pack reçu. Pouvez-vous me les transmettre ? En attendant,
   j'utilise deux cas construits par mes soins, calculés à la main.

2. **Générateurs de demande.** La formule cite « poids du driver » sans
   donner la liste. J'applique sept générateurs : densité résidentielle
   20 %, bureaux et administrations 20 %, commerces et marchés 15 %, axes de
   passage et transports 15 %, enseignement 10 %, loisirs, santé et culte
   10 %, solvabilité de la zone 10 %. Avez-vous votre propre liste ?

3. **Catégories de risques.** Le brief en cite quatre (site, approvisionnement,
   ressources humaines, conformité) sans poids. J'applique sept catégories :
   site et local 20 %, approvisionnement 15 %, ressources humaines 15 %,
   conformité 15 %, financement et trésorerie 15 %, sécurité et
   environnement 10 %, dépendance à un facteur externe 10 %.

4. **Besoins de la grille de vides commerciaux.** J'applique dix besoins avec
   une importance par défaut de 1 à 3, modifiable par l'utilisateur. Votre
   grille existante a-t-elle une liste et des importances fixes ?

5. **Pourcentage cible de loyer.** Quelle valeur par défaut retenez-vous ?
   J'applique 10 % du chiffre d'affaires mensuel, modifiable dans le
   parcours.

6. **Décision « GO sous conditions critiques ».** La table des états compte
   trois décisions, mais les red flags et le cas R05 en nomment une
   quatrième. J'affiche « GO sous conditions critiques » comme variante de
   « GO sous conditions » avec un indicateur dédié. Souhaitez-vous plutôt
   une quatrième orientation à part entière ?

7. **Données partiellement renseignées.** J'applique une renormalisation sur
   les composantes renseignées (demande, menace, risque), comme le brief le
   fait pour la pression concurrentielle. Un indicateur sans aucune donnée
   bloque la finalisation. Cela correspond-il à votre pratique ?

8. **Arrondi.** Je calcule en précision complète, conserve deux décimales,
   applique les seuils à la valeur conservée et affiche une décimale.
   Avez-vous une règle d'arrondi expresse ?

9. **Dépôt et accès.** Le code doit être déposé dans un espace partagé avec
   FUND.lab. Où souhaitez-vous qu'il soit créé, et à quel compte donner
   l'accès administrateur ? Le dépôt est prêt en local.

10. **Jour 0.** Quelle date retenez-vous comme jour 0, pour caler le
    calendrier des sept jours ouvrés ?

11. **Hébergement de recette.** Je propose Vercel (application) et Neon
    (PostgreSQL), offres gratuites suffisantes pour la recette, avec
    réversibilité complète (Node standard, export `pg_dump`). Ces services
    vous conviennent-ils, ou avez-vous un hébergeur imposé ?

12. **Numérotation des livrables.** La liste passe de L7 à L9. Le livrable
    L8 est-il simplement absent, ou manque-t-il une exigence ?

Un dernier point, à part : vous avez mentionné un chatbot en m'envoyant le
document, mais je ne le retrouve nulle part dans le brief, qui précise
qu'aucune génération par intelligence artificielle n'est requise et classe
l'IA générative hors périmètre. Parliez-vous du parcours guidé question par
question, d'une évolution prévue après le MVP, ou d'un élément à intégrer
dès maintenant ? Je préfère clarifier avant d'avancer sur ce point.

Merci d'avance pour vos retours. Je poursuis en parallèle sur le moteur de
calcul et le modèle de données, qui n'en dépendent pas.

Cordialement,
Paul Maxime Dossou

## Suivi des réponses

| N°  | Sujet                        | Envoyée le | Réponse reçue | Décision retenue                      |
| --- | ---------------------------- | ---------- | ------------- | ------------------------------------- |
| 1   | Jeux de recette              |            |               | Cas internes en attendant             |
| 2   | Générateurs de demande       |            |               | Liste proposée (H2)                   |
| 3   | Catégories de risques        |            |               | Liste proposée (H3)                   |
| 4   | Besoins de la grille de gaps |            |               | Liste proposée (H4)                   |
| 5   | Pourcentage de loyer         |            |               | 10 % (H5)                             |
| 6   | GO sous conditions critiques |            |               | Variante avec indicateur (H1)         |
| 7   | Données partielles           |            |               | Renormalisation (H6)                  |
| 8   | Arrondi                      |            |               | Deux décimales (H7)                   |
| 9   | Dépôt et accès               |            |               | Dépôt local en attendant              |
| 10  | Jour 0                       |            |               | À confirmer                           |
| 11  | Hébergement                  |            |               | Vercel et Neon proposés               |
| 12  | Livrable L8                  |            |               | Erreur de numérotation supposée (H12) |
| 13  | Chatbot                      |            |               | Hors MVP (H10)                        |
