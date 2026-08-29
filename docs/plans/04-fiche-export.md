# LOT 4 — Fiche de personnage, récapitulatif & Export

## Objectif

Fermer le parcours : l'utilisateur a fait ses choix, il doit **voir ce qu'il a créé**, savoir **ce qui manque**, et **emporter sa fiche** (papier, PDF, fichier). Trois écrans, zéro nouvelle dépendance, zéro règle D&D calculée dans un composant.

Contraintes qui pilotent tout le lot :
- `ui → state → domain ← data` : la fiche est une **projection pure** du domaine ; les composants n'additionnent rien.
- Mobile 360 px d'abord : la fiche papier A4 recto-verso est un format **de sortie**, jamais le modèle d'écran.
- Aucune chaîne française dans `domain/` : le domaine renvoie des données structurées, `ui/` les formule.
- Pas de jsPDF, pas de html2canvas (justification en section Impression).

### Fichiers prévus (LOT 4)

```
src/domain/sheet/CharacterSheet.ts        type de la fiche (contrat de vue)
src/domain/sheet/buildCharacterSheet.ts   assemblage à partir des primitives du LOT 1
src/domain/sheet/formatSheetAsText.ts     résumé texte brut
src/domain/export/CharacterFile.ts        format + version du fichier
src/domain/export/toCharacterFile.ts      sérialisation
src/domain/export/parseCharacterFile.ts   validation défensive à l'entrée
src/domain/export/fileName.ts             slug du nom de fichier
src/ui/summary/SummaryScreen.tsx          récapitulatif avant validation
src/ui/summary/MissingChoiceList.tsx      « Il te reste 1 compétence à choisir »
src/ui/sheet/SheetScreen.tsx              la fiche (page unique)
src/ui/sheet/SheetJumpMenu.tsx            accès rapide collant « Aller à… »
src/ui/sheet/SheetBlock.tsx               enveloppe de bloc (titre + ancre + data-print)
src/ui/sheet/DefinitionList.tsx           liste étiquette → valeur(s)
src/ui/sheet/CombatBlock.tsx AbilitiesBlock.tsx SkillsBlock.tsx
src/ui/sheet/AttacksBlock.tsx SpellcastingBlock.tsx FeaturesBlock.tsx
src/ui/sheet/SheetActions.tsx             imprimer / exporter / partager / modifier
src/ui/io/ImportButton.tsx downloadJson.ts printSheet.ts shareSummary.ts
src/ui/styles/print.css                   feuille d'impression globale unique
```

`SheetBlock` + `DefinitionList` sont génériques **parce qu'il y a trois cas réels** (maîtrises, personnalité, équipement), conformément à la règle KISS de la charte. Pas un de moins.

### Séquencement (tranches verticales, chacune verte)

1. Type `CharacterSheet` + jeux d'essai (`alric-guerrier`, `lyra-magicienne`, `perso-incomplet`) → la fiche se développe **avant** que le LOT 1 soit livré.
2. `SheetScreen` en lecture sur jeu d'essai (la tranche la plus risquée en premier).
3. `SummaryScreen` + navigation vers l'étape manquante.
4. Export JSON + nom de fichier.
5. Import + validation défensive.
6. `print.css`.
7. Copie du résumé / partage.

---

## Récapitulatif avant validation

### Tranchée : oui, on peut terminer avec un personnage incomplet

La charte §4 le dit déjà : « Progression linéaire, sans blocage : on peut avancer avec des choix incomplets, l'écran final récapitule ce qui manque. » Je ne rediscute pas cette décision, je l'applique jusqu'au bout :

- Le bouton principal **n'est jamais désactivé**. Un bouton grisé sans explication est le pire échec possible pour un débutant qui ne sait pas ce qu'est une « compétence ».
- Un personnage incomplet **produit quand même une fiche**, un export et une impression. Les trous s'affichent en toutes lettres : `À choisir`.
- Ce qui manque n'est jamais caché ni minimisé : un bloc dédié en haut du récapitulatif, avant les choix déjà faits.
- L'export porte `complete: false` (calculé, non stocké) — voir section Export.

Dégradation quand le socle manque (race ou classe absente) : les valeurs indérivables (PV, CA, dés de vie, magie) valent `null` dans `CharacterSheet` et le bloc affiche une phrase d'aide (« Choisis ta classe pour connaître tes points de vie »), pas un tiret muet.

### Contenu de l'écran

