# Arbitrage des plans — revue de lots

Les cinq lots ont planifié en parallèle. Ce document tranche les conflits et fait
autorité sur les plans individuels. **En cas de désaccord entre un plan de lot et
ce fichier, ce fichier gagne.**

---

## A. Conflits entre lots (à corriger dans les plans)

### A1. Trois définitions incompatibles du brouillon

| Lot | Nom | Forme des choix |
|---|---|---|
| 1 | `BrouillonPersonnage` (français) | `reponses: Record<ChoixId, string[]>` |
| 2 | `CharacterDraft` (anglais) | `choices: Record<ChoiceSlotId, string[]>` |
| 4 | `CharacterDraft` (anglais) | `skillChoices[]`, `languageChoices[]`, `toolChoices[]`, `featureChoices{}`, `spellChoices{}` |

**Tranché : la forme du lot 2 gagne.** Un seul dictionnaire `choices`, clé =
identifiant de créneau. La forme du lot 4 (un tableau par catégorie) casse
l'uniformité que les lots 1 et 2 ont tous les deux identifiée comme la décision
structurante : elle rend l'invalidation en cascade impossible à écrire sans un
`switch` par catégorie, et oblige à toucher le type à chaque nouvelle sorte de
choix (violation directe d'Ouvert/Fermé).

`CharacterDraft` est **défini dans `src/domain/draft.ts`** et importé par `state/`,
`data/` et les tests. Une seule déclaration dans tout le dépôt.

### A2. Langue du code — la charte a été violée par deux lots sur quatre

Lots 1 et 3 ont écrit le domaine et les hooks en français (`modificateur`,
`trouverRace`, `useChoixRace`, `--c-texte`). Lots 2 et 4 en anglais. Mélanger est
le pire résultat possible.

**Tranché : anglais dans le code, sans exception** (charte §6, déjà écrite avant
les plans). `abilityModifier`, `findRace`, `useRaceChoice`, `--color-text`.
Restent en français : les chaînes affichées, les identifiants de contenu
(`'demi-orc'`, `'roublard'`), et les noms de tests.

Le point 6 de la charte est clarifié pour couper court : cela vaut aussi pour les
noms de hooks, de variables CSS, de fichiers et de dossiers.

### A3. Identifiant de créneau de choix

| Lot | Convention |
|---|---|
| 1 | `'roublard/competences'` |
| 2 | `'class:roublard:skills'` |
| 4 | `'style-de-combat'` (aucun parent) |

**Tranché : `source:parentId:subject`** → `class:roublard:skills`,
`race:haut-elfe:cantrip`, `background:acolyte:languages`.

C'est l'exigence la mieux argumentée de toute la revue : parce que l'identifiant
porte la décision parente, changer de classe ferme mécaniquement tous les créneaux
de l'ancienne et la purge devient gratuite — **zéro ligne de code par catégorie**.
La forme du lot 4 rendrait la cascade impossible.

### A4. Un seul type de créneau, un seul type d'option

Trois noms pour la même chose : `Question`/`OptionQuestion` (lot 1),
`ChoiceSlot`/`ChoiceOption` (lot 2), `OptionChoix`/`OptionMultiple` (lot 3).

**Tranché** : `ChoiceSlot` / `ChoiceOption`, définis dans `src/domain/choice.ts`,
produits par `openChoices(draft, catalogue)`.

Deux corrections de fond aux propositions initiales :

1. **La réponse ne vit pas dans le créneau.** Le lot 1 mettait `reponse` et
   `complete` dans sa `Question` : ce serait une seconde source de vérité à côté de
   `draft.choices`. Le créneau décrit ce qui est demandé ; le brouillon détient ce
   qui a été répondu.
2. **`ChoiceOption` porte les trois repères comparables** exigés par le lot 3 —
   c'est la meilleure idée d'ergonomie de la revue et aucun autre lot ne l'avait
   prévue. Type figé à un triplet, pas un tableau libre : c'est ce qui garantit la
   comparaison verticale sur 360 px.

```ts
// src/domain/choice.ts
export type ChoiceSlotId = string;            // 'class:roublard:skills'
export type ChoiceSource = 'race' | 'class' | 'background';
export type ChoiceKind =
  | 'skill' | 'language' | 'tool' | 'cantrip' | 'spell'
  | 'ability' | 'equipment' | 'ancestry' | 'fighting-style' | 'expertise';

export type UnavailableReason =
  | { readonly kind: 'already-granted'; readonly source: ChoiceSource }
  | { readonly kind: 'slot-full' };

export interface ChoiceOption {
  readonly id: string;
  readonly label: string;                     // « Discrétion »
  readonly blurb: string;                     // une phrase, vocabulaire de joueur
  readonly facts: readonly [string, string, string];  // repères ALIGNÉS
  readonly details: readonly { title: string; body: string }[];
  readonly unavailable: UnavailableReason | null;
}

export interface ChoiceSlot {
  readonly id: ChoiceSlotId;
  readonly source: ChoiceSource;
  readonly kind: ChoiceKind;
  readonly title: string;                     // « Choisis 2 compétences de roublard »
  readonly help: string;
  readonly pick: number;
  readonly options: readonly ChoiceOption[];
}
```

### A5. Où s'écrit le français — le lot 2 et le lot 3 se contredisent frontalement

Lot 2 : « les messages sont écrits en français **dans `domain/`** ».
Lot 3 : « le lot 2 dit *pourquoi* c'est bloqué, le lot 3 écrit la phrase ».

**Tranché, avec une ligne nette :**

- **Prose de contenu** (nom de race, description de sort, phrase d'usage d'une
  compétence) → `data/`, en français. C'est du contenu, pas de la logique.
- **Phrase qui dépend de valeurs d'exécution** (« Il te reste 2 points, monter la
  Force en coûte 3 ») → composée dans `ui/format/`, à partir d'une **raison
  structurée** rendue par le domaine.

