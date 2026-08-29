# LOT 2 — Assistant de création & État (`src/state/`)

> Ce plan est subordonné à `docs/plans/00-arbitrage.md`, qui fait autorité, et à
> `CLAUDE.md` (§ Architecture, § Conventions, amendés). Version 2 : intègre les
> arbitrages A1 à A13 et les réductions de périmètre B1 et B4.

## Objectif

Piloter le parcours de création d'un personnage de niveau 1 : quel écran s'affiche, ce
que le joueur a choisi, ce qui manque, ce qui est sauvegardé. Ce lot ne connaît aucune
règle D&D (il les demande à `domain/`), ne rédige aucune phrase française (il rend des
raisons structurées, `ui/format/` les compose) et ne dessine rien (il expose des hooks).

Trois décisions structurantes :

1. **Le parcours est dérivé, jamais stocké.** L'état retient l'identifiant de l'écran
   courant ; la liste des écrans est recalculée à partir du brouillon.
2. **Un choix appartient à la décision qui l'a ouvert**, propriété portée par
   l'identifiant de créneau `source:parentId:subject` (arbitrage A3). Cela suffit à
   produire toute l'invalidation en cascade, sans une ligne par catégorie.
3. **Un point de passage unique** (`commit`) traverse chaque modification du brouillon :
   purge, avis, recalcul du parcours, réancrage de l'écran. Impossible d'oublier une
   cascade puisqu'il n'existe qu'un chemin.

Fichiers prévus :

```
src/state/
  types.ts                        WizardState, WizardAction, Screen, Notice
  flow.ts                         STEPS, buildFlow, locate
  prune.ts                        pruneChoices
  reducer.ts                      createWizardReducer(catalogue)
  WizardProvider.tsx              deux contextes, init paresseuse, effet de sauvegarde
  hooks.ts                        hooks exposés à l'UI
  persistence/DraftStorage.ts     interface + types de résultat
  persistence/localStorageDraftStorage.ts
  persistence/memoryDraftStorage.ts
  persistence/parseSession.ts     garde de forme écrite à la main
```

Pas de `src/state/index.ts` : baril de couche interdit (charte § Architecture, A11).
`state/` n'importe **jamais** `data/` — le catalogue est injecté par `App.tsx`.

---

## Étapes et écrans

### Le modèle : deux niveaux, une seule liste

- **Étape (`StepId`)** : un chapitre. Sert au repère « Étape 3 sur 8 » et au
  regroupement du récapitulatif. Huit, fixes, ordre imposé par A9.
- **Écran (`Screen`)** : **une décision, une seule**. Unité de navigation. 14 à 22 selon
  la classe et la race.

Pas de sous-machine par étape, pas de reducer imbriqué : une liste plate d'écrans et un
identifiant courant.

### Les 8 étapes (A9)

| # | Étape | Écrans |
|---|---|---|
| 1 | Ta race | race, sous-race *(si applicable)*, créneaux de race hors maîtrises |
| 2 | Ta classe | classe, créneaux de classe hors maîtrises et hors expertise |
| 3 | Tes caractéristiques | méthode, répartition |
| 4 | Ton historique | historique, créneaux d'historique hors maîtrises |
| 5 | Ce que tu sais faire | tous les créneaux `skill`/`language`/`tool`, puis `expertise` |
| 6 | Tes sorts | tours de magie, sorts *(classes lanceuses seulement)* |
| 7 | Ton équipement | options de départ |
| 8 | Ton identité | nom, alignement, personnalité |
| — | Récapitulatif | hors numérotation ; la fiche appartient au lot 4 |

L'ordre suit les dépendances : chaque étape ne consomme que les précédentes.
Le regroupement de l'étape 5 est **accepté** : il rend le conflit « Perception donnée
deux fois » inatteignable en marche avant, puisque toutes les dotations fixes (race
étape 1, historique étape 4) sont posées avant le premier choix de maîtrise. Coût réel
dans `buildFlow` : une partition et un tri, six lignes. Le mécanisme de disponibilité
reste indispensable (un retour en arrière le déclenche encore) et ses tests de
convergence restent obligatoires.

**Correction demandée à A9** : `expertise` doit être différé au même titre que
`skill`/`language`/`tool`, et placé **en dernier dans l'étape 5**. Les options d'une
expertise sont les compétences que le personnage possède : accrochée derrière l'ancre de
classe (étape 2), elle proposerait une liste vide. Sans ce déplacement, le roublard est
cassé dès le premier parcours.

### Comment un écran naît

Deux familles :

- **Écrans d'ancrage**, codés dans `flow.ts` : `race`, `subrace`, `class`,
  `ability-method`, `ability-assign`, `background`, `equipment`, `name`, `alignment`,
  `personality`, `summary`.
- **Écrans de créneau**, générés : un par `ChoiceSlot` rendu par
  `openChoices(draft, catalogue)`. Identifiant `'choice:' + slotId`.

