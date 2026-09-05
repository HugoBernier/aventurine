import { findClass } from './catalogue';
import type { Catalogue } from './catalogue';
import { prefixOf } from './pack';
import type {
  GraftedSubclass,
  PackEntryKind,
  PackInfo,
  PackIssue,
  PackParse,
} from './pack';
import type {
  Background,
  LeveledFeature,
  MagicSchool,
  Race,
  Spell,
  SpellLevel,
  Subclass,
} from './content';
import { MAX_LEVEL, MIN_LEVEL } from './progression';
import { parseBackground } from './parseBackground';
import { parseClass } from './parseClass';
import type { PackClass } from './parseClass';
import { parseRace } from './parseRace';
import {
  ID_SHAPE,
  MAX_ID,
  MAX_LINE,
  MAX_NAME,
  MAX_TEXT,
  facts,
  isRecord,
  labelOf,
  optionalText,
  text,
} from './parseValues';

const MAX_ENTRIES = 500;
const MAX_FEATURES = 40;
/** Assez pour trois fois le SRD : la borne arrête l'absurde, pas les auteurs. */
const MAX_CLASSES_PER_SPELL = 20;

const SCHOOLS = new Set<string>([
  'abjuration',
  'divination',
  'enchantement',
  'evocation',
  'illusion',
  'invocation',
  'necromancie',
  'transmutation',
]);

/**
 * Ce qu'une sous-classe du SRD porte et qu'on ne sait pas encore écrire ici.
 * Refusé plutôt que tu : les taire, c'est les perdre à la réexportation, et
 * personne ne s'en apercevrait avant d'avoir rendu le fichier à son auteur.
 */
const SUBCLASS_FIELDS_TO_COME = [
  'proficiencies',
  'alwaysPreparedSpells',
  'unarmoredDefense',
  'bonusHitPointsPerLevel',
  'choices',
];

function isSchool(value: unknown): value is MagicSchool {
  return typeof value === 'string' && SCHOOLS.has(value);
}

function isSpellLevel(value: unknown): value is SpellLevel {
  return (
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 9
  );
}

/** Le rapporteur d'une entrée : il sait la nommer, donc l'appelant ne le fait pas. */
function reporter(
  value: unknown,
  at: number,
  what: PackEntryKind,
  issues: PackIssue[],
): (field: string) => null {
  const entry = labelOf(value);
  return (field) => {
    issues.push({ kind: 'missing-field', at, entry, what, field });
    return null;
  };
}

/**
 * Les classes qui ont droit à ce sort. Une référence sort du pack, une
 * définition non : un sort maison peut rejoindre la liste du magicien, il ne
 * peut pas inventer une classe.
 */
function castersOf(
  value: unknown,
  where: {
    readonly at: number;
    readonly entry: string;
    readonly catalogue: Catalogue;
    readonly own: ReadonlySet<string>;
  },
  issues: PackIssue[],
): readonly string[] {
  const raw = Array.isArray(value) ? value.slice(0, MAX_CLASSES_PER_SPELL) : [];
  const known: string[] = [];
  for (const classId of raw) {
    if (typeof classId !== 'string') continue;
    if (findClass(where.catalogue, classId) === null && !where.own.has(classId)) {
      issues.push({
        kind: 'unknown-class',
        at: where.at,
        entry: where.entry,
        what: 'spell',
        value: classId,
      });
      continue;
    }
    known.push(classId);
  }
  return known;
}

function parseSpell(
  value: unknown,
  at: number,
  prefix: string,
  catalogue: Catalogue,
  own: ReadonlySet<string>,
  issues: PackIssue[],
): Spell | null {
  const entry = labelOf(value);
  const miss = reporter(value, at, 'spell', issues);
  if (!isRecord(value)) {
    return miss('sort');
  }

  const id = text(value.id, MAX_ID);
  if (id === null || !ID_SHAPE.test(id)) return miss('id');
  if (!id.startsWith(prefix)) {
    issues.push({ kind: 'bad-prefix', at, entry, what: 'spell' });
    return null;
  }
  const name = text(value.name, MAX_NAME);
  if (name === null) return miss('name');
  if (!isSpellLevel(value.level)) return miss('level');
  if (!isSchool(value.school)) return miss('school');
  const summary = text(value.summary, MAX_TEXT);
  if (summary === null) return miss('summary');

  const components = isRecord(value.components) ? value.components : {};
  const known = castersOf(value.classes, { at, entry, catalogue, own }, issues);
  if (known.length === 0) return miss('classes');

  return {
    id,
    name,
    level: value.level,
    school: value.school,
    castingTime: optionalText(value.castingTime, MAX_LINE) || '1 action',
    range: optionalText(value.range, MAX_LINE) || 'personnelle',
    components: {
      verbal: components.verbal === true,
      somatic: components.somatic === true,
      material: text(components.material, MAX_LINE),
    },
    duration: optionalText(value.duration, MAX_LINE) || 'instantanée',
    concentration: value.concentration === true,
    ritual: value.ritual === true,
    summary,
    classes: known,
  };
}

