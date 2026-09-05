import { ABILITIES } from './abilities';
import type { AbilityId } from './abilities';
import { findLanguage, findTool, findWeapon } from './catalogue';
import type { Catalogue } from './catalogue';
import type { ChoiceSpec } from './choiceSpec';
import { RACE_CHOICE_KINDS, parseChoiceSpec } from './parseChoice';
import {
  ID_SHAPE,
  MAX_ID,
  MAX_NAME,
  MAX_TEXT,
  count,
  facts,
  isRecord,
  keptAmong,
  strings,
  text,
} from './parseValues';
import { ALL_SKILLS } from './skills';
import type { SkillId } from './skills';
import type { PackEntryKind, PackIssue } from './pack';
import type {
  ArmorCategory,
  DamageType,
  Feature,
  Proficiencies,
  Race,
  Subrace,
  WeaponCategory,
} from './content';

/** Un peuple du SRD en a trois ou quatre ; la borne arrête l'absurde. */
const MAX_FEATURES = 20;
const MAX_CHOICES = 8;
const MAX_SUBRACES = 12;
/** Le nain marche à 7,50 m, le cheval de trait à 18 : au-delà, c'est une faute. */
const MAX_SPEED = 30;
const MAX_DARKVISION = 60;
const MAX_BONUS_HIT_POINTS = 5;

const ARMOR: readonly string[] = ['legere', 'intermediaire', 'lourde', 'bouclier'];
const WEAPON_CATEGORIES: readonly string[] = ['courantes', 'de-guerre'];
const DAMAGE_TYPES: readonly string[] = [
  'tranchant',
  'perforant',
  'contondant',
  'feu',
  'froid',
  'foudre',
  'acide',
  'poison',
  'psychique',
  'necrotique',
  'radiant',
  'force',
  'tonnerre',
];

const SKILL_IDS: readonly string[] = ALL_SKILLS;

function isSkillId(id: string): id is SkillId {
  return SKILL_IDS.includes(id);
}

/** Une mesure en mètres : jamais négative, jamais absurde, arrondie au quart. */
function meters(value: unknown, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) {
    return null;
  }
  return Math.round(value * 4) / 4;
}

/**
 * Les références d'un peuple ne sortent jamais du catalogue : une compétence,
 * une langue, un outil, une arme qui n'existent pas sont écartés en silence
 * plutôt que refusés — ce sont des LISTES, et une entrée morte dans une liste
 * n'empêche pas les autres de servir.
 */
function proficienciesOf(value: unknown, catalogue: Catalogue): Proficiencies {
  const source = isRecord(value) ? value : {};
  return {
    armor: keptAmong(strings(source.armor), ARMOR) as readonly ArmorCategory[],
    weaponCategories: keptAmong(
      strings(source.weaponCategories),
      WEAPON_CATEGORIES,
    ) as readonly WeaponCategory[],
    weapons: strings(source.weapons).filter((id) => findWeapon(catalogue, id) !== null),
    tools: strings(source.tools).filter((id) => findTool(catalogue, id) !== null),
  };
}

function featuresOf(value: unknown): readonly Feature[] | null {
  const raw = Array.isArray(value) ? value.slice(0, MAX_FEATURES) : [];
  const features: Feature[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) return null;
    const name = text(entry.name, MAX_NAME);
    const body = text(entry.text, MAX_TEXT);
    if (name === null || body === null) return null;
    features.push({ name, text: body });
  }
  return features;
}

/** Ce que race et sous-race partagent : la prose, les repères, ce qu'elles donnent. */
interface CommonParts {
  readonly name: string;
  readonly blurb: string;
  readonly facts: readonly [string, string, string];
  readonly skills: readonly SkillId[];
  readonly proficiencies: Proficiencies;
  readonly features: readonly Feature[];
  readonly choices: readonly ChoiceSpec[];
}

function commonOf(
  value: Record<string, unknown>,
  catalogue: Catalogue,
  miss: (field: string) => null,
): CommonParts | null {
  const name = text(value.name, MAX_NAME);
  if (name === null) return miss('name');
  const blurb = text(value.blurb, MAX_TEXT);
  if (blurb === null) return miss('blurb');
  const features = featuresOf(value.features);
  if (features === null) return miss('features');

  const rawChoices = Array.isArray(value.choices)
    ? value.choices.slice(0, MAX_CHOICES)
    : [];
  const choices: ChoiceSpec[] = [];
  for (const raw of rawChoices) {
    const choice = parseChoiceSpec(raw, catalogue, RACE_CHOICE_KINDS);
    if (choice === null) return miss('choices');
    choices.push(choice);
  }

  return {
    name,
    blurb,
    facts: facts(value.facts),
    skills: strings(value.skills).filter(isSkillId),
    proficiencies: proficienciesOf(value.proficiencies, catalogue),
    features,
    choices,
  };
}