```
buildFlow(draft, catalogue):
  slots = openChoices(draft, catalogue)
  deferred = slots où kind ∈ {skill, language, tool, expertise}
  attached = slots restants
  → ancres de l'étape 1..4, chaque ancre suivie de ses `attached`
  → étape 5 : deferred triés par (rang de source: race < background < class,
                                 expertise en dernier, puis ordre de openChoices)
  → étapes 6..8 : ancres + `attached` de sorts et d'équipement
  → summary
```

Le tri de l'étape 5 **reproduit exactement la priorité d'exclusion du domaine**
(dotations fixes > race > historique > classe). C'est ce qui garantit que l'écran vu en
premier est aussi celui qui l'emporte : jamais de « pourquoi cette option est-elle
grisée alors que je n'ai encore rien choisi ? ».

Conséquence voulue (SOLID/O) : ajouter une race à sous-races n'ajoute **aucun** code de
navigation, seulement une entrée de données déclarant ses créneaux. Aucun `switch` sur
`'haut-elfe'` dans `state/`.

Exemple, haut-elfe roublard, 18 écrans :

```
race → choice:race:haut-elfe:ability → choice:race:haut-elfe:cantrip
class
ability-method → ability-assign
background
choice:race:haut-elfe:language → choice:background:acolyte:languages
  → choice:class:roublard:skills → choice:class:roublard:expertise
choice:race:haut-elfe:cantrip est en étape 1 (kind 'cantrip', non différé)
equipment → choice:class:roublard:equipment
name → alignment → personality → summary
```

---

## Forme de l'état

### Ce que le brouillon a le droit de contenir

**Le brouillon ne contient que ce que le joueur a tapé ou touché.** Tout ce qui se
recalcule (score final, modificateur, points de vie, classe d'armure, initiative,
vitesse, bonus de maîtrise, jets de sauvegarde, sorts préparés) en est absent, de façon
vérifiée.

`CharacterDraft` est **défini dans `src/domain/draft.ts`** (arbitrage A1) et importé par
`state/`, `data/` et les tests. Une seule déclaration dans le dépôt. Je le reproduis ici
parce que j'en suis le principal producteur — le lot 1 en est propriétaire.

```ts
// src/domain/draft.ts — propriété du lot 1
export type AbilityId =
  | 'force' | 'dexterite' | 'constitution'
  | 'intelligence' | 'sagesse' | 'charisme';

export type AbilityMethod = 'point-buy' | 'standard-array';   // B1 : plus de 'dice'

export interface AbilityInput {
  readonly method: AbilityMethod;
  /** Scores AVANT bonus raciaux. Choix du joueur. Partiel tant qu'il n'a pas fini. */
  readonly base: Partial<Record<AbilityId, number>>;
}

export interface Personality {
  readonly trait: string;
  readonly ideal: string;
  readonly bond: string;
  readonly flaw: string;
}

export interface CharacterDraft {
  readonly name: string;
  readonly raceId: string | null;
  readonly subraceId: string | null;
  readonly classId: string | null;
  readonly backgroundId: string | null;
  readonly alignmentId: string | null;
  readonly abilities: AbilityInput;
  /** Un dictionnaire unique. Clé absente = créneau jamais touché. */
  readonly choices: Readonly<Record<ChoiceSlotId, readonly string[]>>;
  readonly personality: Personality;
}

export function emptyDraft(): CharacterDraft;
```

### L'état de l'assistant

```ts
// src/state/types.ts
import type { CharacterDraft, ChoiceSlotId, ChoiceSource, ChoiceKind,
              AbilityMethod } from '../domain/draft';

export type StepId =
  | 'race' | 'class' | 'abilities' | 'background'
  | 'proficiencies' | 'spells' | 'equipment' | 'identity';

export type AnchorId =
  | 'race' | 'subrace' | 'class' | 'ability-method' | 'ability-assign'
  | 'background' | 'equipment' | 'name' | 'alignment' | 'personality' | 'summary';

export type ScreenId = string;

export type Screen =
  | { readonly id: ScreenId; readonly step: StepId;
      readonly kind: 'anchor'; readonly anchor: AnchorId }
  | { readonly id: ScreenId; readonly step: StepId;
      readonly kind: 'choice'; readonly slotId: ChoiceSlotId };

/** Aucune phrase ici : `ui/format/formatNotice` compose le français. */
export type NoticeReason =
  | { readonly kind: 'slot-closed'; readonly source: ChoiceSource;
      readonly parentId: string; readonly slotKind: ChoiceKind;
      readonly lost: number }
  | { readonly kind: 'options-withdrawn'; readonly slotId: ChoiceSlotId;
      readonly optionIds: readonly string[]; readonly remaining: number }
  | { readonly kind: 'abilities-reset'; readonly method: AbilityMethod };

export interface Notice {
  readonly id: string;
  readonly reason: NoticeReason;
  readonly screenId: ScreenId;   // où réparer
}

export type StorageStatus = 'ok' | 'memory' | 'quota' | 'unavailable';

export interface WizardState {
  readonly draft: CharacterDraft;
  readonly currentScreenId: ScreenId;   // un identifiant, jamais un index
  readonly notices: readonly Notice[];
  readonly storage: StorageStatus;
}
```

