# Lot 3 — Interface mobile-first & design (`src/ui/`)

> Ce plan est subordonné à `docs/plans/00-arbitrage.md`, qui fait autorité.
> Version 2 : nommage anglais (charte §6), `ui → data` autorisé (§A6), parcours à
> 8 étapes (§A9), écran de fiche retiré (§A8), deux méthodes de caractéristiques (§B1).

## Objectif

Rendre l'assistant utilisable **au pouce, sur 360 px**, par quelqu'un qui n'a jamais joué.
Ce lot livre les jetons de design, le cadre d'écran, neuf composants et les écrans des
**étapes 1 à 8**. Il ne calcule aucune règle : il consomme les hooks de `state/` et lit du
contenu dans `data/`.

Frontière avec le lot 4 : je possède le cadre, les jetons, les composants et les écrans de
l'assistant ; le lot 4 possède le récapitulatif, la fiche, l'impression et l'import/export.
Il réutilise mes composants et déclare les siens dans `ui/sheet/`.

---

## Principes d'écran

1. **Une décision par écran.** Le `h1` énonce la décision. Deux décisions = deux écrans —
   c'est pourquoi la méthode de caractéristiques est un écran séparé de la répartition (§B1).
2. **Trois zones invariables** : en-tête, contenu défilant, barre d'actions. Rien ne flotte.
3. **Jamais de blocage.** « Suivant » est toujours actif ; un choix manquant est une ligne
   `incomplete` au récapitulatif, pas une erreur.
4. **Aligner plutôt que juxtaposer.** Chaque option expose `facts: readonly [string, string,
string]` (§A4) : trois repères, même sens à chaque indice, même place sur chaque carte.
   On compare en balayant verticalement. Aucun tableau, aucun défilement horizontal.
5. **Le mot avant la couleur.** « Choisi », « Erreur : », « Déjà acquise ». La couleur
   renforce, jamais elle seule.
6. **Zéro icône seule.** Seuls `✓` et `▸` sont admis, toujours collés à un mot.

---

## Jetons de design (`src/ui/styles/tokens.css`)

Un seul fichier de variables sur `:root`. Aucune valeur brute dans les modules CSS.
**Noms anglais, valeurs inchangées** — elles ont été calculées et validées.

### Couleurs — thème clair, ratios WCAG calculés

| Variable                   | Valeur    | Usage                                                                               | Contraste                                               |
| -------------------------- | --------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `--color-page`             | `#F7F5F2` | fond général, blanc cassé chaud (pas jaune)                                         | —                                                       |
| `--color-surface`          | `#FFFFFF` | cartes, champs                                                                      | —                                                       |
| `--color-surface-selected` | `#EAEFF5` | carte sélectionnée                                                                  | —                                                       |
| `--color-surface-error`    | `#FDF0EE` | bloc d'erreur                                                                       | —                                                       |
| `--color-text`             | `#1B1A18` | texte courant, titres                                                               | **15,98** / page                                        |
| `--color-text-muted`       | `#57534C` | accroches, descriptions                                                             | **7,03** / page                                         |
| `--color-text-subtle`      | `#6E6960` | méta 14 px                                                                          | **5,01** / page                                         |
| `--color-accent`           | `#1F4E79` | **accent 1, interactif** : bouton principal, bord sélectionné, barre de progression | **7,96** / page ; blanc dessus **8,66**                 |
| `--color-accent-pressed`   | `#173C5C` | état pressé                                                                         | blanc dessus **11,43**                                  |
| `--color-acquired`         | `#3F6B3F` | **accent 2, acquis** : « Choisi », « Étape complète »                               | **5,70** / page ; **5,36** / sélectionné                |
| `--color-error`            | `#9B2415` | état d'erreur. Pas un accent : jamais décoratif                                     | **7,26** / page ; **7,10** / fond erreur                |
| `--color-rule`             | `#E3DED5` | filets **décoratifs** uniquement                                                    | 1,23 — assumé, redondant avec du texte                  |
| `--color-control-border`   | `#8A8275` | contour de tout élément interactif                                                  | **3,49** / page, **3,80** / blanc → ≥ 3:1 (WCAG 1.4.11) |
| `--color-focus`            | `#1B1A18` | anneau de focus                                                                     | **15,98** / page                                        |
| `--color-disabled-bg`      | `#EDE9E3` | contrôle désactivé                                                                  | —                                                       |
| `--color-disabled-text`    | `#6E6960` | texte désactivé                                                                     | **4,51** / fond désactivé                               |

- Un **seul** accent interactif : aucune ambiguïté sur « où appuyer ».
- Le **vert d'armoirie** ne marque que l'acquis, jamais cliquable — pas de confusion.
- Le **rouge** n'est pas compté comme accent : il n'apparaît que préfixé du mot « Erreur ».
  Rouge et vert ne s'opposent jamais dans un même composant.
- Le **rail de progression** est volontairement sous 3:1 : il est strictement redondant
  avec « Étape 3 sur 8 » et ne porte aucune information.
- L'anneau de focus est en **encre, pas en accent** : un anneau bleu sur bouton bleu tombe
  à 2,01. Avec `outline-offset: 2px` l'anneau se pose sur le fond de page (15,98) — c'est
  l'offset qui rend l'anneau conforme partout.

### Typographie

```css
--font-ui:
  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
  'Noto Sans', sans-serif;
--font-title:
  'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, 'Noto Serif',
  serif;
```

Deux piles **système**, zéro octet téléchargé : pas de FOUT, pas de décalage au chargement,
pas de requête réseau sur un site consulté à table avec trois barres de réseau. La serif ne
sert qu'aux `h1`/`h2` : elle donne le ton « vieux grimoire » sans une seule image, ce qui
est aussi la seule façon d'être « médiéval discret » sans copier d'habillage (charte §9).

