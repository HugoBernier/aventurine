# LOT 2 — Assistant de création & État (`src/state/`)

## Objectif

Piloter le parcours de création d'un personnage de niveau 1 : quel écran s'affiche,
ce que le joueur a choisi, ce qui manque, ce qui est sauvegardé. Ce lot ne connaît
aucune règle D&D (il les demande à `domain/`) et ne dessine rien (il expose des hooks).

Trois décisions structurantes, prises une fois pour tout le lot :

1. **Le parcours est dérivé, jamais stocké.** L'état retient l'identifiant de l'écran
   courant ; la liste des écrans est recalculée à partir du brouillon.
2. **Un choix appartient à la décision qui l'a ouvert.** Cette propriété, encodée dans
   l'identifiant du créneau de choix, suffit à produire toute l'invalidation en cascade.
3. **Un point de passage unique** (`commit`) traverse chaque modification du brouillon :
   purge, avis au joueur, recalcul du parcours, réancrage de l'écran. Impossible d'oublier
   une cascade puisqu'il n'existe qu'un chemin.

Fichiers prévus (aucun n'est écrit ici) :

```
src/state/
  types.ts                        WizardState, WizardAction, Screen, Notice
  flow.ts                         STEPS, buildFlow, locate, screenIdForSlot
  prune.ts                        pruneChoices, describeImpact
  reducer.ts                      createWizardReducer(catalogue)
  WizardProvider.tsx              deux contextes, init paresseuse, effet de sauvegarde
  hooks.ts                        hooks exposés à l'UI
  persistence/DraftStorage.ts     interface + types de résultat
  persistence/localStorageDraftStorage.ts
  persistence/memoryDraftStorage.ts
  persistence/parseSession.ts     garde de forme écrite à la main (pas de dépendance)
```

Convention de nommage retenue, conforme à la charte §6 : **le code est en anglais**,
**les identifiants de contenu SRD restent en français**. Un identifiant de créneau
mélange donc légitimement les deux : `'class:roublard:skills'`.

---

## Étapes et écrans

### Le modèle : deux niveaux, une seule liste

- **Étape (`Step`)** : un chapitre de la création. Sert uniquement au repère
  « étape 3 sur 8 » et au regroupement dans le récapitulatif. Il y en a 8, fixes.
- **Écran (`Screen`)** : **une décision, une seule**. C'est l'unité de navigation.
  Leur nombre varie (14 à 22 selon la classe et la race).

Pas de sous-machine par étape, pas de reducer imbriqué : une liste plate d'écrans
et un identifiant courant. Le repère affiché est l'étape (stable, rassurant) ;
la barre de progression fine se calcule sur les écrans.

### Les 8 étapes, dans l'ordre

| # | Étape | Pourquoi ici |
|---|---|---|
| 1 | Ta race | Concret, familier, ne dépend de rien. Entrée en douceur. |
| 2 | Ta classe | La décision la plus structurante ; ouvre compétences, sorts, équipement. |
| 3 | Tes caractéristiques | Après la classe : on peut conseiller « priorise la Dextérité ». |
| 4 | Ton historique | Dernière source de maîtrises ; voit tout ce qui précède. |
| 5 | Tes sorts | Dépend de la classe **et** des caractéristiques (nombre de sorts préparés). |
| 6 | Ton équipement | Dépend de classe + historique, sans réciproque. Peu engageant → tard. |
| 7 | Ton identité | Nom, alignement, personnalité : on se nomme quand on sait qui on est. |
| 8 | Récapitulatif | Ce qui manque, ce qu'on a, accès direct à chaque écran. |

Le fil directeur est un ordre de dépendances : chaque étape ne consomme que les
précédentes. La seule inversion réelle (l'historique donne des compétences fixes
alors que la classe a déjà fait choisir les siennes) est traitée par la règle de
cascade — voir plus bas ; elle ne justifie pas de tordre l'ordre pédagogique.

### Comment un écran naît

Deux familles seulement :

- Les **écrans d'ancrage** : un par décision structurante, codés en dur dans `flow.ts`.
  `race`, `class`, `abilities-method`, `abilities-assign`, `background`, `equipment`,
  `identity-name`, `identity-alignment`, `personality`, `summary`.
- Les **écrans de créneau** : générés, un par `ChoiceSlot` ouvert que le domaine déclare
  pour le brouillon courant. Identifiant : `'choice:' + slotId`.

`buildFlow(draft, catalogue)` = les ancres, avec les créneaux de chaque source insérés
juste après l'ancre correspondante. Une trentaine de lignes, pure, testée.

Conséquence directe et voulue (charte §5, SOLID/O) : **ajouter une race à sous-races
n'ajoute aucun code de navigation**, seulement une entrée de données qui déclare ses
créneaux. Aucun `switch` sur `'haut-elfe'` dans `state/`.

Exemple de parcours réel, haut-elfe magicien :

```
race → choice:race:haut-elfe:ability → choice:race:haut-elfe:cantrip
     → choice:race:haut-elfe:language
class → choice:class:magicien:skills
abilities-method → abilities-assign
background → choice:background:sage:languages
choice:class:magicien:cantrips → choice:class:magicien:spells
equipment → choice:class:magicien:equipment
identity-name → identity-alignment → personality → summary
```

Soit 17 écrans, un doigt, un choix à la fois.

---

## Forme de l'état

### Ce que le brouillon a le droit de contenir

Règle stricte : **le brouillon ne contient que ce que le joueur a tapé ou touché.**
Tout ce qui se recalcule (score final, modificateur, points de vie, classe d'armure,
initiative, vitesse, bonus de maîtrise, jets de sauvegarde, nombre de sorts préparés)
est absent, et le sera de façon vérifiée (voir « Comment on le garantit »).

`CharacterDraft` est **défini dans `domain/`**, pas ici : c'est l'entrée de
`buildCharacter`, le domaine ne peut donc pas ignorer ce type, et la règle de
dépendance `state → domain` reste à sens unique. Je le spécifie ci-dessous parce que
j'en suis le principal producteur ; c'est la pièce maîtresse du contrat.

```ts
// domain/draft.ts — possédé par le lot domaine, forme demandée par le lot état
export type AbilityId =
  | 'force' | 'dexterite' | 'constitution'
  | 'intelligence' | 'sagesse' | 'charisme';

export type AbilityMethod = 'standard-array' | 'point-buy' | 'dice';

export interface AbilityInput {
  readonly method: AbilityMethod;
  /** Scores AVANT bonus raciaux. Choix du joueur. Incomplet tant qu'il n'a pas fini. */
  readonly base: Partial<Record<AbilityId, number>>;
  /** Uniquement en méthode 'dice' : les 6 tirages. Entrée non reproductible → stockée. */
  readonly rolled: readonly number[] | null;
}

export interface Personality {
  readonly trait: string;
  readonly ideal: string;
  readonly bond: string;
  readonly flaw: string;
}

export type ChoiceSlotId = string; // 'class:roublard:skills', 'race:haut-elfe:cantrip'

export interface CharacterDraft {
  readonly name: string;
  readonly raceId: string | null;
  readonly subraceId: string | null;
  readonly classId: string | null;
  readonly backgroundId: string | null;
  readonly alignmentId: string | null;
  readonly abilities: AbilityInput;
  /** Choix multiples par créneau ouvert. Clé absente = créneau jamais touché. */
  readonly choices: Readonly<Record<ChoiceSlotId, readonly string[]>>;
  readonly personality: Personality;
}

export function emptyDraft(): CharacterDraft;
```

`rolled` mérite une justification : un tirage de dés n'est pas dérivable, c'est une
entrée du monde extérieur au même titre qu'une frappe clavier. Il est donc stocké.
Le `base` reste séparé : le joueur assigne ses tirages aux caractéristiques.

### L'état de l'assistant

```ts
// src/state/types.ts
import type { CharacterDraft, ChoiceSlotId } from '../domain';

export type StepId =
  | 'race' | 'class' | 'abilities' | 'background'
  | 'spells' | 'equipment' | 'identity' | 'summary';

export type ScreenId = string;

export interface Screen {
  readonly id: ScreenId;
  readonly step: StepId;
  readonly title: string;        // français, affiché tel quel
  readonly slotId?: ChoiceSlotId; // présent sur les écrans de créneau
}

export interface Notice {
  readonly id: string;
  readonly message: string;   // français
  readonly screenId: ScreenId; // où le joueur va réparer
}

export type StorageStatus = 'ok' | 'memory' | 'quota' | 'unavailable';

export interface WizardState {
  /** Les choix du joueur. Seule partie persistée avec currentScreenId. */
  readonly draft: CharacterDraft;
  /** Identifiant, jamais un index : le parcours change de longueur. */
  readonly currentScreenId: ScreenId;
  /** Ce qu'une cascade vient de supprimer. Historique, donc non dérivable. */
  readonly notices: readonly Notice[];
  readonly storage: StorageStatus;
}
```

Quatre champs. Notez trois absences volontaires :

- **Pas de `flow`** : dérivé de `draft` (`useMemo`).
- **Pas d'`issues`** : dérivé de `draft` par `domain.validateDraft`.
- **Pas de `visitedScreenIds`** : le parcours ne contient jamais un écran dont les
  prérequis manquent (pas d'écran « sorts » sans classe). « Déjà vu » n'apporte donc
  aucune information : **tout écran présent dans le parcours est atteignable**. C'est
  un champ que YAGNI supprime, pas un raccourci.

`notices` est bien de l'état légitime : « tu as perdu Discrétion parce que tu as changé
de classe » est un événement passé, indéductible de l'état courant.

### Comment on garantit l'absence de valeur dérivée

1. **Par la forme du type** : aucun champ numérique hors `abilities` ; aucun champ
   nommé d'après une valeur de fiche.
2. **Par le point d'entrée unique** : `domain.buildCharacter(draft, catalogue)` est le
   seul producteur de valeurs de fiche, appelé depuis un `useMemo` dans `useCharacterSheet`.
   `state/` n'affecte jamais son résultat à une variable de `WizardState`.
3. **Par un test de liste noire** : `it('ne stocke aucune valeur dérivable dans le brouillon')`
   parcourt récursivement un brouillon complet et échoue si une clé contient
   `pv|ca|modifier|bonus|total|initiative|speed|proficiencyBonus`.
4. **Par un test d'aller-retour** : `buildCharacter(parse(serialize(draft)))` est
   profondément égal à `buildCharacter(draft)` — si une valeur dérivée s'était glissée
   dans le brouillon, elle serait devenue une deuxième source de vérité détectable.
5. **Par la revue** : question ajoutée à la liste de la charte §10 — « ce champ
   pourrait-il être recalculé ? Alors il sort. »

---

## Actions

```ts
// src/state/types.ts
export type WizardAction =
  // --- Décisions structurantes ---
  | { readonly type: 'SELECT_RACE';       readonly raceId: string }
  | { readonly type: 'SELECT_SUBRACE';    readonly subraceId: string }
  | { readonly type: 'SELECT_CLASS';      readonly classId: string }
  | { readonly type: 'SELECT_BACKGROUND'; readonly backgroundId: string }
  | { readonly type: 'SELECT_ALIGNMENT';  readonly alignmentId: string }
  // --- Caractéristiques ---
  | { readonly type: 'SET_ABILITY_METHOD'; readonly method: AbilityMethod }
  | { readonly type: 'ASSIGN_ABILITY';     readonly ability: AbilityId;
                                           readonly score: number | null }
  | { readonly type: 'SET_ROLLED_SCORES';  readonly scores: readonly number[] }
  // --- Créneaux de choix (compétences, langues, sorts, dons de race, équipement) ---
  | { readonly type: 'TOGGLE_CHOICE'; readonly slotId: ChoiceSlotId;
                                      readonly optionId: string }
  // --- Texte libre ---
  | { readonly type: 'SET_NAME';        readonly name: string }
  | { readonly type: 'SET_PERSONALITY'; readonly field: keyof Personality;
                                        readonly text: string }
  // --- Navigation ---
  | { readonly type: 'GO_NEXT' }
  | { readonly type: 'GO_BACK' }
  | { readonly type: 'GO_TO'; readonly screenId: ScreenId }
  // --- Divers ---
  | { readonly type: 'DISMISS_NOTICE'; readonly noticeId: string }
  | { readonly type: 'RESET' }
  | { readonly type: 'SET_STORAGE_STATUS'; readonly status: StorageStatus };
```

Dix-sept actions, `switch` exhaustif clos par un `const _: never = action`.

| Action | Comportement |
|---|---|
| `SELECT_RACE` | Si `raceId` identique → **retourne `state`** (identité conservée). Sinon pose la race, met `subraceId` à `null`, puis `commit`. |
| `SELECT_SUBRACE` | Idempotent. Ignorée si la sous-race n'appartient pas à la race courante (état illégal non représentable). Puis `commit`. |
| `SELECT_CLASS` | Idempotent. Pose la classe, puis `commit` — c'est là que la cascade de la section suivante se produit. |
| `SELECT_BACKGROUND` | Idempotent, puis `commit`. Ses dotations fixes peuvent évincer un choix de classe. |
| `SELECT_ALIGNMENT` | Pose l'alignement. Aucun créneau n'en dépend : `commit` est un passage à vide. |
| `SET_ABILITY_METHOD` | Méthode identique → no-op. Sinon **vide `base` et `rolled`** : les valeurs d'une méthode n'ont pas de sens dans une autre. C'est la seule remise à zéro codée en dur, et elle est annoncée par un avis. |
| `ASSIGN_ABILITY` | `score: null` désassigne. En `standard-array` : si la valeur est déjà portée par une autre caractéristique, **les deux valeurs s'échangent** (règle prévisible, un seul geste). En `point-buy` : refusée si elle sort de 8–15 ou dépasse le budget de 27 points — l'invalide n'est jamais atteignable par un geste. En `dice` : refusée si la valeur n'est pas un tirage disponible. |
| `SET_ROLLED_SCORES` | Enregistre 6 tirages (le tirage lui-même vit dans l'UI via une frontière `random` du domaine). Vide `base` : les anciennes assignations ne correspondent plus. |
| `TOGGLE_CHOICE` | Option déjà cochée → décochée. Sinon cochée, sauf si l'option est marquée indisponible ou si le créneau est plein (`pick` atteint) : **ignorée silencieusement**, l'UI ayant désactivé la case avec la raison. Si `pick === 1`, la sélection remplace l'ancienne. Puis `commit` (cocher une compétence peut fermer une option ailleurs). |
| `SET_NAME` | Écrit le nom, coupé à 60 caractères. Pas de `commit` : rien n'en dépend. |
| `SET_PERSONALITY` | Idem, 300 caractères par champ. |
| `GO_NEXT` | Écran suivant du parcours. **Jamais bloquée par un choix incomplet.** No-op sur le récapitulatif. |
| `GO_BACK` | Écran précédent. No-op sur le premier. |
| `GO_TO` | Saute à n'importe quel écran **présent dans le parcours courant**. Ignorée sinon. Sert au récapitulatif (« Corriger ») et au sélecteur d'étapes. |
| `DISMISS_NOTICE` | Retire un avis. Les avis expirent aussi d'eux-mêmes après 3 actions modifiantes. |
| `RESET` | Repart d'`emptyDraft()`, écran `race`, avis vidés. La confirmation est à l'UI. |
| `SET_STORAGE_STATUS` | Émise par l'effet de sauvegarde quand `localStorage` refuse. Ne touche pas au brouillon. |

Le reducer est produit par une fabrique : `createWizardReducer(catalogue)`, mémoïsée au
niveau module. Ainsi `state/` **n'importe pas `data/`** — c'est `App.tsx` qui injecte le
catalogue dans le `WizardProvider` —, et les tests utilisent un catalogue miniature de
deux races et deux classes.

---

## Invalidation en cascade

### Le problème

Le joueur choisit roublard, coche Discrétion et Perception, revient en arrière, prend
clerc. Discrétion n'est pas une compétence de clerc. Et si son historique lui donnait
déjà Perception, la cocher une seconde fois est interdit.

### La règle générale, en une phrase

> **Un choix ne survit que si le créneau qui l'a ouvert est encore ouvert à l'identique
> et que l'option est encore proposée. Sinon il est supprimé, en entier, sans
> rattrapage.**

Deux mécanismes suffisent à l'appliquer, et ils sont tous les deux déjà nécessaires :

**1. L'identité du créneau porte la décision parente.** Le domaine nomme ses créneaux
`'class:roublard:skills'`, pas `'class:skills'`. Passer à clerc n'ouvre pas le même
créneau mais `'class:clerc:skills'` : l'ancien disparaît, et avec lui *tous* ses choix.
Aucune ligne de code spécifique aux compétences, aux sorts ou au domaine de clerc.

**2. Une purge, à chaque `commit`, à point fixe.**

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

La purge : pour chaque entrée de `draft.choices`, si son `slotId` n'est plus dans
`openChoices(draft, catalogue)` → supprimée (`slot-closed`) ; sinon, chaque option
sélectionnée absente des options du créneau ou marquée `unavailable` → retirée
(`option-withdrawn`). On recommence tant que quelque chose bouge, avec un plafond de
3 passes. Une suppression ne fait qu'élargir la disponibilité ailleurs (les exclusions
sont monotones), donc une seconde passe ne supprime jamais rien de nouveau : le plafond
est une ceinture, testée par `it('la purge se stabilise dès la deuxième passe')`.

### Réponse aux deux cas de l'énoncé

**Roublard → clerc.** `'class:roublard:skills'` n'existe plus : Discrétion et Perception
partent ensemble, y compris Perception qui aurait pu être légale ailleurs. Le joueur
arrive sur l'écran « Choisis 2 compétences de clerc » vierge, avec l'avis :
« Tu as changé de classe : tes compétences de roublard ont été remises à zéro. »

Pourquoi ne pas conserver ce qui reste légal ? Parce que « j'avais coché 2 cases, il en
reste 1 cochée que je n'ai pas choisie en tant que clerc » est plus déroutant qu'une
ardoise propre, et parce que la règle « ça repart de zéro quand tu changes d'avis »
s'explique en une phrase à quelqu'un qui n'a jamais joué. KISS gagne sur l'économie de
deux tapes.

**Doublon avec l'historique.** Le domaine ne propose jamais deux fois la même compétence :
`openChoices` marque `unavailable: "Déjà obtenue grâce à ton historique"` sur les options
déjà acquises. Deux ordres possibles, un seul état final :

- *Historique avant classe* : Perception arrive désactivée sur l'écran des compétences
  de clerc, avec sa raison affichée. Aucun avis, rien n'a été perdu.
- *Classe avant historique* : Perception était cochée, l'historique la rend indisponible,
  la purge la retire. Créneau à 1/2, avis : « Perception t'est déjà donnée par ton
  historique ; il te reste 1 compétence de clerc à choisir. »

Pour que cette convergence soit garantie, l'exclusion a une **priorité déterministe** :
les dotations fixes l'emportent toujours sur les choix, et entre deux créneaux, celui
qui apparaît le plus tôt dans l'ordre de `openChoices` l'emporte. Le domaine doit rendre
cet ordre stable — c'est une clause du contrat.

### Cas limites

| Cas | Comportement |
|---|---|
| Re-sélection de la même classe | `state` retourné à l'identique. Rien n'est purgé. Test dédié : c'est le bug le plus coûteux du lot. |
| Changement de sous-race seulement | Seuls les créneaux `race:<sous-race>:*` tombent. Compétences de classe intactes. |
| Écran courant supprimé par la cascade | On recule dans l'ancien parcours jusqu'au premier écran encore présent ; à défaut, premier écran du parcours. |
| Créneau devenu plus petit (`pick` 4 → 2) | Le créneau change d'identité côté domaine si sa taille dépend de la décision parente ; sinon les options excédentaires ne sont **pas** tronquées automatiquement — la validation signale « tu as 3 compétences pour 2 places ». Cas non atteignable par un geste, seulement par une sauvegarde ancienne. |
| Changement de méthode de caractéristiques | Seule remise à zéro hors purge ; annoncée. |
| Catalogue modifié entre deux versions | Un `raceId` inconnu est remis à `null` à la lecture (réparation), puis la purge fait le reste. La sauvegarde n'est jamais jetée pour un identifiant inconnu. |
| Deux sources voudraient la même option | Impossible par construction (exclusion à priorité). Un test le vérifie plutôt qu'un garde-fou à l'exécution. |
| Cascade en chaîne (race → sorts raciaux → langues) | Traitée par le point fixe, sans code spécifique. |

### Prévenir plutôt que consoler

`describeImpact(draft, action, catalogue): readonly string[]` rejoue la purge sur le
brouillon hypothétique et rend la liste, en français, de ce qui serait perdu. L'UI
n'affiche une confirmation que si la liste n'est pas vide : changer de classe sans rien
avoir coché ne déclenche aucune boîte de dialogue. Une fonction pure, dix lignes,
réutilisant la purge existante.

---

## Navigation

- **Avancer** : `GO_NEXT`, écran suivant du parcours. Le bouton « Suivant » n'est
  **jamais désactivé** (charte §4 : progression linéaire sans blocage). Avancer avec un
  choix incomplet est un usage normal, pas une erreur : on peut découvrir tout
  l'assistant avant de décider. Le récapitulatif final liste ce qui manque, chaque ligne
  étant un lien direct vers l'écran concerné.
- **Reculer** : `GO_BACK`. `canGoBack` est faux sur le premier écran. Le geste « retour »
  du navigateur n'est pas géré (charte : aucun routeur) ; le bouton « Précédent » est en
  bas d'écran, atteignable au pouce.
- **Sauter** : `GO_TO(screenId)`, autorisé vers tout écran du parcours courant. Comme le
  parcours ne contient jamais un écran dont les prérequis manquent, aucune garde
  supplémentaire n'est nécessaire — le sélecteur d'étapes et le récapitulatif s'appuient
  dessus.
- **Reprendre** : le brouillon *et* `currentScreenId` sont relus au démarrage dans
  l'initialiseur paresseux de `useReducer`, donc de façon synchrone, sans écran de
  chargement ni clignotement. Si l'écran mémorisé n'existe plus, on retombe sur le
  premier écran encore valide. La reprise est silencieuse ; « Recommencer » (`RESET`)
  reste accessible depuis le récapitulatif et le menu.
- **Repère de progression** : `useWizard().progress` rend `{ stepIndex, stepCount: 8,
  stepLabel, screenIndex, screenCount }`. On affiche « Étape 2 sur 8 » (stable) et une
  barre fine sur les écrans (précise). Annoncer « écran 7 sur 19 » découragerait.

---

## Validation

### Où elle vit

| Rôle | Lieu | Forme |
|---|---|---|
| Empêcher l'illégal | `state/reducer.ts` | Actions refusées : dépassement de `pick`, score hors bornes, budget d'achat de points, option indisponible. |
| Nettoyer le caduc | `state/prune.ts` | Suppression sans interprétation. |
| Dire ce qui manque ou cloche | `domain/validate.ts` | `validateDraft(draft, catalogue): readonly Issue[]` |
| Situer et présenter | `state/hooks.ts` | Rattache chaque anomalie à un écran. |

La frontière entre purge et validation, énoncée une fois pour toutes :

> **La purge supprime ce qui est objectivement caduc. La validation signale ce qu'on ne
> peut pas corriger sans choisir à la place du joueur.**

### Quand elle s'exécute

À chaque changement de brouillon, dans un `useMemo`. Il n'y a pas de « soumission » :
rien à valider au clic. Le résultat n'est jamais stocké dans `WizardState` — ce serait
une valeur dérivée.

### Incomplet contre invalide

```ts
// domain/validate.ts
export type IssueSeverity = 'incomplete' | 'invalid';
export type IssueTarget =
  | { readonly kind: 'slot';  readonly slotId: ChoiceSlotId }
  | { readonly kind: 'field'; readonly field: keyof CharacterDraft };

export interface Issue {
  readonly severity: IssueSeverity;
  readonly target: IssueTarget;
  readonly message: string; // français, prêt à afficher
}
```

- **`incomplete`** : une décision n'a pas été prise ou pas jusqu'au bout.
  « Il te reste 1 compétence de clerc à choisir. » « Tu n'as pas encore de nom. »
  Attendu, non bloquant, ton neutre, gris. Compté dans le badge du récapitulatif.
- **`invalid`** : l'état viole une règle et le joueur doit trancher.
  « Tes caractéristiques dépassent le budget de 27 points. » Alerte, à corriger.

Comme le reducer refuse les gestes illégaux et que la purge nettoie le caduc, `invalid`
n'est atteignable qu'à la relecture d'une sauvegarde ancienne ou modifiée à la main.
C'est voulu : **on préfère rendre l'invalide irreprésentable plutôt que le détecter**.
Le niveau existe quand même parce qu'une sauvegarde est une entrée non fiable, et parce
qu'un message adapté vaut mieux qu'une correction arbitraire.

### Remontée à l'UI

Les messages sont écrits **en français dans `domain/`**. C'est assumé : l'application
n'a qu'une langue, et une table code → message dans `state/` serait exactement
l'indirection spéculative que YAGNI proscrit. En revanche le domaine **ne connaît pas
les écrans** : il désigne une cible (`slot` ou `field`), et `state/flow.ts` la traduit en
`screenId`. La dépendance reste `state → domain`.

L'UI consomme `useScreenIssues(screenId)` (bandeau discret sur l'écran courant) et
`useIssues()` (récapitulatif groupé par étape, chaque ligne cliquable).

---

## Persistance

C'est la seule interface du lot, et elle est justifiée par la charte elle-même
(§3, YAGNI : « sauf frontière réelle — persistance »). Elle a **deux implémentations**,
pas une.

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
  | { readonly kind: 'ok' }
  | { readonly kind: 'quota' }
  | { readonly kind: 'unavailable' };

export interface DraftStorage {
  load(): LoadResult;
  save(session: PersistedSession): SaveResult;
  clear(): void;
}

export function localStorageDraftStorage(): DraftStorage;
export function memoryDraftStorage(): DraftStorage; // tests + navigation privée
```

- **Clé** : `'ddbf:draft:v1'`. Le numéro de version est **dans la clé et dans la charge
  utile**. La clé isole les générations ; le champ `version` est la vérification qui
  fait autorité (3 lignes, défensif contre une charge éditée à la main).
- **Quand on écrit** : anti-rebond de 400 ms après toute action qui change
  `draft` ou `currentScreenId` (comparaison par référence — le reducer ne crée un nouvel
  objet que s'il a réellement changé, ce qui rend le test `it('n'écrit rien quand rien
  n'a changé')` trivial). Écriture immédiate et synchrone sur `pagehide` et sur
  `visibilitychange` en `hidden` : sur mobile, l'onglet est tué sans `beforeunload`.
- **Quand on lit** : une fois, dans l'initialiseur paresseux de `useReducer`.
- **Migration** : aucune aujourd'hui, il n'existe qu'une version (YAGNI). La politique
  d'un futur changement est fixée dès maintenant : version inconnue ou supérieure →
  **abandon propre**, on repart d'un brouillon vide et on le dit
  (« Ta sauvegarde vient d'une autre version de l'application ; on repart de zéro. »).
  Une clé versionnée d'une génération antérieure est supprimée par la version suivante.

| Incident | Détection | Réaction |
|---|---|---|
| `localStorage` inaccessible (navigation privée verrouillée, cookies bloqués, iframe) | accès à `window.localStorage` **et** écriture sonde, tous deux dans un `try/catch` | bascule sur `memoryDraftStorage`, statut `unavailable`, bandeau unique : « Ta progression ne sera pas conservée si tu fermes cet onglet. » |
| Quota dépassé | `SaveResult.kind === 'quota'` | statut `quota`, bandeau, **arrêt des tentatives** jusqu'au prochain changement d'écran (pas de nouvel essai à chaque frappe). On ne supprime jamais la sauvegarde existante pour faire de la place. |
| JSON illisible | `JSON.parse` dans un `try/catch` | clé supprimée, brouillon vierge, message. Conserver un blob corrompu consomme du quota et bloque le joueur. |
| Forme invalide (JSON valide mais objet inattendu) | `parseSession(unknown): PersistedSession \| null`, garde de forme écrite à la main, ~40 lignes, aucune dépendance | même traitement que JSON illisible. |
| Identifiant inconnu du catalogue (contenu retiré) | comparaison aux entrées du catalogue à la lecture | **réparation champ par champ** : l'identifiant passe à `null`, la purge enchaîne. La sauvegarde n'est jamais jetée pour ça. |
| Données effacées par le système (iOS, 7 jours d'inactivité) | `load()` rend `empty` | démarrage normal. Rien à faire, mais la limite est documentée dans l'UI (« sauvegarde sur cet appareil uniquement »). |

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
    readonly stepIndex: number; readonly stepCount: number;
    readonly stepLabel: string;
    readonly screenIndex: number; readonly screenCount: number;
  };
  readonly goNext: () => void;
  readonly goBack: () => void;
  readonly goTo: (screenId: ScreenId) => void;
};

export function useChoiceSlot(slotId: ChoiceSlotId): {
  readonly slot: ChoiceSlot;
  readonly selected: readonly string[];
  readonly remaining: number;   // dérivé : slot.pick - selected.length
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
  readonly pool: readonly number[];      // dérivé du domaine
  readonly pointsLeft: number | null;    // dérivé, null hors achat de points
  readonly setMethod: (method: AbilityMethod) => void;
  readonly assign: (ability: AbilityId, score: number | null) => void;
  readonly setRolled: (scores: readonly number[]) => void;
};

export function useCharacterSheet(): CharacterSheet;               // 100 % dérivé
export function useIssues(): readonly LocatedIssue[];              // tout le brouillon
export function useScreenIssues(screenId: ScreenId): readonly LocatedIssue[];
export function useNotices(): { readonly notices: readonly Notice[];
                                readonly dismiss: (id: string) => void };
export function useStorageStatus(): StorageStatus;
export function useDraftText(field: 'name' | keyof Personality): {
  readonly initial: string;
  readonly commit: (text: string) => void;
};
```

### Pourquoi ce découpage ne re-rend pas tout à chaque frappe

Trois raisons, de la plus décisive à la moins :

1. **Un seul écran est monté.** L'assistant affiche une décision à la fois : le rayon
   d'action d'un re-rendu, c'est une dizaine de nœuds. Toute optimisation plus poussée
   serait de la complexité gratuite — je l'écris explicitement pour que personne
   n'introduise plus tard un sélecteur mémoïsé « au cas où ».
2. **Le texte libre ne passe pas par le reducer à chaque touche.** `useDraftText` rend
   une valeur initiale et un `commit` : le champ garde sa frappe en `useState` local et
   ne remonte qu'au `blur` (et par sécurité toutes les 500 ms d'inactivité). Une frappe
   ne déclenche donc ni purge, ni validation, ni sauvegarde. C'est la seule optimisation
   réellement nécessaire, et elle est aussi la plus simple.
