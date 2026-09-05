import { ABILITIES } from './abilities';
import type { AbilityId } from './abilities';
import { findItem, findTool, findWeapon } from './catalogue';
import type { Catalogue } from './catalogue';
import type { ChoiceSpec, SubclassSpec } from './choiceSpec';
import { CLASS_CHOICE_KINDS, parseChoiceSpec } from './parseChoice';
import { MAX_LEVEL, MIN_LEVEL } from './progression';
import type { CastingProgression } from './progression';
import type { PackIssue } from './pack';
import {
  ID_SHAPE,
  MAX_ID,
  MAX_LINE,
  MAX_NAME,
  MAX_TEXT,
  count,
  facts,
  isRecord,
  keptAmong,
  strings,
  text,
} from './parseValues';
import type {
  ArmorCategory,
  CharacterClass,
  EquipmentOption,
  ItemLine,
  LeveledFeature,
  Proficiencies,
  Spellcasting,
  UnarmoredDefense,
  WeaponCategory,
} from './content';

const MAX_FEATURES = 60;
const MAX_CHOICES = 12;
const MAX_OPTIONS = 12;
const MAX_ITEMS = 20;
const MAX_QUANTITY = 99;

const ARMOR: readonly string[] = ['legere', 'intermediaire', 'lourde', 'bouclier'];
const WEAPON_CATEGORIES: readonly string[] = ['courantes', 'de-guerre'];
const HIT_DICE = new Set([6, 8, 10, 12]);
const PROGRESSIONS = new Set<string>(['full', 'half', 'pact']);
const PREPARATIONS = new Set<string>(['known', 'prepared', 'spellbook']);
const ABILITY_IDS: readonly string[] = ABILITIES;

function isAbilityId(value: unknown): value is AbilityId {
  return typeof value === 'string' && ABILITY_IDS.includes(value);
}

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

function itemsOf(value: unknown, catalogue: Catalogue): readonly ItemLine[] {
  const raw = Array.isArray(value) ? value.slice(0, MAX_ITEMS) : [];
  const lines: ItemLine[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) continue;
    const itemId = text(entry.itemId, MAX_ID);
    if (itemId === null || findItem(catalogue, itemId) === null) continue;
    lines.push({ itemId, quantity: count(entry.quantity, MAX_QUANTITY, 1) ?? 1 });
  }
  return lines;
}

/**
 * Un lot d'équipement de départ. Son identifiant reste LOCAL à la classe — pas
 * de préfixe de pack : il ne devient jamais un identifiant de créneau, il n'est
 * lu que dans le choix de sa propre classe, où aucune collision n'est possible.
 */
function equipmentOptionsOf(
  value: unknown,
  catalogue: Catalogue,
): readonly EquipmentOption[] | null {
  const raw = Array.isArray(value) ? value.slice(0, MAX_OPTIONS) : [];
  const options: EquipmentOption[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) return null;
    const id = text(entry.id, MAX_ID);
    const name = text(entry.name, MAX_NAME);
    if (name === null || id === null || !ID_SHAPE.test(id)) return null;
    options.push({
      id,
      name,
      blurb: text(entry.blurb, MAX_TEXT) ?? '',
      facts: facts(entry.facts),
      items: itemsOf(entry.items, catalogue),
    });
  }
  return options;
}

function featuresOf(value: unknown): readonly LeveledFeature[] | null {
  const raw = Array.isArray(value) ? value.slice(0, MAX_FEATURES) : [];
  const features: LeveledFeature[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) return null;
    const name = text(entry.name, MAX_NAME);
    const body = text(entry.text, MAX_TEXT);
    const level = count(entry.level, MAX_LEVEL, MIN_LEVEL);
    if (name === null || body === null || level === null) return null;
    features.push({ level, name, text: body });
  }
  return features;
}

/**
 * L'enveloppe distingue « pas de magie » d'« une magie mal écrite » : la
 * moitié des classes n'en lance pas, et c'est parfaitement normal.
 */
function spellcastingOf(
  value: unknown,
): { readonly casting: Spellcasting | null } | null {
  if (value === undefined || value === null) return { casting: null };
  if (!isRecord(value)) return null;
  const { ability, progression, preparation } = value;
  if (!isAbilityId(ability)) return null;
  if (typeof progression !== 'string' || !PROGRESSIONS.has(progression)) return null;
  if (typeof preparation !== 'string' || !PREPARATIONS.has(preparation)) return null;
  return {
    casting: {
      ability,
      progression: progression as CastingProgression,
      preparation:
        preparation === 'prepared' || preparation === 'spellbook' ? preparation : 'known',
      ritual: value.ritual === true,
    },
  };
}

function unarmoredDefenceOf(
  value: unknown,
): { readonly defence: UnarmoredDefense | null } | null {
  if (value === undefined || value === null) return { defence: null };
  if (!isRecord(value)) return null;
  const base = count(value.base, 20, 5);
  return base === null
    ? null
    : {
        defence: {
          base,
          addedAbilities: strings(value.addedAbilities).filter((id) => isAbilityId(id)),
          shieldAllowed: value.shieldAllowed === true,
        },
      };
}

function subclassChoiceOf(value: unknown): SubclassSpec | null {
  const source = isRecord(value) ? value : {};
  const level = count(source.level, MAX_LEVEL, MIN_LEVEL);
  const title = text(source.title, MAX_LINE);
  const help = text(source.help, MAX_TEXT);
  return level === null || title === null || help === null
    ? null
    : { kind: 'subclass', subject: 'subclass', title, help, pick: 1, level };
}