| Variable          | Valeur             | Usage                                        |
| ----------------- | ------------------ | -------------------------------------------- |
| `--font-size-100` | `0.875rem` (14 px) | méta, notes, coût                            |
| `--font-size-200` | `1rem` (16 px)     | **texte, champs, boutons — plancher absolu** |
| `--font-size-300` | `1.125rem` (18 px) | titre de carte, valeur de score              |
| `--font-size-400` | `1.375rem` (22 px) | `h1` d'écran (serif)                         |
| `--font-size-500` | `1.75rem` (28 px)  | grand chiffre (`tabular-nums`)               |

`--line-height-body: 1.5` ; `--line-height-title: 1.25`. Graisses 400 / 600 / 700.
**16 px minimum sur tout `input`** : sous 16 px iOS zoome au focus, casse la mise en page
et crée un défilement horizontal — cause n° 1 du « ça bouge tout seul ».

### Espacement, rayons, ombres, dimensions

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;

--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;

/* Deux ombres, fonctionnelles : elles disent « cette zone flotte ». Aucune sur les cartes. */
--shadow-header: 0 1px 0 var(--color-rule);
--shadow-actions: 0 -1px 0 var(--color-rule), 0 -6px 16px rgb(27 26 24 / 0.08);

--touch-target: 44px;
--content-max: 36rem;
```

Pas de rayon « pilule », pas de dégradé, pas d'ombre sur les cartes : sobriété et coût de
peinture nul sur téléphone d'entrée de gamme.

---

## Cadre d'écran mobile (`src/ui/shell/AppShell.tsx`)

### 1. La barre d'actions n'est PAS `position: fixed` _(retenu §B5)_

```css
.app {
  height: 100vh; /* repli */
  height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto; /* header | content | actions */
  overflow: hidden; /* la page ne défile jamais */
}
.content {
  overflow-y: auto;
  overscroll-behavior: contain;
}
```

Une **rangée de grille** supprime d'un coup : le contenu masqué sous la barre, le
`padding-bottom` magique à maintenir, et les bugs de repositionnement de `position: fixed`
pendant le défilement élastique d'iOS. La barre est toujours visible parce qu'elle est
_hors_ du conteneur défilant, pas parce qu'elle est collée.

### 2. `100vh` ment sur mobile → `dvh`

Sur iOS Safari et Chrome Android, `1vh` est calé sur le viewport **le plus grand** (barre
d'URL rétractée). Au chargement, barre déployée, un `height: 100vh` dépasse la fenêtre
visible de 60 à 110 px : la barre d'actions se retrouve **sous le pli**, exactement ce que
la charte interdit. `100dvh` suit la hauteur réellement visible (Safari 15.4+, Chrome 108+,
Firefox 101+) ; la double déclaration sert de repli.

Contrepartie connue : `dvh` change pendant le défilement quand la barre d'URL se rétracte,
donc reflow. Acceptable ici parce que la variation est absorbée par la rangée `1fr` :
l'en-tête et la barre d'actions ne bougent pas d'un pixel. Aucune hauteur n'est animée.
**Repli documenté, à trancher sur iPhone réel et pas en réunion** (§A5 du point 4 de la
revue) : si un tremblement est constaté, `height: 100svh` — valeur stable, quelques pixels
perdus barre rétractée.

### 3. `env(safe-area-inset-*)` — encoche et barre d'accueil

Prérequis dicté au lot 5 et commenté dans `index.html` (§A10) :

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

Sans `viewport-fit=cover`, `env()` vaut `0px` : le bug est **invisible en développement** et
les boutons passent sous la barre d'accueil de l'iPhone en production.

```css
.actions {
  padding-block: var(--space-3);
  padding-block-end: calc(var(--space-3) + env(safe-area-inset-bottom, 0px));
  padding-inline: max(var(--space-4), env(safe-area-inset-left, 0px))
    max(var(--space-4), env(safe-area-inset-right, 0px));
}
.header {
  padding-block-start: calc(var(--space-2) + env(safe-area-inset-top, 0px));
}
```

Les insets latéraux comptent en **paysage** : sans eux l'encoche mange « Précédent ».

### 4. Le clavier virtuel

- **Android (Chrome)** : le viewport visuel se réduit, `100dvh` se réduit, la barre reste
  au-dessus du clavier. Rien à faire.
- **iOS Safari** : le viewport de mise en page ne se réduit pas ; le clavier se superpose et
  la barre passe derrière. C'est un comportement du système, pas un défaut de CSS.

Stratégie, par coût croissant :

1. **Éviter.** Deux écrans seulement ont un champ important (identité, historique
   personnalisé). Le champ est dans un `<form>` avec `enterkeyhint="done"` : la touche du
   clavier valide. La barre revient dès la fermeture du clavier.
2. **Ne pas aggraver.** `font-size: 16px` partout ; le champ de recherche est en tête d'une
   zone collante, donc jamais recouvert.
3. **Si et seulement si le test sur iPhone réel échoue** : un hook de présentation
   `useKeyboardInset()` (≈ 20 lignes, `ui/shell/`) qui écoute `window.visualViewport`,
   calcule `innerHeight − (visualViewport.height + visualViewport.offsetTop)` et l'expose en
   `--keyboard-inset`, appliqué en `translateY` sur `.actions`. **Non écrit d'avance.**

### 5. Pas de défilement horizontal, jamais

Pas de `overflow-x: hidden` sur `body` (ça crée un conteneur de défilement et masque le vrai
problème). À la source : aucune largeur fixe, `min-width: 0` sur tout enfant de grille ou de
flex, `overflow-wrap: anywhere` sur les titres, `hyphens: auto` avec `<html lang="fr">`.

### 6. Contrat d'impression avec le lot 4

`AppShell` pose `data-print="hide"` sur son `<header>` et son `<footer>` ; `ActionBar` le
pose sur sa racine ; **tout élément collant de `ui/` porte `data-print="hide"`**. Ce sont
des attributs stables : la feuille `ui/styles/print.css` du lot 4 ne peut pas cibler des
classes CSS Modules, dont les noms sont hachés. Je ne pose jamais `data-print="only"` — il
appartient au lot 4.

### 7. Changement d'écran, avis a posteriori

`AppShell` reçoit `screenKey`. À son changement : `content.scrollTop = 0`, focus sur le `h1`
(`tabIndex={-1}`), `document.title` mis à jour. En tête de la zone défilante, `AppShell`
rend les avis de `useNotices()` — c'est le dispositif retenu en §B4 à la place d'une boîte
de confirmation : « Tes deux compétences de roublard ont été remises à zéro. » `role="status"`,
bouton « Fermer » de 44 px avec libellé texte.

### Squelette

```
┌────────────────────────────────────────────┐  360 px
│ ‹ Retour      Étape 3 sur 8      Ma fiche  │  header ~52 px + safe-area haute
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  rail 4 px, mesuré en ÉCRANS
├────────────────────────────────────────────┤
│ [avis : « … remises à zéro. »   Fermer ]   │  useNotices(), si présent
│                                            │
│              zone défilante                │  1fr — seul élément qui défile
│                                            │
├────────────────────────────────────────────┤
│  [ ‹ Précédent ]      [    Suivant ›    ]  │  48 px, cibles 44 px
│  Tu pourras revenir sur ce choix.          │  note 14 px
│············ safe-area-inset-bottom ········│
└────────────────────────────────────────────┘
```

---

## Inventaire des composants (`src/ui/components/`)

Neuf fichiers. Un composant utilisé une seule fois n'y figure pas : il vit dans son écran.
Le lot 4 se limite à cet inventaire (§A7) — ni `Button`, ni `Card`, ni `Chip`, ni `Stack`.

### 1. `AppShell`

```ts
export interface AppShellProps {
  header: React.ReactNode;
  actions: React.ReactNode;
  screenKey: string; // change → défilement remis à zéro + focus sur le h1
  children: React.ReactNode;
}
```

Toute la mécanique `dvh` / safe-area / clavier / impression existe **en un seul endroit**.

### 2. `ProgressBanner`

```ts
export interface ProgressBannerProps {
  stepIndex: number; // 1-based
  stepCount: number; // 8
  stepLabel: string; // « Tes caractéristiques »
  screenIndex: number; // la barre fine mesure les écrans (§A9)
  screenCount: number;
  onBack?: () => void;
  onOpenSummary: () => void; // « Ma fiche » → récapitulatif (lot 4)
}
```

Les cinq champs viennent tels quels de `useWizard().progress`. Le texte annonce l'étape
(stable, encourageant), la barre mesure les écrans (précise) : annoncer « écran 7 sur 19 »
découragerait. `role="progressbar"` avec `aria-valuenow/min/max` et
`aria-label="Étape 3 sur 8"`.

### 3. `ChoiceGroup`

```ts
import type { ChoiceSlot } from '../../domain/choice';

