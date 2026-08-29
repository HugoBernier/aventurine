# LOT 1 — Domaine & Données

> Révision 2. Intègre `docs/plans/00-arbitrage.md` (§A1 à §A18, §B1 à §B5), qui
> fait autorité sur ce plan, et la charte amendée (§5, §6, §9).

## Objectif

Poser `src/domain/` (types et règles pures) et `src/data/` (contenu SRD 5.1 en
français) pour un personnage de **niveau 1 uniquement**. À la fin du lot :

- un personnage se décrit entièrement par un `CharacterDraft` sérialisable en JSON ;
- `buildSheet(draft, catalogue)` en dérive toute la fiche, sans rien stocker ;
- `openChoices(draft, catalogue)` dit quelles décisions restent à prendre, sous une
  forme unique que `state/` et `ui/` consomment sans connaître les règles ;
- `draftIssues(draft, catalogue)` dit ce qui manque, en **raisons structurées** ;
- ajouter une race, une classe, un historique ou un sort = **ajouter une entrée de
  données**, jamais toucher au domaine ;
- `domain/` n'importe rien : ni React, ni `data/`, ni `state/`, ni `ui/`.

Aucun composant, aucun reducer, aucune persistance : lots 2 et 3.

---

## Arborescence des fichiers

Pas de baril à la racine d'une couche (charte §5) : **ni `src/domain/index.ts`, ni
`src/data/index.ts`**. Chaque module s'importe par son chemin. `src/data/catalogue.ts`
et `src/data/classes/index.ts` sont des modules d'agrégation _à l'intérieur_ d'une
couche : autorisés par §A11.

### `src/domain/` — 16 fichiers, ~1 200 lignes

| Fichier              | Contenu                                                          | ~l. |
| -------------------- | ---------------------------------------------------------------- | --- |
| `abilities.ts`       | 6 caractéristiques, `abilityModifier`, `AbilityScores`           | 55  |
| `skills.ts`          | 18 compétences, table compétence → caractéristique               | 50  |
| `point-buy.ts`       | budget, coûts, `standardArray`, `abilityRows` (§A16)             | 110 |
| `choice.ts`          | `ChoiceSlot`, `ChoiceOption`, `UnavailableReason` (forme §A4)    | 45  |
| `choice-spec.ts`     | `ChoiceSpec` (forme auteur) + `slotId()`                         | 95  |
| `race.ts`            | `Race`, `Subrace`, `Feature`, `Proficiencies`                    | 70  |
| `character-class.ts` | `CharacterClass`, `Subclass`, `Spellcasting`, `UnarmoredDefense` | 115 |
| `background.ts`      | `Background`, `SuggestedTraits`                                  | 45  |
| `spell.ts`           | `Spell`, `MagicSchool`, `spellsForClass`                         | 60  |
| `equipment.ts`       | `Weapon`, `Armor`, `Item`, `ItemLine`, `EquipmentOption`         | 85  |
| `catalogue.ts`       | `Catalogue` + `findRace`/`findClass`/…                           | 70  |
| `draft.ts`           | `CharacterDraft`, `emptyDraft()`                                 | 60  |
| `granted.ts`         | `grantedProficiencies(draft, catalogue)` — socle partagé         | 90  |
| `open-choices.ts`    | `openChoices(draft, catalogue)` + `optionsFor`                   | 140 |
| `sheet.ts`           | `buildSheet(draft, catalogue)` + calculs dérivés                 | 180 |
| `issues.ts`          | `draftIssues(draft, catalogue)`, `DraftIssue`                    | 80  |

Tests à côté : `abilities.test.ts`, `point-buy.test.ts`, `open-choices.test.ts`,
`sheet.test.ts`, `issues.test.ts`, `draft.test.ts`.

### `src/data/` — 27 fichiers, ~4 000 lignes

```
src/data/
  attribution.ts               licence SRD (EN verbatim + FR) + mention Aventurine   ~30 l
  abilities.ts                 6 noms français                              ~1 Ko
  skills.ts                    18 entrées (nom, phrase d'usage) + ALL_SKILL_IDS   ~3 Ko
  languages.ts                 16 entrées                                   ~1 Ko
  alignments.ts                9 entrées                                    ~2 Ko
  tools.ts                     ~25 entrées                                  ~2 Ko
  weapons.ts                   37 armes SRD                                 ~5 Ko
  armor.ts                     13 armures + bouclier                        ~2 Ko
  gear.ts                      paquetages et matériel divers (~40)          ~3 Ko
  draconic-ancestries.ts       10 entrées                                   ~2 Ko
  fighting-styles.ts           6 entrées                                    ~2 Ko
  races.ts                     9 races, 4 sous-races imbriquées             ~19 Ko
  classes/
    index.ts                   agrège les 12                                ~20 l
    barbarian.ts … wizard.ts   12 fichiers, ~150 l chacun                    ~70 Ko
  backgrounds.ts               acolyte + personnalisé (§B3)                 ~7 Ko
  spells.ts                    ~85 sorts, mécanique + `summary`             ~47 Ko
  catalogue.ts                 `export const CATALOGUE: Catalogue`          ~35 l
  catalogue.test.ts            unicité, intégrité référentielle, garde-fous
```

`src/data/*` n'importe de `domain/` que des **types** (`import type`). Aucune
valeur, aucune fonction. Seules expressions autorisées dans `data/` : composer un
tableau ou un objet littéral, et `SKILLS.map(s => s.id)` pour les listes « parmi
toutes ». Aucune condition, aucun calcul.

---

## Types clés (code TypeScript réel)

Tout le code est en **anglais** (charte §6). Restent en français : les identifiants
de contenu (`'demi-orc'`, `'roublard'`, `'athletisme'`), les chaînes de `data/`, les
noms de tests.

### Vocabulaire de règle — unions littérales dérivées de tableaux

Ensembles fermés par les règles, qui ne grossissent jamais. Écrits une fois, type
dérivé : pas de cast, pas de métaprogrammation.

```ts
// src/domain/abilities.ts
export const ABILITIES = [
  'force',
  'dexterite',
  'constitution',
  'intelligence',
  'sagesse',
  'charisme',
] as const;

export type AbilityId = (typeof ABILITIES)[number];
export type AbilityScores = Readonly<Record<AbilityId, number>>;

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}
```

```ts
// src/domain/skills.ts
export const SKILL_ABILITY = {
  acrobaties: 'dexterite',
  arcanes: 'intelligence',
  athletisme: 'force',
  discretion: 'dexterite',
  dressage: 'sagesse',
  escamotage: 'dexterite',
  histoire: 'intelligence',
  intimidation: 'charisme',
  investigation: 'intelligence',
  medecine: 'sagesse',
  nature: 'intelligence',
  perception: 'sagesse',
  perspicacite: 'sagesse',
  persuasion: 'charisme',
  religion: 'intelligence',
  representation: 'charisme',
  supercherie: 'charisme',
  survie: 'sagesse',
} as const satisfies Record<string, AbilityId>;

export type SkillId = keyof typeof SKILL_ABILITY;
```