/** Un choix d'équipement de départ : ses options sont les lots de la classe. */
function equipmentChoiceOf(
  value: Record<string, unknown>,
  options: readonly EquipmentOption[],
): ChoiceSpec | null {
  const subject = text(value.subject, MAX_ID);
  const title = text(value.title, MAX_LINE);
  const help = text(value.help, MAX_TEXT);
  if (title === null || help === null || subject === null || !ID_SHAPE.test(subject)) {
    return null;
  }
  const from = strings(value.from).filter((id) =>
    options.some((option) => option.id === id),
  );
  return from.length === 0
    ? null
    : {
        kind: 'equipment',
        subject,
        title,
        help,
        pick: count(value.pick, 4, 1) ?? 1,
        from,
      };
}

function choicesOf(
  value: unknown,
  catalogue: Catalogue,
  options: readonly EquipmentOption[],
): readonly ChoiceSpec[] | null {
  const raw = Array.isArray(value) ? value.slice(0, MAX_CHOICES) : [];
  const choices: ChoiceSpec[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) return null;
    const choice =
      entry.kind === 'equipment'
        ? equipmentChoiceOf(entry, options)
        : parseChoiceSpec(entry, catalogue, CLASS_CHOICE_KINDS);
    if (choice === null) return null;
    choices.push(choice);
  }
  return choices;
}

/** Les niveaux où la classe améliore ses scores. Le SRD en donne 4, 8, 12, 16, 19. */
function advancementLevelsOf(value: unknown): readonly number[] {
  const levels = Array.isArray(value) ? value.slice(0, MAX_LEVEL) : [];
  const kept = new Set<number>();
  for (const entry of levels) {
    const level = count(entry, MAX_LEVEL, 2);
    if (level !== null) kept.add(level);
  }
  return [...kept].toSorted((a, b) => a - b);
}

/**
 * Une classe de pack, moins ses paliers d'amélioration.
 *
 * Ces paliers ne portent aucune donnée propre : quatre choix identiques d'une
 * classe à l'autre, dont le seul paramètre est le niveau. Le fichier ne dit
 * donc que les niveaux, et la prose française qui les accompagne reste celle
 * de l'application — sinon un pack figerait, dans son fichier, un texte que
 * l'application a le droit d'améliorer.
 */
export interface PackClass {
  readonly base: Omit<CharacterClass, 'advancements'>;
  readonly advancementLevels: readonly number[];
}

export interface ClassParse {
  readonly entry: PackClass | null;
  readonly issues: readonly PackIssue[];
}

/**
 * Une classe venue d'un fichier. Ses voies ne sont pas ici : une voie de son
 * propre pack se déclare comme une greffe, avec un `for` qui la nomme, et
 * l'assemblage du catalogue les réunit — le même chemin que pour une voie
 * greffée sur une classe du SRD.
 */
export function parseClass(
  value: unknown,
  at: number,
  prefix: string,
  catalogue: Catalogue,
): ClassParse {
  const issues: PackIssue[] = [];
  const entry = isRecord(value)
    ? (text(value.id, MAX_ID) ?? text(value.name, MAX_NAME) ?? '')
    : '';
  const miss = (field: string): ClassParse => {
    issues.push({ kind: 'missing-field', at, entry, what: 'class', field });
    return { entry: null, issues };
  };

  if (!isRecord(value)) return miss('classe');
  const id = text(value.id, MAX_ID);
  if (id === null || !ID_SHAPE.test(id)) return miss('id');
  if (!id.startsWith(prefix)) {
    issues.push({ kind: 'bad-prefix', at, entry, what: 'class' });
    return { entry: null, issues };
  }
  const name = text(value.name, MAX_NAME);
  if (name === null) return miss('name');
  const blurb = text(value.blurb, MAX_TEXT);
  if (blurb === null) return miss('blurb');

  const hitDie = count(value.hitDie, 12, 6);
  if (hitDie === null || !HIT_DICE.has(hitDie)) return miss('hitDie');

  const saves = strings(value.saves).filter((save) => isAbilityId(save));
  if (saves.length !== 2 || saves[0] === saves[1]) return miss('saves');

  const features = featuresOf(value.features);
  if (features === null) return miss('features');

  const options = equipmentOptionsOf(value.equipmentOptions, catalogue);
  if (options === null) return miss('equipmentOptions');

  const choices = choicesOf(value.choices, catalogue, options);
  if (choices === null) return miss('choices');

  const casting = spellcastingOf(value.spellcasting);
  if (casting === null) return miss('spellcasting');

  const defence = unarmoredDefenceOf(value.unarmoredDefense);
  if (defence === null) return miss('unarmoredDefense');

  const subclassChoice = subclassChoiceOf(value.subclassChoice);
  if (subclassChoice === null) return miss('subclassChoice');

  return {
    entry: {
      base: {
        id,
        name,
        blurb,
        facts: facts(value.facts),
        hitDie: hitDie as 6 | 8 | 10 | 12,
        saves: [saves[0], saves[1]] as readonly [AbilityId, AbilityId],
        proficiencies: proficienciesOf(value.proficiencies, catalogue),
        unarmoredDefense: defence.defence,
        features,
        choices,
        equipmentOptions: options,
        fixedEquipment: itemsOf(value.fixedEquipment, catalogue),
        spellcasting: casting.casting,
        subclasses: [],
        subclassChoice,
      },
      advancementLevels: advancementLevelsOf(value.advancements),
    },
    issues,
  };
}