export interface ChoiceGroupProps {
  slot: ChoiceSlot; // porte title, help, pick, options
  selected: readonly string[];
  remaining: number;
  onToggle: (optionId: string) => void;
  fieldName: string; // attribut name, stable
  error?: string;
  empty?: React.ReactNode;
}
```

**L'union discriminée de la v1 disparaît** : `useChoiceSlot` rend un `toggle` uniforme, et
`slot.pick === 1` détermine `radio` contre `checkbox`. Un seul chemin de données, une
branche de deux lignes sur la sémantique HTML. C'est le gain direct de §A4.

Huit usages réels : sous-race, créneaux de race, créneaux de classe, compétences, langues,
outils, sorts, équipement — plus les choix locaux (méthode de caractéristiques, alignement)
pour lesquels l'écran construit deux `ChoiceOption` littérales.

### 4. `SelectableCard` _(interne à `ChoiceGroup`, non exportée)_

```ts
interface SelectableCardProps {
  option: ChoiceOption;
  inputType: 'radio' | 'checkbox';
  fieldName: string;
  checked: boolean;
  onSelect: (optionId: string) => void;
}
```

Rien d'autre n'en a besoin, donc elle n'est pas exportée hors du dossier. **Natif d'abord** :

```html
<label class="card">
  <input type="radio" name="race" value="nain-des-collines" class="input" />
  <span class="body"> … label, blurb, facts, details … </span>