function parseFeature(value: unknown): LeveledFeature | null {
  if (!isRecord(value)) {
    return null;
  }
  const name = text(value.name, MAX_NAME);
  const body = text(value.text, MAX_TEXT);
  const { level } = value;
  if (name === null || body === null) {
    return null;
  }
  if (
    typeof level !== 'number' ||
    !Number.isSafeInteger(level) ||
    level < MIN_LEVEL ||
    level > MAX_LEVEL
  ) {
    return null;
  }
  return { level, name, text: body };
}

/** Ce qu'une sous-classe porte et qu'on ne sait pas encore écrire ici. */
function reportFieldsToCome(
  value: Record<string, unknown>,
  at: number,
  entry: string,
  issues: PackIssue[],
): void {
  for (const field of SUBCLASS_FIELDS_TO_COME) {
    const carried = value[field];
    const isEmpty =
      carried === undefined ||
      carried === null ||
      carried === 0 ||
      (Array.isArray(carried) && carried.length === 0);
    if (!isEmpty) {
      issues.push({
        kind: 'field-not-yet-supported',
        at,
        entry,
        what: 'subclass',
        field,
      });
    }
  }
}

function parseSubclass(
  value: unknown,
  at: number,
  prefix: string,
  catalogue: Catalogue,
  own: ReadonlySet<string>,
  issues: PackIssue[],
): GraftedSubclass | null {
  const entry = labelOf(value);
  const miss = reporter(value, at, 'subclass', issues);
  if (!isRecord(value)) {
    return miss('sous-classe');
  }

  const id = text(value.id, MAX_ID);
  if (id === null || !ID_SHAPE.test(id)) return miss('id');
  if (!id.startsWith(prefix)) {
    issues.push({ kind: 'bad-prefix', at, entry, what: 'subclass' });
    return null;
  }
  const name = text(value.name, MAX_NAME);
  if (name === null) return miss('name');
  const blurb = text(value.blurb, MAX_TEXT);
  if (blurb === null) return miss('blurb');

  // La greffe vise une classe qui existe : c'est ce qui la distingue d'une
  // classe maison, et ce qui la rend gratuite en aval — tout ce qui lit une
  // classe voit simplement une voie de plus.
  const forClassId = text(value.for, MAX_ID);
  if (forClassId === null) return miss('for');
  // Le SRD, ou une classe du même pack — jamais celle d'un autre pack : ce
  // serait la dépendance croisée refusée au §13.10, et un identifiant inconnu
  // resterait indistinguable d'une faute de frappe.
  if (findClass(catalogue, forClassId) === null && !own.has(forClassId)) {
    issues.push({
      kind: 'unknown-class',
      at,
      entry,
      what: 'subclass',
      value: forClassId,
    });
    return null;
  }

  reportFieldsToCome(value, at, entry, issues);

  const rawFeatures = Array.isArray(value.features)
    ? value.features.slice(0, MAX_FEATURES)
    : [];
  const features: LeveledFeature[] = [];
  for (const raw of rawFeatures) {
    const feature = parseFeature(raw);
    if (feature === null) {
      return miss('features');
    }
    features.push(feature);
  }
  if (features.length === 0) return miss('features');

  const subclass: Subclass = {
    id,
    name,
    blurb,
    facts: facts(value.facts),
    features,
    proficiencies: null,
    alwaysPreparedSpells: [],
    unarmoredDefense: null,
    bonusHitPointsPerLevel: 0,
    choices: [],
  };
  return { forClassId, subclass };
}

function parseInfo(value: unknown, issues: PackIssue[]): PackInfo | null {
  const source = isRecord(value) ? value : {};
  const id = text(source.id, MAX_ID);
  const name = text(source.name, MAX_NAME);
  if (id === null || !ID_SHAPE.test(id)) {
    issues.push({
      kind: 'bad-pack-id',
      value: typeof source.id === 'string' ? source.id : '',
    });
    return null;
  }
  if (name === null) {
    issues.push({ kind: 'missing-name' });
    return null;
  }
  return {
    id,
    name,
    author: optionalText(source.author, MAX_NAME),
    description: optionalText(source.description, MAX_TEXT),
    // Une date illisible ne vaut pas un refus : elle ne sert qu'à dire lequel
    // est lequel. On garde la chaîne telle quelle, l'affichage se débrouille.
    updatedAt: optionalText(source.updatedAt, MAX_LINE),
  };
}

/** `false` quand l'identifiant est déjà pris : l'entrée n'entre pas deux fois. */
function isFreeId(
  id: string,
  at: number,
  what: PackEntryKind,
  taken: Set<string>,
  issues: PackIssue[],
): boolean {
  if (taken.has(id)) {
    issues.push({ kind: 'duplicate-id', at, entry: id, what });
    return false;
  }
  taken.add(id);
  return true;
}

function entriesOf(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value.slice(0, MAX_ENTRIES) : [];
}

