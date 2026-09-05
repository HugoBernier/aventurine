import type { SpellLevel } from './content';

/**
 * Le pack en cours d'écriture. Tout y est permis d'être incomplet — c'est déjà
 * la philosophie de l'assistant : on avance avec des trous, et un écran
 * récapitule ce qui manque. Ce qui décide de la validité reste `parsePack`, et
 * lui seul : ce brouillon ne juge de rien, il retient.
 *
 * Les champs sont plats et bruts, à l'image des champs de saisie qui les
 * portent : un formulaire n'a pas de `null`, il a des chaînes vides.
 */
export interface SpellDraft {
  /** Fixé à la création depuis le nom, jamais recalculé : les fiches qui s'en
   *  servent le nomment, et le renommer les couperait de leur sort. */
  readonly id: string;
  readonly name: string;
  readonly level: SpellLevel;
  readonly school: string;
  readonly castingTime: string;
  readonly range: string;
  readonly verbal: boolean;
  readonly somatic: boolean;
  readonly material: string;
  readonly duration: string;
  readonly concentration: boolean;
  readonly ritual: boolean;
  readonly summary: string;
  readonly classes: readonly string[];
}

/** Une aptitude de sous-classe : le niveau où elle arrive, son nom, son texte. */
export interface FeatureDraft {
  readonly level: number;
  readonly name: string;
  readonly text: string;
}

export interface SubclassDraft {
  readonly id: string;
  readonly name: string;
  readonly blurb: string;
  /** La classe du SRD à laquelle elle s'ajoute : elle n'en remplace rien. */
  readonly forClassId: string;
  readonly facts: readonly [string, string, string];
  readonly features: readonly FeatureDraft[];
}

/**
 * Un choix qu'un peuple ouvre. Un seul type pour les cinq genres : ils
 * partagent leur titre, leur aide et leur nombre, et ne diffèrent que par ce
 * qu'ils listent — d'où `from` pour les uns, `listFrom` et `bonus` pour les
 * autres, vides quand ils ne servent pas.
 */
export type ChoiceKindDraft =
  | 'skill'
  | 'language'
  | 'tool'
  | 'ability'
  | 'cantrip'
  | 'ancestry'
  | 'spell'
  | 'fighting-style'
  | 'expertise'
  | 'equipment';

/** « À partir du niveau 4, tu en connais trois. » */
export interface SpellStepDraft {
  readonly level: number;
  readonly howMany: number;
}

export interface ChoiceDraft {
  /** Fixé à la création : le créneau du personnage porte ce sujet. */
  readonly subject: string;
  readonly kind: ChoiceKindDraft;
  readonly title: string;
  readonly help: string;
  readonly pick: number;
  readonly from: readonly string[];
  /** `ability` : +1 ou +2 à placer. */
  readonly bonus: number;
  /** `cantrip` et `spell` : la classe dont on emprunte la liste de sorts. */
  readonly listFrom: string;
  /** `fighting-style` : le niveau où le style se choisit. */
  readonly level: number;
  /** `spell` : vrai quand le nombre se calcule au lieu de se lire dans une table. */
  readonly prepared: boolean;
  readonly steps: readonly SpellStepDraft[];
}

export interface SubraceDraft {
  readonly id: string;
  readonly name: string;
  readonly blurb: string;
  readonly facts: readonly [string, string, string];
  readonly features: readonly FeatureDraft[];
  readonly choices: readonly ChoiceDraft[];
  readonly skills: readonly string[];
  readonly bonusHitPointsPerLevel: number;
  /** 0 : la branche garde la vitesse et la vision de son peuple. */
  readonly speed: number;
  readonly darkvision: number;
}