Même motif pour `MagicSchool` (8), `AlignmentId` (9), `ArmorCategory`,
`WeaponCategory`, `DamageType`, `CreatureSize`.

Les identifiants de **contenu** (`RaceId`, `ClassId`, `SpellId`, `LanguageId`,
`ToolId`, `BackgroundId`, `ItemId`, `ChoiceSlotId`…) sont de simples
`export type RaceId = string`. Justification et filet de sécurité : § Identifiants.

### Forme résolue — `ChoiceSlot` / `ChoiceOption`, reprise telle quelle de §A4

```ts
// src/domain/choice.ts
export type ChoiceSlotId = string; // 'class:roublard:skills'
export type ChoiceSource = 'race' | 'class' | 'background';
export type ChoiceKind =
  | 'skill'
  | 'language'
  | 'tool'
  | 'cantrip'
  | 'spell'
  | 'ability'
  | 'equipment'
  | 'ancestry'
  | 'fighting-style'
  | 'expertise';

export type UnavailableReason =
  | { readonly kind: 'already-granted'; readonly source: ChoiceSource }
  | { readonly kind: 'slot-full' };

export interface ChoiceOption {
  readonly id: string;
  readonly label: string; // « Discrétion »
  readonly blurb: string; // une phrase, vocabulaire de joueur
  readonly facts: readonly [string, string, string]; // repères ALIGNÉS
  readonly details: readonly { title: string; body: string }[];
  readonly unavailable: UnavailableReason | null;
}

export interface ChoiceSlot {
  readonly id: ChoiceSlotId;
  readonly source: ChoiceSource;
  readonly kind: ChoiceKind;
  readonly title: string;
  readonly help: string;
  readonly pick: number;
  readonly options: readonly ChoiceOption[];
}
```

**Le créneau ne porte ni réponse ni état d'avancement.** `draft.choices` est la
seule source de vérité de ce qui a été répondu ; `state/` calcule
`picked = draft.choices[slot.id] ?? []` et `complete = picked.length === slot.pick`.

**D'où viennent `title` et `help` (point 4 du lot 2).** Ce sont de la prose, donc
elles sont **rédigées dans `data/`**, portées par la forme auteur `ChoiceSpec`, et
**recopiées à l'identique** par `openChoices`. Le domaine ne les compose pas, ne les
interpole pas, ne les concatène pas : il les transporte. Trois conséquences
concrètes, testées :

1. Le titre authored **ne contient pas le nombre** : on écrit « Tes compétences de
   roublard », pas « Choisis 2 compétences ». Le nombre est dans `pick` ; le laisser
   aussi dans la phrase créerait deux sources de vérité qu'on oublierait de changer
   ensemble. `ui/format/` compose « Choisis-en 2 » à partir de `pick`.
2. Aucun littéral de phrase française n'existe dans `src/domain/` — vérifié par un
   test (§ Tests, garde-fous).
3. `label`, `blurb` et `details` suivent la même règle : recopie depuis `data/`.