</label>
```

`.input { position:absolute; width:1px; height:1px; clip-path: inset(50%); }` — jamais
`display:none`, qui retire le champ de la tabulation et des lecteurs d'écran. Focus :
`.input:focus-visible + .body` (compatible partout), `.card:has(:focus-visible)` en
amélioration. `touch-action: manipulation` supprime le délai de 300 ms.
`option.unavailable` → `disabled` + raison formatée par `ui/format/unavailable.ts`.
Le `<details>` n'est rendu que si `option.details.length > 0` — en v1 les sorts n'ont pas de
prose longue (§A19), donc leurs cartes n'ont aucun dépliant.

### 5. `AbilityStepper`

```ts
export interface AbilityStepperProps {
  label: string; // « Force »
  purpose: string; // « Frapper, porter, briser. »
  score: number;
  racialBonus: number;
  bonusSource: string | null; // « nain »
  total: number;
  modifier: string; // « +2 », déjà signé par ui/format
  increaseCost: number | null;
  canIncrease: boolean;
  canDecrease: boolean;
  blockedReason: string | null; // phrase composée par ui/format
  onIncrease: () => void;
  onDecrease: () => void;
}
```

Six instances sur un écran, une mécanique tactile non triviale. Il ne calcule rien : les
booléens et le coût viennent du domaine. L'écran « tableau standard » réutilise la même
mise en page de ligne via `abilityRow.module.css` partagé dans le dossier de l'écran, avec
un `<select>` natif à la place des deux boutons — un composant local, pas d'inventaire.

### 6. `Explainer`

```ts
export interface ExplainerProps {
  label: string; // « Comment ça marche ? »
  children: React.ReactNode;
}
```

Seul mécanisme d'aide du site. `<details>/<summary>` natif, `<summary>` de 44 px, libellé
qui bascule en « Masquer » à l'ouverture via `onToggle`.

### 7. `ActionBar`

```ts
export interface ActionBarProps {
  back?: { label: string; onClick: () => void };
  primary: { label: string; onClick?: () => void; type?: 'button' | 'submit' };
  note?: string;
}
```

`grid-template-columns: auto 1fr` : « Précédent » compact à gauche, action principale large
à droite, 8 px d'écart minimum, 48 px de haut. Porte `data-print="hide"`.

### 8. `TextField`

```ts
export interface TextFieldProps {
  id: string;
  label: string; // <label> visible, jamais un placeholder-libellé
  defaultValue: string;
  onCommit: (value: string) => void; // flou + Entrée — s'aligne sur useDraftText
  onInput?: (value: string) => void; // frappe, recherche locale uniquement
  type?: 'text' | 'search';
  hint?: string;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  enterKeyHint?: 'next' | 'done' | 'search';
  maxLength?: number;
}
```

**Non contrôlé par conception** : `useDraftText` du lot 2 rend `{ initial, commit }`
précisément pour ne pas re-rendre l'assistant à chaque frappe. `onInput` n'est branché que
sur la recherche de sorts, où l'état est local et ne touche pas le brouillon.

### 9. `Notice`

```ts
export interface NoticeProps {
  tone: 'error' | 'reminder';
  title?: string;
  children: React.ReactNode;
  live?: boolean; // true → role="alert" (error) ou role="status" (reminder)
  onDismiss?: () => void; // rendu en bouton « Fermer » 44 px, libellé texte
}
```

Rend les `useScreenIssues(screenId)`, les avis de `useNotices()` et les erreurs de stockage.
Le ton se lit dans le texte avant la couleur ; un filet gauche de 4 px double l'information.

---

## Écrans détaillés

Parcours canonique de §A9 : **8 étapes**, environ quinze à dix-neuf écrans selon les choix.
L'écran de fiche ne m'appartient plus (§A8).

| Étape                  | Écrans que je rends                                                    |
| ---------------------- | ---------------------------------------------------------------------- |
| —                      | Accueil                                                                |
| 1 Ta race              | race · sous-race _(si applicable)_ · créneaux de race                  |
| 2 Ta classe            | classe · créneaux de classe hors compétences                           |
| 3 Tes caractéristiques | **méthode** · répartition                                              |
| 4 Ton historique       | historique · créneaux d'historique · champs libres si « Personnalisé » |
| 5 Ce que tu sais faire | compétences · langues · outils                                         |
| 6 Tes sorts            | tours de magie · sorts _(classes lanceuses)_                           |
| 7 Ton équipement       | options de départ                                                      |
| 8 Ton identité         | nom · alignement · personnalité                                        |
| —                      | → récapitulatif, puis fiche : **lot 4**                                |

**Un seul composant d'écran générique**, `ChoiceSlotScreen`, rend tous les écrans de créneau
— soit la grande majorité : il appelle `useChoiceSlot(slotId)`, rend `slot.title` en `h1`,
`slot.help` dans un `Explainer`, un `ChoiceGroup` et une `ActionBar`. Les écrans écrits à la
main se réduisent à : accueil, race, classe, historique, méthode, répartition, identité.

### Étape 1 — Ta race _(difficile : beaucoup de contenu à comparer)_

**Objectif** : choisir le peuple d'origine en comprenant ce qu'il change.

```
┌────────────────────────────────────────────┐
│ ‹ Retour      Étape 1 sur 8      Ma fiche  │
│ ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
├────────────────────────────────────────────┤
│ Choisis ta race                            │  h1 22 px serif
│ Le peuple d'où tu viens. Ça change tes     │  16 px
│ scores et te donne des capacités.          │
│ ▸ C'est quoi une « race » ?                │  Explainer, 44 px
│                                            │
│ ┌────────────────────────────────────────┐ │  bord 2 px accent
│ │ Nain des collines            ✓ Choisi  │ │  18 px / 14 px vert
│ │ Solide, tenace, dur au mal.            │ │  blurb
│ │ Scores       +2 Constitution, +1 Sag.  │ │  facts[0]
│ │ Déplacement  7,50 m · taille moyenne   │ │  facts[1]
│ │ Capacité     Vision dans le noir       │ │  facts[2]
│ │ Ce que ça change : Constitution 14,    │ │  useCharacterSheet()
│ │ 12 points de vie                       │ │
│ │ ▸ En savoir plus                       │ │
│ └────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────┐ │  bord 1 px control-border
│ │ Elfe des bois                          │ │
│ │ Rapide, discret, à l'aise en forêt.    │ │
│ │ Scores       +2 Dextérité, +1 Sagesse  │ │
│ │ Déplacement  10,50 m · taille moyenne  │ │
│ │ Capacité     Vision dans le noir       │ │
│ │ ▸ En savoir plus                       │ │
│ └────────────────────────────────────────┘ │
│              … 7 autres races …            │
├────────────────────────────────────────────┤
│  [ ‹ Précédent ]      [    Suivant ›    ]  │
└────────────────────────────────────────────┘
```

**Comparer sans tableau** : les trois `facts` sont aux mêmes coordonnées sur chaque carte,
avec le même libellé de gauche. Le lecteur balaie verticalement la colonne « Scores » de
toutes les cartes — c'est un tableau lu en colonne, sans jamais dépasser 360 px. Le type
l'impose : triplet figé (§A4), `'—'` quand une option n'a rien à dire à un indice.

Le texte SRD complet est dans `details`, replié : neuf cartes tiennent en trois écrans de
défilement au lieu de quinze.

**Source des données** : les options de race sont du **contenu**, donc lues directement dans
`data/` — `label`, `blurb`, `facts`, `details` sont des champs de la fiche de contenu. C'est
le bénéfice concret de §A6 : plus de faux hook de transit. La ligne « Ce que ça change » est
la seule partie dépendante du brouillon ; elle vient de `useCharacterSheet()` et se compose
dans `ui/format/impact.ts`.

**Interaction** : appui n'importe où sur la carte, radio natif, la précédente se décoche.
Aucun défilement automatique, aucune animation.
**État vide** : impossible en usage normal ; si la liste est vide, `empty` affiche « Les
races n'ont pas pu être chargées. » + « Réessayer » 44 px.
**État d'erreur** : aucun. Ne rien choisir n'est pas une erreur — « Suivant » passe et le
récapitulatif portera une ligne `incomplete`.

### Étape 3 — Tes caractéristiques _(difficile : chiffres, coûts, + et −)_

**Deux écrans, pas un écran à deux décisions** (§B1 + charte §4).

**Écran 3.1 — la méthode.** Un `ChoiceGroup` de deux options construites sur place, qui
prouve que le triplet de repères généralise :

```
│ Comment veux-tu tes scores ?               │
│ ┌────────────────────────────────────────┐ │
│ │ Répartir des points          ✓ Choisi  │ │
│ │ Tu construis chaque score toi-même.    │ │
│ │ Budget      27 points                  │ │
│ │ Bornes      de 8 à 15 avant bonus      │ │
│ │ Pour qui    tu veux tout maîtriser     │ │
│ └────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────┐ │
│ │ Tableau standard                       │ │
│ │ Six scores tout prêts, à placer.       │ │
│ │ Budget      aucun calcul               │ │
│ │ Bornes      15, 14, 13, 12, 10, 8      │ │
│ │ Pour qui    tu veux aller vite         │ │
│ └────────────────────────────────────────┘ │
```

**Écran 3.2 — la répartition (achat de points).**

```
┌────────────────────────────────────────────┐
│ ‹ Retour      Étape 3 sur 8      Ma fiche  │
├────────────────────────────────────────────┤
│ Répartis tes points                        │
│ Monter un score coûte de plus en plus cher.│
│ ▸ Comment ça marche ?                      │
│┌──────────────────────────────────────────┐│ ← sticky top:0, 44 px
││ Points restants : 12 sur 27              ││   data-print="hide"
│└──────────────────────────────────────────┘│
│ ┌────────────────────────────────────────┐ │
│ │ Force                        ┌───────┐ │ │
│ │ Frapper, porter, briser.     │   +   │ │ │ 44 × 56
│ │ 13 + 1 (nain) = 14           ├───────┤ │ │
│ │ modificateur +2              │   −   │ │ │ 44 × 56
│ │                              └───────┘ │ │
│ └────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────┐ │
│ │ Dextérité                    ┌───────┐ │ │
│ │ Viser, esquiver, se faufiler.│   +   │ │ │
│ │ 12 = 12                      ├───────┤ │ │
│ │ modificateur +1              │   −   │ │ │
│ │                              └───────┘ │ │
│ └────────────────────────────────────────┘ │
│           … 4 autres scores …              │
├────────────────────────────────────────────┤
│  [ ‹ Précédent ]      [    Suivant ›    ]  │
└────────────────────────────────────────────┘
```

**Pourquoi les boutons empilés à droite** : en ligne, `[−] 14 [+]` plus le calcul
« 13 + 1 (nain) = 14 · mod. +2 » demande ~320 px de texte et 96 px de boutons — ça ne tient
pas à 360 px, et pas du tout à 200 % de zoom. Empilés, la colonne de commande fait 56 px et
il reste 260 px de texte qui peut passer sur deux lignes sans rien casser. Bonus : `+`
au-dessus de `−` est l'orientation attendue, et les deux cibles sont du côté du pouce.

**Le budget est collant** (`position: sticky; top: 0`, 44 px) : on ajuste le Charisme tout en
bas en voyant toujours ce qu'il reste. C'est le seul élément collant de l'assistant.

**Interaction** : `aria-label="Augmenter la Force"` — un `+` seul ne serait pas un libellé.
Bouton `disabled` quand `canIncrease` est faux, **avec la raison affichée** en 14 px :
« Il te reste 2 points, monter la Force en coûte 3. » Un bouton grisé sans explication est un
cul-de-sac. Une **unique** région `aria-live="polite"` (pas une par ligne), retardée d'environ
300 ms, annonce « Force 14, modificateur +2. Points restants : 12. »

**Écran 3.2 bis — le tableau standard.** Même mise en page de ligne, mais un `<select>`
natif à la place des deux boutons : le sélecteur système est grand, familier, accessible et
coûte zéro ligne de code. Il liste les six valeurs du `pool`. Choisir une valeur déjà placée
**échange** les deux caractéristiques, et un `role="status"` l'annonce (« 14 est passé de
Dextérité à Force ») — c'est une ligne de reducer contre un flux à impasses.

**État vide** : sans race, les bonus valent 0 et une `Notice reminder` dit « Tu n'as pas
encore de race : les bonus s'ajouteront tout seuls après. »
**État d'erreur** : le reducer refuse le budget négatif ; `invalid` n'est atteignable qu'en
relisant une sauvegarde modifiée à la main, et s'affiche alors dans une `Notice error`.

### Étape 6 — Tes sorts _(difficile : listes longues)_

Deux écrans (tours de magie, puis sorts de niveau 1), tous deux rendus par
`ChoiceSlotScreen`.

```
┌────────────────────────────────────────────┐
│ ‹ Retour      Étape 6 sur 8      Ma fiche  │
├────────────────────────────────────────────┤
│ Choisis 3 tours de magie                   │
│ De petits sorts que tu peux relancer autant │
│ de fois que tu veux. ▸ C'est quoi ?        │
│┌──────────────────────────────────────────┐│ ← sticky
││ 2 sur 3 choisis · Lumière, Prestidigit.  ││   récapitulatif en LECTURE
││ ┌──────────────────────────────────────┐ ││   SEULE
││ │ Rechercher un sort                   │ ││   44 px, 16 px, type=search
││ └──────────────────────────────────────┘ ││
│└──────────────────────────────────────────┘│
│ ┌────────────────────────────────────────┐ │
│ │ Lumière                      ✓ Choisi  │ │
│ │ Fait briller un objet comme une torche.│ │  summary (§B2)
│ │ Portée      contact                    │ │
│ │ Durée       1 heure                    │ │
│ │ Incantation 1 action                   │ │
│ └────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────┐ │
│ │ Rayon de givre                         │ │
│ │ Un trait de froid qui blesse et ralentit│ │
│ │ Portée      18 mètres                  │ │
│ │ Durée       instantané                 │ │
│ │ Incantation 1 action                   │ │
│ └────────────────────────────────────────┘ │
│           … 28 autres sorts …              │
├────────────────────────────────────────────┤
│  [ ‹ Précédent ]      [    Suivant ›    ]  │
└────────────────────────────────────────────┘
```

Quatre décisions pour tenir la longueur :

1. **Cartes courtes.** `summary` d'une à trois phrases plus les trois `facts` alignés. En v1
   la prose longue n'existe pas (§A19) : **aucun dépliant sur les cartes de sort**, ce qui divise la
   hauteur de liste par trois. Quand la prose longue arrivera, le `<details>` apparaîtra tout
   seul, sans changer une ligne de composant.
2. **Recherche**, pas de facettes. `TextField type="search"` avec `onInput`, filtrage par nom
   et par `summary` dans un `useMemo` local — c'est du filtrage d'affichage, pas une règle.
3. **Récapitulatif collant en lecture seule.** On voit ses choix sans remonter ; on retire en
   retouchant la carte. Un bouton « Retirer » par sort ajouterait trois cibles de 44 px qui
   poussent la liste hors écran.
4. **La liste ne se réordonne jamais** sous le doigt ; seul le bandeau change.

`content-visibility: auto; contain-intrinsic-size: 0 116px;` sur les éléments de liste : coût
de rendu nul hors écran, sans virtualisation ni dépendance (§B5).

**État vide (recherche)** : « Aucun sort ne correspond à « xyz ». » + « Effacer la recherche »
44 px. **État vide (classe non lanceuse)** : l'écran n'existe pas — le parcours ne contient
jamais un écran dont les prérequis manquent, il n'apparaît pas grisé.
**Maximum atteint** : `option.unavailable = { kind: 'slot-full' }`, les cartes non cochées
passent `disabled` et une `Notice reminder` (`role="status"`) dit « Tu as tes 3 tours de
magie. Décoche-en un pour en changer. » Désactiver plutôt qu'ignorer l'appui : un appui sans
effet fait croire à un bug.

### Autres écrans (résumé)

- **Accueil** : `h1` « Crée ton personnage », trois lignes d'explication, « Commencer » ;
  « Reprendre où j'en étais » n'apparaît que si une sauvegarde existe (`useStorageStatus`).
  Attribution SRD / CC BY 4.0 et mention « non affilié à Wizards of the Coast ni à D&D
  Beyond » en pied de contenu, 14 px (charte §9). Sauvegarde illisible → `Notice error` +
  « Repartir de zéro ».
- **Sous-race, créneaux de race et de classe** : `ChoiceSlotScreen`, sans exception.
- **Étape 4 — historique** : mêmes cartes. L'historique « Personnalisé » (§B3) porte dans son
  `blurb` la mention explicite « assemblé à partir des règles générales du SRD » et ouvre des
  créneaux plus des champs libres (trait, idéal, lien, défaut) via `useDraftText`.
- **Étape 5 — ce que tu sais faire** : un écran par créneau. Les compétences déjà accordées
  arrivent avec `unavailable = { kind: 'already-granted', source: 'background' }`, formaté en
  « Déjà acquise grâce à ton historique ». Grâce au regroupement de §A9 ce cas est
  inatteignable en marche avant, mais reste affiché correctement au retour arrière. Chaque
  compétence porte sa caractéristique et une phrase d'usage (« Se cacher, avancer sans bruit »).
- **Étape 7 — équipement** : `ChoiceSlotScreen`, `facts` = contenu du paquetage en trois lignes.
- **Étape 8 — identité** : `TextField` nom (`enterKeyHint="done"`, `maxLength={40}`) dans un
  `<form>`, `ChoiceGroup` alignement avec une phrase par option (« Loyal bon — tu aides les
  autres et tu tiens parole »), puis les quatre champs de personnalité. Écran soumis au piège
  du clavier iOS : voir cadre, §4.

---

## Aide contextuelle

**Niveau 1 — le mot lui-même.** Aucun terme technique nu : « Vision dans le noir » est suivi
de « tu vois à 18 mètres dans le noir, en nuances de gris ». Les `facts` sont écrits en
langage de joueur (« Se bat avec » et non « Maîtrises martiales »). C'est du **contenu**,
donc à la charge de `data/` (lot 1) ; je n'impose que les emplacements et leur longueur : une
ligne pour le `blurb`, une ligne par `fact`.

**Niveau 2 — `Explainer`, un dépliant sur place.** Décision : **le dépliant `<details>`, pas
la feuille glissante** (confirmé §B5).

- **Zéro JavaScript de comportement** : ouverture, clavier, `aria-expanded` et exposition aux
  lecteurs d'écran sont natifs et corrects partout.
- **Le contexte reste à l'écran** : expliquer « modificateur » en masquant les six scores dont
  on parle est absurde.
- **Rien à piéger** : une feuille impose un piège de focus, un `inert`, une touche Échap et un
  verrouillage du défilement du corps — sur iOS, un nid à bugs connu.
- **La charte interdit l'animation décorative** : une feuille sans glissement est un saut
  brutal ; avec glissement, elle est hors charte.
- **Recherche dans la page et impression** fonctionnent ; le CSS d'impression du lot 4 force
  l'ouverture.

Coût assumé : l'ouverture pousse le contenu vers le bas — acceptable, le `<summary>` reste
ancré, rien ne bouge au-dessus du doigt.

**Glossaire** : `ui/help/glossary.ts` importe la table de termes **directement depuis
`data/`** (§A6). Le composant `GlossaryTerm` fait huit lignes : il lit une définition et rend
un `Explainer`. Ce n'est pas un composant d'inventaire, c'est de la glu — et surtout ce n'est
plus un faux hook de `state/` dont le seul rôle était de faire transiter du texte.

Règles d'usage : un `Explainer` au niveau du sous-titre (le concept de l'écran), un par carte
pour les détails SRD. Trois à six lignes maximum, avec un exemple chiffré. Au-delà, c'est que
le mot n'aurait pas dû être employé.

---

## Élargissement bureau

**Une seule requête média : `@media (min-width: 600px)`.** Aucune `max-width` en requête média
(charte §4) ; les `max-width` de _propriété_ restent indispensables et autorisées.

```css
@media (min-width: 600px) {
  .content > * {
    max-width: var(--content-max);
    margin-inline: auto;
  }
  .actions > .inner {
    max-width: var(--content-max);
    margin-inline: auto;
  }
  .card {
    padding: var(--space-5);
  }
  :root {
    --font-size-400: 1.75rem;
  }
}
```

Le reste se fait **sans requête média**, par dimensionnement intrinsèque : la liste de cartes
est en `grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr))` et passe d'elle-même à
deux colonnes quand la largeur le permet, ce qui améliore encore la comparaison verticale.

Ce qu'on **ne** fait **pas** : pas de panneau latéral « fiche en direct », pas de barre
d'étapes horizontale, pas de disposition formulaire/aperçu. Ce serait une deuxième interface
à concevoir, tester et maintenir pour une cible qui n'est pas la nôtre. La barre d'actions
reste en bas au bureau : inhabituel, mais un seul comportement à expliquer.

---

## Accessibilité

- **Groupes de choix : aucun rôle ARIA** (confirmé §B5). `<fieldset>` + `<legend>` + `<input
type="radio">` ou `checkbox` dans un `<label>`. Le natif fournit le regroupement, le nom du
  groupe, `aria-checked`, le tabindex tournant, les flèches, Home/End, Espace — correctement
  et sur tous les lecteurs d'écran. Un `role="radiogroup"` fait main serait plus de code **et**
  moins fiable. Seule exigence : masquer l'`<input>` par `clip-path`, jamais `display:none`.
  Le compteur « 2 sur 3 choisis » est lié au `<fieldset>` par `aria-describedby`.
- **Focus visible, jamais supprimé** :
  ```css
  :focus-visible {
    outline: 3px solid var(--color-focus);
    outline-offset: 2px;
    border-radius: inherit;
  }
  ```
  L'`outline-offset` place l'anneau sur le fond de page, y compris autour d'un bouton bleu où
  un anneau collé tomberait à 2,01.
- **Changement d'écran** : `AppShell` déplace le focus sur le `h1` et met à jour
  `document.title` (« Tes caractéristiques — étape 3 sur 8 »). Le déplacement de focus _est_
  l'annonce ; pas de région live pour l'étape, ce qui provoquerait une double lecture. Les
  régions `aria-live="polite"` sont réservées aux changements de valeur sans changement de
  focus : points restants, compteur de sorts, échange de scores, état d'enregistrement.
- **Navigation clavier** : ordre du DOM = ordre visuel. Aucun `tabindex` positif. Rien
  d'essentiel au survol.
- **Cibles** : `min-height: var(--touch-target)` sur tout `button`, `label.card`, `summary`,
  `input`, `select`, avec 8 px d'écart minimum.
- **`prefers-reduced-motion`**, dans `reset.css` :
  ```css
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
  Il n'y a de toute façon que deux transitions de 120 ms (fond et bord au pressage).