function collectSpells(
  value: unknown,
  prefix: string,
  catalogue: Catalogue,
  own: ReadonlySet<string>,
  taken: Set<string>,
  issues: PackIssue[],
): readonly Spell[] {
  const kept: Spell[] = [];
  for (const [index, entry] of entriesOf(value).entries()) {
    const spell = parseSpell(entry, index + 1, prefix, catalogue, own, issues);
    if (spell !== null && isFreeId(spell.id, index + 1, 'spell', taken, issues)) {
      kept.push(spell);
    }
  }
  return kept;
}

function collectSubclasses(
  value: unknown,
  prefix: string,
  catalogue: Catalogue,
  own: ReadonlySet<string>,
  taken: Set<string>,
  issues: PackIssue[],
): readonly GraftedSubclass[] {
  const kept: GraftedSubclass[] = [];
  for (const [index, entry] of entriesOf(value).entries()) {
    const grafted = parseSubclass(entry, index + 1, prefix, catalogue, own, issues);
    if (
      grafted !== null &&
      isFreeId(grafted.subclass.id, index + 1, 'subclass', taken, issues)
    ) {
      kept.push(grafted);
    }
  }
  return kept;
}

function collectRaces(
  value: unknown,
  prefix: string,
  catalogue: Catalogue,
  taken: Set<string>,
  issues: PackIssue[],
): readonly Race[] {
  const kept: Race[] = [];
  for (const [index, entry] of entriesOf(value).entries()) {
    const parsed = parseRace(entry, index + 1, prefix, catalogue);
    issues.push(...parsed.issues);
    const { race } = parsed;
    if (race === null) continue;
    if (!isFreeId(race.id, index + 1, 'race', taken, issues)) continue;
    // Une branche partage le jeu d'identifiants du reste : son créneau porte
    // son propre identifiant, `race:karn-brumeux-des-marais:origin-1`.
    const clash = race.subraces.find(
      (subrace) => !isFreeId(subrace.id, index + 1, 'subrace', taken, issues),
    );
    if (clash === undefined) {
      kept.push(race);
    }
  }
  return kept;
}

function collectBackgrounds(
  value: unknown,
  prefix: string,
  catalogue: Catalogue,
  taken: Set<string>,
  issues: PackIssue[],
): readonly Background[] {
  const kept: Background[] = [];
  for (const [index, entry] of entriesOf(value).entries()) {
    const parsed = parseBackground(entry, index + 1, prefix, catalogue);
    issues.push(...parsed.issues);
    const { background } = parsed;
    if (
      background !== null &&
      isFreeId(background.id, index + 1, 'background', taken, issues)
    ) {
      kept.push(background);
    }
  }
  return kept;
}

function collectClasses(
  value: unknown,
  prefix: string,
  catalogue: Catalogue,
  taken: Set<string>,
  issues: PackIssue[],
): readonly PackClass[] {
  const kept: PackClass[] = [];
  for (const [index, raw] of entriesOf(value).entries()) {
    const parsed = parseClass(raw, index + 1, prefix, catalogue);
    issues.push(...parsed.issues);
    const { entry } = parsed;
    if (entry !== null && isFreeId(entry.base.id, index + 1, 'class', taken, issues)) {
      kept.push(entry);
    }
  }
  return kept;
}

/**
 * La seule porte par laquelle un contenu venu d'un fichier entre dans
 * l'application. Elle sert deux fois : à l'import, où elle refuse, et dans le
 * formulaire du créateur, où elle pointe les champs à remplir. Deux
 * vérifications finiraient par diverger.
 *
 * Le refus est net et sans réparation : on ne doit rien à qui écrit son JSON à
 * la main. Un champ facultatif absent, en revanche, n'est pas une faute.
 */
export function parsePack(value: unknown, catalogue: Catalogue): PackParse {
  if (!isRecord(value)) {
    return { kind: 'invalid', issues: [{ kind: 'not-a-pack' }] };
  }
  const issues: PackIssue[] = [];
  const info = parseInfo(value.pack, issues);
  if (info === null) {
    return { kind: 'invalid', issues };
  }

  const prefix = prefixOf(info.id);
  // Un seul jeu d'identifiants pour tout le pack : un sort et une sous-classe
  // ne peuvent pas porter le même nom, sinon la provenance devient ambiguë.
  const taken = new Set<string>();
  // Les classes d'abord : un sort et une voie du même pack ont le droit de les
  // nommer, et il faut donc savoir lesquelles existent avant de les relire.
  const classes = collectClasses(value.classes, prefix, catalogue, taken, issues);
  const own = new Set(classes.map((entry) => entry.base.id));
  const spells = collectSpells(value.spells, prefix, catalogue, own, taken, issues);
  const subclasses = collectSubclasses(
    value.subclasses,
    prefix,
    catalogue,
    own,
    taken,
    issues,
  );
  const races = collectRaces(value.races, prefix, catalogue, taken, issues);
  const backgrounds = collectBackgrounds(
    value.backgrounds,
    prefix,
    catalogue,
    taken,
    issues,
  );

  return issues.length > 0
    ? { kind: 'invalid', issues }
    : { kind: 'ok', pack: { info, spells, subclasses, races, backgrounds, classes } };
}