`facts` est **authored dans `data/`** pour les entités comparables (race, sous-race,
classe, historique, option d'équipement, ascendance, style de combat) et **recopié
par pur transport** pour les autres, depuis des champs déjà français :

| `kind`             | `facts`                                                                             |
| ------------------ | ----------------------------------------------------------------------------------- |
| `skill`            | `[nom de la caractéristique, phrase d'usage courte, '—']` (les deux depuis `data/`) |
| `language`         | `[type ('Standard'/'Exotique'), écriture, '—']`                                     |
| `tool`             | `[catégorie, prix, '—']`                                                            |
| `cantrip`, `spell` | `[castingTime, range, duration]` — trois champs déjà rédigés                        |
| `equipment`        | authored sur `EquipmentOption`                                                      |
| `ability`          | `[nom de la caractéristique, phrase d'usage, '—']`                                  |
| tous les autres    | authored sur l'entité                                                               |

Aucune de ces cases n'est une concaténation : c'est un choix de champ. Le `switch
(kind)` correspondant est un branchement sur un **genre de règle** (ensemble fermé
de 10 valeurs), pas sur un identifiant de contenu.

### Forme auteur — `ChoiceSpec`, ce qu'on écrit dans `data/`

C'est la décision structurante du lot, et elle est conservée : un choix existe sous
**deux formes**. `ChoiceSpec` est compact, déclaratif, parfois implicite (« un tour
de magie de la liste du magicien ») et ne connaît pas l'état du brouillon.
`ChoiceSlot` est plat, uniforme, options déjà libellées et déjà filtrées. Le domaine
est le seul à connaître les deux ; l'UI ne voit que `ChoiceSlot` et n'a donc qu'un
seul composant de choix.

```ts
// src/domain/choice-spec.ts
export type ChoiceSubject = string; // 'skills', 'languages', 'equipment-1'

interface BaseSpec {
  readonly subject: ChoiceSubject;
  readonly title: string; // prose française, rédigée dans data/, sans le nombre
  readonly help: string; // prose française, rédigée dans data/
  readonly pick: number;
}

export interface SkillSpec extends BaseSpec {
  readonly kind: 'skill';
  readonly from: readonly SkillId[];
}
export interface LanguageSpec extends BaseSpec {
  readonly kind: 'language';
  readonly from: readonly LanguageId[];
}
export interface ToolSpec extends BaseSpec {
  readonly kind: 'tool';
  readonly from: readonly ToolId[];
}
export interface EquipmentSpec extends BaseSpec {
  readonly kind: 'equipment';
  readonly from: readonly EquipmentOptionId[];
}
export interface AncestrySpec extends BaseSpec {
  readonly kind: 'ancestry';
}
export interface FightingStyleSpec extends BaseSpec {
  readonly kind: 'fighting-style';
}

/** Demi-elfe : +1 à deux caractéristiques autres que le Charisme. */
export interface AbilitySpec extends BaseSpec {
  readonly kind: 'ability';
  readonly bonus: number;
  readonly from: readonly AbilityId[];
}

/** La liste de sorts n'est jamais recopiée : on référence celle d'une classe. */
export interface SpellSpec extends BaseSpec {
  readonly kind: 'cantrip' | 'spell';
  readonly listFrom: ClassId; // 'magicien' pour le haut-elfe
}

/** Roublard : options calculées à l'exécution, jamais authored (§A15). */
export interface ExpertiseSpec extends BaseSpec {
  readonly kind: 'expertise';
  readonly tools: readonly ToolId[]; // ['outils-de-voleur']
}

export type ChoiceSpec =
  | SkillSpec
  | LanguageSpec
  | ToolSpec
  | EquipmentSpec
  | AncestrySpec
  | FightingStyleSpec
  | AbilitySpec
  | SpellSpec
  | ExpertiseSpec;

export function slotId(
  source: ChoiceSource,
  parentId: string,
  subject: ChoiceSubject,
): ChoiceSlotId {
  return `${source}:${parentId}:${subject}`;
}
```

### Identifiants de créneau — `source:parentId:subject` (§A3)

Une `ChoiceSpec` **n'écrit jamais son identifiant complet** : elle ne porte que
`subject`. `source` et `parentId` viennent de l'endroit où la spec est déclarée, et
`openChoices` appelle `slotId()`. Un identifiant mal formé est donc inexprimable.

**Règle : `parentId` est toujours l'identifiant que le joueur a choisi lui-même**,
jamais celui d'une entité dérivée. C'est ce qui rend la cascade du lot 2 gratuite.

| Créneau                                | Identifiant                     | Parent qui le ferme                          |
| -------------------------------------- | ------------------------------- | -------------------------------------------- |
| Compétences de roublard                | `class:roublard:skills`         | changement de classe                         |
| Expertise du roublard                  | `class:roublard:expertise`      | changement de classe                         |
| Style de combat du guerrier            | `class:guerrier:fighting-style` | changement de classe                         |
| Grimoire du magicien                   | `class:magicien:spells`         | changement de classe                         |
| Ascendance de l'ensorceleur draconique | `class:ensorceleur:ancestry`    | changement de classe, **pas** la sous-classe |
| Ascendance du drakéide                 | `race:drakeide:ancestry`        | changement de race                           |
| Tour de magie du haut-elfe             | `race:haut-elfe:cantrip`        | changement de **sous-race**                  |
| +1 ×2 du demi-elfe                     | `race:demi-elfe:ability`        | changement de race                           |
| Langues de l'acolyte                   | `background:acolyte:languages`  | changement d'historique                      |
| 1re option d'équipement du guerrier    | `class:guerrier:equipment-1`    | changement de classe                         |

La sous-classe du SRD étant unique par classe et acquise d'office (voir plus bas),
ses créneaux portent l'identifiant de la **classe** : changer de classe les ferme,
et rien d'autre ne peut les invalider.

### `CharacterDraft` — la frontière domaine / état (§A1)

Défini une seule fois dans tout le dépôt, dans `src/domain/draft.ts`. Le domaine ne
stocke rien : `state/` détient le brouillon et le passe en premier argument. Tout est
JSON pur — pas de `Map`, pas de `Set`, pas de `Date`, pas d'instance de classe.
`JSON.parse(JSON.stringify(draft))` doit rendre un objet identique : c'est cette
propriété, et elle seule, qui fait marcher `localStorage` et l'import/export sans une
ligne de sérialisation.

```ts
// src/domain/draft.ts
export type AbilityMethod = 'point-buy' | 'standard-array'; // §B1 : plus de 'dice'

export interface PersonalTraits {
  readonly trait: string;
  readonly ideal: string;
  readonly bond: string;
  readonly flaw: string;
}

export interface CharacterDraft {
  readonly name: string;
  readonly raceId: RaceId | null;
  readonly subraceId: SubraceId | null;
  readonly classId: ClassId | null;
  readonly backgroundId: BackgroundId | null;
  readonly alignmentId: AlignmentId | null;
  readonly abilityMethod: AbilityMethod;
  /** Valeurs AVANT bonus raciaux. Toujours les 6 clés, 8 par défaut. */
  readonly baseAbilities: AbilityScores;
  /** Un dictionnaire unique. Clé = identifiant de créneau. */
  readonly choices: Readonly<Record<ChoiceSlotId, readonly string[]>>;
  readonly personalTraits: PersonalTraits;
}

export function emptyDraft(): CharacterDraft;
```

Ce qui n'y est **pas**, parce que c'est dérivé : PV max (au niveau 1 c'est toujours
le maximum du dé de vie + mod. de Con, jamais un jet), classe d'armure, bonus de
maîtrise, caractéristiques finales, langues, maîtrises, équipement obtenu, DD de
sauvegarde. Si une valeur est calculable, elle n'est pas stockée.

Le tableau standard ne demande aucun champ supplémentaire : l'affectation _est_
`baseAbilities`, et `draftIssues` vérifie que c'est une permutation de
`[15, 14, 13, 12, 10, 8]`.

### Race, classe, historique, sort

```ts
// src/domain/race.ts
export interface Feature {
  readonly name: string;
  readonly text: string;
} // FR, depuis data/

export interface Proficiencies {
  readonly armor: readonly ArmorCategory[]; // 'legere' | 'intermediaire' | 'lourde' | 'bouclier'
  readonly weaponCategories: readonly WeaponCategory[]; // 'courantes' | 'de-guerre'
  readonly weapons: readonly WeaponId[];
  readonly tools: readonly ToolId[];
}

export interface Race {
  readonly id: RaceId;
  readonly name: string;
  readonly blurb: string;
  readonly facts: readonly [string, string, string]; // « +2 For, +1 Con » / « 9 m » / « Endurance implacable »
  readonly abilityBonuses: Partial<AbilityScores>;
  readonly size: CreatureSize;
  readonly speed: number; // mètres : 9 ou 7.5
  readonly darkvision: number; // mètres : 0 ou 18
  readonly languages: readonly LanguageId[];
  readonly skills: readonly SkillId[];
  readonly proficiencies: Proficiencies;
  readonly resistances: readonly DamageType[];
  readonly features: readonly Feature[]; // affichées, jamais calculées
  readonly choices: readonly ChoiceSpec[];
  readonly subraces: readonly Subrace[]; // imbriquées
}

export interface Subrace {
  readonly id: SubraceId;
  readonly name: string;
  readonly blurb: string;
  readonly facts: readonly [string, string, string];
  readonly abilityBonuses: Partial<AbilityScores>;
  readonly skills: readonly SkillId[];
  readonly proficiencies: Proficiencies;
  readonly features: readonly Feature[];
  readonly bonusHitPointsPerLevel: number; // nain des collines : 1
  readonly choices: readonly ChoiceSpec[];
}
```

```ts
// src/domain/character-class.ts
export interface UnarmoredDefense {
  readonly base: number; // 10 (barbare, moine), 13 (draconique)
  readonly addedAbilities: readonly AbilityId[]; // ['dexterite', 'constitution']
  readonly shieldAllowed: boolean; // barbare oui, moine non
}

export type PreparationMode = 'known' | 'prepared' | 'spellbook';

export interface Spellcasting {
  readonly ability: AbilityId;
  readonly level1Slots: number; // 2, 1 (occultiste), 0 (paladin, rôdeur)
  readonly preparation: PreparationMode;
  readonly ritual: boolean;
}

/** Sous-classe obtenue au niveau 1. Le SRD n'en propose qu'une par classe
 *  concernée (clerc, ensorceleur, occultiste) : elle s'applique d'office,
 *  ce n'est donc pas un choix et il n'y a pas de `ChoiceKind` pour elle. */
export interface Subclass {
  readonly id: SubclassId;
  readonly name: string; // « Domaine de la Vie »
  readonly blurb: string;
  readonly features: readonly Feature[];
  readonly proficiencies: Proficiencies | null; // clerc de la Vie : armures lourdes
  readonly alwaysPreparedSpells: readonly SpellId[];
  readonly unarmoredDefense: UnarmoredDefense | null;
  readonly bonusHitPointsPerLevel: number; // ensorceleur draconique : 1
  readonly choices: readonly ChoiceSpec[]; // ascendance draconique
}

export interface CharacterClass {
  readonly id: ClassId;
  readonly name: string;
  readonly blurb: string;
  readonly facts: readonly [string, string, string]; // « d10 » / « For + Con » / « Armures lourdes »
  readonly hitDie: 6 | 8 | 10 | 12;
  readonly saves: readonly [AbilityId, AbilityId];
  readonly proficiencies: Proficiencies;
  readonly unarmoredDefense: UnarmoredDefense | null;
  readonly features: readonly Feature[];
  readonly choices: readonly ChoiceSpec[];
  readonly equipmentOptions: readonly EquipmentOption[]; // table locale, référencée par id
  readonly fixedEquipment: readonly ItemLine[];
  readonly spellcasting: Spellcasting | null;
  readonly subclass: Subclass | null;
}
```

```ts
// src/domain/spell.ts  — §B2
export interface Spell {
  readonly id: SpellId;
  readonly name: string;
  readonly level: 0 | 1;
  readonly school: MagicSchool;
  readonly castingTime: string; // « 1 action », « 1 action bonus »
  readonly range: string; // « 18 mètres », « Personnelle », « Contact »
  readonly components: {
    readonly verbal: boolean;
    readonly somatic: boolean;
    readonly material: string | null;
  };
  readonly duration: string; // « Instantanée », « Concentration, jusqu'à 1 minute »
  readonly concentration: boolean;
  readonly ritual: boolean;
  readonly summary: string; // 1 à 3 phrases, obligatoire
  readonly classes: readonly ClassId[]; // seule source de vérité des listes de sorts
}
```

Les listes de sorts par classe ne sont **jamais recopiées** dans les classes :
`spellsForClass(spells, classId, level)` les dérive de `Spell.classes`. Ajouter un
sort à la liste du barde = modifier une ligne, dans un seul fichier.

```ts
// src/domain/background.ts
export interface SuggestedTraits {
  readonly traits: readonly string[];
  readonly ideals: readonly string[];
  readonly bonds: readonly string[];
  readonly flaws: readonly string[];
}

export interface Background {
  readonly id: BackgroundId;
  readonly name: string;
  readonly blurb: string;
  readonly facts: readonly [string, string, string];
  readonly skills: readonly SkillId[];
  readonly proficiencies: Proficiencies;
  readonly choices: readonly ChoiceSpec[];
  readonly equipment: readonly ItemLine[];
  readonly feature: Feature;
  readonly suggestedTraits: SuggestedTraits; // listes vides pour « Personnalisé »
}
```

### Le catalogue — comment `domain/` accède aux données sans les importer

```ts
// src/domain/catalogue.ts
export interface Catalogue {
  readonly abilities: readonly AbilityEntry[]; // noms français des 6 caractéristiques
  readonly skills: readonly Skill[];
  readonly races: readonly Race[];
  readonly classes: readonly CharacterClass[];
  readonly backgrounds: readonly Background[];
  readonly alignments: readonly Alignment[];
  readonly languages: readonly Language[];
  readonly tools: readonly Tool[];
  readonly weapons: readonly Weapon[];
  readonly armor: readonly Armor[];
  readonly items: readonly Item[];
  readonly spells: readonly Spell[];
  readonly draconicAncestries: readonly DraconicAncestry[];
  readonly fightingStyles: readonly FightingStyle[];
}

export function findRace(c: Catalogue, id: RaceId | null): Race | null;
export function findClass(c: Catalogue, id: ClassId | null): CharacterClass | null;
// … un accesseur par table : la table est fixée par la fonction, on ne peut pas
//   chercher un identifiant de classe dans la liste des races.
```

Toute fonction de règle a la signature `f(draft, catalogue, …)` — l'ordre de §A4.
Aucune ne lit un module global. Les tests fabriquent des mini-catalogues de deux
entrées ; c'est ce qui rend `domain/` testable sans jamais charger 85 sorts.

### Répartition de points — piloter l'écran sans règle dans le composant (§A16)

```ts
// src/domain/point-buy.ts
export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;
export const POINT_BUY_COST: Readonly<Record<number, number>> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

/** Même forme que `UnavailableReason` (§A4) : jamais rédigé, toujours structuré. */
export type BlockedReason =
  | {
      readonly kind: 'not-enough-points';
      readonly required: number;
      readonly remaining: number;
    }
  | { readonly kind: 'max-score'; readonly max: number }
  | { readonly kind: 'min-score'; readonly min: number };

export interface AbilityRow {
  readonly id: AbilityId;
  readonly score: number; // valeur de base, avant bonus
  readonly racialBonus: number;
  readonly bonusSource: readonly string[]; // ids : ['nain', 'nain-des-collines', 'race:demi-elfe:ability']
  readonly total: number;
  readonly modifier: number;
  readonly canIncrease: boolean;
  readonly canDecrease: boolean;
  readonly increaseCost: number | null; // null si l'augmentation est impossible
  readonly blockedBy: BlockedReason | null;
}

export function pointsRemaining(scores: AbilityScores): number;
export function abilityRows(
  draft: CharacterDraft,
  catalogue: Catalogue,
): readonly AbilityRow[];
```

`abilityRows` est le seul point d'entrée dont `state/` a besoin pour l'écran de
répartition. En mode `standard-array`, `canIncrease`/`canDecrease` valent `false` et
`increaseCost` vaut `null` : l'écran d'affectation manipule des permutations, pas
des boutons `+`/`−`. Aucune table de coûts ne franchit la frontière du domaine.

`bonusSource` porte des **identifiants**, pas des noms : la phrase « +2 grâce à ton
nain » se compose dans `ui/format/`, qui lit le nom dans `data/` (autorisé par §A6).

### Ce que rend `buildSheet`

```ts
// src/domain/sheet.ts
export interface RollLine {
  readonly id: SkillId | AbilityId;
  readonly ability: AbilityId;
  readonly proficient: boolean;
  readonly expert: boolean;
  readonly bonus: number;
}

export interface ArmorClassResult {
  readonly value: number;
  readonly from: 'armor' | 'unarmored';
  readonly armorId: ArmorId | null;
  readonly shield: boolean;
  readonly fightingStyleBonus: number;
}

export interface SpellcastingSheet {
  readonly ability: AbilityId;
  readonly saveDc: number;
  readonly attackBonus: number;
  readonly level1Slots: number;
  readonly preparation: PreparationMode;
  readonly preparedCount: number | null;
  readonly cantrips: readonly SpellId[];
  readonly spells: readonly SpellId[];
  readonly alwaysPrepared: readonly SpellId[];
}

export interface CharacterSheet {
  readonly name: string;
  readonly raceId: RaceId | null;
  readonly subraceId: SubraceId | null;
  readonly classId: ClassId | null;
  readonly subclassId: SubclassId | null;
  readonly backgroundId: BackgroundId | null;
  readonly alignmentId: AlignmentId | null;
  readonly level: 1;
  readonly abilities: AbilityScores; // finales, bonus inclus
  readonly modifiers: AbilityScores;
  readonly proficiencyBonus: 2;
  readonly maxHitPoints: number | null;
  readonly hitDie: 6 | 8 | 10 | 12 | null;
  readonly armorClass: ArmorClassResult | null;
  readonly initiative: number;
  readonly speed: number | null;
  readonly saves: readonly RollLine[]; // 6 lignes
  readonly skills: readonly RollLine[]; // 18 lignes
  readonly attacks: readonly Attack[];
  readonly spellcasting: SpellcastingSheet | null;
  readonly proficiencies: Proficiencies;
  readonly languages: readonly LanguageId[];
  readonly equipment: readonly ItemLine[];
  readonly features: readonly Feature[]; // prose transportée depuis data/
  readonly personalTraits: PersonalTraits;
}

export function buildSheet(draft: CharacterDraft, catalogue: Catalogue): CharacterSheet;
```

La fiche porte des **identifiants**, pas des noms affichables (`raceId`, pas
`« Nain des collines »`). L'UI résout les noms en lisant `data/` (§A6). Seuls
`Feature.name` / `Feature.text` traversent en français, parce qu'ils sont recopiés
tels quels depuis `data/` et que rien ne les dérive.

### Problèmes signalés, sous forme structurée (§A5, §A17)

```ts
// src/domain/issues.ts
export type DraftIssue =
  | {
      readonly kind: 'missing';
      readonly what: 'name' | 'race' | 'class' | 'background' | 'alignment';
    }
  | { readonly kind: 'missing-subrace'; readonly raceId: RaceId }
  | { readonly kind: 'points-unspent'; readonly remaining: number }
  | { readonly kind: 'invalid-standard-array' }
  | {
      readonly kind: 'slot-incomplete';
      readonly slotId: ChoiceSlotId;
      readonly picked: number;
      readonly pick: number;
    }
  | { readonly kind: 'personal-trait-empty'; readonly field: keyof PersonalTraits };

export function draftIssues(
  draft: CharacterDraft,
  catalogue: Catalogue,
): readonly DraftIssue[];
```

Jamais d'exception, jamais de blocage : l'assistant reste linéaire, l'écran final
récapitule ce qui manque (charte §4). Le domaine ne connaît pas les 8 étapes de
§A9 : c'est `state/` qui associe une issue à une étape, à partir de `kind` et du
préfixe de `slotId`.

---

## Règles et formules

**Caractéristiques**

- `abilityModifier(score) = Math.floor((score - 10) / 2)`.
- Répartition : budget **27**, valeurs 8 à 15, coûts `{8:0, 9:1, 10:2, 11:3, 12:4,
13:5, 14:7, 15:9}`. `increaseCost = COST[score + 1] − COST[score]`.
- Tableau standard : `[15, 14, 13, 12, 10, 8]`, chaque valeur affectée une fois.
- **Aucun jet de dés** (§B1) : ni `rolled`, ni frontière d'aléatoire injectée, ni
  méthode `'dice'`.
- Finales = base + bonus de race + bonus de sous-race + réponses du créneau
  `ability`. Aucun plafond n'est atteignable au niveau 1 (15 + 2 + 1 = 18).

**Valeurs dérivées**

- Bonus de maîtrise : **+2** (`PROFICIENCY_BONUS_LEVEL_1`, pas de table).
- PV max = `hitDie` + mod. Con + `subrace.bonusHitPointsPerLevel` +
  `subclass.bonusHitPointsPerLevel`. Aucun jet au niveau 1.
- Initiative = mod. Dex. Vitesse = `race.speed`, en mètres.
- CA : on calcule **tous les candidats** et on garde le maximum, avec sa provenance.
  - sans armure : `base + Σ modificateurs des addedAbilities`
  - avec armure : `armor.base + dexContribution(armor, dexMod)` où
    `dexContribution` suit `armor.dexBonus: 'full' | 'capped-2' | 'none'`
  - `+2` si bouclier possédé, maîtrisé, et autorisé par le candidat
  - `+ fightingStyle.armorClassBonusWithArmor` (Défense du guerrier : +1)
- Sauvegardes : mod. + BM si la caractéristique est dans `class.saves`.
- Compétences : mod. + BM si maîtrisée, + BM une seconde fois si expertise.
- Attaque : mod. For, ou mod. Dex si l'arme est à distance ou a la propriété finesse
  (dans ce cas le meilleur des deux), + BM si maîtrisée. Dégâts : dé + même modificateur.
- DD de sauvegarde des sorts = `8 + BM + mod(spellcasting.ability)` ;
  bonus d'attaque de sort = `BM + mod(spellcasting.ability)`.
- Emplacements de niveau 1 = `spellcasting.level1Slots`.
- Sorts préparables (`prepared`, `spellbook`) = `max(1, mod(ability) + 1)`.
  **La préparation quotidienne n'est pas une décision de création** : la fiche
  affiche le nombre et la liste de classe complète. Seuls `known` (barde 4,
  ensorceleur 2, occultiste 2) et `spellbook` (magicien 6) ouvrent un créneau.

**Expertise (§A15)** — `grantedProficiencies(draft, catalogue)` rassemble les
compétences acquises **par toutes les voies** : dotations fixes de race, de
sous-race, de classe, d'historique, **et** réponses aux créneaux `skill` déjà
remplis. `openChoices` construit les options du créneau `expertise` à partir de ce
résultat, plus les outils listés par `ExpertiseSpec.tools` si le personnage les
maîtrise. Si le joueur n'a encore aucune compétence, le créneau existe avec zéro
option — l'étape 5 le place en dernier précisément pour que ce cas n'arrive pas en
marche avant. `grantedProficiencies` est partagé avec `buildSheet` et avec le calcul
de `unavailable: { kind: 'already-granted' }` : une seule implémentation, trois
usages, testée une fois.

---

## Stratégie de données

### Ouvert/Fermé : le mécanisme, concrètement

Un `switch` sur un identifiant de contenu (`case 'barbare':`) est interdit. Il est
remplacé, cas par cas, par un champ de données :

| Règle particulière            | Champ qui la porte                       | Exemple SRD                                         |
| ----------------------------- | ---------------------------------------- | --------------------------------------------------- |
| CA sans armure                | `CharacterClass.unarmoredDefense`        | barbare `10 + Dex + Con`, moine `10 + Dex + Sag`    |
| CA sans armure (sous-classe)  | `Subclass.unarmoredDefense`              | ensorceleur draconique `13 + Dex`                   |
| PV supplémentaires par niveau | `bonusHitPointsPerLevel`                 | nain des collines +1, ensorceleur draconique +1     |
| Vitesse réduite               | `Race.speed`                             | nain, halfelin, gnome : 7,50 m                      |
| Maîtrises supplémentaires     | `Subclass.proficiencies`                 | clerc de la Vie : armures lourdes                   |
| Sorts toujours préparés       | `Subclass.alwaysPreparedSpells`          | domaine de la Vie : bénédiction, soin des blessures |
| Compétence offerte            | `Race.skills`                            | elfe : Perception ; demi-orc : Intimidation         |
| Bonus de CA conditionnel      | `FightingStyle.armorClassBonusWithArmor` | guerrier, style Défense : +1                        |
| Apport de Dex selon l'armure  | `Armor.dexBonus`                         | légère / intermédiaire / lourde                     |
| Décisions à poser             | `choices: ChoiceSpec[]`                  | toutes                                              |

**Ce qui reste un `switch`, et pourquoi c'est légitime.** Le domaine branche sur des
_genres de règle_, dont l'ensemble est fermé par les règles du jeu et ne grossit
jamais quand on ajoute du contenu : `ChoiceKind` (10), `armor.dexBonus` (3),
`PreparationMode` (3), `AbilityMethod` (2). La ligne est nette : **brancher sur un
genre de règle, oui ; brancher sur un identifiant de contenu, jamais.**

Garde-fou testé : `catalogue.test.ts` lit les sources de `src/domain/` et vérifie
qu'aucun identifiant de race, sous-race, classe, sous-classe, historique ou sort du
catalogue n'y apparaît. Le test échoue à la seconde où quelqu'un écrit
`if (classId === 'barbare')`.

Ajouter une classe = créer `src/data/classes/nouvelle.ts` et l'ajouter à
`classes/index.ts`. Deux fichiers touchés, zéro dans `domain/`, zéro dans `ui/`.

### Identifiants

- **Fabrication** : minuscules, diacritiques supprimés, espaces et apostrophes
  remplacés par `-`. `'demi-orc'`, `'haut-elfe'`, `'athletisme'`,
  `'projectile-magique'`, `'cotte-de-mailles'`. Aucun accent dans un identifiant ;
  seuls les champs `name` portent l'orthographe française.
- **Unicité par table**, pas globale. `'nain'` est à la fois une race et une langue :
  deux tables distinctes, aucun conflit.
- **Typage** : unions littérales pour le vocabulaire de règle (`AbilityId`,
  `SkillId`, `AlignmentId`, `MagicSchool`, `ArmorCategory`) — gratuit, sans cast,
  exhaustivité vérifiée par le compilateur. Simples alias `string` pour le contenu
  extensible. On **renonce aux types de marque** : ils imposeraient ~400 casts dans
  `src/data/` pour un bénéfice que les tests d'intégrité référentielle couvrent
  mieux, puisqu'ils attrapent aussi les fautes de frappe dans les listes `from`.
- Conséquence de « `data → domain`, types uniquement » : `data/` ne peut pas importer
  la constante `SKILL_ABILITY` du domaine. La liste des 18 identifiants existe donc
  deux fois — une fois comme clés de `SKILL_ABILITY` (règle), une fois comme entrées
  de `src/data/skills.ts` (contenu). Un test verrouille l'égalité des deux ensembles.
  C'est le prix, assumé et chiffré, de l'étanchéité du domaine.

### Volume et chargement sur mobile

`summary` au lieu de la prose longue (§B2) change complètement le calcul.

| Bloc                                         | Source TS   | JS émis     | gzip       |
| -------------------------------------------- | ----------- | ----------- | ---------- |
| Sorts (~85 entrées, résumé de 1 à 3 phrases) | ~47 Ko      | ~40 Ko      | **~11 Ko** |
| Classes (12)                                 | ~70 Ko      | ~55 Ko      | ~11 Ko     |
| Races, tables, historiques                   | ~55 Ko      | ~42 Ko      | ~9 Ko      |
| Domaine (règles)                             | ~35 Ko      | ~22 Ko      | ~6 Ko      |
| **Total LOT 1**                              | **~207 Ko** | **~159 Ko** | **~37 Ko** |
| + React 18 + ReactDOM                        | —           | ~140 Ko     | ~45 Ko     |

Le chiffre à retenir : ce n'est pas 200 sorts, c'est **~85** (25 tours de magie et
~60 sorts de niveau 1 dans le SRD). L'ensemble tient sous **~82 Ko gzip** avec React,
soit ~1,7 s sur une 3G lente à 400 kbit/s utiles.

**Décision : aucun découpage dynamique en v1** (§B5). Découper maintenant, c'est
ajouter de l'asynchrone à `state/` et des états de chargement à l'UI pour économiser
11 Ko. **Seuil écrit d'avance** : si le premier écran dépasse **150 Ko gzip** à la
fin du lot 3, on ajoute _un seul_ `import('../data/spells')` dynamique, **dans
`state/`**, jamais ailleurs — 6 des 12 classes n'ont aucun sort au niveau 1
(barbare, guerrier, moine, roublard, paladin, rôdeur). `src/data/` reste sans
logique et `domain/` n'apprend rien.

Contrainte du lot 5 (§A13) respectée par construction : **les données sont des
modules TypeScript importés**, jamais des fichiers récupérés par `fetch`. Aucune URL
dans `src/data/`, aucun chemin commençant par `/`. Le sous-chemin GitHub Pages ne
peut donc rien casser.

Ce qui plombe vraiment un budget mobile est déjà exclu : aucune image, aucune police
téléchargée, aucune bibliothèque d'icônes.

### Volume de traduction

C'est le vrai coût du projet, et §B2 le divise par deux et demi : ~85 résumés de
~250 caractères (~21 000 signes) + traits raciaux, aptitudes de classe et historiques
(~15 000 signes) ≈ **36 000 signes** au lieu de ~90 000. Découpage en commits de
10 sorts, chacun laissant `npm run verify` vert.

### Droits, attribution, et le nom « Aventurine » (§A18)

- Le SRD 5.1 est publié par Wizards of the Coast sous **CC BY 4.0**, qui impose une
  mention exacte et l'indication que l'œuvre a été modifiée.
- `src/data/attribution.ts` exporte trois constantes :
  - `SRD_ATTRIBUTION_EN` — le texte exigé par WotC, **verbatim, en anglais**
    (« This work includes material taken from the System Reference Document 5.1… »).
    On ne le traduit pas : c'est la mention légale.
  - `SRD_ATTRIBUTION_FR` — traduction de courtoisie, affichée à côté, complétée par
    « Traduction française et adaptation écrites pour Aventurine ».
    C'est la mention « indicate if changes were made » exigée par CC BY.
  - `AFFILIATION_NOTICE` — « Aventurine est un créateur de personnage compatible
    D&D 5e, non affilié à Wizards of the Coast ni à D&D Beyond. »
- Chaque fichier de `src/data/` dérivé du SRD porte un en-tête de trois lignes :
  « Contenu dérivé du SRD 5.1 (CC BY 4.0) — traduction Aventurine. Voir
  `attribution.ts`. » Le nom « Aventurine » y remplace toute mention de l'ancien nom.
- Le dépôt GitHub garde son nom : la seule occurrence de `D-DBeyondFranche` dans tout
  le projet est `base: '/D-DBeyondFranche/'` côté lot 5. Aucun fichier de ce lot ne
  la mentionne.
- **La traduction est écrite par nous, depuis l'anglais du SRD.** Aucun mot repris
  d'une traduction commerciale ou communautaire : elles sont protégées séparément et
  ne sont pas couvertes par la CC BY du SRD. Les termes techniques (« jet de
  sauvegarde », « bonus de maîtrise ») sont du vocabulaire non appropriable ; les
  _phrases_ sont rédigées à neuf.
- Aucun contenu hors SRD, à l'exception assumée et signalée de l'historique
  « Personnalisé » (§B3, charte §9), construit uniquement sur les règles génériques
  d'historique du SRD : 2 compétences au choix parmi les 18, 2 outils ou langues, un
  paquetage, traits/idéal/lien/défaut saisis librement (`suggestedTraits` vides).
- Revue de PR : toute entrée de `src/data/` doit pouvoir être pointée à une section du
  SRD 5.1. Si on ne sait pas dire où, l'entrée ne rentre pas.

---

## Tests prévus

Un test = un comportement, nommé en français (charte §7). ~50 cas. Seuil de
couverture sur `src/domain/` uniquement (§A13).

**`abilities.test.ts`**

- `it('donne un modificateur de -1 pour une valeur de 8')`
- `it('donne un modificateur de +4 pour une valeur de 18')`
- `it('donne un modificateur de 0 pour 10 comme pour 11')`

**`point-buy.test.ts`**

- `it('coûte 27 points pour 15/15/15/8/8/8')`
- `it('facture 2 points le passage de 13 à 14')`
- `it('refuse de monter au-delà de 15 et dit pourquoi')`
- `it('refuse de descendre en dessous de 8 et dit pourquoi')`
- `it('bloque une augmentation trop chère en indiquant le coût et le reste')`
- `it('additionne le bonus racial au score de base dans la ligne rendue')`
- `it('cite le nain et le nain des collines comme sources du bonus')`
- `it('interdit les boutons plus et moins en mode tableau standard')`
- `it('propose 15, 14, 13, 12, 10 et 8 dans le tableau standard')`

**`sheet.test.ts` — bonus raciaux**

- `it('ajoute +2 en Constitution à un nain')`
- `it('ajoute +1 en Sagesse à un nain des collines, en plus du +2 de Constitution')`
- `it('ajoute +1 partout à un humain')`
- `it('applique le +1 aux deux caractéristiques choisies par un demi-elfe')`

**`sheet.test.ts` — valeurs dérivées**

- `it('donne un bonus de maîtrise de +2 au niveau 1')`
- `it('donne 12 points de vie à un guerrier avec 14 en Constitution')`
- `it('ajoute 1 point de vie à un nain des collines')`
- `it('ajoute 1 point de vie à un ensorceleur draconique')`
- `it('calcule une CA de 12 pour un magicien sans armure avec 14 en Dextérité')`
- `it('plafonne le bonus de Dextérité à +2 avec une armure intermédiaire')`
- `it('ignore le bonus de Dextérité avec une cotte de mailles')`
- `it('ajoute 2 à la CA quand le personnage porte un bouclier maîtrisé')`
- `it('retient la meilleure CA entre l\'armure portée et la défense sans armure')`
- `it('donne 13 de CA à un ensorceleur draconique sans armure avec 10 en Dextérité')`
- `it('ajoute 1 à la CA d\'un guerrier au style Défense qui porte une armure')`
- `it('n\'ajoute rien à la CA d\'un guerrier au style Défense sans armure')`
- `it('donne une vitesse de 7,50 mètres à un halfelin')`
- `it('ajoute le bonus de maîtrise aux deux sauvegardes de la classe seulement')`
- `it('double le bonus de maîtrise sur une compétence prise en expertise')`
- `it('utilise la Dextérité pour une arme de finesse quand elle est meilleure')`
- `it('calcule un DD de sauvegarde de 13 pour un clerc avec 14 en Sagesse')`
- `it('donne 2 emplacements de sorts de niveau 1 à un magicien')`
- `it('donne 1 seul emplacement à un occultiste')`
- `it('ne donne aucun emplacement à un paladin de niveau 1')`
- `it('rend préparables mod. de Sagesse + 1 sorts pour un clerc, au minimum 1')`
- `it('ajoute bénédiction et soin des blessures aux sorts toujours préparés du clerc de la Vie')`
- `it('ne renvoie aucun point de vie tant que la classe n\'est pas choisie')`
- `it('rend des identifiants et jamais des noms affichables')`

**`open-choices.test.ts`**

- `it('demande 4 compétences à un roublard')`
- `it('nomme le créneau de compétences du roublard class:roublard:skills')`
- `it('rattache le tour de magie du haut-elfe à la sous-race et non à la race')`
- `it('rattache l\'ascendance de l\'ensorceleur à la classe et non à la sous-classe')`
- `it('marque comme déjà acquise une compétence donnée par l\'historique')`
- `it('ne propose à l\'expertise du roublard que les compétences qu\'il maîtrise')`
- `it('compte dans l\'expertise une compétence reçue de la race')`
- `it('rend un créneau d\'expertise vide quand aucune compétence n\'est acquise')`
- `it('propose les tours de magie du magicien à un haut-elfe')`
- `it('propose les six styles de combat à un guerrier et à personne d\'autre')`
- `it('propose les dix ascendances draconiques à un drakéide')`
- `it('recopie sans les modifier le titre et l\'aide écrits dans les données')`
- `it('remplit les trois repères de chaque option, avec un tiret cadratin si besoin')`
- `it('ne pose aucun créneau de sort à un barbare')`
- `it('ne porte ni réponse ni état d\'avancement dans le créneau')`

**`issues.test.ts`**

- `it('signale l\'absence de race sans lever d\'exception')`
- `it('signale les points de répartition non dépensés avec leur nombre')`
- `it('signale un tableau standard mal affecté')`
- `it('signale un créneau incomplet avec le nombre choisi et le nombre attendu')`
- `it('ne signale rien pour un personnage entièrement rempli')`

**`draft.test.ts`**

- `it('produit un brouillon identique après passage par JSON')`
- `it('conserve les réponses devenues invalides après un changement de classe')`

**`catalogue.test.ts` (données)**

- `it('n\'a aucun identifiant en double dans une même table')`
- `it('n\'a aucun identifiant de créneau en double dans tout le catalogue')`
- `it('forme tous les identifiants de créneau en source:parent:sujet')`
- `it('ne référence que des compétences, langues, outils et objets existants')`
- `it('ne référence que des sorts existants dans les listes de classe')`
- `it('contient les 12 classes et les 9 races du SRD')`
- `it('couvre exactement les 18 compétences déclarées par le domaine')`
- `it('n\'écrit aucun identifiant avec un accent ou une majuscule')`
- `it('donne à chaque classe deux jets de sauvegarde et un dé de vie')`
- `it('donne à chaque sort un résumé français non vide')`
- `it('n\'écrit aucun identifiant de contenu dans src/domain/')`
- `it('n\'écrit aucune phrase française dans src/domain/')`
- `it('n\'écrit aucune URL dans src/data/')`

---

## Hors périmètre

1. **Multiclassage** — aucun champ, aucune règle.
2. **Niveaux 2 et au-delà** — pas de table de progression, pas de PX.
3. **Sous-classes obtenues après le niveau 1** — archétypes de guerrier et de
   roublard (3), cercle druidique (2), tradition monastique (3), serment (3),
   archétype de rôdeur (3), voie primitive (3), collège de barde (3), tradition
   arcanique (2). Seules les trois voies de niveau 1 du SRD sont modélisées
   (Domaine de la Vie, Lignage draconique, Le Fiélon), et elles s'appliquent d'office.
4. **Dons (feats)** et variante humaine.
5. **Sorts de niveau 2 et plus** ; prose longue des sorts — le champ `fullText`
   n'est pas déclaré tant qu'aucun sort ne le remplit (§A19).
6. **Jets de dés 4d6 garde-3** (§B1) : ni méthode, ni champ, ni frontière d'aléatoire.
7. **Préparation quotidienne des sorts** — décision de jeu, pas de création.
8. **Homebrew** — aucun mécanisme d'ajout de contenu par l'utilisateur.
9. **Combat et suivi en jeu** — PV courants, repos, conditions, initiative jouée,
   inspiration.
10. **Objets magiques**, achat d'équipement, or de départ alternatif (on prend le
    paquetage), encombrement, pièces au détail.