export interface RaceDraft {
  readonly id: string;
  readonly name: string;
  readonly blurb: string;
  readonly facts: readonly [string, string, string];
  readonly size: 'P' | 'M';
  readonly speed: number;
  readonly darkvision: number;
  readonly languages: readonly string[];
  readonly skills: readonly string[];
  readonly resistances: readonly string[];
  readonly weapons: readonly string[];
  readonly tools: readonly string[];
  /** L'humain, et lui seul : six +1 imposés au lieu d'un bonus à placer. */
  readonly everyAbilityPlusOne: boolean;
  readonly features: readonly FeatureDraft[];
  readonly choices: readonly ChoiceDraft[];
  readonly subraces: readonly SubraceDraft[];
}

export interface EquipmentDraft {
  readonly itemId: string;
  readonly quantity: number;
}

export interface BackgroundDraft {
  readonly id: string;
  readonly name: string;
  readonly blurb: string;
  readonly facts: readonly [string, string, string];
  readonly skills: readonly string[];
  readonly tools: readonly string[];
  readonly choices: readonly ChoiceDraft[];
  readonly equipment: readonly EquipmentDraft[];
  readonly goldPieces: number;
  /** Une seule, et facultative : le nom vide veut dire « aucune ». */
  readonly featureName: string;
  readonly featureText: string;
  readonly traits: readonly string[];
  readonly ideals: readonly string[];
  readonly bonds: readonly string[];
  readonly flaws: readonly string[];
}

export interface EquipmentOptionDraft {
  /** Local à la classe : ce n'est jamais un identifiant de créneau. */
  readonly id: string;
  readonly name: string;
  readonly blurb: string;
  readonly facts: readonly [string, string, string];
  readonly items: readonly EquipmentDraft[];
}

export interface ClassDraft {
  readonly id: string;
  readonly name: string;
  readonly blurb: string;
  readonly facts: readonly [string, string, string];
  readonly hitDie: 6 | 8 | 10 | 12;
  /** Deux, jamais plus : le SRD n'en donne jamais un troisième. */
  readonly saves: readonly string[];
  readonly armor: readonly string[];
  readonly weaponCategories: readonly string[];
  readonly weapons: readonly string[];
  readonly tools: readonly string[];
  readonly features: readonly FeatureDraft[];
  readonly choices: readonly ChoiceDraft[];
  readonly equipmentOptions: readonly EquipmentOptionDraft[];
  readonly fixedEquipment: readonly EquipmentDraft[];
  readonly casts: boolean;
  readonly castingAbility: string;
  readonly progression: string;
  readonly preparation: string;
  readonly ritual: boolean;
  /** Quand la voie se choisit, et sous quel nom la classe l'appelle. */
  readonly subclassLevel: number;
  readonly subclassTitle: string;
  readonly subclassHelp: string;
  /** Les seuls niveaux : la prose des paliers reste celle de l'application. */
  readonly advancements: readonly number[];
}

export interface PackDraft {
  readonly id: string;
  readonly name: string;
  readonly author: string;
  readonly description: string;
  readonly spells: readonly SpellDraft[];
  readonly subclasses: readonly SubclassDraft[];
  readonly races: readonly RaceDraft[];
  readonly backgrounds: readonly BackgroundDraft[];
  readonly classes: readonly ClassDraft[];
}

export function emptyPackDraft(): PackDraft {
  return {
    id: '',
    name: '',
    author: '',
    description: '',
    spells: [],
    subclasses: [],
    races: [],
    backgrounds: [],
    classes: [],
  };
}

export function emptyClassDraft(): ClassDraft {
  return {
    id: '',
    name: '',
    blurb: '',
    facts: ['', '', ''],
    hitDie: 8,
    saves: [],
    armor: [],
    weaponCategories: [],
    weapons: [],
    tools: [],
    features: [],
    choices: [],
    equipmentOptions: [],
    fixedEquipment: [],
    casts: false,
    castingAbility: 'intelligence',
    progression: 'full',
    preparation: 'known',
    ritual: false,
    subclassLevel: 3,
    subclassTitle: '',
    subclassHelp: '',
    // Ceux du SRD, que toutes les classes partagent.
    advancements: [4, 8, 12, 16, 19],
  };
}

