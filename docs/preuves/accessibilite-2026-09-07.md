# Revue d'accessibilité (Q-02)

Exigence du brief : « navigation clavier de base, labels de formulaire,
contraste lisible » (non fonctionnel NF-7), et « couleurs accessibles,
contraste suffisant et libellés associés aux contrôles de formulaire ».

Revue de code, faute d'outil d'audit automatisé (axe-core, Lighthouse)
installé dans ce projet ; aucune dépendance ajoutée pour cette seule tâche.
Les constats ci-dessous sont vérifiés en lisant chaque composant partagé,
pas par échantillonnage visuel.

## Labels de formulaire

Tout contrôle de saisie passe par un composant partagé qui impose un
libellé associé :

- `Champ` (texte, nombre, sélecteur) exige `id` et `libelle`, relie
  `<label htmlFor>` au contrôle, et ajoute `aria-describedby` vers l'aide et
  l'erreur quand elles existent (`attributsControle`).
- `SelecteurNote` (notes de 0 à 3) utilise `<fieldset>` et `<legend>`,
  pattern natif pour un groupe de contrôles apparentés.
- Les cases à cocher (modes de service, non applicable) sont wrappées dans
  leur propre `<label>` : libellé implicite, sans `id` à dupliquer.

Aucun contrôle de saisie trouvé sans libellé associé, y compris dans les
formulaires Expert (clients, preuves, rattachement, scénario).

## Navigation au clavier

- Tous les contrôles interactifs sont des éléments natifs : `<button>`,
  `<input>`, `<select>`, `<a>` (via `next/link`), `<details>/<summary>`
  (menu d'étapes mobile). Aucun widget reconstruit à la main (pas de
  faux bouton en `<div onClick>`).
- Les notations à choix multiples (`SelecteurNote`, statut des vides
  commerciaux) sont de vraies cases `<input type="radio">`, visuellement
  masquées (`sr-only`) mais présentes et focusables : navigables au clavier
  (Tab, flèches, Espace) comme n'importe quel groupe de radios.
- Confirmations destructrices (archiver un dossier, supprimer un
  concurrent, recommencer une étude) utilisent `window.confirm()`, une
  boîte native, entièrement accessible au clavier par construction.

## Focus visible

- Règle globale dans `globals.css` : `:focus-visible` reçoit un contour de
  2 px dans la couleur d'accent, sur tout le site.
- Point vérifié spécifiquement : les entrées `sr-only` (notations,
  statuts) n'auraient normalement aucun contour visible, puisque l'élément
  focusable est masqué. Les deux composants concernés
  (`selecteur-note.tsx`, l'étape `vides.tsx`) portent une règle
  `has-[:focus-visible]:outline` sur le libellé visuellement associé : le
  contour apparaît bien à l'écran quand l'utilisateur atteint ces choix au
  clavier.

## Couleur jamais seule

- `Pastille` (statuts, orientations) affiche toujours un libellé texte à
  côté du point de couleur.
- `Alerte` affiche toujours une étiquette textuelle du niveau (Bloquant,
  Attention, Information, Validé) en plus de la couleur du cadre.
- La jauge de score (`JaugeScore`) porte une description textuelle complète
  en `aria-label`, équivalente à ce que montrent les couleurs.

## Structure et langue

- `<html lang="fr">` posé une fois dans la mise en page racine.
- Un seul `<h1>` par page, `<h2>` pour les titres de carte : hiérarchie de
  titres cohérente, sans saut de niveau observé.

## Constats non bloquants, à traiter plus tard

- Pas de lien d'évitement (« aller au contenu ») avant la navigation :
  désagrément mineur pour un utilisateur clavier sur les pages à barre
  latérale (espace Expert). À ajouter si le temps le permet ; sans incidence
  sur les cas de recette.
- Les teintes de statut (bon, vigilance, critique) reposent sur des valeurs
  déjà pensées pour le contraste (texte foncé sur fond très clair), mais
  aucun outil de mesure automatique du ratio de contraste n'a été exécuté
  faute d'outillage installé : à vérifier avec un vérificateur de contraste
  si FUND.lab dispose d'une exigence WCAG formelle au-delà du MVP.

## Conclusion

Aucun défaut bloquant trouvé pour un MVP : labels, clavier, focus visible et
distinction sans la seule couleur sont couverts par construction dans les
composants partagés, donc appliqués uniformément à tout le parcours PME et
à l'espace Expert.