11. **Familiers et compagnons** — _Trouver un familier_ reste un sort affichable,
    sans fiche de créature.
12. **Monstres, PNJ, compendium, règles du MJ.**
13. **Toute autre langue que le français**, toute autre source que le SRD 5.1.
14. **Images, portraits, jetons.**
15. **`describeImpact`** et toute prévisualisation d'impact d'un changement (§B4).

---

## Risques et décisions ouvertes

**1. `fullText` — objection acceptée, risque clos.** J'avais signalé qu'un champ
fixé à `null` pour les 85 sorts est du code mort, interdit par la charte. §A19 a
tranché en ce sens : le champ **n'est pas déclaré**. Il le sera le jour où un sort
le remplit. Rien à surveiller.

**2. `UnavailableReason.slot-full` a un coût d'usage sur 360 px.** Marquer 16
compétences sur 18 comme indisponibles dès que le joueur en a coché 2 sur 2 le force
à décocher avant de changer d'avis, sans que rien ne le lui dise. Le domaine peut
l'émettre, mais je recommande que le lot 3 ne le rende pas comme un blocage : un
groupe de cases à cocher plafonné, où la 3e coche remplace la plus ancienne, est plus
utilisable au pouce. À trancher entre lots 1 et 3 ; le type reste celui de §A4 quoi
qu'il arrive.