Quatre champs, et trois absences volontaires :

- **Pas de `flow`** : dérivé de `draft`.
- **Pas d'`issues`** : dérivé par `validateDraft`.
- **Pas de `visitedScreenIds`** : le parcours ne contient jamais un écran dont les
  prérequis manquent, donc « déjà vu » n'apporte rien. Tout écran du parcours est
  atteignable. Champ supprimé par YAGNI, pas par raccourci.

`notices` est de l'état légitime : « tu as perdu Discrétion parce que tu as changé de
classe » est un événement passé, indéductible de l'état courant.

`Screen` ne porte **aucun libellé** : `ui/` titre les ancres, et le titre d'un écran de
créneau vient de `ChoiceSlot.title`, prose de contenu venue de `data/` (A5).

### Comment on garantit l'absence de valeur dérivée

1. **Par la forme du type** : aucun champ numérique hors `abilities.base`.
2. **Par le producteur unique** : `buildCharacter(draft, catalogue)` est le seul
   producteur de valeurs de fiche, appelé dans un `useMemo` ; son résultat n'est jamais
   affecté à un champ de `WizardState`.
3. **Par un test de liste noire** : `it('ne stocke aucune valeur dérivable dans le
   brouillon')` parcourt récursivement un brouillon complet et échoue sur une clé
   contenant `hp|ac|modifier|bonus|total|initiative|speed|proficiencyBonus`.
4. **Par un test d'aller-retour** : `buildCharacter(parse(serialize(draft)))` est
   profondément égal à `buildCharacter(draft)`.
5. **Par la revue** : « ce champ pourrait-il être recalculé ? Alors il sort. »

---

## Actions

```ts
// src/state/types.ts
export type WizardAction =
  | { readonly type: 'SELECT_RACE';       readonly raceId: string }
  | { readonly type: 'SELECT_SUBRACE';    readonly subraceId: string }
  | { readonly type: 'SELECT_CLASS';      readonly classId: string }
  | { readonly type: 'SELECT_BACKGROUND'; readonly backgroundId: string }
  | { readonly type: 'SELECT_ALIGNMENT';  readonly alignmentId: string }
  | { readonly type: 'SET_ABILITY_METHOD'; readonly method: AbilityMethod }
  | { readonly type: 'ASSIGN_ABILITY';     readonly ability: AbilityId;
                                           readonly score: number | null }
  | { readonly type: 'TOGGLE_CHOICE'; readonly slotId: ChoiceSlotId;
                                      readonly optionId: string }
  | { readonly type: 'SET_NAME';        readonly name: string }
  | { readonly type: 'SET_PERSONALITY'; readonly field: keyof Personality;
                                        readonly text: string }
  | { readonly type: 'GO_NEXT' }
  | { readonly type: 'GO_BACK' }
  | { readonly type: 'GO_TO'; readonly screenId: ScreenId }
  | { readonly type: 'DISMISS_NOTICE'; readonly noticeId: string }
  | { readonly type: 'RESET' }
  | { readonly type: 'SET_STORAGE_STATUS'; readonly status: StorageStatus };
```

Seize actions (`SET_ROLLED_SCORES` supprimée, B1). `switch` exhaustif clos par
`const _: never = action`.

| Action | Comportement |
|---|---|
| `SELECT_RACE` | Identifiant identique → **`state` retourné tel quel**. Sinon pose la race, remet `subraceId` à `null`, puis `commit`. |
| `SELECT_SUBRACE` | Idempotente. Ignorée si la sous-race n'appartient pas à la race courante. Puis `commit`. |
| `SELECT_CLASS` | Idempotente. Puis `commit` : c'est là que se produit la cascade. |
| `SELECT_BACKGROUND` | Idempotente, puis `commit`. |
| `SELECT_ALIGNMENT` | Aucun créneau n'en dépend ; `commit` est un passage à vide. |
| `SET_ABILITY_METHOD` | Méthode identique → no-op. Sinon **vide `base`** : une valeur de tableau standard n'a pas de sens en répartition de points. Seule remise à zéro hors purge ; produit un avis `abilities-reset`. |
| `ASSIGN_ABILITY` | `null` désassigne. En `standard-array`, assigner une valeur déjà portée **échange les deux** (un seul geste, résultat prévisible). En `point-buy`, refusée hors de 8–15 ou au-delà du budget : l'invalide n'est jamais atteignable par un geste. |
| `TOGGLE_CHOICE` | Option cochée → décochée. Sinon cochée, sauf si `unavailable !== null` ou créneau plein : **ignorée**, l'UI ayant désactivé la case et affiché la raison. Si `pick === 1`, remplace. Puis `commit`. |
| `SET_NAME` | Écrit, coupé à 60 caractères. Pas de `commit`. |
| `SET_PERSONALITY` | Idem, 300 caractères. |
| `GO_NEXT` | Écran suivant. **Jamais bloquée par un choix incomplet.** No-op sur `summary`. |
| `GO_BACK` | Écran précédent. No-op sur le premier. |
| `GO_TO` | Saute à tout écran **présent dans le parcours courant**. Ignorée sinon. |
| `DISMISS_NOTICE` | Retire un avis ; les avis expirent aussi après 3 actions modifiantes. |
| `RESET` | `emptyDraft()`, écran `race`, avis vidés. Confirmation à l'UI. |
| `SET_STORAGE_STATUS` | Émise par l'effet de sauvegarde. Ne touche pas au brouillon. |

