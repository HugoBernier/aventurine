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
export interface ChoiceDraft {
  /** Fixé à la création : le créneau du personnage porte ce sujet. */
  readonly subject: string;
  readonly kind: 'skill' | 'language' | 'tool' | 'ability' | 'cantrip' | 'ancestry';
  readonly title: string;
  readonly help: string;
  readonly pick: number;
  readonly from: readonly string[];
  /** `ability` : +1 ou +2 à placer. `cantrip` : la classe dont on prend la liste. */
  readonly bonus: number;
  readonly listFrom: string;
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

export interface PackDraft {
  readonly id: string;
  readonly name: string;
  readonly author: string;
  readonly description: string;
  readonly spells: readonly SpellDraft[];
  readonly subclasses: readonly SubclassDraft[];
  readonly races: readonly RaceDraft[];
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

/** Un bonus d'origine +2, dans la forme et la prose que le SRD emploie. */
export function emptyChoiceDraft(
  kind: ChoiceDraft['kind'],
  subject: string,
): ChoiceDraft {
  return {
    subject,
    kind,
    title: '',
    help: '',
    pick: 1,
    from: [],
    bonus: 1,
    listFrom: '',
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
  if (choice.kind === 'ability') {
    return { ...base, bonus: choice.bonus };
  }
  if (choice.kind === 'cantrip') {
    return { ...base, listFrom: choice.listFrom };
  }
  return choice.kind === 'ancestry' ? base : { ...base, from: choice.from };
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
    classes: [],
    backgrounds: [],
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
    features: Array.isArray(source.features)
      ? source.features.slice(0, 40).map((entry) => asFeatureDraft(entry))
      : [],
  };
}

const CHOICE_KINDS: readonly ChoiceDraft['kind'][] = [
  'skill',
  'language',
  'tool',
  'ability',
  'cantrip',
  'ancestry',
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

function asChoiceDraft(value: unknown): ChoiceDraft {
  const source = isRecord(value) ? value : {};
  const kind = CHOICE_KINDS.find((entry) => entry === source.kind) ?? 'skill';
  return {
    subject: asText(source.subject),
    kind,
    title: asText(source.title),
    help: asText(source.help),
    pick: asNumber(source.pick, 1),
    from: asStrings(source.from),
    bonus: asNumber(source.bonus, 1),
    listFrom: asText(source.listFrom),
  };
}

function asChoiceDrafts(value: unknown): readonly ChoiceDraft[] {
  return Array.isArray(value)
    ? value.slice(0, 8).map((entry) => asChoiceDraft(entry))
    : [];
}

function asFeatureDrafts(value: unknown): readonly FeatureDraft[] {
  return Array.isArray(value)
    ? value.slice(0, 40).map((entry) => {
        const source = isRecord(entry) ? entry : {};
        return { level: 1, name: asText(source.name), text: asText(source.text) };
      })
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
  };
}