export function emptyBackgroundDraft(): BackgroundDraft {
  return {
    id: '',
    name: '',
    blurb: '',
    facts: ['', '', ''],
    skills: [],
    tools: [],
    choices: [],
    equipment: [],
    goldPieces: 10,
    featureName: '',
    featureText: '',
    traits: [],
    ideals: [],
    bonds: [],
    flaws: [],
  };
}

export function emptyRaceDraft(): RaceDraft {
  return {
    id: '',
    name: '',
    blurb: '',
    facts: ['', '', ''],
    size: 'M',
    speed: 9,
    darkvision: 0,
    languages: [],
    skills: [],
    resistances: [],
    weapons: [],
    tools: [],
    everyAbilityPlusOne: false,
    features: [],
    choices: [],
    subraces: [],
  };
}

export function emptySubraceDraft(): SubraceDraft {
  return {
    id: '',
    name: '',
    blurb: '',
    facts: ['', '', ''],
    features: [],
    choices: [],
    skills: [],
    bonusHitPointsPerLevel: 0,
    speed: 0,
    darkvision: 0,
  };
}

/** Un choix neuf du genre demandé, avec les valeurs que le SRD emploie le plus. */
export function emptyChoiceDraft(kind: ChoiceKindDraft, subject: string): ChoiceDraft {
  return {
    subject,
    kind,
    title: '',
    help: '',
    pick: 1,
    from: [],
    bonus: 1,
    listFrom: '',
    level: 1,
    prepared: false,
    steps: [{ level: 1, howMany: 2 }],
  };
}

export function emptySubclassDraft(): SubclassDraft {
  return {
    id: '',
    name: '',
    blurb: '',
    forClassId: '',
    facts: ['', '', ''],
    features: [],
  };
}

export function emptySpellDraft(): SpellDraft {
  return {
    id: '',
    name: '',
    level: 0,
    school: 'evocation',
    castingTime: '1 action',
    range: '18 mètres',
    verbal: true,
    somatic: true,
    material: '',
    duration: 'instantanée',
    concentration: false,
    ritual: false,
    summary: '',
    classes: [],
  };
}

/** Tout ce que le pack a déjà nommé : de quoi ne jamais nommer deux fois pareil. */
export function allIds(draft: PackDraft): readonly string[] {
  return [
    ...draft.spells.map((entry) => entry.id),
    ...draft.subclasses.map((entry) => entry.id),
    ...draft.races.flatMap((race) => [
      race.id,
      ...race.subraces.map((subrace) => subrace.id),
    ]),
    ...draft.backgrounds.map((entry) => entry.id),
    ...draft.classes.map((entry) => entry.id),
  ];
}

/**
 * L'identifiant d'une entrée, fabriqué depuis son nom et rendu unique dans son
 * pack. Personne ne veut le taper : il n'a d'existence que technique, et une
 * faute de frappe dedans coûte un pack refusé pour une raison illisible.
 *
 * Le suffixe n'arrive que sur une vraie collision — deux peuples appelés
 * pareil — et vaut mieux qu'un refus : le joueur voit deux entrées du même
 * nom, ce qui est SON problème, pas celui d'un identifiant.
 */
export function uniqueId(packId: string, name: string, taken: readonly string[]): string {
  const base = `${packId}-${slug(name)}`;
  if (!taken.includes(base)) {
    return base;
  }
  let rank = 2;
  while (taken.includes(`${base}-${String(rank)}`)) {
    rank += 1;
  }
  return `${base}-${String(rank)}`;
}

/** `Appel des brumes` → `appel-des-brumes`. Sans accent : c'est un identifiant. */
export function slug(value: string): string {
  return value
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, '-')
    .replaceAll(/^-|-$/gu, '');
}