Le reducer vient d'une fabrique `createWizardReducer(catalogue)`, mémoïsée au niveau
module. `state/` n'importe donc pas `data/` (règle de dépendance amendée : `state → domain`
seulement) et les tests utilisent un catalogue miniature.

---

## Invalidation en cascade

### La règle générale, en une phrase

> **Un choix ne survit que si le créneau qui l'a ouvert est encore ouvert à l'identique
> et si l'option est encore proposée. Sinon il est supprimé, en entier, sans rattrapage.**

Deux mécanismes, tous deux déjà nécessaires par ailleurs :

**1. L'identifiant porte la décision parente** (A3) : `class:roublard:skills`. Passer à
clerc n'ouvre pas le même créneau mais `class:clerc:skills` ; l'ancien disparaît, et avec
lui tous ses choix. Zéro ligne par catégorie.

**2. Une purge à point fixe, à chaque `commit`.**

```ts
// src/state/prune.ts
export interface RemovedChoice {
  readonly slotId: ChoiceSlotId;
  readonly optionIds: readonly string[];
  readonly reason: 'slot-closed' | 'option-withdrawn';
}
export interface PruneResult {
  readonly draft: CharacterDraft;
  readonly removed: readonly RemovedChoice[];
}
export function pruneChoices(draft: CharacterDraft, catalogue: Catalogue): PruneResult;
```

Pour chaque entrée de `draft.choices` : `slotId` absent de `openChoices(draft, catalogue)`
→ supprimée (`slot-closed`) ; sinon toute option sélectionnée absente des `options` ou
dont `unavailable !== null` → retirée (`option-withdrawn`). On répète tant que quelque
chose bouge, plafond 3 passes. Une suppression ne fait qu'élargir la disponibilité
ailleurs : la deuxième passe ne supprime jamais rien de nouveau. Le plafond est une
ceinture, testée.

### Les deux cas de l'énoncé

**Roublard → clerc.** `class:roublard:skills` n'existe plus : Discrétion et Perception
partent ensemble, y compris une compétence qui aurait été légale chez le clerc. Avis
`{ kind: 'slot-closed', source: 'class', parentId: 'roublard', slotKind: 'skill', lost: 2 }`,
que `ui/format/` rend en « Tu as changé de classe : tes 2 compétences de roublard ont été
remises à zéro. » L'expertise du roublard tombe dans la même passe.

Pourquoi ne pas garder ce qui reste légal ? « Il reste une case cochée que je n'ai jamais
choisie en tant que clerc » est plus déroutant qu'une ardoise propre, et « ça repart de
zéro quand tu changes d'avis » s'explique en une phrase à quelqu'un qui n'a jamais joué.
KISS gagne sur l'économie de deux tapes.

**Doublon avec l'historique.** Le domaine ne propose jamais deux fois la même compétence :
il marque `unavailable: { kind: 'already-granted', source: 'background' }`.