Le domaine ne concatène jamais de phrase. Il rend `{ kind: 'not-enough-points',
required: 3, remaining: 2 }`. Le lot 3 a raison sur le principe, le lot 2 a raison
sur le fait qu'il ne faut pas de couche de traduction : il n'y en a pas, il y a
juste un formateur français, dans la couche qui affiche.

### A6. `ui → data` est autorisé

Le lot 3 a inventé un hook `useGlossaire` dont le seul rôle était de faire
transiter du texte par `state/` pour ne pas enfreindre la règle de dépendance —
et a lui-même qualifié ce hook d'artificiel. Il avait raison de le signaler.

**Tranché : la règle devient**

```
ui → state → domain
ui → data          (lecture de contenu uniquement)
data → domain      (types uniquement)
domain → rien
```

Ce qui compte vraiment est préservé : `domain/` ne dépend de rien, `data/` ne
contient aucune logique. Un composant qui lit une définition de glossaire dans
`data/` n'enfreint aucun principe ; un faux hook, si. Le lot 5 encode cette forme
exacte dans sa règle de lint.

### A7. Le lot 4 s'appuie sur un système de design que le lot 3 refuse d'écrire

Lot 4 : « Réutilisés tels quels : `Button`, `Card`, `Chip`, `Callout`, `Stack` ».
Lot 3 : « Pas de composant générique `Bouton` exporté […] Trois cas identiques
feront un composant ; pas avant. »

**Tranché : le lot 3 a raison** (YAGNI), et c'est lui qui possède `src/ui/`. Le lot
4 se limite à l'inventaire réel du lot 3 (`AppShell`, `ActionBar`, `ChoiceGroup`,
`Explainer`, `TextField`, `Notice`) et déclare ses propres `StatTile` et `DataRow`
dans `ui/sheet/`. Le lot 4 renumérote au passage : **UI = lot 3, état = lot 2**
(il les a intervertis dans tout son plan).

### A8. Frontière lot 3 / lot 4 sur l'écran final

Les deux plans décrivent l'écran de fiche. **Tranché :** le lot 3 possède le cadre,
les jetons, les composants et les écrans 0 à 9 ; le lot 4 possède le récapitulatif,
la fiche, l'impression et l'import/export. Le lot 3 retire l'écran 10 de son plan.

### A9. Parcours canonique — une seule liste

Lot 2 annonçait 8 étapes, lot 3 en montrait 9 à 11, lot 4 écrivait « étape 8 sur 8 ».

**Tranché — 8 étapes, dans cet ordre :**

| # | Étape | Écrans |
|---|---|---|
| 1 | Ta race | race, sous-race *(si applicable)*, créneaux de race |
| 2 | Ta classe | classe, créneaux de classe hors compétences |
| 3 | Tes caractéristiques | méthode, répartition |
| 4 | Ton historique | historique, créneaux d'historique |
| 5 | Ce que tu sais faire | créneaux de compétences, langues, outils |
| 6 | Tes sorts | tours de magie, sorts *(classes lanceuses seulement)* |
| 7 | Ton équipement | options de départ |
| 8 | Ton identité | nom, alignement, personnalité |
| — | Récapitulatif puis fiche | hors numérotation d'étape |