/** Un choix n'écrit que ce que son genre emploie : le reste serait du bruit. */
function choiceFile(choice: ChoiceDraft): Record<string, unknown> {
  const base = {
    kind: choice.kind,
    subject: choice.subject,
    title: choice.title,
    help: choice.help,
    pick: choice.pick,
  };
  switch (choice.kind) {
    case 'ability': {
      return { ...base, bonus: choice.bonus };
    }
    case 'cantrip': {
      return { ...base, listFrom: choice.listFrom };
    }
    case 'spell': {
      return {
        ...base,
        listFrom: choice.listFrom,
        count: choice.prepared
          ? { kind: 'prepared' }
          : {
              kind: 'known',
              steps: Object.fromEntries(
                choice.steps.map((step) => [String(step.level), step.howMany]),
              ),
            },
      };
    }
    case 'fighting-style': {
      return { ...base, level: choice.level, from: choice.from };
    }
    case 'expertise': {
      return { ...base, tools: choice.from };
    }
    case 'ancestry': {
      return base;
    }
    case 'skill':
    case 'language':
    case 'tool':
    case 'equipment': {
      return { ...base, from: choice.from };
    }
  }
}

/**
 * Le brouillon rendu au format du fichier. C'est ce qu'on écrit sur l'appareil
 * ET ce qu'on soumet à `parsePack` : le créateur et l'import jugent donc
 * exactement le même objet, ce qui est la seule façon qu'ils ne divergent pas.
 *
 * La date est celle de l'export, prise au moment de l'export : c'est tout ce
 * qu'elle prétend être, et elle sert de version.
 */