- *Marche avant* (étape 5 après l'étape 4, A9) : Perception arrive désactivée sur l'écran
  des compétences de classe, avec sa raison. Rien n'est perdu, aucun avis. **C'est le seul
  chemin qu'un joueur emprunte s'il ne revient pas en arrière.**
- *Retour en arrière* (l'historique est changé après coup) : Perception était cochée, elle
  devient indisponible, la purge la retire, le créneau passe à 1/2, avis
  `options-withdrawn` avec `remaining: 1`.

Les deux chemins aboutissent au **même état final** : c'est la propriété de convergence,
testée. Elle est garantie par une **priorité d'exclusion déterministe** exigée du domaine :
dotations fixes d'abord, puis race, puis historique, puis classe ; à égalité, l'ordre de
`openChoices`. Le tri de l'étape 5 reproduit cette priorité, donc l'ordre visible et
l'ordre logique coïncident.

### Cas limites

| Cas | Comportement |
|---|---|
| Re-sélection de la même classe | `state` retourné à l'identique, rien n'est purgé. Test dédié : c'est le bug le plus coûteux du lot. |
| Changement de sous-race seul | Seuls les créneaux `race:<sous-race>:*` tombent. |
| Expertise portant sur une compétence abandonnée | L'option n'est plus dans `options` → retirée par `option-withdrawn`, sans code spécifique. Cascade à deux niveaux, testée. |
| Écran courant supprimé | On recule dans l'ancien parcours jusqu'au premier écran encore présent ; à défaut, premier écran du nouveau parcours. |
| Créneau rétréci (`pick` 4 → 2) | Non atteignable par un geste (l'identifiant change avec le parent). Depuis une sauvegarde ancienne : la validation signale `too-many-choices`, on ne tranche pas à la place du joueur. |
| Changement de méthode de caractéristiques | Vidage annoncé par `abilities-reset`. |
| Contenu retiré du catalogue | Identifiant inconnu remis à `null` à la lecture, puis purge. La sauvegarde n'est jamais jetée pour ça. |
| Deux sources réclamant la même option | Impossible par construction ; vérifié par test plutôt que gardé à l'exécution. |
| Cascade en chaîne (race → sorts raciaux → langues) | Traitée par le point fixe. |

### Pas de confirmation préalable (B4)

`describeImpact` et la boîte de confirmation sont retirés du périmètre. Le dispositif
restant suffit : avis a posteriori formaté par `ui/format/`, plus un retour arrière à un
doigt. Ajouter un dialogue — que le lot 3 n'a pas et refuse à raison — pour éviter
l'annulation d'un geste serait un mauvais échange.

---

## Navigation

- **Avancer** : `GO_NEXT`. Le bouton « Suivant » n'est **jamais désactivé** (charte :
  progression linéaire sans blocage). Avancer avec un choix incomplet est un usage normal :
  on peut parcourir tout l'assistant avant de décider. Le récapitulatif liste ce qui
  manque, chaque ligne pointant vers son écran.
- **Reculer** : `GO_BACK` ; `canGoBack` faux sur le premier écran. Le geste « retour » du
  navigateur n'est pas géré (aucun routeur).
- **Sauter** : `GO_TO` vers tout écran du parcours courant. Aucune garde supplémentaire :
  le parcours ne contient jamais un écran dont les prérequis manquent.
- **Reprendre** : brouillon **et** `currentScreenId` relus dans l'initialiseur paresseux
  de `useReducer`, donc de façon synchrone, sans écran de chargement. Écran mémorisé
  disparu → premier écran encore valide. Reprise silencieuse ; « Recommencer » (`RESET`)
  reste accessible.
- **Repère** : `useWizard().progress` rend `{ stepIndex, stepCount: 8, step, screenIndex,
  screenCount }`. L'UI affiche « Étape 3 sur 8 » (stable) et une barre fine sur les écrans.
  Annoncer « écran 7 sur 19 » découragerait.

---

## Validation

### Où elle vit

| Rôle | Lieu | Forme |
|---|---|---|
| Empêcher l'illégal | `state/reducer.ts` | actions refusées (dépassement de `pick`, bornes, budget, option indisponible) |
| Nettoyer le caduc | `state/prune.ts` | suppression sans interprétation |
| Dire ce qui manque ou cloche | `domain/validate.ts` | `validateDraft(draft, catalogue): readonly Issue[]` |
| Situer | `state/flow.ts` | rattache chaque anomalie à un écran |
| Rédiger | `ui/format/formatIssue.ts` | compose la phrase française (A5) |

> **La purge supprime ce qui est objectivement caduc. La validation signale ce qu'on ne
> peut pas corriger sans décider à la place du joueur.**

### Quand

À chaque changement de brouillon, dans un `useMemo`. Il n'y a pas de soumission : rien à
valider au clic. Le résultat n'est jamais stocké.

### Incomplet contre invalide, sans une phrase dans le domaine

```ts
// src/domain/validate.ts — propriété du lot 1, forme demandée par le lot 2
export type IssueSeverity = 'incomplete' | 'invalid';

export type IssueTarget =
  | { readonly kind: 'slot';  readonly slotId: ChoiceSlotId }
  | { readonly kind: 'field'; readonly field: keyof CharacterDraft };

export type IssueReason =
  | { readonly kind: 'missing-field' }
  | { readonly kind: 'missing-choices'; readonly missing: number }
  | { readonly kind: 'abilities-incomplete'; readonly missing: readonly AbilityId[] }
  | { readonly kind: 'not-enough-points'; readonly required: number;
      readonly remaining: number }
  | { readonly kind: 'over-budget'; readonly spent: number; readonly budget: number }
  | { readonly kind: 'score-out-of-range'; readonly ability: AbilityId;
      readonly score: number }
  | { readonly kind: 'too-many-choices'; readonly extra: number };

export interface Issue {
  readonly severity: IssueSeverity;
  readonly target: IssueTarget;
  readonly reason: IssueReason;
}
```

- **`incomplete`** : décision non prise ou pas terminée (`missing-choices`,
  `missing-field`, `abilities-incomplete`). Attendu, non bloquant, ton neutre, compté
  dans le badge du récapitulatif.
- **`invalid`** : l'état viole une règle et seul le joueur peut trancher (`over-budget`,
  `too-many-choices`, `score-out-of-range`). Alerte.

Comme le reducer refuse les gestes illégaux et que la purge nettoie le caduc, `invalid`
n'est atteignable qu'en relisant une sauvegarde ancienne ou modifiée à la main. C'est
voulu : **on préfère rendre l'invalide irreprésentable plutôt que le détecter.** Le
niveau existe parce qu'une sauvegarde est une entrée non fiable.

`state/` ajoute la localisation (`LocatedIssue = Issue & { screenId }`) ; `ui/format/`
compose la phrase. Le domaine ne concatène jamais.

---

## Persistance

Seule interface du lot, justifiée par la charte (frontière réelle), avec **deux**
implémentations.

```ts
// src/state/persistence/DraftStorage.ts
export interface PersistedSession {
  readonly version: 1;
  readonly savedAt: string;        // ISO 8601
  readonly draft: CharacterDraft;
  readonly currentScreenId: ScreenId;
}

export type LoadResult =
  | { readonly kind: 'empty' }
  | { readonly kind: 'session'; readonly session: PersistedSession }
  | { readonly kind: 'unreadable'; readonly cause: 'json' | 'version' | 'shape' }
  | { readonly kind: 'unavailable' };

export type SaveResult =
  | { readonly kind: 'ok' } | { readonly kind: 'quota' }
  | { readonly kind: 'unavailable' };

export interface DraftStorage {
  load(): LoadResult;
  save(session: PersistedSession): SaveResult;
  clear(): void;
}

export function localStorageDraftStorage(): DraftStorage;
export function memoryDraftStorage(): DraftStorage;   // tests + navigation privée
```

- **Clé** : `'aventurine:draft:v1'`. Version dans la clé **et** dans la charge utile ; le champ
  `version` fait autorité (défense contre une charge éditée à la main).
- **Écriture** : anti-rebond 400 ms après toute action changeant `draft` ou
  `currentScreenId` (comparaison par référence : le reducer ne crée un objet que s'il a
  réellement changé). Écriture immédiate sur `pagehide` et sur `visibilitychange` en
  `hidden` — sur mobile l'onglet est tué sans `beforeunload`.
- **Lecture** : une seule fois, dans l'initialiseur paresseux.
- **Migration** : aucune aujourd'hui (une seule version). Politique fixée d'avance :
  version inconnue ou supérieure → **abandon propre**, brouillon vierge, message. Une
  clé d'une génération antérieure est supprimée par la version qui la remplace.

| Incident | Détection | Réaction |
|---|---|---|
| Stockage inaccessible (navigation privée verrouillée, cookies bloqués, iframe) | accès à `window.localStorage` **et** écriture sonde, tous deux sous `try/catch` | bascule sur `memoryDraftStorage`, statut `unavailable`, bandeau unique |
| Quota dépassé | `SaveResult` `quota` | statut `quota`, bandeau, **arrêt des tentatives** jusqu'au prochain changement d'écran ; on ne supprime jamais la sauvegarde pour faire de la place |
| JSON illisible | `JSON.parse` sous `try/catch` | clé supprimée, brouillon vierge, message |
| Forme invalide | `parseSession(unknown)`, garde écrite à la main (~40 lignes, aucune dépendance — cohérent avec le validateur d'import du lot 4) | idem |
| Identifiant inconnu du catalogue | comparaison au catalogue à la lecture | **réparation champ par champ** puis purge ; la sauvegarde n'est jamais jetée |
| Données effacées par le système (iOS) | `load()` rend `empty` | démarrage normal ; limite annoncée dans l'UI |

Le brouillon pèse moins de 4 Ko : le quota est un cas de robustesse, pas de conception.

---

## Hooks exposés

```ts
// src/state/hooks.ts
export function useWizard(): {
  readonly screen: Screen;
  readonly canGoBack: boolean;
  readonly canGoNext: boolean;
  readonly progress: {
    readonly step: StepId; readonly stepIndex: number; readonly stepCount: number;
    readonly screenIndex: number; readonly screenCount: number;
  };
  readonly goNext: () => void;
  readonly goBack: () => void;
  readonly goTo: (screenId: ScreenId) => void;
};

export function useChoiceSlot(slotId: ChoiceSlotId): {
  readonly slot: ChoiceSlot;
  readonly selected: readonly string[];
  readonly remaining: number;                 // dérivé : slot.pick - selected.length
  readonly toggle: (optionId: string) => void;
};

export function useSelection(): {
  readonly raceId: string | null;  readonly subraceId: string | null;
  readonly classId: string | null; readonly backgroundId: string | null;
  readonly alignmentId: string | null;
  readonly select: (action: WizardAction) => void;
};

export function useAbilities(): {
  readonly input: AbilityInput;
  readonly pool: readonly number[];           // dérivé (tableau standard)
  readonly pointsLeft: number | null;         // dérivé, null hors répartition
  readonly setMethod: (method: AbilityMethod) => void;
  readonly assign: (ability: AbilityId, score: number | null) => void;
};

export function useCharacterSheet(): CharacterSheet;             // 100 % dérivé
export function useIssues(): readonly LocatedIssue[];
export function useScreenIssues(screenId: ScreenId): readonly LocatedIssue[];
export function useNotices(): { readonly notices: readonly Notice[];
                                readonly dismiss: (id: string) => void };
export function useStorageStatus(): StorageStatus;
export function useDraftText(field: 'name' | keyof Personality): {
  readonly initial: string;
  readonly commit: (text: string) => void;
};
export function useWizardDispatch(): React.Dispatch<WizardAction>;
```

Ces hooks rendent des **données structurées**. La mise en français (titres d'ancres,
avis, anomalies) appartient à `ui/format/`. `ui/` lit directement le contenu de `data/`
(glossaire, descriptions) sans passer par `state/` : la règle de dépendance amendée
l'autorise, et un faux hook de transit serait un contournement.

### Pourquoi ça ne re-rend pas tout à chaque frappe

Trois raisons, de la plus décisive à la moins :

1. **Un seul écran est monté.** L'assistant affiche une décision à la fois : le rayon
   d'un re-rendu, c'est une dizaine de nœuds. Je l'écris pour que personne n'introduise
   plus tard un sélecteur mémoïsé « au cas où ».
2. **Le texte libre ne passe pas par le reducer à chaque touche.** `useDraftText` rend
   une valeur initiale et un `commit` ; le champ garde sa frappe en `useState` local et
   ne remonte qu'au `blur` (et par sécurité après 500 ms d'inactivité). Une frappe ne
   déclenche ni purge, ni validation, ni sauvegarde. Seule optimisation réellement
   nécessaire, et la plus simple.
3. **Deux contextes, pas un.** `WizardStateContext` (change à chaque action) et
   `WizardDispatchContext` (référence stable à vie). Barres d'actions et cartes
   cliquables ne consomment que le dispatch : elles ne se re-rendent jamais. Gratuit.

`useCharacterSheet` mémoïse sur l'identité de `draft` : l'aperçu « ce que ça change sur ta
fiche » se recalcule une fois par choix, pas une fois par rendu.

---

## Contrat attendu du domaine

Ce que `src/state/` importe de `src/domain/`, et rien d'autre.

```ts
// src/domain/draft.ts   → AbilityId, AbilityMethod, AbilityInput, Personality,
//                         CharacterDraft, emptyDraft()
// src/domain/choice.ts  → ChoiceSlotId, ChoiceSource, ChoiceKind, UnavailableReason,
//                         ChoiceOption, ChoiceSlot   (formes fixées en A4)
// src/domain/validate.ts→ IssueSeverity, IssueTarget, IssueReason, Issue
// src/domain/catalogue.ts → Catalogue
// src/domain/sheet.ts   → CharacterSheet

export function openChoices(draft: CharacterDraft, catalogue: Catalogue)
  : readonly ChoiceSlot[];

export function validateDraft(draft: CharacterDraft, catalogue: Catalogue)
  : readonly Issue[];

/** Seul producteur de valeurs dérivées ; doit tolérer un brouillon incomplet. */
export function buildCharacter(draft: CharacterDraft, catalogue: Catalogue)
  : CharacterSheet;

export const STANDARD_ARRAY: readonly number[];
export const POINT_BUY_BUDGET: number;
export function pointBuyCost(score: number): number;
export function pointsSpent(base: AbilityInput['base']): number;
```

Cinq exigences non négociables :

1. **`openChoices` est pure et déterministe** : même brouillon, même catalogue, même
   liste, même ordre. Tout le parcours et toute la cascade en dépendent.
2. **L'identifiant de créneau porte la décision parente** (A3). Sans cela, `state/`
   devrait maintenir une table de dépendances codée en dur.
3. **Priorité d'exclusion déclarée et stable** : dotations fixes > race > historique >
   classe, puis ordre de déclaration. Le tri de l'étape 5 la reproduit.
4. **Une option indisponible reste dans `options`**, avec `unavailable` renseigné : c'est
   ce qui permet à l'UI d'expliquer « déjà obtenue grâce à ton historique » et à la purge
   de la retirer sans perdre son libellé.
5. **`buildCharacter` tolère l'incomplet** : valeurs partielles, ni exception ni `null`
   surprise ; la fiche est affichée en aperçu dès le premier écran.

Demande complémentaire au lot 1, issue de la relecture d'A9 : les créneaux de kind
`'expertise'` doivent voir dans leurs `options` les compétences effectivement acquises par
le brouillon courant, dotations fixes comprises.

---

## Tests prévus

Vitest, dans `src/state/__tests__/`, sur un catalogue miniature (2 races dont une à
sous-races, 2 classes dont une lanceuse, 2 historiques).

**Parcours**
- `it('n'affiche l'écran de sous-race que pour les races qui en ont')`
- `it('regroupe les compétences de toutes les sources dans l'étape « Ce que tu sais faire »')`
- `it('place le choix d'expertise après tous les choix de compétences')`
- `it('n'insère les écrans de sorts que pour une classe qui lance des sorts')`
- `it('garde le même écran courant quand le parcours s'allonge')`
- `it('recule jusqu'au dernier écran encore valide quand l'écran courant disparaît')`

**Cascade**
- `it('oublie les compétences de roublard quand on passe à clerc')`
- `it('ne touche à rien quand on re-sélectionne la même classe')`
- `it('conserve les compétences de classe quand on change seulement de sous-race')`
- `it('grise Perception dans les compétences de classe quand l'historique la donne déjà')`
- `it('retire Perception déjà cochée quand un retour en arrière change l'historique')`
- `it('aboutit au même état quel que soit l'ordre entre historique et classe')`
- `it('retire une expertise portant sur une compétence abandonnée')`
- `it('vide les caractéristiques quand on change de méthode de répartition')`
- `it('la purge se stabilise dès la deuxième passe')`

**Actions**
- `it('échange les valeurs quand on assigne 15 à une caractéristique déjà prise')`
- `it('refuse une troisième compétence quand on n'en choisit que deux')`
- `it('refuse une répartition qui dépasse 27 points')`
- `it('décoche une option déjà cochée')`

**Navigation et validation**
- `it('laisse avancer avec un choix incomplet')`
- `it('liste sur le récapitulatif tout ce qui manque, écran par écran')`
- `it('distingue un choix incomplet d'une répartition invalide')`
- `it('rattache chaque anomalie à l'écran qui la corrige')`
- `it('ne rend aucune phrase française depuis le domaine ni depuis l'état')` — vérifie que
  `Issue` et `Notice` ne portent que des raisons structurées

**Persistance**
- `it('reprend à l'écran quitté après un rechargement')`
- `it('repart d'un brouillon vide si le JSON est corrompu')`
- `it('repart d'un brouillon vide si la version du schéma est inconnue')`
- `it('remet à null une race retirée du catalogue sans jeter la sauvegarde')`
- `it('signale un stockage indisponible et continue en mémoire')`
- `it('cesse de réessayer après un quota dépassé')`
- `it('n'écrit pas dans le stockage quand rien n'a changé')`

**Invariants**
- `it('ne stocke aucune valeur dérivable dans le brouillon')`
- `it('reconstruit une fiche identique après un aller-retour de sauvegarde')`

**Intégration (obligatoire, A13.3 — à charge conjointe des lots 2 et 3)**, dans
`src/__tests__/parcours.test.tsx` : monte `<App />`, crée un personnage complet du premier
écran au récapitulatif au doigt (rôles et libellés uniquement), vérifie qu'un retour en
arrière sur la classe efface bien les compétences et affiche l'avis, puis démonte,
remonte, et vérifie que la session reprend à l'écran quitté avec les mêmes choix. C'est la
compensation explicite du renoncement à Playwright.

---

## Hors périmètre

- **Annulation / rétablissement multi-niveaux.** Une pile d'instantanés pèserait plus que
  le problème. La cascade est couverte par l'avis a posteriori et le retour arrière.
- **Confirmation avant changement destructeur et `describeImpact`** (B4) : retirés.
- **Jets de dés 4d6, `SET_ROLLED_SCORES`, `AbilityInput.rolled`, frontière d'aléatoire**
  (B1) : retirés. L'ajout ultérieur sera purement additif — une valeur de méthode, un
  champ, une action.
- **Synchronisation réseau.** Rien ne la prépare : `DraftStorage` est synchrone, et la
  rendre asynchrone « au cas où » contaminerait tout le lot.
- **Brouillons multiples.** Une clé, un personnage ; l'import/export du lot 4 couvre
  l'archivage.
- **Routeur, URL, historique du navigateur.**
- **Montée de niveau, multiclassage, homebrew.**
- **Machine à états tierce.** Une liste dérivée et un identifiant courant ; une
  bibliothèque coûterait plus que les 40 lignes de `flow.ts`.
- **Sélecteurs mémoïsés génériques.** Un seul écran monté : le problème n'existe pas.

---

## Risques

| Risque | Gravité | Parade |
|---|---|---|
| Le lot 1 ne fait pas porter la décision parente aux identifiants de créneau | élevée — toute la cascade s'écroule | Exigence 2 du contrat, arbitrée en A3 ; à vérifier sur le premier créneau livré, avant d'écrire `prune.ts` |
| Les options d'expertise ne voient pas les compétences acquises | élevée — le roublard est cassé | Correction demandée à A9 (expertise différée en fin d'étape 5) + test dédié |
| `openChoices` change d'ordre entre deux versions | moyenne — la priorité d'exclusion bascule | Test de convergence + ordre déclaré dans le contrat |
| Le tri de l'étape 5 diverge de la priorité du domaine | moyenne — options grisées inexplicables | Un seul rang de source, écrit une fois, testé |
| Trop d'écrans, parcours perçu comme long | moyenne | Mesurer les tapes jusqu'à la fin (cible < 25) ; regrouper un créneau de moins de 3 options si nécessaire |
| Suppression silencieuse mal vécue, sans confirmation (B4) | moyenne | Avis systématique et lisible, retour arrière à un doigt ; à réévaluer après les tests d'usage |
| `openChoices` appelée souvent (purge, parcours, validation) | faible | Quelques dizaines d'entrées, mémoïsation sur l'identité de `draft` ; à mesurer seulement si un ralentissement est observé |
| Sauvegarde effacée par le système sur iOS | faible mais visible | Documenté dans l'UI ; l'export JSON du lot 4 est la vraie réponse |
| Dérive du brouillon vers des valeurs dérivées | moyenne, insidieuse | Test de liste noire + question de revue |