**Changement de fond par rapport au plan du lot 2** : les créneaux de compétences
sont regroupés à l'étape 5, **après** l'historique, au lieu d'être accrochés
derrière la classe. Conséquence directe : l'historique a déjà donné ses compétences
fixes quand le joueur choisit les siennes, donc le cas « Perception en double »
devient inatteignable en marche avant. On ne supprime pas le mécanisme de
disponibilité (un retour en arrière peut toujours le déclencher), mais on cesse de
le faire vivre au joueur à chaque partie.

L'affichage reste « Étape 3 sur 8 » ; la barre fine mesure les écrans.

### A10. `index.html` — le lot 5 casse deux exigences du lot 3

Le lot 3 a démontré deux prérequis, le lot 5 a écrit un `index.html` qui les
contredit tous les deux.

| Point | Lot 3 | Lot 5 | Tranché |
|---|---|---|---|
| `viewport` | `viewport-fit=cover` **obligatoire** | absent | **Lot 3.** Sans lui `env(safe-area-inset-*)` vaut `0px` : le problème est invisible en développement, et les boutons passent sous la barre d'accueil de l'iPhone en production. |
| `color-scheme` | `light` seul | `light dark` | **Lot 3.** Annoncer `dark` sans thème sombre fait inverser les contrôles natifs par le système et détruit les contrastes vérifiés du lot 3. On annonce `light` tant qu'il n'y a pas de thème sombre. |

`index.html` appartient au lot 5, mais ces deux attributs sont dictés par le
lot 3. Ils sont commentés dans le fichier pour que personne ne les « nettoie ».

### A11. Interdiction des fichiers barils — trop large telle quelle

Le lot 5 interdit « aucun fichier `index.ts` de ré-export dans `src/` », pour
empêcher qu'un baril ouvre un chemin de `domain/` vers `ui/` que le motif de lint
ne verrait pas. Le raisonnement est juste, la formulation est trop large : le
lot 1 a besoin de `src/data/classes/index.ts` (assemblage des 12 classes) et d'un
module qui compose le `Catalogue`.

**Tranché — la règle devient :**

- Interdit : tout baril **à la racine de `src/`** ou **à la racine d'une couche**
  (`src/index.ts`, `src/domain/index.ts`, `src/ui/index.ts`…). C'est là, et là
  seulement, que naît le chemin détourné entre couches.
- Autorisé : un module d'agrégation **à l'intérieur** d'une couche, qui compose
  du contenu et ne ré-exporte pas d'autres couches. `src/data/classes/index.ts`
  et `src/data/catalogue.ts` sont légitimes.

### A12. Références à la charte

Le lot 5 cite la charte par numéro de ligne (« §139 », « §41 », « §165 »). Ces
numéros ne correspondent à rien et deviendront faux à la première modification.
**Citer les sections par leur nom** (« Principes non négociables », « Tests »).

### A13. Ce que le lot 5 apporte et qui s'impose aux autres

Trois décisions du lot 5 contraignent les autres lots et sont retenues telles
quelles :

1. **Les données SRD sont des modules TypeScript importés, jamais des fichiers
   récupérés par `fetch`.** Conséquence directe du sous-chemin GitHub Pages : une
   URL absolue écrite à la main casse en production. Contrainte pour le lot 1.
2. **Aucune URL commençant par `/` dans le code.** Un actif s'importe ; une URL
   construite part de `import.meta.env.BASE_URL`.
3. **Un test d'intégration qui monte `<App />` et parcourt tout l'assistant est
   obligatoire.** C'est la compensation explicite du renoncement à Playwright, et
   il couvre la persistance `localStorage` d'un rechargement à l'autre. Il est à
   la charge conjointe des lots 2 et 3.

Est également retenue, sans réserve, l'analyse du lot 5 sur la couverture de
tests : un seuil **uniquement sur `src/domain/`**, aucun ailleurs. L'argument
— « un seuil global apprend à tromper la mesure » — est le bon.

### A14. Versions de dépendances à vérifier à l'installation

Le lot 5 propose un jeu de versions majeures récentes (Vite 8, Vitest 4,
ESLint 10, `@vitejs/plugin-react` 6). Elles sont plausibles mais n'ont pas été
installées. **À vérifier réellement à l'étape 2 de la mise en place**, pas à
recopier de confiance : si une majeure ne s'installe pas ou casse, on descend
d'une version et on le note. Le plan a raison sur un point qui compte plus que
les numéros : `package-lock.json` versionné et `npm ci` partout.

---

## B. Décisions de périmètre (réduction assumée)