function subraceOf(
  value: unknown,
  catalogue: Catalogue,
  prefix: string,
  miss: (field: string) => null,
): Subrace | null {
  if (!isRecord(value)) return miss('sous-race');
  const id = text(value.id, MAX_ID);
  if (id === null || !ID_SHAPE.test(id)) return miss('id');
  if (!id.startsWith(prefix)) return miss('prefix');
  const common = commonOf(value, catalogue, miss);
  if (common === null) return null;

  return {
    id,
    ...common,
    abilityBonuses: {},
    bonusHitPointsPerLevel:
      count(value.bonusHitPointsPerLevel, MAX_BONUS_HIT_POINTS) ?? 0,
    // `null` : la branche garde ce que son peuple lui donne. L'elfe noir est le
    // seul du SRD à doubler la portée de sa vision.
    speed: meters(value.speed, MAX_SPEED),
    darkvision: meters(value.darkvision, MAX_DARKVISION),
  };
}

export interface RaceParse {
  readonly race: Race | null;
  readonly issues: readonly PackIssue[];
}

/**
 * Un peuple venu d'un fichier. Comme partout ailleurs : refus net, sans
 * réparation, et des raisons structurées que `ui/format/` met en français.
 *
 * Les six +1 de l'humain sont la seule forme de `abilityBonuses` acceptée : le
 * reste se place par le joueur, via un créneau `ability`, ce qui est la règle
 * d'origine personnalisée de la charte.
 */
export function parseRace(
  value: unknown,
  at: number,
  prefix: string,
  catalogue: Catalogue,
): RaceParse {
  const issues: PackIssue[] = [];
  const entry = isRecord(value)
    ? (text(value.id, MAX_ID) ?? text(value.name, MAX_NAME) ?? '')
    : '';
  const report = (field: string, what: PackEntryKind = 'race'): null => {
    issues.push({ kind: 'missing-field', at, entry, what, field });
    return null;
  };
  const miss = (field: string): null => report(field);

  if (!isRecord(value)) {
    report('race');
    return { race: null, issues };
  }
  const id = text(value.id, MAX_ID);
  if (id === null || !ID_SHAPE.test(id)) {
    report('id');
    return { race: null, issues };
  }
  if (!id.startsWith(prefix)) {
    issues.push({ kind: 'bad-prefix', at, entry, what: 'race' });
    return { race: null, issues };
  }
  const common = commonOf(value, catalogue, miss);
  if (common === null) {
    return { race: null, issues };
  }

  const speed = meters(value.speed, MAX_SPEED);
  if (speed === null || speed === 0) {
    report('speed');
    return { race: null, issues };
  }

  const rawSubraces = Array.isArray(value.subraces)
    ? value.subraces.slice(0, MAX_SUBRACES)
    : [];
  const subraces: Subrace[] = [];
  for (const raw of rawSubraces) {
    const subrace = subraceOf(raw, catalogue, prefix, (field) =>
      report(field, 'subrace'),
    );
    if (subrace === null) {
      return { race: null, issues };
    }
    subraces.push(subrace);
  }

  const race: Race = {
    id,
    ...common,
    abilityBonuses: value.everyAbilityPlusOne === true ? EVERY_ABILITY_PLUS_ONE : {},
    size: value.size === 'P' ? 'P' : 'M',
    speed,
    darkvision: meters(value.darkvision, MAX_DARKVISION) ?? 0,
    languages: strings(value.languages).filter(
      (id2) => findLanguage(catalogue, id2) !== null,
    ),
    resistances: keptAmong(
      strings(value.resistances),
      DAMAGE_TYPES,
    ) as readonly DamageType[],
    subraces,
  };
  return { race, issues };
}

/** L'humain : six +1, rien à placer. C'est la seule forme imposée du SRD. */
const EVERY_ABILITY_PLUS_ONE = Object.fromEntries(
  ABILITIES.map((ability) => [ability, 1]),
) as Readonly<Record<AbilityId, number>>;