```
┌────────────────────────────────────────────┐ 360 px
│ Étape 8 sur 8                              │
│ Presque prêt !                             │
│                                            │
│ ┌────────────────────────────────────────┐ │
│ │ ALRIC                                  │ │
│ │ Nain des collines · Guerrier · Niv. 1  │ │
│ │ Historique : Soldat                    │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ⚠ Il te reste 2 choix à faire              │
│ ┌────────────────────────────────────────┐ │
│ │ Compétences                        →   │ │ ← ligne entière tactile, 56 px
│ │ Il te reste 1 compétence à choisir      │ │
│ ├────────────────────────────────────────┤ │
│ │ Langues                            →   │ │
│ │ Il te reste 1 langue à choisir          │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ Tes choix                                  │
│ ┌────────────────────────────────────────┐ │
│ │ Race     Nain des collines    Modifier │ │
│ │ Classe   Guerrier             Modifier │ │
│ │ Historiq. Soldat              Modifier │ │
│ │ Caracs   16 14 15 8 12 10     Modifier │ │
│ │ Équipem. Épée longue, écu, …  Modifier │ │
│ └────────────────────────────────────────┘ │
│                                            │
│  ⌄ (fin de page)                           │
├────────────────────────────────────────────┤
│ [        Voir ma fiche        ]            │ ← barre collante basse
└────────────────────────────────────────────┘
```

### Retour à l'écran concerné « en un geste »

- La **ligne entière** de `MissingChoiceList` est un `<button>` (pas une icône seule, pas un lien de 12 px), hauteur ≥ 56 px.
- Un appui envoie `GO_TO_STEP(stepId, { returnToSummary: true })`.
- À l'arrivée sur l'étape, la barre basse affiche **« Revenir au récapitulatif »** à la place de « Suivant » tant que `returnToSummary` est vrai. Un geste à l'aller, un geste au retour.
- Le champ concerné reçoit le focus (`ref.focus()` sur le premier groupe de choix restant), et un bandeau d'une ligne rappelle la raison : « Il te reste 1 compétence à choisir. »

Le signalement n'est **jamais** porté par la couleur seule : mot `À choisir`, icône **plus** libellé, texte explicite du reste à faire.

### Formulation française

Le domaine renvoie `{ kind: 'skill', remaining: 1, stepId: 'competences' }`. `ui/` porte la table :

| `kind` | singulier | pluriel |
|---|---|---|
| `skill` | 1 compétence à choisir | N compétences à choisir |
| `language` | 1 langue à choisir | N langues à choisir |
| `tool` | 1 outil à choisir | N outils à choisir |
| `cantrip` | 1 tour de magie à choisir | N tours de magie à choisir |
| `spell` | 1 sort à choisir | N sorts à choisir |
| `equipment` | 1 choix d'équipement | N choix d'équipement |
| `name` | Ton personnage n'a pas de nom | — |
| `ability` | Tes caractéristiques ne sont pas réparties | — |

Titre du bloc : « Il te reste N choix à faire » (N = nombre de lignes, pas la somme des unités : plus lisible).

---

## Architecture de la fiche mobile

### Décision : page unique, défilement vertical, ordre imposé par l'usage, plus une barre collante « Aller à… »

Une seule colonne, tous les blocs dans le DOM en permanence, ancres natives (`<a href="#competences">` + `scroll-margin-top`). Une barre collante de 48 px en haut contient le nom du personnage et un unique bouton `Aller à…` qui déplie un `<details>` listant les blocs en lignes pleine largeur de 48 px.

### Défense contre les onglets

Les onglets sont la fausse bonne idée du lot :
- **L'impression casse.** Une fiche imprimée doit tout montrer ; il faut donc que tous les panneaux existent déjà dans le DOM et que le CSS d'impression les force à s'afficher. Les onglets ne sont alors qu'un masque CSS : on paie la complexité (`role="tablist"`, gestion des flèches clavier, état actif, focus) pour un bénéfice d'un seul appui.
- **La recherche dans la page meurt.** « Rechercher dans la page » du navigateur est un outil réel à table ; il ne trouve pas le contenu masqué par `display: none`.
- **Six onglets ne rentrent pas dans 360 px** sans défilement horizontal — interdit par la charte — ou sans passage à la ligne, qui mange 96 px permanents.
- Perte de la position de lecture à chaque changement d'onglet.

### Défense contre l'accordéon global

- **Tout replié** : chaque consultation coûte un appui *et* une recherche du bon en-tête. On échange une seconde de défilement contre une seconde de repérage plus un appui. Mauvaise affaire.
- **Tout déplié** : c'est exactement mon défilement long, avec des chevrons en plus et un risque de repli accidentel.
- L'accordéon est en revanche **excellent pour du texte long**. Je le garde donc **à l'intérieur** des blocs Aptitudes et Sorts : chaque aptitude est un `<details>` avec le nom visible et la description repliée. C'est une utilisation locale, pas l'architecture de la fiche.

### Pourquoi le défilement gagne

Le geste le moins cher sur téléphone est le défilement au pouce, pas l'appui précis. Le défilement long est aussi la seule structure qui soit **native à l'impression** (l'ordre du document = l'ordre du papier), à la recherche dans la page, au clavier et aux lecteurs d'écran, pour **zéro ligne de JavaScript** hormis les 25 lignes du menu contrôlé.

