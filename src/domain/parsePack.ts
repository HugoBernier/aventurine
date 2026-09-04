import { findClass } from './catalogue';
import type { Catalogue } from './catalogue';
import { prefixOf } from './pack';
import type { PackInfo, PackIssue, PackParse } from './pack';
import type { MagicSchool, Spell, SpellLevel } from './content';

const MAX_ID = 64;
const MAX_NAME = 60;
const MAX_LINE = 120;
const MAX_TEXT = 600;
const MAX_ENTRIES = 500;
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

/** Minuscules, chiffres et tirets : le même jeu que les identifiants du SRD. */
const ID_SHAPE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === '' || trimmed.length > max ? null : trimmed;
}

/** Facultatif : absent et vide sont la même chose, et ne sont pas une faute. */
function optionalText(value: unknown, max: number): string {
  return text(value, max) ?? '';
}

function isSchool(value: unknown): value is MagicSchool {
  return typeof value === 'string' && SCHOOLS.has(value);
}

function isSpellLevel(value: unknown): value is SpellLevel {
  return (
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 9
  );
}

/** De quoi nommer l'entrée fautive sans écrire de phrase : son identifiant, à
 *  défaut son nom, à défaut rien — l'appelant a le rang. */
function labelOf(value: unknown): string {
  if (!isRecord(value)) {
    return '';
  }
  return text(value.id, MAX_ID) ?? text(value.name, MAX_NAME) ?? '';
}

function parseSpell(
  value: unknown,
  at: number,
  prefix: string,
  catalogue: Catalogue,
  issues: PackIssue[],
): Spell | null {
  const entry = labelOf(value);
  const miss = (field: string): null => {
    issues.push({ kind: 'missing-field', at, entry, field });
    return null;
  };
  if (!isRecord(value)) {
    return miss('sort');
  }

  const id = text(value.id, MAX_ID);
  if (id === null || !ID_SHAPE.test(id)) return miss('id');
  if (!id.startsWith(prefix)) {
    issues.push({ kind: 'bad-prefix', at, entry });
    return null;
  }
  const name = text(value.name, MAX_NAME);
  if (name === null) return miss('name');
  if (!isSpellLevel(value.level)) return miss('level');
  if (!isSchool(value.school)) return miss('school');
  const summary = text(value.summary, MAX_TEXT);
  if (summary === null) return miss('summary');

  const components = isRecord(value.components) ? value.components : {};
  const classes = Array.isArray(value.classes) ? value.classes : [];
  const known: string[] = [];
  for (const classId of classes.slice(0, MAX_CLASSES_PER_SPELL)) {
    if (typeof classId !== 'string') continue;
    // Une référence sort du pack, une définition non : un sort maison peut
    // rejoindre la liste du magicien, il ne peut pas inventer une classe.
    if (findClass(catalogue, classId) === null) {
      issues.push({ kind: 'unknown-class', at, entry, value: classId });
      continue;
    }
    known.push(classId);
  }
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

  // Les genres que cette version ne lit pas encore : les taire les perdrait
  // en silence à la réexportation, ce qui est pire que de refuser le fichier.
  for (const section of ['races', 'classes', 'backgrounds']) {
    const entries = value[section];
    if (Array.isArray(entries) && entries.length > 0) {
      issues.push({ kind: 'not-yet-supported', section });
    }
  }

  const prefix = prefixOf(info.id);
  const raw = Array.isArray(value.spells) ? value.spells.slice(0, MAX_ENTRIES) : [];
  const spells: Spell[] = [];
  for (const [index, entry] of raw.entries()) {
    const spell = parseSpell(entry, index + 1, prefix, catalogue, issues);
    if (spell === null) {
      continue;
    }
    if (spells.some((kept) => kept.id === spell.id)) {
      issues.push({ kind: 'duplicate-id', at: index + 1, entry: spell.id });
      continue;
    }
    spells.push(spell);
  }

  return issues.length > 0
    ? { kind: 'invalid', issues }
    : { kind: 'ok', pack: { info, spells } };
}