3. **Deux contextes, pas un.** `WizardStateContext` (change à chaque action) et
   `WizardDispatchContext` (référence stable pour toute la vie de l'application). Les
   barres d'action, boutons « Suivant/Précédent » et cartes cliquables ne consomment que
   le dispatch : ils ne se re-rendent jamais. Gratuit, deux `createContext` au lieu d'un.

`useCharacterSheet` mémoïse sur l'identité de `draft` : le panneau « ce que ça change sur
ta fiche » se recalcule une fois par choix, pas une fois par rendu.

---

## Contrat attendu du domaine

Ce que `src/state/` importe de `src/domain/`, et rien d'autre. Toute évolution de cette
liste se négocie entre les deux lots.

```ts
// --- Types ---
export type AbilityId; export type AbilityMethod; export type ChoiceSlotId;
export interface AbilityInput; export interface Personality;
export interface CharacterDraft;      // forme donnée plus haut
export interface CharacterSheet;      // toutes les valeurs dérivées
export interface Catalogue;           // instancié par data/, injecté par App.tsx

// --- Le créneau de choix : pièce maîtresse du contrat ---
export type ChoiceSource = 'race' | 'class' | 'background';
export type ChoiceKind =
  | 'skill' | 'language' | 'tool' | 'cantrip' | 'spell'
  | 'ability' | 'equipment' | 'subclass' | 'ancestry' | 'fighting-style';

export interface ChoiceOption {
  readonly id: string;
  readonly label: string;        // français
  readonly summary: string;      // une phrase d'explication, français
  readonly unavailable?: string; // raison en français si l'option est déjà acquise
}

export interface ChoiceSlot {
  /** DOIT contenir l'identifiant de la décision parente :
   *  'class:roublard:skills', 'race:haut-elfe:cantrip'. */
  readonly id: ChoiceSlotId;
  readonly source: ChoiceSource;
  readonly kind: ChoiceKind;
  readonly title: string;   // « Choisis 2 compétences de roublard »
  readonly help: string;    // explication courte, français
  readonly pick: number;
  readonly options: readonly ChoiceOption[];
}

// --- Fonctions ---
export function emptyDraft(): CharacterDraft;

/** Tous les créneaux que le brouillon courant ouvre, dans un ORDRE STABLE.
 *  Exclut ou marque `unavailable` toute option déjà acquise par une dotation fixe
 *  ou par un créneau antérieur dans cet ordre. */
export function openChoices(draft: CharacterDraft, catalogue: Catalogue)
  : readonly ChoiceSlot[];

export function validateDraft(draft: CharacterDraft, catalogue: Catalogue)
  : readonly Issue[];

/** Le seul producteur de valeurs dérivées : scores finaux, modificateurs, PV, CA,
 *  initiative, vitesse, maîtrises, bonus de maîtrise, jets de sauvegarde,
 *  langues, sorts préparés. Doit tolérer un brouillon incomplet. */
export function buildCharacter(draft: CharacterDraft, catalogue: Catalogue)
  : CharacterSheet;

// --- Caractéristiques ---
export const STANDARD_ARRAY: readonly number[];
export const POINT_BUY_BUDGET: number;
export function pointBuyCost(score: number): number;
export function pointsSpent(base: AbilityInput['base']): number;
```

Quatre exigences non négociables pour que ce lot fonctionne :

1. **`openChoices` est pur et déterministe** : même brouillon, même catalogue, même
   liste, dans le même ordre. Tout le parcours et toute la cascade en dépendent.
2. **L'identifiant de créneau porte la décision parente.** C'est ce qui rend
   l'invalidation gratuite. Sans cela, `state/` devrait maintenir une table de
   dépendances codée en dur — exactement ce qu'on veut éviter.
3. **`buildCharacter` tolère l'incomplet** et rend des valeurs partielles (pas
   d'exception, pas de `null` surprise) : la fiche est affichée en aperçu dès l'écran 1.
4. **`openChoices` est la seule source des exclusions.** `state/` ne sait pas qu'une
   compétence ne se prend pas deux fois ; il applique « l'option n'est plus proposée ».

---

## Tests prévus

Vitest, dans `src/state/__tests__/`, sur un catalogue miniature (2 races dont une à
sous-races, 2 classes dont une lanceuse de sorts, 2 historiques).

**Parcours**
- `it('n'affiche l'écran de sous-race que pour les races qui en ont')`
- `it('insère les écrans de sorts seulement pour une classe qui lance des sorts')`
- `it('garde le même écran courant quand le parcours s'allonge')`
- `it('recule jusqu'au dernier écran encore valide quand l'écran courant disparaît')`

**Cascade**
- `it('oublie les compétences de roublard quand on passe à clerc')`
- `it('ne touche à rien quand on re-sélectionne la même classe')`
- `it('conserve les compétences de classe quand on change seulement de sous-race')`
- `it('retire Perception des compétences de clerc quand l'historique la donne déjà')`
- `it('aboutit au même état que l'historique soit choisi avant ou après la classe')`
- `it('vide les caractéristiques quand on change de méthode de répartition')`
- `it('la purge se stabilise dès la deuxième passe')`
- `it('annonce en français ce qu'un changement de classe ferait perdre')`

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

---

## Hors périmètre

- **Annulation / rétablissement multi-niveaux.** Une pile d'instantanés du brouillon
  serait la seule implémentation honnête, et elle pèse plus que le problème qu'elle
  résout. La cascade est traitée en amont : confirmation avant un changement qui détruit
  quelque chose (`describeImpact`), avis expliquant ce qui a été retiré, retour arrière
  d'un doigt. Si les tests d'usage montrent de la frustration, l'incrément minimal est
  **une** annulation d'un niveau, limitée à la dernière action destructrice (un champ
  `lastDestructive: { label, previous }`, effacé à l'action suivante). Pas avant.
- **Synchronisation réseau.** Hors périmètre du projet (charte §1). Rien dans ce lot ne
  la prépare : `DraftStorage` est synchrone, et le rendre asynchrone « au cas où »
  contaminerait tout le lot.
- **Brouillons multiples.** Une clé, un personnage. Un second personnage passe par
  « Recommencer ». L'import/export JSON, prévu ailleurs, couvre déjà le besoin d'archiver.
- **Routeur, URL, historique du navigateur.** Charte §2 : aucun routage.
- **Montée de niveau, multiclassage, homebrew.** Charte §1.
- **Machine à états tierce.** Le parcours est une liste dérivée et un identifiant courant ;
  une bibliothèque coûterait plus que les 40 lignes de `flow.ts`.
- **Sélecteurs mémoïsés génériques / abonnement fin au contexte.** Un seul écran est
  monté : le problème n'existe pas.

---

## Risques

| Risque | Gravité | Parade |
|---|---|---|
| Le domaine ne nomme pas ses créneaux avec la décision parente | élevée — toute la cascade s'écroule | Point 2 du contrat, à valider avant la première ligne de `prune.ts`. Repli : une table de dépendances explicite dans `state/`, plus verbeuse et à maintenir. |
| Le domaine refuse de porter `CharacterDraft` | moyenne | Repli : `state/` définit le type et `buildCharacter` reçoit les champs éclatés. Coût : signature à rallonge et couplage inversé à surveiller. Option non retenue. |
| Trop d'écrans, parcours perçu comme long | moyenne | Mesurer le nombre de tapes pour finir (cible : moins de 25). Regrouper les créneaux d'une même source de moins de 3 options si nécessaire. |
| Suppression silencieuse mal vécue | moyenne | Avis systématique, confirmation avant destruction, tests d'usage sur écran de 360 px. |
| `openChoices` appelé souvent (purge à point fixe, parcours, validation) | faible | Quelques dizaines d'entrées, mémoïsation sur l'identité de `draft`. À mesurer seulement si un ralentissement est observé. |
| Sauvegarde effacée par le système sur iOS | faible, mais visible | Documenté dans l'UI ; l'export JSON du lot fiche est la vraie réponse. |
| Dérive du brouillon vers des valeurs dérivées | moyenne, insidieuse | Test de liste noire + question ajoutée à la revue. |