### Ce qu'on voit en ouvrant sa fiche à table

Budget vertical mesuré sur 360 × 640 (zone utile ≈ 600 px sous la barre système) :

| Élément | Hauteur |
|---|---|
| Barre collante (nom + Aller à…) | 48 px |
| Identité (2 lignes) | 56 px |
| Bloc **En combat** (6 tuiles, 2 colonnes × 3 lignes) | 232 px |
| Titre + 2 premières attaques | 200 px |
| **Total** | **536 px** |

Le bonus d'attaque est visible **sans aucun appui et sans défilement** sur un écran de 640 px, à la limite du pli sur les plus petits. C'est la réponse à l'usage réel.

```
┌────────────────────────────────────────────┐
│ ALRIC                    [ Aller à… ⌄ ]    │ ← collant, 48 px
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

### Ordre des blocs (fixe, dicté par la fréquence d'usage à table)

1. Identité — 2. **En combat** — 3. **Attaques** — 4. Caractéristiques et sauvegardes — 5. Compétences — 6. Magie *(si lanceur)* — 7. Aptitudes — 8. Maîtrises et langues — 9. Équipement — 10. Personnalité — 11. Actions + attribution SRD.

Les actions (Imprimer, Exporter, Partager, Modifier) sont **en bas du document**, pas dans une barre collante : à table on lit, on n'imprime pas. Elles restent atteignables en un appui via l'entrée « Actions » du menu `Aller à…`. C'est une lecture assumée de la charte (« actions principales en bas de l'écran » vise la navigation de l'assistant).

### Élargissement bureau

`@media (min-width: 720px)` : deux colonnes en grille, la barre collante disparaît au profit d'un sommaire latéral en `position: sticky`. Aucune `max-width` en media query.

---

## Blocs et provenance des données

Légende de la provenance : **J** = choix du joueur, **D** = calcul du domaine, **C** = contenu `data/` (SRD traduit).

### 1. Identité
| Champ | Provenance |
|---|---|
| Nom | J (défaut : « Personnage sans nom ») |
| Race / sous-race, classe, historique, alignement | J, libellés C |
| Niveau | Constante 1 |

### 2. En combat
| Champ | Provenance |
|---|---|
| Classe d'armure + détail (« 16 (cotte de mailles) + 2 (écu) ») | D — `armorClass(draft)` renvoie `{ total, parts[] }` ; gère Défense sans armure du barbare et du moine |
| Initiative | D — modificateur de Dextérité |
| Vitesse + note éventuelle | D + C — vitesse raciale **en mètres**, réduite de 3 m si armure lourde sans la Force requise |
| Points de vie max | D — max du dé de vie + mod. Constitution (+1 nain des collines) |
| Dés de vie | D + C — `1 d10` |
| Bonus de maîtrise | D — `+2` au niveau 1 |

### 3. Attaques
Une carte par arme possédée. `nom` (C), `bonus d'attaque` (D : mod. For, ou Dex si finesse/à distance, + maîtrise si l'arme est maîtrisée), `dégâts` (D : dés C + modificateur), `type de dégâts`, `propriétés`, `portée`. Si aucune arme : « Aucune arme équipée ».