export function packDraftFile(
  draft: PackDraft,
  updatedAt: string,
): Record<string, unknown> {
  return {
    pack: {
      id: draft.id,
      name: draft.name,
      author: draft.author,
      description: draft.description,
      updatedAt,
    },
    spells: draft.spells.map((spell) => ({
      id: spell.id,
      name: spell.name,
      level: spell.level,
      school: spell.school,
      castingTime: spell.castingTime,
      range: spell.range,
      components: {
        verbal: spell.verbal,
        somatic: spell.somatic,
        material: spell.material === '' ? null : spell.material,
      },
      duration: spell.duration,
      concentration: spell.concentration,
      ritual: spell.ritual,
      summary: spell.summary,
      classes: spell.classes,
    })),
    races: draft.races.map((race) => ({
      id: race.id,
      name: race.name,
      blurb: race.blurb,
      facts: race.facts,
      size: race.size,
      speed: race.speed,
      darkvision: race.darkvision,
      languages: race.languages,
      skills: race.skills,
      resistances: race.resistances,
      proficiencies: {
        armor: [],
        weaponCategories: [],
        weapons: race.weapons,
        tools: race.tools,
      },
      everyAbilityPlusOne: race.everyAbilityPlusOne,
      features: race.features.map((feature) => ({
        name: feature.name,
        text: feature.text,
      })),
      choices: race.choices.map((choice) => choiceFile(choice)),
      subraces: race.subraces.map((subrace) => ({
        id: subrace.id,
        name: subrace.name,
        blurb: subrace.blurb,
        facts: subrace.facts,
        skills: subrace.skills,
        bonusHitPointsPerLevel: subrace.bonusHitPointsPerLevel,
        speed: subrace.speed,
        darkvision: subrace.darkvision,
        features: subrace.features.map((f) => ({ name: f.name, text: f.text })),
        choices: subrace.choices.map((choice) => choiceFile(choice)),
      })),
    })),
    classes: draft.classes.map((entry) => ({
      id: entry.id,
      name: entry.name,
      blurb: entry.blurb,
      facts: entry.facts,
      hitDie: entry.hitDie,
      saves: entry.saves,
      proficiencies: {
        armor: entry.armor,
        weaponCategories: entry.weaponCategories,
        weapons: entry.weapons,
        tools: entry.tools,
      },
      features: entry.features,
      choices: entry.choices.map((choice) => choiceFile(choice)),
      equipmentOptions: entry.equipmentOptions,
      fixedEquipment: entry.fixedEquipment,
      spellcasting: entry.casts
        ? {
            ability: entry.castingAbility,
            progression: entry.progression,
            preparation: entry.preparation,
            ritual: entry.ritual,
          }
        : null,
      subclassChoice: {
        level: entry.subclassLevel,
        title: entry.subclassTitle,
        help: entry.subclassHelp,
      },
      advancements: entry.advancements,
    })),
    backgrounds: draft.backgrounds.map((background) => ({
      id: background.id,
      name: background.name,
      blurb: background.blurb,
      facts: background.facts,
      skills: background.skills,
      proficiencies: { tools: background.tools },
      choices: background.choices.map((choice) => choiceFile(choice)),
      equipment: background.equipment,
      goldPieces: background.goldPieces,
      feature:
        background.featureName === ''
          ? null
          : { name: background.featureName, text: background.featureText },
      suggestedTraits: {
        traits: background.traits,
        ideals: background.ideals,
        bonds: background.bonds,
        flaws: background.flaws,
      },
    })),
    subclasses: draft.subclasses.map((subclass) => ({
      id: subclass.id,
      name: subclass.name,
      blurb: subclass.blurb,
      for: subclass.forClassId,
      facts: subclass.facts,
      features: subclass.features,
    })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.slice(0, 600) : fallback;
}

function asLevel(value: unknown): SpellLevel {
  const levels: readonly SpellLevel[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  return levels.find((level) => level === value) ?? 0;
}

function asSpellDraft(value: unknown): SpellDraft {
  const source = isRecord(value) ? value : {};
  const components = isRecord(source.components) ? source.components : {};
  const empty = emptySpellDraft();
  return {
    id: asText(source.id),
    name: asText(source.name),
    level: asLevel(source.level),
    school: asText(source.school, empty.school),
    castingTime: asText(source.castingTime, empty.castingTime),
    range: asText(source.range, empty.range),
    verbal: components.verbal === true,
    somatic: components.somatic === true,
    material: asText(components.material),
    duration: asText(source.duration, empty.duration),
    concentration: source.concentration === true,
    ritual: source.ritual === true,
    summary: asText(source.summary),
    classes: Array.isArray(source.classes)
      ? source.classes.filter((entry): entry is string => typeof entry === 'string')
      : [],
  };
}

function asFeatureDraft(value: unknown): FeatureDraft {
  const source = isRecord(value) ? value : {};
  return {
    level:
      typeof source.level === 'number' && Number.isSafeInteger(source.level)
        ? source.level
        : 1,
    name: asText(source.name),
    text: asText(source.text),
  };
}

function asSubclassDraft(value: unknown): SubclassDraft {
  const source = isRecord(value) ? value : {};
  const facts = Array.isArray(source.facts) ? source.facts : [];
  const fact = (index: number): string => asText(facts[index]);
  return {
    id: asText(source.id),
    name: asText(source.name),
    blurb: asText(source.blurb),
    forClassId: asText(source.for),
    facts: [fact(0), fact(1), fact(2)],
    features: asFeatureDrafts(source.features),
  };
}

const CHOICE_KINDS: readonly ChoiceKindDraft[] = [
  'skill',
  'language',
  'tool',
  'ability',
  'cantrip',
  'ancestry',
  'spell',
  'fighting-style',
  'expertise',
  'equipment',
];

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asStrings(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function asFacts(value: unknown): readonly [string, string, string] {
  const from = Array.isArray(value) ? value : [];
  const at = (index: number): string => asText(from[index]);
  return [at(0), at(1), at(2)];
}

function asStepDrafts(value: unknown): readonly SpellStepDraft[] {
  const source = isRecord(value) ? value : {};
  const steps = isRecord(source.steps) ? source.steps : {};
  return Object.entries(steps).map(([level, howMany]) => ({
    level: asNumber(Number(level), 1),
    howMany: asNumber(howMany, 1),
  }));
}

function asChoiceDraft(value: unknown): ChoiceDraft {
  const source = isRecord(value) ? value : {};
  const kind = CHOICE_KINDS.find((entry) => entry === source.kind) ?? 'skill';
  const steps = asStepDrafts(source.count);
  return {
    subject: asText(source.subject),
    kind,
    title: asText(source.title),
    help: asText(source.help),
    pick: asNumber(source.pick, 1),
    // L'expertise range ses outils sous un autre nom : le brouillon n'a qu'une
    // liste, et c'est ici qu'on la retrouve.
    from: asStrings(kind === 'expertise' ? source.tools : source.from),
    bonus: asNumber(source.bonus, 1),
    listFrom: asText(source.listFrom),
    level: asNumber(source.level, 1),
    prepared: isRecord(source.count) && source.count.kind === 'prepared',
    steps: steps.length === 0 ? [{ level: 1, howMany: 2 }] : steps,
  };
}

function asChoiceDrafts(value: unknown): readonly ChoiceDraft[] {
  return Array.isArray(value)
    ? value.slice(0, 8).map((entry) => asChoiceDraft(entry))
    : [];
}

/**
 * Un peuple n'écrit pas de niveau — les siennes valent dès la naissance — une
 * classe si. `asFeatureDraft` rend 1 quand le fichier se tait, ce qui répond
 * aux deux cas sans les distinguer.
 */
function asFeatureDrafts(value: unknown): readonly FeatureDraft[] {
  return Array.isArray(value)
    ? value.slice(0, 40).map((entry) => asFeatureDraft(entry))
    : [];
}

function asSubraceDraft(value: unknown): SubraceDraft {
  const source = isRecord(value) ? value : {};
  return {
    id: asText(source.id),
    name: asText(source.name),
    blurb: asText(source.blurb),
    facts: asFacts(source.facts),
    features: asFeatureDrafts(source.features),
    choices: asChoiceDrafts(source.choices),
    skills: asStrings(source.skills),
    bonusHitPointsPerLevel: asNumber(source.bonusHitPointsPerLevel, 0),
    speed: asNumber(source.speed, 0),
    darkvision: asNumber(source.darkvision, 0),
  };
}

function asRaceDraft(value: unknown): RaceDraft {
  const source = isRecord(value) ? value : {};
  const proficiencies = isRecord(source.proficiencies) ? source.proficiencies : {};
  const empty = emptyRaceDraft();
  return {
    id: asText(source.id),
    name: asText(source.name),
    blurb: asText(source.blurb),
    facts: asFacts(source.facts),
    size: source.size === 'P' ? 'P' : 'M',
    speed: asNumber(source.speed, empty.speed),
    darkvision: asNumber(source.darkvision, 0),
    languages: asStrings(source.languages),
    skills: asStrings(source.skills),
    resistances: asStrings(source.resistances),
    weapons: asStrings(proficiencies.weapons),
    tools: asStrings(proficiencies.tools),
    everyAbilityPlusOne: source.everyAbilityPlusOne === true,
    features: asFeatureDrafts(source.features),
    choices: asChoiceDrafts(source.choices),
    subraces: Array.isArray(source.subraces)
      ? source.subraces.slice(0, 12).map((entry) => asSubraceDraft(entry))
      : [],
  };
}

function asBackgroundDraft(value: unknown): BackgroundDraft {
  const source = isRecord(value) ? value : {};
  const proficiencies = isRecord(source.proficiencies) ? source.proficiencies : {};
  const traits = isRecord(source.suggestedTraits) ? source.suggestedTraits : {};
  const feature = isRecord(source.feature) ? source.feature : {};
  return {
    id: asText(source.id),
    name: asText(source.name),
    blurb: asText(source.blurb),
    facts: asFacts(source.facts),
    skills: asStrings(source.skills),
    tools: asStrings(proficiencies.tools),
    choices: asChoiceDrafts(source.choices),
    equipment: asEquipmentDrafts(source.equipment),
    goldPieces: asNumber(source.goldPieces, 0),
    featureName: asText(feature.name),
    featureText: asText(feature.text),
    traits: asStrings(traits.traits),
    ideals: asStrings(traits.ideals),
    bonds: asStrings(traits.bonds),
    flaws: asStrings(traits.flaws),
  };
}

function asEquipmentDrafts(value: unknown): readonly EquipmentDraft[] {
  return Array.isArray(value)
    ? value.slice(0, 20).map((line) => {
        const entry = isRecord(line) ? line : {};
        return { itemId: asText(entry.itemId), quantity: asNumber(entry.quantity, 1) };
      })
    : [];
}

function asClassDraft(value: unknown): ClassDraft {
  const source = isRecord(value) ? value : {};
  const proficiencies = isRecord(source.proficiencies) ? source.proficiencies : {};
  const casting = isRecord(source.spellcasting) ? source.spellcasting : null;
  const voie = isRecord(source.subclassChoice) ? source.subclassChoice : {};
  const empty = emptyClassDraft();
  const dice: readonly number[] = [6, 8, 10, 12];
  const die = dice.find((entry) => entry === source.hitDie) ?? 8;
  return {
    id: asText(source.id),
    name: asText(source.name),
    blurb: asText(source.blurb),
    facts: asFacts(source.facts),
    hitDie: die as 6 | 8 | 10 | 12,
    saves: asStrings(source.saves),
    armor: asStrings(proficiencies.armor),
    weaponCategories: asStrings(proficiencies.weaponCategories),
    weapons: asStrings(proficiencies.weapons),
    tools: asStrings(proficiencies.tools),
    features: asFeatureDrafts(source.features),
    choices: asChoiceDrafts(source.choices),
    equipmentOptions: Array.isArray(source.equipmentOptions)
      ? source.equipmentOptions.slice(0, 12).map((option) => {
          const entry = isRecord(option) ? option : {};
          return {
            id: asText(entry.id),
            name: asText(entry.name),
            blurb: asText(entry.blurb),
            facts: asFacts(entry.facts),
            items: asEquipmentDrafts(entry.items),
          };
        })
      : [],
    fixedEquipment: asEquipmentDrafts(source.fixedEquipment),
    casts: casting !== null,
    castingAbility: asText(casting?.ability, empty.castingAbility),
    progression: asText(casting?.progression, empty.progression),
    preparation: asText(casting?.preparation, empty.preparation),
    ritual: casting?.ritual === true,
    subclassLevel: asNumber(voie.level, empty.subclassLevel),
    subclassTitle: asText(voie.title),
    subclassHelp: asText(voie.help),
    advancements: Array.isArray(source.advancements)
      ? source.advancements.filter((level): level is number => typeof level === 'number')
      : [],
  };
}

/**
 * Relit un fichier POUR L'ÉCRIRE, pas pour l'installer : ici l'incomplet est
 * normal, donc rien n'est refusé et tout ce qui manque devient un champ vide.
 *
 * Ce n'est pas une seconde validation — `parsePack` reste seul juge de ce qui
 * entre dans l'application. C'est la même séparation que pour un personnage :
 * `parseDraft` remplit un formulaire, il ne décide de rien.
 */
export function parsePackDraft(value: unknown): PackDraft {
  if (!isRecord(value)) {
    return emptyPackDraft();
  }
  const info = isRecord(value.pack) ? value.pack : {};
  return {
    id: asText(info.id),
    name: asText(info.name),
    author: asText(info.author),
    description: asText(info.description),
    spells: Array.isArray(value.spells)
      ? value.spells.slice(0, 500).map((entry) => asSpellDraft(entry))
      : [],
    subclasses: Array.isArray(value.subclasses)
      ? value.subclasses.slice(0, 500).map((entry) => asSubclassDraft(entry))
      : [],
    races: Array.isArray(value.races)
      ? value.races.slice(0, 100).map((entry) => asRaceDraft(entry))
      : [],
    backgrounds: Array.isArray(value.backgrounds)
      ? value.backgrounds.slice(0, 100).map((entry) => asBackgroundDraft(entry))
      : [],
    classes: Array.isArray(value.classes)
      ? value.classes.slice(0, 50).map((entry) => asClassDraft(entry))
      : [],
  };
}