- **Zoom** : jamais de `user-scalable=no` ni `maximum-scale`. Tenue à 320 px avec zoom 200 %.
- **`color-scheme: light` seul** (§A10) : annoncer `dark` sans thème sombre fait inverser les
  contrôles natifs par le système et détruit tous les contrastes ci-dessus.
- **`<html lang="fr">`** : prononciation des lecteurs d'écran et `hyphens: auto`.

---

## Contrat attendu du lot état

Je consomme les hooks de `src/state/hooks.ts` tels que le lot 2 les a publiés :
`useWizard`, `useChoiceSlot`, `useSelection`, `useAbilities`, `useCharacterSheet`,
`useIssues`, `useScreenIssues`, `useNotices`, `useStorageStatus`, `useDraftText`.
Je lis le **contenu** (label, blurb, facts, details, glossaire) directement dans `data/`
(§A6). Je ne demande aucun nouveau hook. Trois demandes précises :

**1. `useAbilities()` doit rendre des lignes dérivées, pas seulement `input` et `pointsLeft`.**
Sans cela l'UI devrait connaître la table de coûts d'achat de points pour décider si `+` est
actif — un calcul de règle dans un composant, donc un bug de conception (charte §5).

```ts
export type AbilityBlockReason =
  | {
      readonly kind: 'not-enough-points';
      readonly required: number;
      readonly remaining: number;
    }
  | { readonly kind: 'max-score'; readonly max: number }
  | { readonly kind: 'min-score'; readonly min: number };

export interface AbilityRow {
  readonly id: AbilityId;
  readonly score: number | null; // null = non assigné (tableau standard)
  readonly racialBonus: number;
  readonly bonusSource: string | null;
  readonly total: number | null;
  readonly modifier: number | null;
  readonly canIncrease: boolean;
  readonly canDecrease: boolean;
  readonly increaseCost: number | null;
  readonly blockedBy: AbilityBlockReason | null; // structuré, jamais rédigé
}
// useAbilities(): { ...existant, readonly rows: readonly AbilityRow[] }
```

