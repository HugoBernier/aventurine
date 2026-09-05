import { ABILITIES } from './abilities';
import type { AbilityId } from './abilities';
import { findLanguage, findTool } from './catalogue';
import type { Catalogue } from './catalogue';
import { byLevel } from './choiceSpec';
import type { AbilitySpec, ChoiceSpec } from './choiceSpec';
import { ALL_SKILLS } from './skills';
import type { SkillId } from './skills';

const MAX_ID = 64;
const MAX_LINE = 120;
const MAX_TEXT = 600;
const MAX_LIST = 40;

/** Les genres qu'un PEUPLE peut ouvrir. */
export const RACE_CHOICE_KINDS = new Set<string>([
  'skill',
  'language',
  'tool',
  'ability',
  'cantrip',
  'ancestry',
]);

/**
 * Les genres qu'un HISTORIQUE peut ouvrir. La règle générique du SRD lui donne
 * « deux outils ou langues » : ni bonus d'origine, ni magie, ni ascendance.
 */
export const BACKGROUND_CHOICE_KINDS = new Set<string>(['skill', 'language', 'tool']);

const SKILL_IDS: readonly string[] = ALL_SKILLS;

function isSkillId(id: string): id is SkillId {
  return SKILL_IDS.includes(id);
}

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

function strings(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value
        .slice(0, MAX_LIST)
        .filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function count(value: unknown, max: number): number | null {
  return typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= max
    ? value
    : null;
}

function abilitySpec(
  value: Record<string, unknown>,
  base: { subject: string; title: string; help: string; pick: number },
): AbilitySpec | null {
  const bonus = count(value.bonus, 2);
  if (bonus === null || bonus === 0) {
    return null;
  }
  const abilities: readonly string[] = ABILITIES;
  const from = strings(value.from).filter((id): id is AbilityId =>
    abilities.includes(id),
  );
  return { ...base, kind: 'ability', bonus, from: from.length === 0 ? ABILITIES : from };
}

/**
 * Un choix ouvert par un peuple ou un historique. Le `subject` est ce qui donne son identifiant
 * au créneau — `race:karn-brumeux:skills` — donc il est validé comme un
 * identifiant, sans quoi l'analyse d'un créneau casserait plus loin.
 */
export function parseChoiceSpec(
  value: unknown,
  catalogue: Catalogue,
  allowed: ReadonlySet<string>,
): ChoiceSpec | null {
  if (!isRecord(value)) return null;
  const kind = text(value.kind, MAX_ID);
  if (kind === null || !allowed.has(kind)) return null;
  const subject = text(value.subject, MAX_ID);
  if (subject === null || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(subject)) return null;
  const title = text(value.title, MAX_LINE);
  const help = text(value.help, MAX_TEXT);
  if (title === null || help === null) return null;
  const pick = count(value.pick, 6) ?? 1;
  const base = { subject, title, help, pick: Math.max(pick, 1) };

  switch (kind) {
    case 'skill': {
      const from = strings(value.from).filter(isSkillId);
      return from.length === 0 ? null : { ...base, kind: 'skill', from };
    }
    case 'language': {
      const from = strings(value.from).filter(
        (id) => findLanguage(catalogue, id) !== null,
      );
      return from.length === 0 ? null : { ...base, kind: 'language', from };
    }
    case 'tool': {
      const from = strings(value.from).filter((id) => findTool(catalogue, id) !== null);
      return from.length === 0 ? null : { ...base, kind: 'tool', from };
    }
    case 'ability': {
      return abilitySpec(value, base);
    }
    case 'cantrip': {
      // Un peuple qui donne un tour de magie en donne UN, dès le niveau 1 :
      // c'est le seul cas du SRD, et une table libre ici n'aurait pas de sens.
      const listFrom = text(value.listFrom, MAX_ID);
      return listFrom === null
        ? null
        : {
            subject,
            title,
            help,
            kind: 'cantrip',
            listFrom,
            count: { kind: 'known', byLevel: byLevel({ 1: 1 }) },
          };
    }
    default: {
      return { ...base, kind: 'ancestry' };
    }
  }
}
