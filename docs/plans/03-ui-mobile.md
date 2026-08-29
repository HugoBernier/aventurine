# Lot 3 — Interface mobile-first & design (`src/ui/`)

## Objectif

Rendre l'assistant de création utilisable **au pouce, sur un écran de 360 px**, par
quelqu'un qui n'a jamais joué à D&D. Ce lot livre : les jetons de design, le cadre
d'écran, huit composants réutilisables, les écrans de l'assistant. Il ne calcule
**aucune** règle et ne détient **aucun** état : il consomme des hooks du lot 2 et
affiche ce qu'ils rendent.

Test d'acceptation, repris de la charte : on comprend ce qu'on nous demande et on
voit le bouton **sans faire défiler**.

---

## Principes d'écran

1. **Une décision par écran.** Le titre `h1` énonce la décision : « Choisis ta race ».
   Si un écran contient deux décisions, on le coupe en deux (la sous-race est un écran).
2. **Trois zones, toujours les mêmes** : en-tête (où j'en suis), contenu défilant,
   barre d'actions en bas. Rien d'autre ne flotte.
3. **Jamais de blocage.** « Suivant » est toujours actif. Un choix manquant n'est pas
   une erreur : c'est une ligne « À compléter » sur l'écran final.
4. **Aligner plutôt que juxtaposer.** On ne compare pas deux options côte à côte sur
   360 px ; on affiche pour chaque option les **mêmes repères, dans le même ordre, à la
   même place**. L'œil compare en descendant. Aucun tableau, aucun défilement horizontal.
5. **Le mot avant la couleur.** Une carte choisie dit « Choisi ». Une erreur commence
   par « Erreur : ». La couleur ne fait que renforcer.
6. **Zéro icône seule.** Les seuls signes graphiques admis (`✓`, `▸`) sont collés à un
   mot et ne portent aucune information à eux seuls.

---

## Jetons de design (`src/ui/styles/tokens.css`)

Un seul fichier de variables CSS sur `:root`, importé une fois dans `main.tsx`. Tous les
CSS Modules n'utilisent **que** ces variables, jamais une valeur brute.

### Couleurs — thème clair, ratios vérifiés

Direction : « médiéval-fantastique discret ». On l'obtient par le **fond légèrement
chaud**, la **serif système des titres** et le **bleu d'encre**, pas par du parchemin
texturé. Deux accents, pas un de plus.

| Variable | Valeur | Usage | Contraste vérifié |
|---|---|---|---|
| `--c-page` | `#F7F5F2` | fond général, blanc cassé chaud (pas jaune) | — |
| `--c-surface` | `#FFFFFF` | cartes, champs | — |
| `--c-surface-choisie` | `#EAEFF5` | fond d'une carte sélectionnée | — |
| `--c-surface-erreur` | `#FDF0EE` | fond d'un bloc d'erreur | — |
| `--c-texte` | `#1B1A18` | texte courant, titres (encre chaude) | **15,98** / page |
| `--c-texte-2` | `#57534C` | accroches, descriptions secondaires | **7,03** / page |
| `--c-texte-3` | `#6E6960` | méta 14 px (portée, durée, coût) | **5,01** / page |
| `--c-accent` | `#1F4E79` | **accent 1 — interactif** : bouton principal, bord de carte choisie, remplissage de progression | **7,96** / page ; blanc dessus **8,66** |
| `--c-accent-presse` | `#173C5C` | état pressé du bouton principal | blanc dessus **11,43** |
| `--c-acquis` | `#3F6B3F` | **accent 2 — acquis** : « Choisi », « Étape complète » | **5,70** / page ; **5,36** / surface choisie |
| `--c-erreur` | `#9B2415` | état d'erreur (bord + texte). Pas un accent : jamais décoratif | **7,26** / page ; **7,10** / fond erreur |
| `--c-bord` | `#E3DED5` | séparateurs **décoratifs** uniquement (rail de progression, filets) | 1,23 — assumé, redondant avec du texte |
| `--c-bord-controle` | `#8A8275` | contour de tout élément interactif (carte, champ, bouton secondaire) | **3,49** / page, **3,80** / blanc → ≥ 3:1 (WCAG 1.4.11) |
| `--c-focus` | `#1B1A18` | anneau de focus | **15,98** / page |
| `--c-inactif-fond` | `#EDE9E3` | bouton désactivé | — |
| `--c-inactif-texte` | `#6E6960` | texte désactivé | **4,51** / fond inactif |

Justifications :
- Le **bleu d'encre** est le seul accent interactif : bouton principal, sélection, focus
  de progression. Un seul bleu = aucune ambiguïté sur « où appuyer ».
- Le **vert d'armoirie** ne sert qu'à l'état *acquis*. Il n'est jamais cliquable, ce qui
  évite la confusion avec l'accent 1.
- Le **rouge** n'est pas compté comme accent : il n'apparaît que sur un message d'erreur,
  toujours préfixé du mot « Erreur ». Rouge/vert jamais opposés dans un même composant.
- Le **rail de progression** (`--c-bord`) est sous 3:1 volontairement : la barre est
  strictement redondante avec le texte « Étape 2 sur 9 », elle ne porte aucune information.
- L'anneau de focus est en **encre, pas en accent** : sur un bouton bleu, un anneau bleu
  serait invisible. Avec `outline-offset: 2px`, l'anneau se pose sur le fond de page
  (15,98) et non sur le bouton — c'est l'offset qui rend l'anneau conforme partout.

### Typographie

```css
--police-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
             "Helvetica Neue", Arial, "Noto Sans", sans-serif;
--police-titre: "Iowan Old Style", "Palatino Linotype", Palatino,
                "Book Antiqua", Georgia, "Noto Serif", serif;
```

Deux piles **système**, zéro octet téléchargé : pas de FOUT, pas de décalage de mise en
page au chargement, pas de requête réseau sur un site statique consulté à table avec
trois barres de réseau. La serif ne sert qu'aux `h1`/`h2` : elle suffit à donner le ton
« vieux grimoire » sans une seule image.

| Variable | px / rem | Usage |
|---|---|---|
| `--fs-100` | `0.875rem` (14 px) | méta, notes, coût en points |
| `--fs-200` | `1rem` (16 px) | **texte courant, champs, boutons — plancher absolu** |
| `--fs-300` | `1.125rem` (18 px) | titre de carte, valeur d'un score |
| `--fs-400` | `1.375rem` (22 px) | `h1` de l'écran (serif) |
| `--fs-500` | `1.75rem` (28 px) | grand chiffre (score total, tabular-nums) |

`--lh-corps: 1.5` ; `--lh-titre: 1.25`. Graisses : 400 / 600 / 700 uniquement.
`font-variant-numeric: tabular-nums` sur les chiffres pour qu'ils ne dansent pas au `+`.
**16 px minimum sur tout `input`/`select`** : sous 16 px, iOS zoome au focus, casse la
mise en page et crée un défilement horizontal — c'est la cause n°1 de « ça bouge tout seul ».

### Espacement, rayons, ombres, dimensions

```css
--sp-1: 4px;  --sp-2: 8px;  --sp-3: 12px; --sp-4: 16px;
--sp-5: 24px; --sp-6: 32px; --sp-7: 48px;

--r-sm: 4px;   /* puce, champ */
--r-md: 8px;   /* carte, bouton */
--r-lg: 12px;  /* bloc d'aide */

/* Deux ombres, toutes deux fonctionnelles : elles disent « cette zone flotte
   au-dessus du contenu ». Aucune ombre sur les cartes (bord suffit). */
--sh-entete:  0 1px 0 var(--c-bord);
--sh-actions: 0 -1px 0 var(--c-bord), 0 -6px 16px rgb(27 26 24 / 0.08);

--cible: 44px;          /* zone tactile minimale */
--contenu-max: 36rem;   /* largeur de lecture au-delà de 600 px */
```

Pas de rayon « pilule », pas de dégradé, pas d'ombre portée sur les cartes : sobriété et
performance de peinture sur téléphone d'entrée de gamme.

---

## Cadre d'écran mobile (`src/ui/shell/AppShell.tsx` + `AppShell.module.css`)

C'est le point dur du lot. Trois décisions structurantes.

### 1. La barre d'actions n'est PAS `position: fixed`

```css
.app {
  height: 100vh;   /* repli pour les navigateurs sans dvh */
  height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto;  /* en-tête | contenu | actions */
  overflow: hidden;                    /* la page ne défile jamais, seul .contenu défile */
}
.contenu { overflow-y: auto; overscroll-behavior: contain; }
```

Une **rangée de grille** plutôt qu'un élément fixe supprime d'un coup : le contenu masqué
sous la barre, le `padding-bottom` magique à maintenir, et les bugs de repositionnement
d'`position: fixed` pendant le défilement élastique d'iOS. La barre est visible en
permanence parce qu'elle est *hors* du conteneur défilant, pas parce qu'elle est collée.

### 2. `100vh` ment sur mobile → `dvh`

Sur iOS Safari et Chrome Android, `1vh` est calé sur le viewport **le plus grand**, celui
qu'on obtient barre d'URL rétractée. Au chargement, la barre d'URL est déployée : un
conteneur en `height: 100vh` dépasse donc la fenêtre réellement visible de 60 à 110 px, et
la barre d'actions se retrouve **sous le pli, invisible** — exactement ce que la charte
interdit.

`100dvh` (*dynamic viewport height*) suit la hauteur réellement visible à chaque instant.
Support : Safari 15.4+, Chrome 108+, Firefox 101+. La double déclaration `100vh` puis
`100dvh` sert de repli : un navigateur qui ne connaît pas l'unité ignore la seconde ligne.

Contrepartie connue : la valeur de `dvh` **change pendant le défilement** quand la barre
d'URL se rétracte, ce qui provoque un reflow. C'est acceptable ici parce que la variation
est absorbée par la rangée `1fr` : l'en-tête et la barre d'actions ne bougent pas d'un
pixel, seule la hauteur du conteneur défilant change. On n'anime ni transition aucune
hauteur — sinon on obtiendrait un tremblement. **Si un tremblement est constaté sur un
iPhone réel**, le repli est `height: 100svh` (viewport *small*, valeur stable) : on perd
quelques pixels barre rétractée, on gagne la stabilité. À trancher sur appareil, pas en
réunion.

### 3. `env(safe-area-inset-bottom)` — l'encoche et la barre d'accueil

Prérequis, **une ligne dans `index.html`** (hors `src/ui/` mais c'est une dépendance de ce lot) :

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

Sans `viewport-fit=cover`, `env()` renvoie `0px` et le problème est invisible en
développement — puis les boutons passent sous la barre d'accueil de l'iPhone en production.

```css
.actions {
  padding-block: var(--sp-3);
  padding-block-end: calc(var(--sp-3) + env(safe-area-inset-bottom, 0px));
  padding-inline: max(var(--sp-4), env(safe-area-inset-left, 0px))
                  max(var(--sp-4), env(safe-area-inset-right, 0px));
  box-shadow: var(--sh-actions);
  background: var(--c-surface);
}
.entete { padding-block-start: calc(var(--sp-2) + env(safe-area-inset-top, 0px)); }
```

Les insets latéraux comptent en **paysage** : sans eux, l'encoche mange le bouton
« Précédent ». Le `max()` garantit qu'on ne descend jamais sous l'espacement normal.

### 4. Le clavier virtuel

- **Android (Chrome)** : le viewport visuel se réduit à l'ouverture du clavier, `100dvh`
  se réduit avec lui, la barre d'actions reste **au-dessus du clavier**. Rien à faire.
- **iOS Safari** : le viewport de mise en page **ne se réduit pas**. Le clavier se
  superpose et la page se translate vers le haut ; la barre d'actions passe **derrière le
  clavier**. C'est un comportement du système, pas un bug qu'on corrige avec du CSS.

Stratégie v1, par ordre de coût croissant :

1. **Éviter le problème.** Un seul écran a un champ texte important (« Ton identité »).
   Sur cet écran, on n'a pas besoin de la barre pendant la frappe : le champ est dans un
   `<form>`, avec `enterkeyhint="done"`, et la touche du clavier valide (`onSubmit` →
   étape suivante). La barre redevient visible dès que le clavier se ferme.
2. **Ne pas aggraver.** `font-size: 16px` sur tous les champs (pas de zoom automatique) ;
   le champ de recherche des sorts est en haut d'une zone collante, donc jamais recouvert.
3. **Si et seulement si le test sur iPhone réel échoue** : un hook de présentation
   `useDecalageClavier()` (≈ 20 lignes, dans `src/ui/shell/`) qui écoute
   `window.visualViewport` (`resize` + `scroll`), calcule
   `innerHeight − (visualViewport.height + visualViewport.offsetTop)` et l'expose en
   variable CSS `--decalage-clavier`, appliquée en `translateY` négatif sur `.actions`.
   Ce n'est **pas** écrit d'avance (YAGNI) : la recette est ici, la décision se prend
   après mesure.

### 5. Pas de défilement horizontal, jamais

Pas de `overflow-x: hidden` sur `body` (ça crée un conteneur de défilement et masque le
vrai problème). On agit à la source : aucune largeur fixe, `min-width: 0` sur tout enfant
de grille ou de flex, `overflow-wrap: anywhere` sur les titres, `hyphens: auto` avec
`<html lang="fr">`. Un test statique (voir « Tests prévus ») vérifie qu'aucun module CSS
n'introduit de largeur en `px` supérieure à 320.

### 6. Changement d'écran

`AppShell` reçoit `cleEcran`. À son changement : `contenu.scrollTop = 0`, puis focus
programmatique sur le `h1` (`tabIndex={-1}`), puis `document.title` mis à jour. Le focus
sur le titre est **le** mécanisme d'annonce (voir Accessibilité).

### Squelette

```
┌────────────────────────────────────────────┐  360 px
│ ‹ Retour      Étape 2 sur 9      Ma fiche  │  ← en-tête, ~52 px + safe-area haute
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← rail 4 px (redondant avec le texte)
├────────────────────────────────────────────┤
│                                            │
│              zone défilante                │  ← 1fr, seul élément qui défile
│                                            │
├────────────────────────────────────────────┤
│  [ ‹ Précédent ]      [    Suivant ›    ]  │  ← 48 px de haut, cibles 44 px
│  Tu pourras revenir sur ce choix.          │  ← note optionnelle, 14 px
│············ safe-area-inset-bottom ········│
└────────────────────────────────────────────┘
```

---

## Inventaire des composants (`src/ui/components/`)

Huit composants réutilisables plus le cadre. Un composant utilisé une seule fois n'est pas
ici : il vit dans le fichier de son écran.

### 1. `AppShell` — le cadre

```ts
export interface AppShellProps {
  entete: React.ReactNode;
  actions: React.ReactNode;
  cleEcran: string;          // change → défilement remis à zéro + focus sur le h1
  children: React.ReactNode; // contenu défilant
}
```
Pourquoi : les trois zones et toute la mécanique `dvh` / safe-area / clavier existent en
**un seul endroit**. Un écran ne peut pas la refaire de travers.

### 2. `ProgressBanner` — bandeau de progression (l'en-tête)

```ts
export interface ProgressBannerProps {
  indice: number;            // 1-based
  total: number;
  titreEtape: string;        // « Ta race »
  onRetour?: () => void;     // absent sur la première étape
  onFiche: () => void;       // ouvre l'écran récapitulatif
}
```
Pourquoi : la charte impose que « où j'en suis », « comment revenir » et « ce que ça change
sur ma fiche » soient **toujours visibles**. C'est le contrat de ce composant, sur les 11
écrans. `aria-label` du rail : `« Étape 2 sur 9 »` ; `role="progressbar"` avec
`aria-valuenow/min/max`.

### 3. `ChoiceGroup` — groupe de choix

```ts
export interface DetailBloc { titre: string; texte: string }

export interface ChoiceOption {
  id: string;
  titre: string;                                // « Nain des collines »
  accroche: string;                             // une phrase, ton joueur
  reperes?: readonly [string, string, string];  // 3 lignes ALIGNÉES, même sens partout
  effet?: string;                               // « Ce que ça change : Constitution 12 → 14 »
  details?: readonly DetailBloc[];              // repliés par défaut
  desactive?: boolean;
  raisonDesactivation?: string;                 // phrase française, déjà formatée
}

interface ChoiceGroupCommun {
  nomChamp: string;              // attribut name des input, stable
  legende: string;               // <legend> visible
  aide?: string;
  options: readonly ChoiceOption[];
  messageErreur?: string;
  etatVide?: React.ReactNode;    // affiché si options est vide
}

export type ChoiceGroupProps =
  | (ChoiceGroupCommun & { mode: 'unique';
      valeur: string | null; onChange: (id: string) => void })
  | (ChoiceGroupCommun & { mode: 'multiple';
      valeurs: readonly string[]; maximum: number; onBascule: (id: string) => void });
```

Pourquoi : c'est **la** brique de l'assistant (race, sous-race, classe, historique,
compétences, sorts ×2, équipement — huit usages). L'union discriminée garde un seul
composant pour la mise en page, la légende, le compteur et l'emplacement d'erreur ; seules
la sémantique HTML (`radio` / `checkbox`) et le compteur « n sur m » diffèrent, soit une
quinzaine de lignes de branche. Deux composants auraient dupliqué tout le reste.

### 4. `SelectableCard` — carte sélectionnable *(interne à `ChoiceGroup`, non exportée)*

```ts
interface SelectableCardProps {
  option: ChoiceOption;
  type: 'radio' | 'checkbox';
  nomChamp: string;
  coche: boolean;
  onSelection: (id: string) => void;
}
```
Pourquoi : la carte est le seul élément dont la mise en forme est délicate (44 px, bord
3:1, `<input>` masqué visuellement, focus reporté sur la carte). Elle reste dans son
fichier mais n'est pas exportée hors du dossier : rien d'autre n'en a besoin.

Structure interne, **native avant tout** :

```html
<label class="carte">
  <input type="radio" name="race" value="nain-collines" class="entree"><!-- clip, pas display:none -->
  <span class="corps"> … titre, accroche, repères, effet, <details> … </span>
</label>
```

`.entree { position:absolute; width:1px; height:1px; clip-path: inset(50%); }` — jamais
`display:none`, qui retire le champ de l'ordre de tabulation et des lecteurs d'écran.
Focus : `.entree:focus-visible + .corps { outline: … }` (compatible partout) et
`.carte:has(:focus-visible)` en amélioration. `touch-action: manipulation` supprime le
délai de 300 ms et le zoom au double-tap.

### 5. `AbilityStepper` — compteur de caractéristique

```ts
export interface AbilityStepperProps {
  nom: string;                    // « Force »
  role: string;                   // « Frapper, porter, briser. »
  base: number;
  bonus: number;                  // bonus racial, 0 si aucun
  origineBonus?: string;          // « nain »
  total: number;
  modificateur: string;           // « +2 », déjà signé par l'écran
  peutAugmenter: boolean;
  peutDiminuer: boolean;
  coutAugmentation: number | null;
  raisonBlocage?: string;         // phrase déjà formatée, ex. « Il te reste 2 points… »
  onAugmente: () => void;
  onDiminue: () => void;
}
```
Pourquoi : six instances sur le même écran, une mécanique tactile non triviale (deux
cibles 44 px, valeur annoncée, boutons désactivés motivés). Il ne calcule rien : coût,
totaux et booléens viennent du lot 2.

### 6. `Explainer` — panneau explicatif dépliable

```ts
export interface ExplainerProps {
  libelle: string;             // « Comment ça marche ? »
  children: React.ReactNode;
}
```
Pourquoi : c'est le seul mécanisme d'aide du site (voir « Aide contextuelle »), présent sur
tous les écrans, souvent plusieurs fois. `<details>/<summary>` natif, `<summary>` haut de
44 px, libellé qui bascule en « Masquer » à l'ouverture via `onToggle`.

### 7. `ActionBar` — barre d'actions

```ts
export interface ActionBarProps {
  precedent?: { libelle: string; onClick: () => void };
  principal: { libelle: string; onClick?: () => void; type?: 'button' | 'submit' };
  note?: string;               // « Tu pourras revenir sur ce choix. »
}
```
Pourquoi : les actions principales en bas, au pouce, sur les 11 écrans. Mise en page
`grid-template-columns: auto 1fr` : « Précédent » compact à gauche, action principale large
à droite (côté pouce dominant), 8 px d'écart minimum, hauteur 48 px.

### 8. `TextField` — champ de texte

```ts
export interface TextFieldProps {
  id: string;
  libelle: string;                       // <label> toujours visible, jamais de placeholder-label
  valeur: string;
  onChange: (valeur: string) => void;
  type?: 'text' | 'search';
  aide?: string;                         // lié par aria-describedby
  erreur?: string;                       // lié par aria-describedby + aria-invalid
  placeholder?: string;
  autoComplete?: string;
  enterKeyHint?: 'next' | 'done' | 'search';
  maxLength?: number;
}
```
Pourquoi : trois usages réels (nom du personnage, recherche de sorts, recherche
d'équipement) et c'est là que se concentrent les pièges mobiles : 16 px obligatoire,
`enterkeyhint`, hauteur 44 px, libellé lié.

### 9. `Notice` — message d'erreur / rappel

```ts
export interface NoticeProps {
  ton: 'erreur' | 'rappel';
  titre?: string;
  children: React.ReactNode;
  vivant?: boolean;   // true → role="alert" (erreur) ou role="status" (rappel)
}
```
Pourquoi : erreurs de chargement des données, budget dépassé, maximum de sorts atteint,
rappels du récapitulatif. Le ton se lit dans le texte (« Erreur : … ») avant la couleur ;
un filet gauche de 4 px double l'information sans dépendre de la teinte.

---

## Écrans détaillés

Onze écrans. `N` est **dynamique** (la sous-race et les sorts n'existent pas pour tout le
monde) : le lot 2 fournit la liste des étapes réellement applicables.

| # | Écran | Décision |
|---|---|---|
| 0 | Accueil | Reprendre ou repartir de zéro |
| 1 | Ta race | Quel peuple |
| 1b | Ta sous-race *(conditionnel)* | Quelle branche |
| 2 | Ta classe | Quel métier d'aventurier |
| 3 | Tes caractéristiques | Répartir 27 points |
| 4 | Ton historique | D'où tu viens |
| 5 | Tes compétences | Ce que tu sais faire |
| 6 | Tes sorts mineurs *(conditionnel)* | Quels tours de magie |
| 7 | Tes sorts de niveau 1 *(conditionnel)* | Quels vrais sorts |
| 8 | Ton équipement | Quel paquetage |
| 9 | Ton identité | Nom, alignement |
| 10 | Ta fiche | Vérifier, exporter, imprimer |

### Écran 1 — Ta race *(difficile : beaucoup de contenu à comparer)*

**Objectif** : choisir le peuple d'origine en comprenant ce qu'il change.

```
┌────────────────────────────────────────────┐
│ ‹ Retour      Étape 2 sur 9      Ma fiche  │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
├────────────────────────────────────────────┤
│ Choisis ta race                            │  h1 22 px serif
│ Le peuple d'où tu viens. Ça change tes     │  16 px
│ scores et te donne des capacités.          │
│ ▸ C'est quoi une « race » ?                │  Explainer, 44 px
│                                            │
│ ┌────────────────────────────────────────┐ │  carte, bord 2 px accent
│ │ Nain des collines            ✓ Choisi  │ │  18 px / 14 px vert
│ │ Solide, tenace, dur au mal.            │ │
│ │ Scores       +2 Constitution, +1 Sag.  │ │  ← repère 1
│ │ Déplacement  7,50 m · taille moyenne   │ │  ← repère 2
│ │ Capacité     Vision dans le noir       │ │  ← repère 3
│ │ Ce que ça change : Constitution 12→14  │ │
│ │ ▸ En savoir plus                       │ │
│ └────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────┐ │  bord 1 px --c-bord-controle
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

**Comparer sans tableau** : les trois repères sont aux mêmes coordonnées sur chaque carte,
avec le même libellé de gauche (Scores / Déplacement / Capacité). Le lecteur balaie
verticalement la colonne « Scores » de toutes les cartes — c'est un tableau lu en
colonne, sans jamais dépasser 360 px. Le type l'impose :
`reperes: readonly [string, string, string]`, jamais un tableau de longueur libre.

Le texte SRD complet (traits, langues, historique du peuple) est dans le `<details>`
« En savoir plus », replié : les neuf cartes tiennent alors en 3 écrans de défilement au
lieu de 15.

**Interaction** : appui n'importe où sur la carte. La sélection déplace le bord en accent,
le fond en `--c-surface-choisie`, ajoute « ✓ Choisi » et la ligne « Ce que ça change ». La
carte précédente se décoche (radio natif). Aucun défilement automatique, aucune animation.

**État vide** : impossible en usage normal ; si `options` est vide (données non chargées),
`etatVide` affiche « Les races n'ont pas pu être chargées. » + bouton « Réessayer » 44 px.

**État d'erreur** : aucun. Ne rien choisir n'est pas une erreur ; « Suivant » passe, la
note de la barre indique « Tu pourras revenir sur ce choix » et le récapitulatif marquera
« Race : à choisir ».

### Écran 3 — Tes caractéristiques *(difficile : chiffres, coûts, + et −)*

**Objectif** : dépenser 27 points entre six scores, en comprenant ce que chacun sert.

```
┌────────────────────────────────────────────┐
│ ‹ Retour      Étape 4 sur 9      Ma fiche  │
├────────────────────────────────────────────┤
│ Répartis tes points                        │
│ Tu as 27 points. Monter un score coûte de  │
│ plus en plus cher.                         │
│ ▸ Comment ça marche ?                      │
│┌──────────────────────────────────────────┐│ ← position: sticky; top:0
││ Points restants : 12 sur 27              ││   44 px, fond surface,
│└──────────────────────────────────────────┘│   filet bas
│ ┌────────────────────────────────────────┐ │
│ │ Force                        ┌───────┐ │ │
│ │ Frapper, porter, briser.     │   +   │ │ │ 44×56
│ │ 13 + 1 (nain) = 14           ├───────┤ │ │
│ │ modificateur +2              │   −   │ │ │ 44×56
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
« 13 + 1 (nain) = 14 · mod. +2 » demande ~320 px de texte plus 96 px de boutons — ça ne
tient pas à 360 px, et encore moins à 200 % de zoom. Empilés, la colonne de commande fait
56 px, il reste 260 px de texte qui peut passer sur deux lignes sans rien casser. Bonus :
`+` au-dessus de `−` est l'orientation attendue d'un pas-à-pas vertical, et les deux cibles
sont du même côté que le pouce.

**Le budget est collant** (`position: sticky; top: 0` dans le conteneur défilant, hauteur
44 px) : on ajuste la Charisme tout en bas en voyant toujours ce qu'il reste. C'est le seul
élément collant du site.

**Interaction** :
- Nom accessible explicite : `aria-label="Augmenter la Force"` / `"Diminuer la Force"` —
  le `+` seul ne serait pas un libellé.
- Bouton `disabled` quand `peutAugmenter` est faux, avec **la raison affichée** en 14 px
  sous le calcul : « Il te reste 2 points, monter la Force en coûte 3. » Un bouton grisé
  sans explication, c'est un cul-de-sac.
- Après chaque changement, une région `aria-live="polite"` unique (pas une par ligne)
  annonce « Force 14, modificateur +2. Points restants : 12. » — regroupée et retardée de
  ~300 ms pour ne pas noyer le lecteur d'écran pendant des appuis répétés.

**État vide** : sans race choisie, les bonus raciaux valent 0 et une `Notice` de ton
`rappel` indique « Tu n'as pas encore de race : les bonus s'ajouteront tout seuls après. »

**État d'erreur** : le budget ne peut pas devenir négatif (le lot 2 refuse), donc pas
d'erreur possible. Une `Notice` `rappel` s'affiche si des points restent non dépensés au
moment d'avancer — sans bloquer.

### Écrans 6 et 7 — Tes sorts *(difficile : listes longues)*

**Objectif** : choisir exactement N sorts parmi 25 à 40.

Deux écrans distincts (sorts mineurs, puis niveau 1) : une décision par écran, et deux
listes moyennes valent mieux qu'une liste énorme avec deux compteurs.

```
┌────────────────────────────────────────────┐
│ ‹ Retour     Étape 7 sur 10      Ma fiche  │
├────────────────────────────────────────────┤
│ Choisis 3 sorts mineurs                    │
│ De petits sorts que tu peux relancer autant │
│ de fois que tu veux. ▸ C'est quoi ?        │
│┌──────────────────────────────────────────┐│ ← sticky
││ 2 sur 3 choisis · Lumière, Prestidigit.  ││   récapitulatif en LECTURE
││ ┌──────────────────────────────────────┐ ││   SEULE : on retire en
││ │ Rechercher un sort                   │ ││   retouchant la carte
││ └──────────────────────────────────────┘ ││   (44 px, 16 px, type=search)
│└──────────────────────────────────────────┘│
│ ┌────────────────────────────────────────┐ │
│ │ Lumière                      ✓ Choisi  │ │
│ │ Fait briller un objet comme une torche.│ │
│ │ Contact · 1 heure · 1 action           │ │  ← repères alignés
│ │ ▸ Texte complet                        │ │
│ └────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────┐ │
│ │ Rayon de givre                         │ │
│ │ Un trait de froid qui blesse et ralentit│ │
│ │ 18 m · instantané · 1 action           │ │
│ │ ▸ Texte complet                        │ │
│ └────────────────────────────────────────┘ │
│           … 28 autres sorts …              │
├────────────────────────────────────────────┤
│  [ ‹ Précédent ]      [    Suivant ›    ]  │
└────────────────────────────────────────────┘
```

Quatre décisions pour tenir la longueur :
1. **Cartes repliées.** Une carte = titre, une phrase d'effet, trois repères alignés
   (portée · durée · temps d'incantation). Le texte SRD complet est dans le `<details>`.
   40 sorts détaillés feraient 20 écrans ; repliés, 4.
2. **Recherche**, pas de filtres à facettes. Un `TextField type="search"` filtre par nom et
   par phrase d'effet (`useMemo` côté UI — c'est du filtrage d'affichage, pas une règle).
   Aucun menu déroulant, aucune puce de filtre.
3. **Récapitulatif collant en lecture seule.** On voit ses choix sans remonter. On ne
   retire pas depuis le bandeau : on retouche la carte dans la liste. Un bouton « Retirer »
   par sort dans le bandeau ajouterait 3 cibles de 44 px qui poussent la liste hors écran.
4. **La liste ne se réordonne jamais** sous le doigt. Les choix restent à leur place
   alphabétique ; seul le bandeau bouge.

`content-visibility: auto; contain-intrinsic-size: 0 132px;` sur les éléments de liste :
le coût de rendu des cartes hors écran tombe à zéro sans virtualisation ni dépendance.

**État vide (recherche)** : « Aucun sort ne correspond à « xyz ». » + bouton « Effacer la
recherche » de 44 px.
**État vide (classe non lanceuse)** : l'écran n'existe pas — le lot 2 le retire de la liste
des étapes, il ne s'affiche pas grisé.
**État d'erreur / maximum atteint** : quand `choisis.length === maximum`, les cartes non
cochées passent en `disabled` et une `Notice` `rappel` (`role="status"`) apparaît sous le
bandeau : « Tu as tes 3 sorts mineurs. Décoche-en un pour en changer. » Désactiver plutôt
que d'ignorer l'appui : un appui sans effet fait croire à un bug.

### Autres écrans (résumé)

- **0 — Accueil** : `h1` « Crée ton personnage », un paragraphe de 3 lignes, action
  principale « Commencer », action secondaire « Reprendre où j'en étais » (visible
  uniquement si une sauvegarde existe, avec sa date). Mention SRD/CC BY 4.0 en pied de
  contenu, 14 px. Erreur : sauvegarde illisible → `Notice erreur` + « Repartir de zéro ».
- **1b — Ta sous-race** : `ChoiceGroup mode="unique"`, mêmes trois repères. N'apparaît que
  si la race en a.
- **2 — Ta classe** : identique à la race ; repères = « Points de vie », « Sait faire »,
  « Se bat avec ». La carte choisie affiche « Ce que ça change : 10 PV, CA 12 ».
- **4 — Ton historique** : identique ; repères = « Compétences », « Matériel », « Trait ».
- **5 — Tes compétences** : `ChoiceGroup mode="multiple"` avec maximum. Les compétences
  déjà acquises par la race ou l'historique sont désactivées avec la raison
  « Déjà acquise grâce à ton historique ». Chaque compétence porte sa caractéristique
  (« Discrétion — Dextérité ») et une phrase d'usage (« Se cacher, avancer sans bruit »).
- **8 — Ton équipement** : `ChoiceGroup mode="unique"` sur les paquetages SRD. Chaque carte
  liste le contenu en 3 repères ; le détail complet est dans le `<details>`.
- **9 — Ton identité** : `TextField` nom (`autoComplete="off"`, `enterkeyhint="done"`,
  `maxLength={40}`) dans un `<form>`, puis `ChoiceGroup` alignement avec une phrase par
  option (« Loyal bon — tu aides les autres et tu tiens parole »). Écran soumis au piège du
  clavier iOS : voir cadre d'écran, §4.
- **10 — Ta fiche** : pas de décision, un bilan. En tête, `Notice rappel` listant ce qui
  manque, chaque manque étant un bouton qui renvoie à son étape. Puis la fiche en cartes
  empilées (jamais un tableau). Barre d'actions : « Précédent » + « Enregistrer et
  imprimer » ; actions secondaires (exporter/importer le JSON) dans le corps, pas dans la
  barre. Une feuille de style d'impression déplie tous les `<details>` et masque les deux
  barres.

---

## Aide contextuelle

Deux niveaux, un seul mécanisme.

**Niveau 1 — le mot lui-même.** On n'écrit jamais un terme technique nu. « Vision dans le
noir » est suivi de « tu vois à 18 mètres dans le noir, en nuances de gris ». Les repères
de carte sont écrits en langage de joueur : « Se bat avec » plutôt que « Maîtrises
martiales ». Cette réécriture est du **contenu**, donc à la charge des données (lot 1),
pas des composants ; le lot 3 impose seulement les emplacements et leur longueur maximale
(une ligne pour l'accroche, une ligne par repère).

**Niveau 2 — `Explainer`, un dépliant `<details>` sur place.** Décision : **le dépliant, pas
la feuille glissante.**

Pourquoi le dépliant gagne :
- **Zéro JavaScript de comportement.** `<details>` gère l'ouverture, le clavier
  (Entrée/Espace), l'exposition aux lecteurs d'écran et l'état `aria-expanded`
  gratuitement, correctement, partout.
- **Le contexte reste à l'écran.** Expliquer « modificateur » en masquant les six scores
  dont on parle est absurde.
- **Rien à piéger.** Une feuille glissante impose un piège de focus, un `inert` sur le
  fond, une touche Échap, et surtout un verrouillage du défilement du corps — sur iOS,
  c'est un nid à bugs connu (rebond, position perdue, scroll qui « traverse »).
- **La charte interdit l'animation décorative.** Une feuille glissante sans glissement est
  un saut brutal ; avec glissement, elle est hors charte. Le dépliant n'a besoin d'aucune
  animation pour être compréhensible.
- **Recherche dans la page et impression** fonctionnent : Chrome ouvre un `<details>` quand
  le terme cherché s'y trouve, et le CSS d'impression force `details { open }`.

Coût assumé : l'ouverture pousse le contenu vers le bas. C'est acceptable parce que le
`<summary>` reste ancré à sa place — rien ne bouge au-dessus du doigt.

Règles d'usage : un `Explainer` par écran au niveau du sous-titre (le concept de l'étape),
plus un par carte pour les détails SRD. Le `<summary>` fait 44 px, porte un libellé en
question (« C'est quoi un modificateur ? ») et bascule en « Masquer » à l'ouverture.
Contenu : 3 à 6 lignes maximum, avec un exemple chiffré. Au-delà, c'est que le mot n'aurait
pas dû être employé.

Glossaire partagé : `<TermeExplique id="modificateur" />`, un helper de 8 lignes qui appelle
`useGlossaire(id)` et rend un `Explainer`. Il n'est pas dans l'inventaire — c'est une glu de
trois lignes utiles, pas un composant.

---

## Élargissement bureau

**Une seule requête média : `@media (min-width: 600px)`.** Aucune `max-width` en requête
média (la charte l'interdit ; les `max-width` de *propriété*, elles, sont indispensables et
autorisées).

Ce qui change à 600 px, et rien d'autre :

```css
@media (min-width: 600px) {
  .contenu > * { max-width: var(--contenu-max); margin-inline: auto; }  /* 36rem, mesure de lecture */
  .actions > .interieur { max-width: var(--contenu-max); margin-inline: auto; }
  .carte { padding: var(--sp-5); }
  :root { --fs-400: 1.75rem; }   /* le h1 respire */
}
```

Le reste de l'élargissement se fait **sans requête média**, par dimensionnement
intrinsèque : la liste de cartes est en
`grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr))`, donc elle passe d'elle-même
à deux colonnes quand la colonne de 36rem le permet, et reste sur une colonne à 360 px.
Deux colonnes de cartes aux repères alignés améliorent encore la comparaison au bureau.

Ce qu'on **ne** fait **pas** : pas de panneau latéral « fiche en direct », pas de barre de
navigation d'étapes horizontale, pas de disposition à deux colonnes formulaire/aperçu. Ce
serait une deuxième interface à concevoir, tester et maintenir, pour une cible qui n'est
pas la nôtre. La barre d'actions reste en bas au bureau : c'est inhabituel mais cohérent,
et ça vaut mieux que deux comportements à expliquer.

---

## Accessibilité

- **Groupes de choix : pas de rôle ARIA du tout.** `<fieldset>` + `<legend>` + `<input
  type="radio">` (ou `checkbox`) dans un `<label>`. Le natif fournit déjà le regroupement,
  le nom du groupe, `aria-checked`, le tabindex tournant, les flèches, Home/End, Espace —
  correctement, sur tous les lecteurs d'écran. Un `role="radiogroup"` fait main serait plus
  de code **et** moins fiable. L'unique exigence : masquer l'`<input>` par
  `clip-path: inset(50%)` et non `display:none`.
  Pour le mode multiple, le compteur « 2 sur 3 choisis » est lié au `<fieldset>` par
  `aria-describedby`.
- **Focus visible, partout, jamais supprimé** :
  ```css
  :focus-visible { outline: 3px solid var(--c-focus); outline-offset: 2px; border-radius: inherit; }
  ```
  L'`outline-offset` place l'anneau sur le fond de page (contraste 15,98), y compris autour
  d'un bouton bleu foncé où un anneau collé serait à 2,01.
- **Changement d'écran** : `AppShell` déplace le focus sur le `h1` (`tabIndex={-1}`) et met
  à jour `document.title` (« Ta race — étape 2 sur 9 »). Le déplacement de focus *est*
  l'annonce ; on n'ajoute pas de région `aria-live` pour l'étape, ce qui provoquerait une
  double lecture. Les régions `aria-live="polite"` sont réservées aux changements de valeur
  **sans** changement de focus : points restants, compteur de sorts, état
  d'enregistrement.
- **Navigation clavier** : ordre du DOM = ordre visuel (en-tête, contenu, actions). Aucun
  `tabindex` positif. Tout est atteignable ; aucune information au survol.
- **Cibles** : `min-height: var(--cible)` sur tout `button`, `label.carte`, `summary`,
  `input`, avec 8 px d'écart minimum.
- **`prefers-reduced-motion`**, dans `reset.css` :
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: .01ms !important; animation-iteration-count: 1 !important;
      transition-duration: .01ms !important; scroll-behavior: auto !important;
    }
  }
  ```
  Il n'y a de toute façon que deux transitions de 120 ms (couleur de fond et de bord au
  pressage). Aucune animation d'entrée, aucun défilement animé.
- **Zoom** : jamais de `user-scalable=no` ni `maximum-scale`. La mise en page tient à 320 px
  avec un zoom texte de 200 % (tout est en `rem` et en grille intrinsèque).
- **`color-scheme: light`** déclaré sur `:root` : sans ça, un téléphone en mode sombre
  inverse les contrôles natifs (champs, cases) et casse les contrastes vérifiés ci-dessus.
- **Langue** : `<html lang="fr">` — indispensable pour la prononciation des lecteurs
  d'écran et pour `hyphens: auto`.

---

## Contrat attendu du lot état (`src/state/`)

Le lot 3 n'importe **rien** de `domain/` ni de `data/`. Tout arrive par ces hooks. Règle
générale : **le lot 2 rend des données prêtes à afficher (chaînes déjà traduites, booléens
déjà calculés, identifiants stables) ; le lot 3 ne fait que composer.**

```ts
// Navigation
type EtapeId =
  | 'accueil' | 'race' | 'sous-race' | 'classe' | 'caracteristiques'
  | 'historique' | 'competences' | 'sorts-mineurs' | 'sorts-niveau-1'
  | 'equipement' | 'identite' | 'recapitulatif';

interface Etape { id: EtapeId; titre: string; indice: number; total: number; complete: boolean }

function useAssistant(): {
  etape: Etape;
  etapes: readonly Etape[];        // seulement les étapes applicables → total dynamique
  allerA(id: EtapeId): void;
  suivant(): void;
  precedent(): void;
  peutReculer: boolean;
};

// Écrans à choix — même forme pour race, sous-race, classe, historique, équipement
interface OptionChoix {
  id: string;
  nom: string;
  accroche: string;
  reperes: readonly [string, string, string];   // ALIGNÉS : même sens à chaque indice
  effet: string | null;                         // rempli seulement pour l'option choisie
  details: readonly { titre: string; texte: string }[];
}
function useChoixRace(): { options: readonly OptionChoix[]; choisie: string | null; choisir(id: string): void };
// idem : useChoixSousRace, useChoixClasse, useChoixHistorique, useChoixEquipement

// Caractéristiques
type CaracteristiqueId = 'force'|'dexterite'|'constitution'|'intelligence'|'sagesse'|'charisme';
type Blocage =
  | { type: 'points-insuffisants'; requis: number; restants: number }
  | { type: 'maximum-atteint'; maximum: number }
  | { type: 'minimum-atteint'; minimum: number };

interface LigneCaracteristique {
  id: CaracteristiqueId; nom: string; role: string;
  base: number; bonus: number; origineBonus: string | null;
  total: number; modificateur: number;
  coutAugmentation: number | null;
  peutAugmenter: boolean; peutDiminuer: boolean;
  blocage: Blocage | null;                       // structuré, PAS une phrase
}
function useCaracteristiques(): {
  lignes: readonly LigneCaracteristique[];
  pointsRestants: number; pointsTotal: number;
  augmenter(id: CaracteristiqueId): void;
  diminuer(id: CaracteristiqueId): void;
  reinitialiser(): void;
};

// Choix multiples : compétences, sorts
interface OptionMultiple {
  id: string; nom: string; accroche: string;
  reperes: readonly [string, string, string];
  details: readonly { titre: string; texte: string }[];
  choisi: boolean;
  selectionnable: boolean;
  blocage: { type: 'deja-acquis'; source: string } | { type: 'maximum-atteint' } | null;
}
function useChoixCompetences(): { maximum: number; options: readonly OptionMultiple[]; basculer(id: string): void };
function useChoixSorts(niveau: 0 | 1): { maximum: number; choisis: readonly string[]; options: readonly OptionMultiple[]; basculer(id: string): void };

// Aide, bilan, persistance
function useGlossaire(id: string): { titre: string; texte: string; exemple: string | null } | null;
function useRecapitulatif(): { blocs: readonly { titre: string; lignes: readonly string[] }[];
                               manques: readonly { etape: EtapeId; libelle: string }[] };
function useSauvegarde(): { etat: 'inactif' | 'enregistre' | 'erreur'; horodatage: string | null; existeUneSauvegarde: boolean };
```

Trois exigences fortes, à valider avec le lot 2 :
1. **`reperes` est un triplet typé**, jamais un tableau libre. C'est ce qui garantit la
   comparaison alignée sur 360 px. Si une option n'a rien à dire à un indice, elle rend `'—'`.
2. **`blocage` est structuré, pas rédigé.** Le lot 2 dit *pourquoi* c'est bloqué, le lot 3
   écrit la phrase française (dans `src/ui/format/`). Sinon le domaine se met à parler
   français d'interface et la règle de dépendance devient fausse.
3. **Le glossaire passe par `state/`**, même si son contenu vit dans `data/`. C'est ce qui
   permet à `src/ui/` de ne jamais importer `data/` — la règle `ui → state → domain ← data`
   reste littéralement vraie. *(Arbitrage à confirmer : si le lot 2 juge ce hook artificiel,
   l'alternative est d'autoriser explicitement `ui → data` pour le seul contenu textuel, à
   inscrire dans la charte.)*

Le lot 3 ne demande **rien d'autre** : ni objet personnage complet, ni accès au reducer,
ni fonction de calcul.

---

## Tests prévus (Vitest + Testing Library, noms en français)

Comportement visible uniquement, aucun snapshot, aucun détail d'implémentation.

**Cadre**
- `it('donne le focus au titre quand on change d\'étape')`
- `it('remet le contenu en haut quand on change d\'étape')`
- `it('affiche la barre d\'actions en dehors de la zone défilante')` — la barre est un frère
  du conteneur défilant, pas un enfant.

**Composants**
- `it('coche la race choisie et décoche la précédente')` — via `getByRole('radio', { name: /nain des collines/i })`
- `it('donne un nom accessible à chaque bouton')` — parcourt `getAllByRole('button')` et
  vérifie que le nom accessible est non vide (garde-fou « aucune icône sans libellé »)
- `it('désactive le bouton + et affiche pourquoi quand il manque des points')`
- `it('annonce le score et les points restants après un appui sur +')`
- `it('empêche de choisir un 4e sort mineur quand le maximum est 3')`
- `it('affiche « Aucun sort ne correspond » quand la recherche ne renvoie rien')`
- `it('replie l\'explication par défaut et la déplie au clic')`
- `it('laisse passer « Suivant » même sans choix')`

**Garde-fous de charte (tests statiques sur les fichiers `.module.css`)**
- `it('n\'utilise aucune media query max-width')`
- `it('déclare 100dvh partout où 100vh apparaît')`
- `it('n\'écrit aucune couleur en dur hors de tokens.css')` — regex `#[0-9a-f]{3,8}`
- `it('ne fixe aucune largeur supérieure à 320 px')`

**Vérification manuelle avant de dire « fini »** (checklist dans la PR) : iPhone Safari et
Chrome Android réels ; clavier ouvert sur l'écran Identité ; paysage avec encoche ; zoom
200 % ; VoiceOver et TalkBack sur les écrans Race et Caractéristiques ; impression de la
fiche.

---

## Hors périmètre de ce lot

- **Pas de thème sombre. D'accord, et voici pourquoi** : il double le travail (une seconde
  palette à concevoir *et* à vérifier au contraste, chaque état d'accent à revoir) pour un
  bénéfice nul sur la fonction du site. La structure en jetons sémantiques
  (`--c-texte`, pas `--gris-900`) fait que l'ajouter plus tard coûtera un bloc
  `@media (prefers-color-scheme: dark)` d'une trentaine de lignes. En attendant, on déclare
  `color-scheme: light` pour que le système n'inverse pas les contrôles natifs de son côté.
- Pas d'illustrations, pas d'icônes personnalisées, pas de jeu d'icônes : uniquement du
  texte et deux caractères de ponctuation (`✓`, `▸`) toujours accolés à un mot.
- Pas de police téléchargée : deux piles système, zéro octet, zéro FOUT, zéro requête.
- Pas d'animation, pas de transition de page, pas de squelette de chargement (les données
  sont locales et synchrones).
- Pas de règle D&D, pas de calcul, pas de reducer, pas de `localStorage` : lots 1 et 2.
- Pas de composant générique « Bouton » exporté : les seuls boutons sont dans `ActionBar` et
  `AbilityStepper`, plus deux ou trois boutons de texte. Trois cas identiques feront un
  composant ; pas avant.

---

## Risques

| Risque | Gravité | Parade |
|---|---|---|
| Le clavier iOS masque la barre d'actions | Élevée | `<form>` + `enterkeyhint`, champs à 16 px ; hook `visualViewport` documenté et écrit seulement si le test sur iPhone échoue |
| `dvh` provoque un tremblement pendant le défilement sur iOS | Moyenne | Aucune hauteur animée ; repli `100svh` si constaté sur appareil |
| `:has()` indisponible (Firefox < 121) pour le focus de carte | Faible | Sélecteur `input:focus-visible + .corps` en base, `:has()` en amélioration |
| Libellés français longs (« Caractéristiques », « Ensorceleur ») débordant à 360 px | Moyenne | `hyphens: auto` + `lang="fr"`, `overflow-wrap: anywhere`, test avec les chaînes les plus longues du SRD |
| L'écran Caractéristiques à 320 px et 200 % de zoom | Moyenne | Colonne de commande fixée à 56 px, texte en 1fr sur deux lignes ; testé explicitement |
| 40 cartes de sorts avec `<details>` : DOM lourd sur téléphone d'entrée de gamme | Moyenne | `content-visibility: auto` + `contain-intrinsic-size` ; pas de virtualisation (dépendance) |
| Le lot 2 rend des phrases françaises au lieu de raisons structurées | Moyenne | Contrat `Blocage` ci-dessus, à figer avant d'écrire les écrans |
| Le total d'étapes dynamique (sorts, sous-race) désynchronise le bandeau | Faible | `total` vient toujours de `useAssistant().etape`, jamais d'une constante côté UI |
| Un `Explainer` trop long devient une page dans la page | Faible | Limite de 6 lignes en revue ; au-delà, c'est le vocabulaire de l'écran qu'il faut corriger |