La forme est exactement celle de `UnavailableReason` (§A4) et respecte §A5 : le domaine dit
_pourquoi_, `ui/format/abilityBlock.ts` écrit la phrase.

**2. `setRolled` et `AbilityMethod = 'dice'` disparaissent** (§B1). Je ne rends aucun écran de
jet de dés.

**3. Affecter une valeur déjà placée doit échanger les deux caractéristiques** (tableau
standard), au lieu de refuser. Une ligne de reducer, contre un flux à impasses sur mobile.

**Point de contradiction restante à trancher** : le plan du lot 2 déclare
`Issue.message: string` « français, prêt à afficher », écrit **dans `domain/`**. C'est
précisément ce que §A5 et la charte §6 amendée interdisent (« Le domaine ne rédige jamais de
phrase »). Ou bien `Issue` porte une raison structurée et `ui/format/issue.ts` compose, ou
bien §A5 ne vaut que pour les blocages de caractéristiques — mais les deux textes ne peuvent
pas coexister. Je plaide pour la première branche, par cohérence avec `UnavailableReason` et
`AbilityBlockReason` : trois mécanismes identiques valent mieux que deux plus une exception.

**Ce que je fournis au lot 4** : `data-print="hide"` sur l'en-tête, la barre d'actions et tout
élément collant ; l'inventaire ci-dessus, rien de plus.

