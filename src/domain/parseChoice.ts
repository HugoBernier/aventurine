import { ABILITIES } from './abilities';
import type { AbilityId } from './abilities';
import { findLanguage, findTool } from './catalogue';
import type { Catalogue } from './catalogue';
import { byLevel } from './choiceSpec';
import type { AbilitySpec, ChoiceSpec, SpellCount } from './choiceSpec';
import { ALL_SKILLS } from './skills';
import {
  MAX_ID,
  MAX_LINE,
  MAX_TEXT,
  count,
  isRecord,
  strings,
  text,
} from './parseValues';
import type { SkillId } from './skills';

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

/**
 * Les genres qu'une CLASSE peut ouvrir. `equipment` n'y est pas : ses options
 * sont les lots de départ de la classe elle-même, donc il se relit là où on les
 * connaît (`parseClass`), pas ici.
 */
export const CLASS_CHOICE_KINDS = new Set<string>([
  'skill',
  'language',
  'tool',
  'cantrip',
  'spell',
  'fighting-style',
  'expertise',
]);

const SKILL_IDS: readonly string[] = ALL_SKILLS;

function isSkillId(id: string): id is SkillId {
  return SKILL_IDS.includes(id);
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
 * Les trois genres qui listent des identifiants du catalogue. Une liste vidée
 * de ses références mortes et devenue vide n'est plus un choix : on refuse.
 */
function listedSpec(
  kind: 'skill' | 'language' | 'tool',
  value: Record<string, unknown>,
  base: { subject: string; title: string; help: string; pick: number },
  catalogue: Catalogue,
): ChoiceSpec | null {
  if (kind === 'skill') {
    const from = strings(value.from).filter(isSkillId);
    return from.length === 0 ? null : { ...base, kind, from };
  }
  const exists =
    kind === 'language'
      ? (id: string): boolean => findLanguage(catalogue, id) !== null
      : (id: string): boolean => findTool(catalogue, id) !== null;
  const from = strings(value.from).filter((id) => exists(id));
  return from.length === 0 ? null : { ...base, kind, from };
}

/** Un palier de table : « à partir du niveau 4, tu en connais trois ». */
function spellStep(
  level: string,
  howMany: unknown,
): { readonly at: number; readonly many: number } | null {
  const at = count(Number(level), 20, 1);
  const many = count(howMany, 40);
  return at === null || many === null ? null : { at, many };
}

/**
 * D'où vient le nombre de sorts : d'une table qui monte avec le niveau, ou du
 * calcul « caractéristique + niveau » que le clerc et le druide emploient.
 *
 * La table s'écrit en paliers — « à partir du 1, tu en connais 2 ; à partir du
 * 4, trois » — parce que vingt nombres à la main sont vingt occasions de se
 * tromper, et parce que c'est ainsi que le SRD la présente.
 */
function spellCount(value: unknown): SpellCount | null {
  if (!isRecord(value)) return null;
  if (value.kind === 'prepared') return { kind: 'prepared' };
  if (value.kind !== 'known' || !isRecord(value.steps)) return null;
  const steps: Record<number, number> = {};
  for (const [level, howMany] of Object.entries(value.steps)) {
    const step = spellStep(level, howMany);
    if (step === null) return null;
    steps[step.at] = step.many;
  }
  return Object.keys(steps).length === 0
    ? null
    : { kind: 'known', byLevel: byLevel(steps) };
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
    case 'skill':
    case 'language':
    case 'tool': {
      return listedSpec(kind, value, base, catalogue);
    }
    case 'ability': {
      return abilitySpec(value, base);
    }
    case 'fighting-style': {
      const level = count(value.level, 20, 1) ?? 1;
      const from = strings(value.from).filter((id) =>
        catalogue.fightingStyles.some((style) => style.id === id),
      );
      return from.length === 0 ? null : { ...base, kind: 'fighting-style', level, from };
    }
    case 'expertise': {
      // Les options se calculent à l'exécution : ce sont les compétences déjà
      // acquises. La spec ne porte que les outils qu'on peut y ajouter.
      return {
        ...base,
        kind: 'expertise',
        tools: strings(value.tools).filter((id) => findTool(catalogue, id) !== null),
      };
    }
    case 'spell': {
      const listFrom = text(value.listFrom, MAX_ID);
      const known = spellCount(value.count);
      return listFrom === null || known === null
        ? null
        : { subject, title, help, kind: 'spell', listFrom, count: known };
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
