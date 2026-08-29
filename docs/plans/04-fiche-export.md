# LOT 4 — Récapitulatif, fiche de personnage, impression & export

> Ce plan est subordonné à `docs/plans/00-arbitrage.md`. Version 2 : intègre
> §A1 (dictionnaire de créneaux), §A5 (aucune phrase française dans le domaine),
> §A7 et §A8 (frontière avec le lot 3), §A15 (expertise différée), §A16 (raisons
> structurées), §A18 (le produit s'appelle **Aventurine**), §B1, §B2, §B3.
> Les numéros de lots sont corrigés : **lot 1** domaine et données, **lot 2**
> assistant et état, **lot 3** interface et design, **lot 5** outillage.

## Objectif

Fermer le parcours : le joueur a fait ses choix, il doit **voir ce qu'il a créé**,
savoir **ce qui manque**, et **emporter sa fiche** — papier, PDF, fichier.

Trois surfaces, zéro nouvelle dépendance, aucun calcul de règle dans un composant.

Ce que je possède (§A8) : le récapitulatif, la fiche, l'impression, l'import/export.
Ce que je ne possède pas : `src/ui/` en général, les jetons, le cadre `AppShell`, les
écrans 0 à 9, le type `CharacterDraft`, le type `CharacterSheet`, les règles.

### Trois conséquences de l'arbitrage que j'acte sans réserve

1. **Je ne déclare plus `CharacterDraft`.** Il est défini par le lot 1 dans
   `src/domain/draft.ts`, avec un dictionnaire unique
   `choices: Readonly<Record<ChoiceSlotId, readonly string[]>>`. Mon fichier exporté
   le transporte **tel quel** : mon schéma s'en trouve plus court, pas plus long.
2. **Je ne déclare plus `CharacterSheet`.** Il est produit par
   `buildCharacter(draft, catalogue)` du lot 1 et servi par `useCharacterSheet()`.
   Comme j'en suis le seul consommateur, j'en **spécifie la forme** ci-dessous —
   même posture que le lot 2 vis-à-vis du brouillon.
3. **Le domaine ne rédige aucune phrase.** Mon `formatSheetAsText` et ma table
   « 1 compétence à choisir » descendent donc dans `ui/format/`. Ce sont des
   fonctions pures, testées par Vitest sans React : rien n'est perdu.

### Fichiers du lot

```
src/domain/completeness.ts            listMissingChoices — à ma charge (§ arbitrage)
src/domain/export/characterFile.ts    format, version, types de résultat
src/domain/export/toCharacterFile.ts  sérialisation
src/domain/export/parseCharacterFile.ts  validation défensive à l'entrée
src/domain/export/fileName.ts         « fiche-alric-guerrier.json »
src/ui/format/missing.ts              MissingChoice → phrase française
src/ui/format/breakdown.ts            ValueBreakdown → « 16 (cotte) + 2 (écu) »
src/ui/format/summaryText.ts          résumé en texte brut
src/ui/summary/SummaryScreen.tsx      récapitulatif
src/ui/summary/MissingChoiceList.tsx  ce qui manque, une ligne = un geste
src/ui/sheet/SheetScreen.tsx          la fiche, page unique
src/ui/sheet/SheetJumpMenu.tsx        accès rapide collant « Aller à… »
src/ui/sheet/SheetBlock.tsx           enveloppe : titre, ancre, crochet d'impression
src/ui/sheet/StatTile.tsx             étiquette + grand chiffre + détail
src/ui/sheet/DataRow.tsx              étiquette · valeur alignée
src/ui/sheet/CombatBlock.tsx AttacksBlock.tsx AbilitiesBlock.tsx
src/ui/sheet/SkillsBlock.tsx SpellcastingBlock.tsx FeaturesBlock.tsx
src/ui/sheet/SheetActions.tsx         imprimer · exporter · partager · modifier
src/ui/io/ImportButton.tsx downloadJson.ts printSheet.ts shareSummary.ts
src/ui/styles/print.css               feuille d'impression, unique et globale
```

`SheetBlock`, `StatTile`, `DataRow`, `SheetJumpMenu` sont **à moi** (§A7) : le lot 3
n'exporte pas de composants génériques tant qu'il n'y a pas trois usages, et il a
raison. Je réutilise son inventaire réel là où il existe : `AppShell` (cadre),
`ActionBar` (barre basse du récapitulatif), `Notice` (erreurs d'import), `Explainer`
(explication d'un terme de règle).

### Séquencement (tranches verticales, chacune verte)

1. `listMissingChoices` + tests, sur un catalogue miniature.
2. Fiche en lecture sur trois jeux d'essai (`alric-guerrier`, `lyra-magicienne`,
   `perso-incomplet`) — la tranche la plus risquée en premier, avant que
   `buildCharacter` ne soit livré.
3. Récapitulatif et retour vers l'écran manquant.
4. Export JSON et nom de fichier.
5. Import et validation défensive.
6. `print.css`.
7. Copie du résumé, puis partage.

---

## Récapitulatif avant validation

### Tranché : oui, on termine avec un personnage incomplet

La charte l'a déjà décidé (§4 : « on peut avancer avec des choix incomplets, l'écran
final récapitule ce qui manque »). Je l'applique jusqu'au bout :

- Le bouton principal **n'est jamais désactivé**. Un bouton grisé sans explication est
  le pire échec possible pour quelqu'un qui ne sait pas encore ce qu'est une compétence.
- Un personnage incomplet **produit une fiche, un export et une impression**. Les trous
  s'affichent en toutes lettres : `À choisir`.
- Rien n'est caché : le manque est en haut de l'écran, avant les choix déjà faits.
- **Le fichier exporté ne porte aucun indicateur de complétude** : ce serait une valeur
  dérivée stockée, interdite par le lot 2 comme par la charte. Elle se recalcule à
  l'import en une ligne.

Le récapitulatif n'est pas seulement terminal : `ProgressBanner` du lot 3 expose
`onOpenSummary` sur **tous** les écrans (« Ma fiche »). C'est mon écran qui s'ouvre.
Il sert donc deux usages avec un seul code : aperçu à tout moment, et bilan final.

### Retour à l'écran manquant « en un geste » — sans nouveau mécanisme

Ma version 1 demandait au lot 2 un drapeau `returnToSummary`. **Je retire cette
demande** : elle est inutile.

- **Aller** : la ligne entière de `MissingChoiceList` est un `<button>` de 56 px qui
  appelle `useWizard().goTo(issue.screenId)`. Un geste.
- **Revenir** : le bouton « Ma fiche » de `ProgressBanner` est présent sur l'écran
  d'arrivée. Un geste.

Zéro état ajouté, zéro action nouvelle, zéro ligne dans le reducer. C'est le meilleur
échange du lot.

### Maquette, 360 px

```
┌────────────────────────────────────────────┐
│ ‹ Retour      Étape 8 sur 8      Ma fiche  │  ProgressBanner (lot 3)
│ ████████████████████████████████████████░  │
├────────────────────────────────────────────┤
│ Presque prêt !                             │  h1 22 px serif
│                                            │
│ ┌────────────────────────────────────────┐ │
│ │ ALRIC                                  │ │
│ │ Nain des collines · Guerrier · Niv. 1  │ │
│ │ Soldat · Loyal bon                     │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ Il te reste 2 choix à faire                │  h2
│ ┌────────────────────────────────────────┐ │
│ │ Ce que tu sais faire               →   │ │  56 px, ligne entière tactile
│ │ Il te reste 1 compétence à choisir     │ │
│ ├────────────────────────────────────────┤ │
│ │ Ton identité                       →   │ │
│ │ Ton personnage n'a pas encore de nom   │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ Tes choix                                  │  h2
│ ┌────────────────────────────────────────┐ │
│ │ Race       Nain des collines  Modifier │ │
│ │ Classe     Guerrier           Modifier │ │
│ │ Caracs     16 14 15 8 12 10   Modifier │ │
│ │ Historique Soldat             Modifier │ │
│ │ Équipement Épée longue, écu…  Modifier │ │
│ └────────────────────────────────────────┘ │
│ ⌄                                          │
├────────────────────────────────────────────┤
│ [           Voir ma fiche           ]      │  ActionBar (lot 3)
└────────────────────────────────────────────┘
```

Le signalement ne passe **jamais** par la couleur seule : le mot « Il te reste… »
porte l'information, la couleur ne fait que la doubler.

### `listMissingChoices` — à ma charge, dans `domain/completeness.ts`

C'est une composition des primitives du lot 1, pas une règle : d'où sa place chez moi.

```ts
// src/domain/completeness.ts
import type { CharacterDraft, Catalogue, ChoiceKind, IssueTarget } from './…';

export type MissingKind = ChoiceKind | 'name' | 'abilities' | 'personality';

export interface MissingChoice {
  readonly kind: MissingKind;
  readonly remaining: number; // 1, 2… jamais 0
  readonly target: IssueTarget; // { kind:'slot', slotId } | { kind:'field', field }
}

export function listMissingChoices(
  draft: CharacterDraft,
  catalogue: Catalogue,
): readonly MissingChoice[];
```

Trois précisions :

1. **Aucun texte.** Conforme à §A16 : la phrase se compose dans `ui/format/missing.ts`.
2. **`target` plutôt que `slotId` nu.** Un manque peut viser un créneau _ou_ un champ
   du brouillon (le nom, la répartition). Réutiliser `IssueTarget` du lot 1 donne
   **une** forme au lieu de deux plus une exception — c'est l'argument même de §A16 —
   et rend `validateDraft` capable d'envelopper mon résultat sans le transformer.
3. **L'ordre est celui de `openChoices`**, donc l'ordre du parcours, donc l'expertise
   en dernier (§A15). Je ne trie pas, je ne regroupe pas : je conserve.

Un point que je signale plutôt que de le contourner : `validateDraft` du lot 1 rend
déjà des `Issue` de sévérité `incomplete`. **Deux fonctions ne doivent pas calculer la
même chose.** Contrat demandé : `validateDraft` construit sa branche `incomplete` en
enveloppant `listMissingChoices` (`severity: 'incomplete'`, même `target`), et n'écrit
elle-même que la branche `invalid`. Une source, deux vues.

### Mise en français, dans `ui/format/missing.ts`

| `kind`                        | 1                                          | N                    |
| ----------------------------- | ------------------------------------------ | -------------------- |
| `skill`                       | Il te reste 1 compétence à choisir         | …N compétences…      |
| `expertise`                   | Il te reste 1 compétence à doubler         | …N compétences…      |
| `language`                    | 1 langue à choisir                         | N langues            |
| `tool`                        | 1 outil à choisir                          | N outils             |
| `cantrip`                     | 1 tour de magie à choisir                  | N tours de magie     |
| `spell`                       | 1 sort à choisir                           | N sorts              |
| `equipment`                   | 1 choix d'équipement à faire               | N choix d'équipement |
| `fighting-style` / `ancestry` | 1 choix de classe à faire                  | —                    |
| `ability`                     | 1 bonus de caractéristique à placer        | N bonus              |
| `name`                        | Ton personnage n'a pas encore de nom       | —                    |
| `abilities`                   | Tes caractéristiques ne sont pas réparties | —                    |
| `personality`                 | Tes traits de personnalité sont vides      | —                    |

Titre du bloc : « Il te reste N choix à faire », N = nombre de lignes (plus lisible que
la somme des unités). En français, 0 et 1 prennent le singulier ; la fonction de
pluriel tient en trois lignes et n'est pas une couche d'internationalisation.

---

## Architecture de la fiche mobile

### Décision : page unique à défilement vertical, ordre dicté par l'usage, plus une barre collante « Aller à… »

Une colonne, tous les blocs présents dans le DOM en permanence, ancres natives
(`<a href="#competences">` + `scroll-margin-top`). Une barre collante de 48 px porte
le nom du personnage et un unique bouton `Aller à…` qui déplie un `<details>` listant
les blocs en lignes pleine largeur de 48 px.

### Contre les onglets

- **L'impression casse.** Une fiche imprimée montre tout ; il faudrait donc que tous
  les panneaux existent déjà et que le CSS d'impression les force à s'afficher. Les
  onglets ne sont alors qu'un masque : on paie `role="tablist"`, la gestion des
  flèches, l'état actif et le focus pour économiser un appui.
- **La recherche dans la page meurt.** « Rechercher dans la page » est un outil réel à
  table ; il ne trouve pas ce qui est en `display: none`.
- **Six onglets ne tiennent pas dans 360 px** sans défilement horizontal — interdit par
  la charte — ni sans passage à la ligne, qui coûte 96 px permanents.
- La position de lecture est perdue à chaque changement d'onglet.

### Contre l'accordéon comme architecture

- **Tout replié** : chaque consultation coûte un appui _et_ le repérage du bon
  en-tête. On échange une seconde de défilement contre une seconde de recherche plus
  un appui : mauvaise affaire.
- **Tout déplié** : c'est mon défilement long, avec des chevrons en plus et un risque
  de repli accidentel.
- L'accordéon reste **excellent pour du texte long**. Je le garde donc **à l'intérieur**
  des blocs Aptitudes et Sorts : chaque aptitude est un `<details>` natif, nom visible,
  description repliée. Même mécanisme que l'`Explainer` du lot 3, même argument (§B5).

### Pourquoi le défilement gagne

Le geste le moins cher sur téléphone est le défilement au pouce, pas l'appui précis.
C'est aussi la seule structure **native à l'impression** (l'ordre du document est
l'ordre du papier), à la recherche dans la page, au clavier et aux lecteurs d'écran,
pour zéro ligne de JavaScript hormis les 25 lignes du menu contrôlé (`<details>`
piloté par un état React, refermé au clic sur une ancre).

### Ce qu'on voit en ouvrant sa fiche à table

Budget vertical mesuré sur 360 × 640 (≈ 600 px utiles sous la barre système) :

| Élément                                               | Hauteur    |
| ----------------------------------------------------- | ---------- |
| Barre collante (nom + Aller à…)                       | 48 px      |
| Identité, 2 lignes                                    | 56 px      |
| Bloc **En combat**, 6 tuiles en 2 colonnes × 3 lignes | 232 px     |
| Titre **Attaques** + 2 cartes                         | 200 px     |
| **Total**                                             | **536 px** |

Le bonus d'attaque est visible **sans un seul appui**. C'est la réponse à l'usage réel.

```
┌────────────────────────────────────────────┐
│ ALRIC                    [ Aller à… ⌄ ]    │  collant, 48 px
├────────────────────────────────────────────┤
│ Nain des collines · Guerrier niveau 1      │
│ Soldat · Loyal bon                         │
│                                            │
│ EN COMBAT                                  │
│ ┌──────────────────┐┌────────────────────┐ │
│ │ Classe d'armure  ││ Initiative         │ │
│ │       18         ││       +2           │ │
│ │ 16 (cotte) +2 écu││                    │ │
│ └──────────────────┘└────────────────────┘ │
│ ┌──────────────────┐┌────────────────────┐ │
│ │ Points de vie    ││ Vitesse            │ │
│ │       12         ││     7,50 m         │ │
│ └──────────────────┘└────────────────────┘ │
│ ┌──────────────────┐┌────────────────────┐ │
│ │ Dés de vie       ││ Bonus de maîtrise  │ │
│ │      1 d10       ││       +2           │ │
│ └──────────────────┘└────────────────────┘ │
│                                            │
│ ATTAQUES                                   │
│ ┌────────────────────────────────────────┐ │
│ │ Épée longue            attaque   +5    │ │
│ │ dégâts 1d8+3 tranchant                 │ │
│ ├────────────────────────────────────────┤ │
│ │ Arbalète légère        attaque   +4    │ │
│ │ 1d8+2 perforant · portée 24/96 m       │ │
│ └────────────────────────────────────────┘ │
```

### Ordre des blocs, par fréquence d'usage à table

1 Identité — 2 **En combat** — 3 **Attaques** — 4 Caractéristiques et sauvegardes —
5 Compétences — 6 Magie _(si lanceur)_ — 7 Aptitudes — 8 Maîtrises et langues —
9 Équipement — 10 Personnalité — 11 Actions et attribution.

Les actions (Imprimer, Exporter, Partager, Modifier) sont **en fin de document**, pas
dans une barre collante : à table on lit, on n'imprime pas. Elles restent atteignables
en un appui par l'entrée « Actions » du menu. C'est une lecture assumée de la charte,
dont la règle « actions principales en bas » vise la navigation de l'assistant — et le
lot 3 rend déjà cette barre-là.

### Balisage

`<h1>` le nom, `<h2>` par bloc, `<section aria-labelledby>`. Aucune `<table>` :
`<dl>` pour les paires étiquette/valeur, `<ul>` pour les tuiles et les compétences.
Cela supprime par construction tout risque de défilement horizontal.

### Élargissement bureau

`@media (min-width: 720px)` : deux colonnes en grille, `--content-max` relevé, barre
collante remplacée par un sommaire latéral `position: sticky`. Aucune `max-width` en
media query, conformément à la charte.

---

## Blocs et provenance des données

Provenance : **J** choix du joueur (`draft`), **D** calcul du domaine
(`buildCharacter`), **C** contenu `data/` lu directement par `ui/` (autorisé §A6).

### 1. Identité

Nom (J, défaut « Personnage sans nom »), race et sous-race, classe, historique,
alignement (J, libellés C), niveau 1 (constante).

### 2. En combat

| Champ                                           | Provenance                                                    |
| ----------------------------------------------- | ------------------------------------------------------------- |
| Classe d'armure + détail                        | D — `ValueBreakdown`, meilleur candidat retenu avec sa source |
| Initiative                                      | D — modificateur de Dextérité                                 |
| Vitesse (+ note si réduite par l'armure lourde) | D + C — **en mètres**                                         |
| Points de vie max                               | D — max du dé de vie + mod. Con (+1 nain des collines)        |
| Dés de vie                                      | D + C — « 1 d10 »                                             |
| Bonus de maîtrise                               | D — +2                                                        |

### 3. Attaques

Une carte par arme possédée : nom (C), bonus d'attaque (D), dés et modificateur de
dégâts (D), type de dégâts, propriétés, portée (C). Aucune arme → « Aucune arme
équipée », phrase composée dans `ui/`.

### 4. Caractéristiques et jets de sauvegarde

Six tuiles : nom, score final (D = base J + bonus raciaux C + créneaux `ability`),
modificateur (D), sauvegarde (D), marqueur `●` maîtrisé / `○` non, avec `aria-label`.

### 5. Compétences

Les 18 compétences SRD, toujours toutes affichées, ordre alphabétique français.
Marqueur, nom (C), caractéristique liée, total signé (D). **Maîtrise double** de
l'expertise : marqueur `◉` et mention « maîtrise double » (§A15 ne change rien ici).

### 6. Magie — bloc rendu seulement si `sheet.spellcasting !== null`

Caractéristique d'incantation, DD de sauvegarde (D : `8 + BM + mod`), bonus d'attaque
de sort (D : `BM + mod`), emplacements de niveau 1 (D), tours de magie et sorts
(J parmi C), nombre préparable avec sa formule expliquée (D).
**§B2** : chaque sort affiche son `summary` (1 à 3 phrases, toujours présent) ; le
`<details>` « Texte complet » **n'est rendu que si `fullText !== null`**, donc jamais
en v1. Le composant gère le cas dès maintenant, sans champ mort ni `TODO`.

### 7. Aptitudes

Une entrée par aptitude, groupée par source (race, classe, historique), nom et
description (C), repliée en `<details>` au-delà de trois lignes.

### 8. Maîtrises et langues

Armures, armes, outils, langues : union race + classe + historique, créneaux compris (D).

### 9. Équipement

Objets issus des options de départ (J parmi C), paquetage d'historique (C), pièces d'or
(D). Liste en lecture seule.

### 10. Personnalité

Trait, idéal, lien, défaut : quatre chaînes du brouillon (J).
**§B3** : avec l'historique « Personnalisé », ce sont des textes saisis librement au
lieu d'être tirés d'une table — la fiche affiche exactement la même chose, aucun code
spécifique. Le bloc affiche en outre la mention prévue par la charte : l'historique
Personnalisé est un assemblage des règles génériques du SRD. Si `background.feature`
est absent, la ligne « Aptitude d'historique » n'est pas rendue.

### 11. Pied de fiche — écran et papier

« **Aventurine** — contenu dérivé du SRD 5.1 © Wizards of the Coast, licence CC BY 4.0.
Non affilié à Wizards of the Coast ni à D&D Beyond. » (charte §9, §A18).

---

## Impression

### Décision : `window.print()` + `@media print`, aucune dépendance (§B5)

- **`html2canvas` rastérise** : texte non sélectionnable, non cherchable, fichier lourd,
  et il capture la mise en page mobile telle qu'affichée — une fiche 360 px étirée sur
  A4. Objectivement pire que le résultat visé.
- **`jsPDF`** impose de placer chaque ligne à la main en points, d'embarquer une police
  pour les accents, et pèse plus de 200 Ko : on réécrirait un moteur de mise en page que
  le navigateur fournit gratuitement.
- « Imprimer → Enregistrer au format PDF » donne un PDF **vectoriel, sélectionnable,
  cherchable**, à coût nul.

### Mise en œuvre

- **Une feuille globale unique**, `src/ui/styles/print.css`, importée dans `App.tsx`,
  ciblant des attributs `data-print` stables — **jamais** des classes CSS Modules, dont
  les noms sont hachés au build.
- **Le piège n° 1 est le cadre du lot 3.** `AppShell` est une grille
  `height: 100dvh; overflow: hidden` : sans correction, l'impression est **coupée à la
  première page**. Première règle du fichier :
  `@media print { [data-print="frame"] { display:block; height:auto; overflow:visible; } }`
  Demande au lot 3 : `data-print="frame"` sur la racine d'`AppShell`,
  `data-print="hide"` sur `ProgressBanner` et `ActionBar` (demande déjà acceptée).
- `@page { size: A4 portrait; margin: 12mm; }`
- **Noir sur blanc** : `color:#000`, aucun fond, filets `0.4pt solid #000`.
- **Économie d'encre** : aucun aplat, aucune ombre, aucune image. Les marqueurs de
  maîtrise sont des **caractères** (`●` `○` `◉`), pas des pastilles colorées — le même
  choix sert l'accessibilité (jamais la couleur seule) et garantit un rendu correct
  même quand « Graphiques d'arrière-plan » est décoché, ce qui est le réglage par défaut.
- **Sauts maîtrisés** : `break-inside: avoid` (+ `page-break-inside` pour les moteurs
  anciens) sur chaque `SheetBlock` ; `orphans: 3; widows: 3` ; `break-before: page`
  avant le bloc Magie.
- **Deux colonnes au papier** : la fiche étant une liste linéaire, `@media print` la
  passe en grille `1fr 1fr`, gouttière 6 mm. Cible : une page sans magie, deux avec.
- **Nom du PDF** : le navigateur reprend `document.title`. `printSheet.ts` écrit
  « **Aventurine — Fiche d'Alric, guerrier niveau 1** » avant `window.print()` et
  restaure le titre sur l'évènement `afterprint`. Six lignes, gain réel.
- **Bloc papier exclusif** (`data-print="only"`) : `PV actuels ____ / 12`,
  `Inspiration ☐`, quelques lignes de notes. C'est la raison même pour laquelle on
  imprime une fiche ; le suivi reste sur le papier, jamais dans l'appli.
- **Contrainte lot 5** : aucune URL commençant par `/`. `print.css` n'appelle **aucun**
  actif — pas de `url(...)`, pas de police, pas d'image. Rien à corriger, mais la règle
  est rappelée en tête de fichier pour qu'on ne l'y introduise pas plus tard.

```
A4 portrait, marges 12 mm — page 1
┌──────────────────────────────────────────────┐
│ ALRIC — Nain des collines · Guerrier niv. 1  │
│ Soldat · Loyal bon            Maîtrise +2    │
├──────────────────────┬───────────────────────┤
│ CARACTÉRISTIQUES     │ EN COMBAT             │
│ FOR 16 (+3) sauv ●+5 │ CA 18   Initiative +2 │
│ DEX 14 (+2) sauv ○+2 │ PV 12   DV 1d10       │
│ …                    │ Vitesse 7,50 m        │
├──────────────────────┼───────────────────────┤
│ COMPÉTENCES          │ ATTAQUES              │
│ ● Athlétisme     +5  │ Épée longue  +5 1d8+3 │
│ ○ Acrobaties     +2  │ Arbalète lég. +4 1d8+2│
│ …                    ├───────────────────────┤
│                      │ APTITUDES             │
├──────────────────────┴───────────────────────┤
│ PV actuels ____/12   Inspiration ☐    Notes  │
│ Aventurine — SRD 5.1, CC BY 4.0 — non affilié│
└──────────────────────────────────────────────┘
```

### Depuis un téléphone

Chrome Android ouvre l'aperçu, « Enregistrer au format PDF » fonctionne. Safari iOS
prend en charge `window.print()` ; l'enregistrement en PDF passe par un écartement des
doigts sur l'aperçu, geste peu découvrable. Les navigateurs intégrés à certaines
applications peuvent ignorer l'appel. Repli : une ligne d'aide sous le bouton —
« Si rien ne se passe, utilise Partager ▸ Imprimer dans ton navigateur. »

### Limites, énoncées plutôt que tues

1. Les en-têtes et pieds de page du navigateur (URL, date) **ne sont pas supprimables**
   par le code : c'est une case à cocher côté utilisateur. On l'indique, rien de plus.
2. `@page { size }` est ignoré par Safari : le format vient de la boîte de dialogue.
3. Pas de « page 1 sur 2 » : les compteurs `@page` ne sont pas implémentés.
4. Le rendu diffère d'un navigateur à l'autre et **aucun test automatique ne couvre
   `@media print`** (jsdom ne rend pas le papier). D'où la liste de vérification manuelle.

---

## Export / import JSON

### Ce qu'on exporte : le brouillon, rien d'autre

Exporter la fiche calculée serait redondant, périssable et volumineux. On exporte les
choix ; le domaine recalcule. Le dictionnaire `choices` du lot 1 **raccourcit** mon
schéma : plus de champ par catégorie à sérialiser, à valider et à faire évoluer.

```ts
// src/domain/export/characterFile.ts
import type { CharacterDraft } from '../draft';

export const FILE_FORMAT = 'aventurine.personnage';
export const FILE_VERSION = 1;

export interface CharacterFile {
  readonly format: typeof FILE_FORMAT;
  readonly version: number; // entier, incrémenté à toute rupture
  readonly exportedAt: string; // ISO 8601, information, jamais relue
  readonly character: CharacterDraft;
}

export type ImportError =
  | { readonly kind: 'file-too-large' }
  | { readonly kind: 'invalid-json' }
  | { readonly kind: 'not-our-format' }
  | { readonly kind: 'version-too-recent'; readonly found: number }
  | { readonly kind: 'invalid-structure'; readonly field: string };

export type ImportWarning =
  | { readonly kind: 'unknown-id'; readonly field: string; readonly value: string }
  | { readonly kind: 'unknown-slot'; readonly slotId: string }
  | { readonly kind: 'value-truncated'; readonly field: string };

export type ImportResult =
  | {
      readonly ok: true;
      readonly draft: CharacterDraft;
      readonly warnings: readonly ImportWarning[];
    }
  | { readonly ok: false; readonly error: ImportError };
```

Rappel de doctrine : `ImportError` et `ImportWarning` ne portent **aucune phrase**
(§A5, charte §6). `ui/format/importMessage.ts` les met en français.
Clés en anglais (c'est du code sérialisé), valeurs d'identifiants en français
(`'nain-des-collines'`, `'class:roublard:skills'`), comme le veut la charte §6.

Exemple de fichier réel, tel qu'un humain le lit :

```json
{
  "format": "aventurine.personnage",
  "version": 1,
  "exportedAt": "2026-08-29T14:03:00.000Z",
  "character": {
    "name": "Alric",
    "raceId": "nain",
    "subraceId": "nain-des-collines",
    "classId": "guerrier",
    "backgroundId": "soldat-personnalise",
    "alignmentId": "loyal-bon",
    "abilities": {
      "method": "point-buy",
      "base": {
        "force": 15,
        "dexterite": 13,
        "constitution": 14,
        "intelligence": 8,
        "sagesse": 12,
        "charisme": 10
      }
    },
    "choices": {
      "class:guerrier:skills": ["athletisme", "perception"],
      "class:guerrier:fighting-style": ["defense"],
      "background:personnalise:tools": ["outils-de-forgeron"]
    },
    "personality": { "trait": "…", "ideal": "…", "bond": "…", "flaw": "…" }
  }
}
```

### Téléchargement

`ui/io/downloadJson.ts`, une quinzaine de lignes : `JSON.stringify(file, null, 2)` →
`new Blob([json], { type: 'application/json' })` → `URL.createObjectURL` → `<a download>`
créé, cliqué, retiré → `URL.revokeObjectURL` au tick suivant. Indentation à 2 espaces :
lisible et comparable pour 300 octets. Sur iOS le fichier arrive dans
Fichiers ▸ Téléchargements ; un texte d'aide le dit.

**Nom du fichier**, `domain/export/fileName.ts` : `fiche-alric-guerrier.json`.
Il ne compose aucune phrase — il assemble le nom saisi et l'identifiant de classe,
donc il reste légitimement dans le domaine. Règle : minuscules, accents retirés par
`normalize('NFD')`, tout caractère non alphanumérique en tiret, tirets compressés,
40 caractères maximum. Sans nom : `fiche-personnage.json`.

### Import — validation défensive, neuf étapes

1. **Taille** : `file.size > 1_000_000` → `file-too-large`. On ne lit pas 300 Mo pour
   découvrir que le fichier est mauvais.
2. **Lecture** : `await file.text()`.
3. **`JSON.parse` sous `try/catch`** → `invalid-json`. Aucune exception ne remonte
   jusqu'à React.
4. **Signature** : `format !== 'aventurine.personnage'` → `not-our-format`. C'est le
   filet pour « un fichier qui n'est pas de nous », avec un message qui ne culpabilise
   pas.
5. **Version** : `> FILE_VERSION` → `version-too-recent` (message dédié) ; non entier ou
   `< 1` → `not-our-format`. Aucune fonction de migration aujourd'hui : il n'existe
   qu'une version, et rien n'a jamais été publié (§A18) — la politique est écrite ici
   pour le jour où il y en aura deux, le code viendra ce jour-là.
6. **Structure, champ par champ** : environ 80 lignes de gardes manuelles
   (`isString`, `isIntBetween`, `asStringArray`). Refus argumenté de zod/valibot : un
   seul schéma, un seul point d'entrée, 80 lignes testées contre 12 Ko de dépendance.
7. **Reconstruction explicite** : l'objet est rebâti champ par champ, jamais par
   `spread` ni `Object.assign`. Conséquences directes : les champs inconnus sont
   **ignorés silencieusement**, et une clé `__proto__` n'atteint jamais l'état.
8. **Bornes** — ce que le dictionnaire de créneaux coûte réellement à l'entrée. Un
   `Record<string, string[]>` a des **clés non bornées**, là où des tableaux par
   catégorie l'étaient par construction. On borne donc explicitement :
   au plus 64 clés ; clé de 64 caractères au plus, conforme à
   `^(race|class|background):[a-z0-9-]+:[a-z-]+$` (sinon `unknown-slot`, ignorée) ;
   au plus 12 valeurs par créneau ; nom tronqué à 60 caractères ; textes de
   personnalité à 300 ; scores contraints à 1–20. Coût réel : environ dix lignes.
9. **Identifiants inconnus** : une race, une classe, un sort ou un créneau absent du
   catalogue **n'invalide pas le fichier**. La valeur est mise à `null` ou retirée, un
   `ImportWarning` remonte, et l'assistant rouvre à l'écran concerné — le manque
   apparaît dans `listMissingChoices` sans une ligne de code supplémentaire. C'est
   cohérent avec « on avance avec des choix incomplets ».

Le résultat part dans une action du lot 2 (`REPLACE_DRAFT`), seule autorisée à écrire
le brouillon. `ui/io/` ne touche jamais `localStorage`.

### Écrasement du personnage en cours

Une seule sauvegarde locale (`aventurine:draft:v1`). Si un brouillon non vide existe,
l'import demande confirmation en nommant le contenu du fichier : « Ce fichier contient
Alric, nain des collines, guerrier. Il remplacera ton personnage en cours. »
Ce n'est pas contradictoire avec §B4, qui écarte la confirmation pour un geste
**annulable dans le parcours** : ici la donnée écrasée n'est récupérable par aucun
retour arrière, et il n'y a pas d'historique. La confirmation est rendue **en place**
avec deux boutons de 44 px, pas en modal : le lot 3 n'a pas de composant de dialogue et
n'en aura pas.

Points d'entrée : le bloc Actions de la fiche, et l'écran d'accueil du lot 3
(« J'ai déjà un fichier »), qui rend mon `ImportButton`.

---

## Partage

### Tranché : le texte entre, le fichier reste dehors

La charte ne liste pas « partage » dans le périmètre. J'applique le rasoir, avec une
exception argumentée :

- **« Copier le résumé » : dans le périmètre.** C'est la sortie de secours
  universelle (messagerie, notes) et son moteur est une fonction pure d'une quarantaine
  de lignes, testable, dans `ui/format/summaryText.ts` — pas dans le domaine, puisqu'elle
  rédige du français. `navigator.clipboard.writeText`, avec repli sur un `<textarea>`
  présélectionné affiché sur place si l'API est absente ou refusée (contexte non
  sécurisé). Elle coûte moins qu'une capture d'écran ratée.
- **`navigator.share({ title, text })` : amélioration progressive.** Dix lignes ; le
  bouton « Partager » **n'est rendu que si** `navigator.share` existe. Pas de repli
  bancal : quand l'API manque, le bouton n'existe pas et « Copier le résumé » reste.
- **Partage du fichier JSON (`canShare({ files })`) : hors périmètre.** Support inégal,
  et sans intérêt : le destinataire n'a pas l'application. Le JSON sert à soi-même, le
  texte sert aux autres.

```
ALRIC — Nain des collines, guerrier niveau 1
Historique : Soldat · Loyal bon

CA 18 · Initiative +2 · PV 12 · Vitesse 7,50 m
Dés de vie 1d10 · Bonus de maîtrise +2

FOR 16 (+3)*  DEX 14 (+2)   CON 15 (+2)*
INT 8 (-1)    SAG 12 (+1)   CHA 10 (+0)
* jet de sauvegarde maîtrisé

Attaques : Épée longue +5 (1d8+3) · Arbalète légère +4 (1d8+2)
Compétences maîtrisées : Athlétisme +5, Intimidation +2,
  Perception +3, Survie +3
Aptitudes : Second souffle, Style de combat (Défense),
  Résistance naine, Attitude militaire

Créé avec Aventurine — SRD 5.1, CC BY 4.0
```

---

## Contrats attendus des autres lots

### Lot 1 — domaine et données

**Ce que je consomme sans le déclarer :** `CharacterDraft`, `Catalogue`, `ChoiceSlot`,
`ChoiceSlotId`, `ChoiceKind`, `IssueTarget`, `openChoices`, `buildCharacter`.

**Ce que je spécifie** (déclaré par le lot 1, je suis son seul consommateur) :

```ts
// src/domain/sheet.ts — forme demandée par le lot 4
export interface BreakdownPart {
  readonly source: 'base' | 'ability' | 'armor' | 'shield' | 'feature';
  readonly id: string | null; // identifiant de contenu, résolu par ui/ dans data/
  readonly value: number;
}
export interface ValueBreakdown {
  readonly total: number;
  readonly parts: readonly BreakdownPart[];
}

export interface SkillLine {
  readonly skillId: string;
  readonly abilityId: AbilityId;
  readonly bonus: number;
  readonly proficiency: 'none' | 'simple' | 'double';
}
export interface Attack {
  readonly weaponId: string;
  readonly attackBonus: number;
  readonly damageDice: string;
  readonly damageBonus: number;
  readonly damageTypeId: string;
  readonly rangeMeters: readonly [number, number] | null;
}
export interface Spellcasting {
  readonly abilityId: AbilityId;
  readonly saveDc: number;
  readonly attackBonus: number;
  readonly level1Slots: number;
  readonly preparedCount: number | null;
  readonly cantripIds: readonly string[];
  readonly spellIds: readonly string[];
}
export interface CharacterSheet {
  readonly abilities: Readonly<Record<AbilityId, { score: number; modifier: number }>>;
  readonly saves: readonly { abilityId: AbilityId; bonus: number; proficient: boolean }[];
  readonly skills: readonly SkillLine[];
  readonly proficiencyBonus: number;
  readonly armorClass: ValueBreakdown | null;
  readonly initiative: number;
  readonly speedMeters: number | null;
  readonly hitPoints: ValueBreakdown | null;
  readonly hitDice: { count: number; die: number } | null;
  readonly attacks: readonly Attack[];
  readonly spellcasting: Spellcasting | null;
  readonly featureIds: readonly { source: ChoiceSource; id: string }[];
  readonly proficiencies: {
    armors: readonly string[];
    weapons: readonly string[];
    tools: readonly string[];
    languages: readonly string[];
  };
  readonly equipment: { itemIds: readonly string[]; gold: number };
}
```

Quatre exigences :

1. **Aucun libellé français.** Les `BreakdownPart` portent un identifiant ; `ui/` va
   chercher le nom dans `data/` (autorisé §A6). C'est ce qui permet d'afficher
   « 16 (cotte de mailles) + 2 (écu) » sans que le domaine ne rédige.
2. **`buildCharacter` tolère l'incomplet** et rend `null` là où le socle manque
   (CA, PV, dés de vie, vitesse, magie), jamais une exception ni un zéro trompeur.
3. **Distances en mètres**, dans les données comme dans la fiche.
4. **`validateDraft` enveloppe `listMissingChoices`** au lieu de recalculer.

### Lot 2 — assistant et état

- `useCharacterSheet(): CharacterSheet`, `useIssues(): readonly LocatedIssue[]`
  (déjà rattachées à un `screenId` : c'est exactement ce dont ma liste a besoin),
  `useWizard().goTo(screenId)`, `useWizardDispatch()`.
- Deux écrans dans le parcours, `'summary'` et `'sheet'`, que `App.tsx` confie à mes
  composants ; `goBack()` depuis le récapitulatif revient à l'écran d'où l'on venait.
- Une action `REPLACE_DRAFT(draft)` pour l'import, et `RESET` pour « Recommencer ».
- **Je ne demande aucun drapeau `returnToSummary`** : « Ma fiche » dans
  `ProgressBanner` suffit au retour.

### Lot 3 — interface et design

- Je réutilise `AppShell`, `ProgressBanner`, `ActionBar`, `Notice`, `Explainer`, et les
  jetons de `tokens.css` (noms anglais). **Je n'invente aucun jeton.**
- Je déclare et j'écris `SheetBlock`, `StatTile`, `DataRow`, `SheetJumpMenu` dans
  `ui/sheet/` : trois usages réels manquent pour en faire des composants partagés, et
  le lot 3 a raison de ne pas les exporter à l'avance (§A7).
- **Demande unique, déjà acceptée** : attributs `data-print` stables —
  `data-print="frame"` sur la racine d'`AppShell`, `data-print="hide"` sur
  `ProgressBanner` et `ActionBar`. Sans eux, la grille `100dvh; overflow:hidden` coupe
  l'impression à la première page, et les classes CSS Modules hachées ne peuvent pas
  être ciblées depuis une feuille globale.
- Le libellé du bouton d'en-tête reste « **Ma fiche** » sur tous les écrans : c'est le
  chemin de retour du récapitulatif.

### Lot 5 — outillage

Aucune dépendance ajoutée. Aucune URL commençant par `/`. Mes tests vivent à côté du
code ; `domain/completeness.ts` et `domain/export/` sont soumis au seuil de couverture
du domaine, ce qui est voulu : ce sont les deux endroits où un bug est silencieux.

---

## Tests prévus

### Domaine — test d'abord, catalogue miniature

- `it('signale « 1 compétence » quand une seule compétence manque')`
- `it('signale « 2 compétences » au pluriel')`
- `it('ne signale aucun manque pour un personnage complet')`
- `it('place le créneau d\'expertise en dernier dans la liste des manques')`
- `it('signale l\'absence de nom comme un manque de champ, pas de créneau')`
- `it('exporte un fichier au format aventurine.personnage en version 1')`
- `it('n\'écrit aucun indicateur de complétude dans le fichier exporté')`
- `it('retrouve un brouillon identique après un aller-retour export puis import')`
- `it('refuse un fichier dont le format n\'est pas le nôtre')`
- `it('refuse un JSON corrompu sans lever d\'exception')`
- `it('refuse un fichier de version 2 avec une erreur dédiée')`
- `it('refuse un fichier de plus d\'un méga-octet sans le lire')`
- `it('ignore une race inconnue et prévient qu\'il faut la rechoisir')`
- `it('ignore un créneau dont l\'identifiant ne respecte pas source:parent:sujet')`
- `it('ignore les champs inconnus d\'un fichier importé')`
- `it('ignore une clé __proto__ présente dans le fichier')`
- `it('refuse un fichier contenant plus de soixante-quatre créneaux')`
- `it('tronque un nom de plus de soixante caractères et le signale')`
- `it('propose le nom de fichier fiche-alric-guerrier.json')`
- `it('retire les accents et les espaces du nom de fichier')`

### Mise en français (`ui/format/`, pures, sans React)

- `it('écrit « 16 (cotte de mailles) + 2 (écu) » à partir du détail de la classe d\'armure')`
- `it('écrit « Il te reste 1 tour de magie à choisir »')`
- `it('produit un résumé texte de moins de vingt lignes')`
- `it('termine le résumé par « Créé avec Aventurine »')`

### Interface (Testing Library)

- `it('affiche « Il te reste 1 compétence à choisir » sur le récapitulatif')`
- `it('emmène à l\'écran des compétences quand on touche la ligne manquante')`
- `it('laisse le bouton « Voir ma fiche » actif malgré un choix manquant')`
- `it('affiche « À choisir » à la place d\'une valeur manquante')`
- `it('affiche « Choisis ta classe » à la place des points de vie sans classe')`
- `it('place le bloc En combat avant le bloc Compétences dans l\'ordre du document')`
- `it('affiche les dix-huit compétences, maîtrisées ou non')`
- `it('marque une compétence d\'expertise comme maîtrise double')`
- `it('n\'affiche pas le bloc Magie pour un guerrier')`
- `it('n\'affiche pas « Texte complet » quand le sort n\'a pas de texte long')`
- `it('affiche les traits saisis librement d\'un historique personnalisé')`
- `it('affiche le bouton Partager seulement si le navigateur sait partager')`
- `it('propose un champ de texte sélectionnable si le presse-papiers est refusé')`
- `it('demande confirmation avant de remplacer le personnage en cours')`
- `it('appelle l\'impression du navigateur quand on touche Imprimer')`
- `it('renomme le document avant l\'impression puis restaure le titre')`

### Vérification manuelle de l'impression

Liste à cocher sur Chrome bureau, Firefox, Chrome Android, Safari iOS : A4 respecté ou
signalé, navigation absente, **fiche non coupée à la première page**, aucun aplat,
aucun bloc scindé, magie sur une page dédiée, mention Aventurine et SRD présentes,
deux pages au maximum.

---

## Hors périmètre

| Écarté                                             | Raison                                                                                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fiche éditable après création                      | Charte §1 ; la modification passe par l'assistant                                                                                                      |
| Suivi des PV, des sorts dépensés, de l'inspiration | Hors périmètre. **Seule exception** : les cases vides de la fiche **imprimée**, retenues à l'arbitrage — c'est la raison même pour laquelle on imprime |
| Gestion d'inventaire (ajout, quantités, poids)     | Hors périmètre : l'équipement est une liste en lecture seule                                                                                           |
| Montée de niveau, multiclassage, dons              | Charte §1                                                                                                                                              |
| Plusieurs personnages sauvegardés                  | Une seule sauvegarde, d'où la confirmation à l'import                                                                                                  |
| Lien de partage contenant le personnage            | Imposerait de lire l'URL, c'est-à-dire du routage, exclu par la charte                                                                                 |
| Partage du fichier par la feuille de partage       | Support inégal, sans intérêt pour le destinataire                                                                                                      |
| QR code, portrait, illustration                    | YAGNI, et charte §9 pour l'habillage                                                                                                                   |
| Bibliothèque PDF côté client                       | Argumenté en section Impression                                                                                                                        |
| Migration de format d'import                       | Il n'existe qu'une version et rien n'a été publié (§A18)                                                                                               |

**Exception argumentée conservée** : le bouton « Modifier mon personnage » sur la
fiche. Ce n'est pas une fiche éditable, c'est un retour à l'assistant sur le brouillon
déjà en mémoire. Sans lui, corriger une faute de frappe imposerait de tout recommencer.
Coût : un appel à `goTo`, déjà fourni par le lot 2.

---

## Risques

1. **Le cadre `100dvh; overflow: hidden` du lot 3 coupe l'impression.** Risque le plus
   concret du lot, et invisible tant qu'on n'imprime pas. Parade : la remise à plat est
   la **première** règle de `print.css`, et la vérification manuelle la teste en premier.
2. **Le papier n'est pas testable automatiquement.** Vitest et jsdom ignorent
   `@media print`. Parade : liste manuelle, structure DOM linéaire, aucun aplat.
3. **`CharacterSheet` arrive tard.** Parade : trois jeux d'essai écrits d'abord ; la
   fiche se développe et se teste contre eux, le branchement est mécanique.
4. **Le dictionnaire de créneaux couple les clés au contenu.** `class:roublard:skills`
   contient un identifiant de classe : le renommer dans `data/` invalide silencieusement
   tous les fichiers déjà exportés. Parade : les identifiants de créneau inconnus sont
   des **avertissements**, jamais des erreurs, et le joueur est renvoyé à l'écran
   concerné. Les identifiants de contenu sont traités comme un contrat public.
5. **La fiche est le miroir des quatre autres lots.** Chaque erreur de règle, de contenu
   ou d'état s'y voit en premier. Parade : les jeux d'essai deviennent la base de
   non-régression commune.
6. **Barre collante et Safari iOS** : la barre d'adresse dynamique décale
   `position: sticky`. Parade : 48 px seulement, `scroll-margin-top` sur les ancres,
   essai au doigt sur 360 px avant de déclarer le lot fini.
7. **Presse-papiers en contexte non sécurisé** : repli `<textarea>` prévu et testé.
8. **Dérive de périmètre.** Une fiche consultable attire « juste un compteur de PV ».
   Le tableau Hors périmètre est le garde-fou ; toute exception passe par une
   justification écrite, comme celle des cases papier.