---

## Tests prévus (Vitest + Testing Library, noms en français)

Comportement visible uniquement, aucun snapshot.

**Cadre**

- `it('donne le focus au titre quand on change d\'écran')`
- `it('remet le contenu en haut quand on change d\'écran')`
- `it('rend la barre d\'actions en dehors de la zone défilante')`
- `it('marque l\'en-tête et la barre d\'actions comme non imprimables')`

**Composants et écrans**

- `it('coche la race choisie et décoche la précédente')`
- `it('donne un nom accessible à chaque bouton')` — parcourt `getAllByRole('button')`
- `it('désactive le bouton + et affiche pourquoi quand il manque des points')`
- `it('annonce le score et les points restants après un appui sur +')`
- `it('échange les deux caractéristiques quand on réutilise une valeur du tableau standard')`
- `it('empêche de choisir un 4e tour de magie quand le maximum est 3')`
- `it('affiche « Aucun sort ne correspond » quand la recherche ne renvoie rien')`
- `it('explique qu\'une compétence est déjà acquise grâce à l\'historique')`
- `it('replie l\'explication par défaut et la déplie au clic')`
- `it('laisse passer « Suivant » même sans choix')`
- `it('affiche l\'avis de remise à zéro après un changement de classe')`

**Test d'intégration obligatoire** (§A13.3), à ma charge conjointe avec le lot 2 — compensation
explicite du renoncement à Playwright :
`it('crée un personnage de bout en bout, puis le retrouve après un rechargement')` — monte
`<App />`, parcourt les 8 étapes en ne visant que des rôles et des libellés français,
remonte le brouillon depuis `localStorage`, remonte `<App />` et vérifie l'écran et les choix.