### B1. Deux méthodes de caractéristiques, pas trois

Le lot 1 prévoyait répartition de points, tableau standard **et** 4d6 garde-3.

**Tranché : répartition de points + tableau standard. Les jets de dés sortent de
la v1.** Ils coûtent un écran de plus (lancer, relancer, affecter), un état non
dérivable à persister (`rolled`), une frontière d'aléatoire injectée dans le
domaine, et l'action `SET_ROLLED_SCORES` — pour une méthode que la moitié des
tables n'utilise pas. C'est exactement ce que YAGNI vise. Premier candidat à
l'ajout après la v1 ; l'ajout sera purement additif.

Disparaissent donc : `AbilityInput.rolled`, `SET_ROLLED_SCORES`, la frontière
`random` du domaine, la méthode `'dice'`.

### B2. Descriptions de sorts : courtes en v1

Le lot 1 a chiffré honnêtement le vrai coût du projet : ~90 000 caractères de
traduction française à écrire à la main, très loin devant le code. C'est le
risque n° 1 de la livraison.

**Tranché :** la v1 livre pour chaque sort toutes les données mécaniques (niveau,
école, temps d'incantation, portée, composantes, durée, concentration, rituel,
classes) et un **résumé d'effet de 1 à 3 phrases en français**. La prose longue
est un enrichissement ultérieur, purement additif : un champ, aucune structure à
changer. Le champ `description` devient donc `summary: string` (obligatoire) et
`fullText: string | null` (facultatif, `null` en v1).

Conséquence pour le lot 3 : le `<details>` « Texte complet » n'apparaît que si
`fullText` existe. Conséquence pour le poids : la charge de données v1 tombe très
en dessous du budget, ce qui confirme qu'aucun découpage n'est nécessaire.

### B3. Historique « personnalisé » — la charte est amendée

Le SRD 5.1 ne contient qu'un seul historique (Acolyte). Un créateur de personnage
avec un seul historique est inutilisable. Le lot 1 a bien posé le problème et
recommandé l'option (b).

**Tranché : option (b) retenue.** On ajoute un historique « Personnalisé » construit
uniquement sur les règles génériques d'historique du SRD (2 compétences au choix,
2 outils ou langues, un paquetage, traits/idéal/lien/défaut saisis librement).
C'est de l'assemblage de règles SRD, pas du contenu inventé. L'interface l'annonce
explicitement. La charte §9 est amendée en ce sens.

### B4. Pas de confirmation avant un changement destructeur

Le lot 2 proposait `describeImpact` + une boîte de confirmation. Le lot 3 n'a
aucun composant de dialogue et refuse (à raison) la feuille glissante et ses
pièges de focus.

**Tranché : `describeImpact` sort de la v1.** Le dispositif du lot 2 est déjà
suffisant : l'avis a posteriori (« tes compétences de roublard ont été remises à
zéro ») plus un retour arrière à un doigt. Ajouter un modal pour éviter une
annulation d'un geste est un mauvais échange.

### B5. Confirmé sans changement

- Impression par `window.print()` + `@media print`, **jsPDF et html2canvas
  refusés** — l'argumentation du lot 4 est solide (PDF vectoriel gratuit contre
  200 Ko et un moteur de mise en page réécrit).
- Fiche en page unique à défilement, onglets rejetés — l'argument « les onglets
  cassent l'impression et la recherche dans la page » est décisif.
- Aide contextuelle par `<details>` natif, feuille glissante rejetée.
- Groupes de choix en `fieldset`/`radio` natifs, aucun `role="radiogroup"` fait main.
- Barre d'actions en **rangée de grille** sur `100dvh`, pas en `position: fixed`.
- Validateur d'import écrit à la main plutôt que zod/valibot.
- Pas de thème sombre en v1, avec `color-scheme: light` déclaré.
- Pas d'annulation/rétablissement, pas de brouillons multiples, pas de routeur.
- Aucun découpage dynamique des données en v1, seuil de déclenchement écrit
  d'avance (150 Ko gzip).

---

## C. Points ouverts, remontés à l'utilisateur

1. **Nom du projet.** « D&D Beyond Franché » reprend le nom d'un service de
   Wizards of the Coast. La licence CC BY couvre le contenu du SRD, **pas les
   marques**. Sans incidence tant que le projet reste privé ; à trancher avant
   toute publication. Une mention « non affilié » visible est ajoutée d'office.
2. **Jets de dés (B1)** et **prose longue des sorts (B2)** : reportés, pas
   abandonnés. À rouvrir quand la v1 tourne.