**3. `ChoiceOption.facts` est du remplissage pour trois `kind` sur dix.** Pour
`skill`, `language`, `tool` et `ability`, deux des trois repères valent `'—'` : le
triplet gagne son coût sur race, classe, historique et équipement, pas ailleurs. Par
ailleurs le type ne porte **pas les intitulés de colonnes** dont l'alignement
vertical a besoin. Résolution proposée sans toucher au type : une table
`ChoiceKind → [libellé, libellé, libellé]` dans `ui/format/`, et l'UI n'affiche la
bande de repères que pour les `kind` où elle informe. À valider par le lot 3.

**4. Duplication forcée de la liste des 18 compétences.** « `data → domain`, types
uniquement » interdit à `data/` d'importer la constante `SKILL_ABILITY`. Les 18
identifiants existent donc dans les deux couches. C'est le seul endroit du lot où
l'étanchéité coûte une duplication ; elle est verrouillée par un test. Alternative
rejetée : autoriser l'import de valeurs constantes depuis `domain/`, qui rouvrirait
la porte que §A11 vient de fermer.

**5. `openChoices` doit tourner sur un brouillon partiel à chaque frappe.** Elle
appelle `grantedProficiencies`, qui parcourt race, sous-race, classe, historique et
toutes les réponses. À 20 créneaux et ~50 entrées de catalogue, c'est de l'ordre du
millier d'opérations : négligeable, et on garde `Array.find` plutôt qu'un index de
`Map` (KISS). Si le lot 3 mesure une gêne réelle, la mémoïsation se pose dans
`state/`, jamais dans le domaine.

**6. Volume de traduction : ~36 000 signes.** Reste le poste le plus lourd du lot,
loin devant le code, même divisé par deux et demi. Risque : résumés bâclés ou trop
proches d'une traduction existante. Garde-fou : relecture croisée obligatoire sur
chaque résumé de sort, et interdiction formelle d'ouvrir une traduction tierce
pendant la rédaction.

**7. Le créneau `equipment` est le plus volumineux et le moins intéressant.** Trois à
cinq options par classe, chacune avec sa liste d'objets, soit ~45 `EquipmentOption` à
écrire. Aucune difficulté technique, mais c'est là que se logeront les fautes
d'identifiants d'objets : le test d'intégrité référentielle est ce qui les attrapera,
pas la relecture.