**Garde-fous de charte (tests statiques sur les fichiers de `src/ui/`)**

- `it('n\'utilise aucune media query max-width')`
- `it('déclare 100dvh partout où 100vh apparaît')`
- `it('n\'écrit aucune couleur en dur hors de tokens.css')`
- `it('ne fixe aucune largeur supérieure à 320 px')`
- `it('n\'utilise aucun identifiant accentué dans le code')` — garde-fou de la charte §6, la
  règle qui a été enfreinte par deux lots sur quatre à la première itération.

**Vérification manuelle avant de dire « fini »** : iPhone Safari et Chrome Android réels ;
clavier ouvert sur l'écran Identité ; paysage avec encoche ; zoom 200 % ; VoiceOver et
TalkBack sur Race et Caractéristiques.

---

## Hors périmètre

- **L'écran de fiche et le récapitulatif** : lot 4 (§A8).
- **Pas de thème sombre, et j'y souscris** : il double le travail (seconde palette à concevoir
  _et_ à vérifier au contraste, chaque état d'accent à revoir) pour un bénéfice nul sur la
  fonction du site. Les jetons sémantiques (`--color-text`, pas `--gray-900`) font que
  l'ajouter plus tard coûtera une trentaine de lignes. En attendant, `color-scheme: light`.
- **Pas de boîte de dialogue, pas de confirmation** (§B4) : avis a posteriori plus retour
  arrière à un doigt. Je n'ai aucun composant de dialogue et je n'en écrirai pas.
- **Pas d'écran de jet de dés** (§B1).
- Pas d'illustrations, pas d'icônes personnalisées, pas de jeu d'icônes.
- Pas de police téléchargée : deux piles système, zéro octet, zéro FOUT.
- Pas d'animation, pas de transition de page, pas de squelette de chargement.
- Pas de règle D&D, pas de reducer, pas de `localStorage`.
- Pas de composant générique `Button`, `Card`, `Chip`, `Callout` ni `Stack` (§A7). Trois cas
  identiques feront un composant ; pas avant.

---

## Risques

| Risque                                                              | Gravité | Parade                                                                                                                      |
| ------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| Le clavier iOS masque la barre d'actions                            | Élevée  | `<form>` + `enterKeyHint`, champs à 16 px ; hook `useKeyboardInset` documenté, écrit seulement si le test sur iPhone échoue |
| `dvh` provoque un tremblement pendant le défilement iOS             | Moyenne | Aucune hauteur animée ; repli `100svh` si constaté sur appareil                                                             |
| `Issue.message` rédigé dans `domain/` (contradiction lot 2)         | Moyenne | À trancher avant d'écrire `ui/format/issue.ts` ; voir contrat ci-dessus                                                     |
| `useAbilities` ne rend pas `rows` : l'UI devrait calculer les coûts | Élevée  | Demande n° 1 du contrat ; sans elle l'écran 3.2 n'est pas implémentable dans les règles                                     |
| `:has()` indisponible (Firefox < 121) pour le focus de carte        | Faible  | `input:focus-visible + .body` en base, `:has()` en amélioration                                                             |
| Libellés français longs débordant à 360 px                          | Moyenne | `hyphens: auto` + `lang="fr"`, `overflow-wrap: anywhere`, test avec les chaînes SRD les plus longues                        |
| Écran 3.2 à 320 px et 200 % de zoom                                 | Moyenne | Colonne de commande fixée à 56 px, texte en `1fr` sur deux lignes ; testé explicitement                                     |
| 40 cartes de sorts sur téléphone d'entrée de gamme                  | Faible  | Cartes sans dépliant en v1 (§B2) + `content-visibility: auto` ; pas de virtualisation                                       |
| Le retour de la prose longue des sorts (§A19) rallonge les listes   | Faible  | Le `<details>` apparaît dès que les options portent des `details` ; aucun composant à changer                               |
| Un `Explainer` trop long devient une page dans la page              | Faible  | Limite de six lignes en revue ; au-delà, c'est le vocabulaire de l'écran qu'il faut corriger                                |