### 4. Caractéristiques et jets de sauvegarde
Six tuiles (2 colonnes) : nom, score final (D : score de base J + bonus raciaux C), modificateur (D), jet de sauvegarde (D : modificateur + maîtrise si la classe l'accorde) avec marqueur `●` maîtrisé / `○` non maîtrisé accompagné d'un `aria-label`.

### 5. Compétences
Les 18 compétences SRD, toujours toutes affichées, ordre alphabétique français. Par ligne : marqueur de maîtrise, nom (C), caractéristique liée entre parenthèses, total signé (D). Gère la **maîtrise double** du roublard (Expertise, niveau 1) : marqueur `◉` et libellé « maîtrise double ». Provenance des maîtrises : race (C), classe (J parmi une liste C), historique (C).

### 6. Magie — bloc affiché seulement si `sheet.spellcasting !== null`
Caractéristique d'incantation (C), DD de sauvegarde des sorts (D : `8 + maîtrise + mod`), bonus d'attaque de sort (D : `maîtrise + mod`), emplacements par niveau (D), tours de magie connus (J parmi C), sorts connus **ou** préparés selon la classe (J + D pour le nombre autorisé), formule expliquée (« tu prépares 1 + ton mod. de Sagesse = 3 sorts »).

### 7. Aptitudes
Une entrée par aptitude, groupée par source (Race / Classe / Historique), nom + description courte (C), repliée dans un `<details>` au-delà de 3 lignes. Provenance : liste C sélectionnée par le domaine selon race+classe+historique de niveau 1, plus les choix J (style de combat du guerrier, domaine du clerc, patron de l'occultiste…).

### 8. Maîtrises et langues
Armures, armes, outils, langues — union race + classe + historique (D), les choix J inclus.

### 9. Équipement
Objets issus des options de départ (J parmi C) + équipement d'historique (C) + pièces d'or (D). Liste en lecture seule, pas de quantités modifiables.

### 10. Personnalité
Traits, idéal, lien, défaut (J parmi les tables C de l'historique).

### 11. Pied de fiche
Attribution obligatoire : « Contenu dérivé du SRD 5.1 © Wizards of the Coast, licence CC BY 4.0. » Présente à l'écran **et** à l'impression.

---

## Impression

### Décision : `window.print()` + `@media print`. Aucune dépendance.

Justification écrite du refus de jsPDF / html2canvas, comme l'exige la charte :
- `html2canvas` **rastérise** : texte non sélectionnable, non cherchable, fichier lourd, et il capture la mise en page mobile telle qu'affichée — donc une fiche 360 px étirée sur A4. Résultat objectivement pire.
- `jsPDF` impose de **repositionner chaque ligne à la main** en points, d'embarquer une police pour les accents, et pèse plus de 200 Ko. On réécrirait un moteur de mise en page que le navigateur fournit gratuitement.
- « Imprimer → Enregistrer au format PDF » donne un PDF **vectoriel, sélectionnable, cherchable**, à coût nul. Aucune des deux dépendances ne fait mieux : elles sont refusées.

### Mise en œuvre

- **Une seule feuille globale** `src/ui/styles/print.css`, importée dans `App.tsx`. Elle cible des attributs stables `data-sheet-block="competences"`, `data-print="hide"` — jamais des classes CSS Modules (noms hachés).
- `@page { size: A4 portrait; margin: 12mm; }`.
- Masquage : barre collante, menu `Aller à…`, barre de navigation de l'assistant, boutons d'action → `[data-print="hide"] { display: none !important; }`. `position: sticky → static`.
- **Noir sur blanc** : `* { color: #000 !important; background: transparent !important; }`. Traits en `0.4pt solid #000`.
- **Économie d'encre** : aucun aplat de couleur, aucun cadre plein, aucune ombre. Les marqueurs de maîtrise sont des **caractères** (`●` `○` `◉`), pas des pastilles colorées — ce choix sert déjà l'accessibilité (l'information ne passe pas par la couleur) et rend l'impression correcte même quand « Graphiques d'arrière-plan » est décoché, ce qui est le réglage par défaut.
- **Sauts de page maîtrisés** : `break-inside: avoid; page-break-inside: avoid;` sur chaque bloc ; `orphans: 3; widows: 3;` sur les descriptions ; `break-before: page` avant le bloc Magie s'il existe.
- **Deux colonnes au papier** : la fiche est une liste linéaire de blocs, `@media print` la passe en `display: grid; grid-template-columns: 1fr 1fr; gap: 6mm;`. Objectif : 1 page sans magie, 2 pages avec.
- **Taille** : `font-size: 9.5pt`, titres `12pt`, unités en `pt` uniquement dans `print.css`.
- **Nom du PDF** : le navigateur utilise `document.title`. `printSheet.ts` fait `document.title = 'Fiche - Alric, guerrier niveau 1'` avant `window.print()`, puis restaure le titre sur l'évènement `afterprint`. Six lignes, gain réel.
- **Bloc « papier » exclusif** (`data-print="only"`) : `PV actuels ____ / 12`, `Inspiration ☐`, quelques lignes de notes. C'est précisément pourquoi on imprime une fiche ; le suivi reste sur le papier, jamais dans l'appli. Coût : ~12 lignes de balisage. Si la revue le juge hors périmètre, c'est le premier élément à couper.

```
A4 portrait, marges 12 mm — page 1
┌──────────────────────────────────────────────┐
│ ALRIC — Nain des collines · Guerrier niv. 1  │
│ Soldat · Loyal bon        Maîtrise +2        │
├──────────────────────┬───────────────────────┤
│ CARACTÉRISTIQUES     │ EN COMBAT             │
│ FOR 16 (+3) sauv ●+5 │ CA 18   Initiative +2 │
│ DEX 14 (+2) sauv ○+2 │ PV 12   DV 1d10       │
│ …                    │ Vitesse 7,50 m        │
├──────────────────────┼───────────────────────┤
│ COMPÉTENCES          │ ATTAQUES              │
│ ● Athlétisme     +5  │ Épée longue  +5 1d8+3 │
│ ○ Acrobaties     +2  │ Arbalète lég.+4 1d8+2 │
│ …                    ├───────────────────────┤
│                      │ APTITUDES             │
├──────────────────────┴───────────────────────┤
│ PV actuels ____/12  Inspiration ☐   Notes    │
│ SRD 5.1 © Wizards of the Coast — CC BY 4.0   │
└──────────────────────────────────────────────┘
```

### Impression depuis un téléphone

Chrome Android : `window.print()` ouvre l'aperçu, « Enregistrer au format PDF » fonctionne. Safari iOS : `window.print()` est pris en charge et ouvre la feuille d'impression ; enregistrer en PDF passe par un écartement des doigts sur l'aperçu, geste peu découvrable. Les navigateurs intégrés aux applications (Facebook, Instagram) peuvent ignorer l'appel. Repli : une ligne d'aide sous le bouton — « Si rien ne se passe, utilise Partager ▸ Imprimer dans ton navigateur. »

### Limites honnêtes

1. On ne peut **pas** supprimer les en-têtes/pieds de page du navigateur (URL, date, numéro de page) : c'est une case à cocher côté utilisateur. On l'indique dans l'aide, on ne peut rien de plus.
2. `@page { size }` est ignoré par Safari : le format vient de la boîte de dialogue.
3. Pas de numérotation « page 1 sur 2 » : les compteurs `@page` ne sont pas implémentés dans les navigateurs.
4. Le rendu diffère d'un navigateur à l'autre ; **aucun test automatique** ne couvre `@media print` (jsdom ne rend pas le papier). Il y aura une liste de vérification manuelle.
5. Une police web du système de design peut ne pas s'imprimer : `print.css` impose une pile système avec empattements pour le papier.

---

## Export / import JSON

### Ce qu'on exporte : les **choix**, jamais les valeurs calculées

Exporter la fiche calculée serait redondant, périmable (une correction de règle ne profiterait pas au fichier) et volumineux. On exporte le brouillon du joueur ; le domaine recalcule à l'import. Fichier ≈ 1,5 Ko.

Clés en **anglais** (c'est du code sérialisé), valeurs d'identifiants de contenu en **français** (`'nain-des-collines'`), conformément à la convention §6.

```ts
// src/domain/export/CharacterFile.ts
export const FILE_FORMAT = 'ddbf.personnage';
export const FILE_VERSION = 1;

export interface CharacterFile {
  format: typeof FILE_FORMAT;
  version: number;          // entier, incrémenté à toute rupture
  exportedAt: string;       // ISO 8601
  character: CharacterDraft; // le brouillon de l'assistant, tel quel
}

// Attendu du LOT 3, dans src/domain/Character.ts
export interface CharacterDraft {
  name: string;
  raceId: string | null;
  subraceId: string | null;
  classId: string | null;
  backgroundId: string | null;
  alignmentId: string | null;
  abilityMethod: 'tableau-standard' | 'achat-de-points' | 'jets';
  baseAbilityScores: Partial<Record<AbilityId, number>>; // avant bonus raciaux
  skillChoices: string[];
  languageChoices: string[];
  toolChoices: string[];
  featureChoices: Record<string, string>;   // ex. { 'style-de-combat': 'defense' }
  equipmentChoices: Record<string, string>; // groupe d'options -> option retenue
  spellChoices: { cantrips: string[]; spells: string[] };
  personality: { traits: string[]; ideal: string | null;
                 bond: string | null; flaw: string | null };
}

// src/domain/export/parseCharacterFile.ts
export type ImportError =
  | { kind: 'file-too-large' }
  | { kind: 'invalid-json' }
  | { kind: 'not-our-format' }
  | { kind: 'version-too-recent'; found: number }
  | { kind: 'invalid-structure'; field: string };

export type ImportWarning =
  | { kind: 'unknown-id'; field: string; value: string }
  | { kind: 'value-truncated'; field: string };

export type ImportResult =
  | { ok: true; character: CharacterDraft; warnings: ImportWarning[] }
  | { ok: false; error: ImportError };

export function parseCharacterFile(text: string): ImportResult;
```

### Téléchargement

`downloadJson.ts` (couche `ui/`, ~15 lignes) : `JSON.stringify(file, null, 2)` → `new Blob([json], { type: 'application/json' })` → `URL.createObjectURL` → `<a download>` créé, cliqué, retiré → `URL.revokeObjectURL` au tick suivant. Indentation 2 espaces : lisible et diffable pour 300 octets de plus.

Nom proposé : `fiche-alric-guerrier.json`. Règle (`fileName.ts`, testée) : minuscules, accents retirés via `normalize('NFD')`, tout caractère non alphanumérique → `-`, tirets compressés, 40 caractères max. Sans nom : `fiche-personnage.json`. Sans classe : `fiche-alric.json`.

Sur iOS le fichier atterrit dans Fichiers ▸ Téléchargements ; un texte d'aide le dit.

### Import

`<input type="file" accept="application/json,.json">` visuellement masqué, déclenché par un `<label>` stylé en bouton de 44 px (le `<label>` reste focusable au clavier).

Pipeline défensif, dans cet ordre, chaque étape sortant proprement :

1. **Taille** : `file.size > 1_000_000` → `file-too-large`. On ne lit pas un fichier de 300 Mo pour découvrir qu'il est mauvais.
2. **Lecture** : `await file.text()`.
3. **`JSON.parse` dans un `try/catch`** → `invalid-json`. Aucune exception ne remonte jusqu'à React.
4. **Signature** : `format !== 'ddbf.personnage'` → `not-our-format`. C'est le filet pour « un fichier qui n'est pas de nous » : une fiche exportée d'un autre outil est refusée immédiatement, avec un message qui ne culpabilise pas.
5. **Version** : `version > FILE_VERSION` → `version-too-recent` (message dédié : « Ce fichier a été créé avec une version plus récente. Mets l'application à jour. »). `version < 1` ou non entier → `not-our-format`. Aucune fonction de migration aujourd'hui : il n'y a qu'une version (YAGNI). La politique est écrite ici pour le jour où il y en aura deux.
6. **Structure, champ par champ** : ~80 lignes de gardes manuelles (`isString`, `isIntBetween`, `asStringArray`). Justification du refus de zod/valibot : un seul schéma, un seul point d'entrée, 80 lignes testées contre 12 Ko de dépendance.
7. **Reconstruction explicite** : l'objet est rebâti champ par champ, jamais par `spread` ni `Object.assign`. Conséquence directe : les **champs inconnus sont ignorés silencieusement** et une clé `__proto__` malveillante n'atteint jamais l'état.
8. **Bornes** : nom tronqué à 60 caractères (avertissement), tableaux plafonnés à 30 entrées, scores contraints à 1–20. Un fichier hostile ne fait pas exploser le rendu.
9. **Identifiants inconnus** : une race, une classe ou un sort absent de `data/` **n'invalide pas le fichier**. La valeur est mise à `null` (ou retirée du tableau) et un `ImportWarning` remonte : « La race “dragonborn” est inconnue : il faudra la rechoisir. » L'assistant rouvre à l'étape concernée. C'est cohérent avec la règle « on avance avec des choix incomplets ».

### Écrasement du personnage en cours

Une seule sauvegarde locale. Si un brouillon non vide existe, l'import affiche une confirmation en français nommant le contenu du fichier : « Ce fichier contient Alric, nain des collines, guerrier. Il remplacera ton personnage en cours. » → `Remplacer` / `Annuler`. Sinon, import direct.

Points d'entrée de l'import : le bloc Actions de la fiche, **et** l'écran d'accueil de l'assistant (« J'ai déjà un fichier ») — ce dernier appartient au LOT 3, qui rend notre composant `ImportButton`.

---

## Partage

### Tranché : le partage **texte** entre, le partage de **fichier** reste dehors

La charte §1 ne liste pas « partage » dans le périmètre. J'applique donc le rasoir, avec une exception argumentée :

- **« Copier le résumé » : dans le périmètre.** C'est la sortie de secours universelle (Discord, WhatsApp, SMS, note), elle fonctionne partout, et son moteur est une fonction pure de 40 lignes dans `domain/sheet/formatSheetAsText.ts`, entièrement testable. Elle coûte moins cher qu'une capture d'écran ratée. `navigator.clipboard.writeText`, avec repli sur un `<textarea>` présélectionné affiché sur place si l'API est absente ou refusée (contexte non sécurisé).
- **`navigator.share({ title, text })` : dans le périmètre, en amélioration progressive.** Dix lignes, le bouton « Partager » n'est **rendu que si** `navigator.share` existe. Pas de repli bancal : quand l'API manque, le bouton n'existe pas et « Copier le résumé » reste là.
- **Partage du fichier JSON via `navigator.canShare({ files })` : hors périmètre.** Support inégal (absent de Firefox), et sans intérêt : le destinataire n'a pas notre application. Le JSON sert à *soi-même*, le texte sert *aux autres*.

Résumé texte, gabarit exact (≤ 20 lignes, pensé pour un message de messagerie) :

```
ALRIC — Nain des collines, guerrier niveau 1
Historique : Soldat · Loyal bon

CA 18 · Initiative +2 · PV 12 · Vitesse 7,50 m
Dés de vie 1d10 · Maîtrise +2

FOR 16 (+3)*  DEX 14 (+2)   CON 15 (+2)*
INT 8 (-1)    SAG 12 (+1)   CHA 10 (+0)
* jet de sauvegarde maîtrisé

Attaques : Épée longue +5 (1d8+3) · Arbalète légère +4 (1d8+2)
Compétences maîtrisées : Athlétisme +5, Intimidation +2,
  Perception +3, Survie +3
Aptitudes : Second souffle, Style de combat (Défense),
  Résistance naine, Attitude militaire

Créé avec D&D Beyond Franché — SRD 5.1, CC BY 4.0
```

---

## Contrats attendus des autres lots

### LOT 1 — domaine et règles

Primitives pures consommées par `buildCharacterSheet` (aucune chaîne d'interface, aucun import React) :

| Fonction | Renvoie |
|---|---|
| `abilityModifier(score)` | `number` |
| `proficiencyBonus(level)` | `number` |
| `finalAbilityScores(draft)` | `Record<AbilityId, number>` |
| `savingThrows(draft)` | `{ abilityId, bonus, proficient }[]` |
| `skillLines(draft)` | `{ skillId, abilityId, bonus, proficiency: 'aucune'\|'simple'\|'double' }[]` |
| `armorClass(draft)` | `{ total, parts: { label, value }[] } \| null` |
| `speed(draft)` | `{ meters, reducedByArmor: boolean } \| null` |
| `hitPoints(draft)` | `{ max, parts } \| null` · `hitDice(draft)` |
| `weaponAttacks(draft)` | `{ name, attackBonus, damageDice, damageBonus, damageType, properties, range }[]` |
| `spellcasting(draft)` | `Spellcasting \| null` (DD, bonus d'attaque, emplacements, sorts) |
| `features(draft)` | `{ source: 'race'\|'class'\|'background', name, description }[]` |
| `proficiencies(draft)` | `{ armors, weapons, tools, languages }` |
| `equipment(draft)` | `{ items: { name, quantity }[], gold }` |
| `listMissingChoices(draft)` | `{ kind, remaining, stepId }[]` |

Deux points à trancher avec le LOT 1 :
- Les distances sont stockées **en mètres** dans `data/` (pas de couche de conversion : KISS).
- Si `listMissingChoices` n'est pas livré, LOT 4 l'implémente dans `domain/completeness.ts` (test d'abord) : le récapitulatif ne peut pas exister sans lui.

Le type `CharacterSheet` et son assembleur appartiennent au LOT 4 (`domain/sheet/`) : c'est une composition des primitives, pas une règle.

### LOT 2 — système de design

Réutilisés tels quels : `Button` (variantes primaire/secondaire/discrète), `Card`, `Chip`, `Callout`, `Stack`, jetons d'espacement, de typographie et de couleur.
Composants que je déclare et que je code dans `ui/sheet/` faute d'équivalent — à reprendre par le LOT 2 s'il préfère : `StatTile` (étiquette + grande valeur + détail), `DataRow` (étiquette · valeur alignée à droite), `SheetJumpMenu`.
Aucun jeton nouveau. Un seul ajout demandé : l'attribut convenu `data-print="hide" | "only"` sur les composants qui encadrent la navigation.

### LOT 3 — assistant et état

- `CharacterDraft` exporté depuis `domain/Character.ts` (le type est partagé, il ne peut pas vivre dans `state/`).
- Actions : `GO_TO_STEP(stepId, { returnToSummary })`, `REPLACE_CHARACTER(draft)`, `RESET`.
- Identifiants d'étapes stables, alignés sur `MissingChoice.stepId`.
- Barre basse « Revenir au récapitulatif » quand `returnToSummary` est vrai.
- Phase applicative : `'wizard' | 'summary' | 'sheet'` dans l'état (pas de routage, conforme au tableau de la stack).
- L'écran d'accueil rend `<ImportButton />`.

---

## Tests prévus

### Domaine (Vitest, test d'abord)

- `it('signale « 1 compétence » quand une seule compétence manque')`
- `it('signale « 2 compétences » au pluriel')`
- `it('ne signale aucun manque pour un personnage complet')`
- `it('renvoie une classe d\'armure nulle quand la classe n\'est pas choisie')`
- `it('détaille la classe d\'armure en 16 (cotte de mailles) + 2 (écu)')`
- `it('compte deux fois le bonus de maîtrise pour une compétence à maîtrise double')`
- `it('calcule +5 à l\'attaque pour un guerrier de Force 16 avec une épée longue')`
- `it('utilise la Dextérité pour une arme de finesse quand elle est meilleure')`
- `it('n\'expose aucune magie pour un guerrier')`
- `it('exporte un fichier de format ddbf.personnage en version 1')`
- `it('refuse un fichier dont le format n\'est pas le nôtre')`
- `it('refuse un JSON corrompu sans lever d\'exception')`
- `it('refuse un fichier de version 2 avec une erreur dédiée')`
- `it('refuse un fichier de plus d\'un méga-octet')`
- `it('ignore une race inconnue et prévient qu\'il faut la rechoisir')`
- `it('ignore les champs inconnus d\'un fichier importé')`
- `it('ignore une clé __proto__ présente dans le fichier')`
- `it('tronque un nom de plus de 60 caractères')`
- `it('propose le nom de fichier fiche-alric-guerrier.json')`
- `it('retire les accents du nom de fichier')`
- `it('produit un résumé texte de moins de 20 lignes')`

### Interface (Testing Library)

- `it('affiche « Il te reste 1 compétence à choisir » sur le récapitulatif')`
- `it('emmène à l\'étape des compétences quand on touche la ligne manquante')`
- `it('laisse le bouton « Voir ma fiche » actif malgré un choix manquant')`
- `it('affiche « À choisir » à la place d\'une valeur manquante')`
- `it('place le bloc En combat avant le bloc Compétences dans l\'ordre du document')`
- `it('n\'affiche pas le bloc Magie pour un guerrier')`
- `it('affiche les 18 compétences, maîtrisées ou non')`
- `it('affiche le bouton Partager seulement si le navigateur sait partager')`
- `it('copie le résumé dans le presse-papiers')`
- `it('propose un champ de texte sélectionnable si le presse-papiers est refusé')`
- `it('demande confirmation avant de remplacer le personnage en cours')`
- `it('appelle l\'impression du navigateur quand on touche Imprimer')`
- `it('renomme le document avant l\'impression puis restaure le titre')`

### Vérification manuelle de l'impression (non automatisable)

Liste à cocher, exécutée sur Chrome bureau, Firefox, Chrome Android, Safari iOS : format A4 respecté ou signalé, navigation absente, aucun aplat de couleur, aucun bloc coupé en deux, sorts sur une page dédiée, attribution SRD présente, tenue en 2 pages maximum.

---

## Hors périmètre

| Écarté | Raison |
|---|---|
| Fiche éditable après création | Charte §1 ; la modification passe par l'assistant |
| Suivi des PV, sorts dépensés, inspiration en partie | Hors périmètre ; **seule exception** : des cases vides sur la fiche **imprimée**, car c'est la raison même de l'impression (~12 lignes, coupables en revue) |
| Gestion d'inventaire (ajout, quantités, poids) | Hors périmètre |
| Montée de niveau, multiclassage | Charte §1 |
| Plusieurs personnages sauvegardés / bibliothèque | Non listé au périmètre ; une seule sauvegarde, d'où la confirmation à l'import |
| Lien de partage contenant le personnage (`#…`) | Imposerait une lecture d'URL, c'est-à-dire du routage — interdit par la stack |
| QR code, portrait, image | YAGNI |
| Export PDF côté client par bibliothèque | Justification en section Impression |
| Export vers d'autres formats (D&D Beyond, Roll20) | YAGNI, et rien à rétro-concevoir |

**Exception argumentée retenue** : le bouton « Modifier mon personnage » sur la fiche. Ce n'est pas une fiche éditable — c'est un retour à l'assistant sur le brouillon déjà en mémoire. Sans lui, la seule façon de corriger une faute de frappe serait de tout recommencer. Coût : une action déjà fournie par le LOT 3.

---

## Risques

1. **Le rendu papier n'est pas testable automatiquement.** Vitest et jsdom ignorent `@media print`. Atténuation : liste de vérification manuelle, structure DOM linéaire (donc prévisible sur papier), aucun aplat de couleur.
2. **Le contrat du domaine peut arriver tard.** Atténuation : le type `CharacterSheet` et trois jeux d'essai (`alric-guerrier`, `lyra-magicienne`, `perso-incomplet`) sont écrits en premier ; la fiche se développe et se teste contre eux, le branchement sur le LOT 1 est mécanique.
3. **La fiche est le miroir de tous les autres lots.** Chaque bug de règle, de contenu ou d'état s'y voit. Atténuation : les jeux d'essai deviennent la base de tests de non-régression commune.
4. **Barre collante et Safari iOS** : la barre d'adresse dynamique décale `position: sticky`. Atténuation : barre de 48 px seulement, `scroll-margin-top` sur les ancres, vérification au doigt sur écran de 360 px avant de considérer le lot fini.
5. **Presse-papiers en contexte non sécurisé** (`file://`, http) : `navigator.clipboard` échoue. Atténuation : repli `<textarea>` prévu et testé.
6. **Impression depuis un navigateur intégré** (Instagram, Facebook) : `window.print()` peut ne rien faire. Atténuation : texte d'aide sous le bouton.
7. **Densité du DOM** : 18 compétences + 6 caractéristiques + aptitudes ≈ 250 nœuds. Aucun risque de performance réel ; **aucune virtualisation** ne sera introduite (YAGNI), c'est écrit ici pour couper court à la tentation.
8. **Dérive de périmètre vers la fiche de jeu.** La fiche consultable attire naturellement « juste un compteur de PV ». Le tableau Hors périmètre est le garde-fou ; toute exception passe par une justification écrite comme celle des cases papier.
