import { abilityScores } from './abilities';
import { isWellFormedSlotId } from './choice';
import { emptyDraft } from './draft';
import type { AbilityMethod, CharacterDraft, PersonalTraits } from './draft';

/**
 * Bornes à l'entrée. Un dictionnaire de créneaux a des clés NON bornées, là où
 * des tableaux par catégorie l'étaient par construction : c'est le seul coût de
 * la forme retenue (§A25), et il se paie en une dizaine de lignes.
 */
const MAX_SLOTS = 64;
const MAX_PICKS_PER_SLOT = 12;
const MAX_NAME = 60;
const MAX_TRAIT = 300;
const MIN_SCORE = 1;
const MAX_SCORE = 20;

export type DraftWarning =
  | { readonly kind: 'unknown-slot'; readonly slotId: string }
  | { readonly kind: 'value-truncated'; readonly field: string };

export interface ParsedDraft {
  readonly draft: CharacterDraft;
  readonly warnings: readonly DraftWarning[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, max: number): string | null {
  return typeof value === 'string' ? value.slice(0, max) : null;
}

function asNullableId(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 && value.length <= 64
    ? value
    : null;
}

function asMethod(value: unknown): AbilityMethod {
  return value === 'standard-array' ? 'standard-array' : 'point-buy';
}

function asScores(value: unknown): CharacterDraft['baseAbilities'] {
  const source = isRecord(value) ? value : {};
  return abilityScores((ability) => {
    const score = source[ability];
    if (typeof score !== 'number' || !Number.isSafeInteger(score)) {
      return 8;
    }
    return Math.min(Math.max(score, MIN_SCORE), MAX_SCORE);
  });
}

function asTraits(value: unknown): PersonalTraits {
  const source = isRecord(value) ? value : {};
  return {
    trait: asString(source.trait, MAX_TRAIT) ?? '',
    ideal: asString(source.ideal, MAX_TRAIT) ?? '',
    bond: asString(source.bond, MAX_TRAIT) ?? '',
    flaw: asString(source.flaw, MAX_TRAIT) ?? '',
  };
}

function asChoices(value: unknown): {
  readonly choices: Record<string, readonly string[]>;
  readonly warnings: readonly DraftWarning[];
} {
  const choices: Record<string, readonly string[]> = {};
  const warnings: DraftWarning[] = [];
  if (!isRecord(value)) {
    return { choices, warnings };
  }
  for (const [slotId, picked] of Object.entries(value).slice(0, MAX_SLOTS)) {
    if (!isWellFormedSlotId(slotId)) {
      warnings.push({ kind: 'unknown-slot', slotId });
      continue;
    }
    if (!Array.isArray(picked)) {
      continue;
    }
    const ids = picked
      .filter((entry): entry is string => typeof entry === 'string')
      .slice(0, MAX_PICKS_PER_SLOT);
    if (ids.length > 0) {
      choices[slotId] = ids;
    }
  }
  return { choices, warnings };
}

/**
 * Reconstruit un brouillon champ par champ depuis une valeur non fiable —
 * `localStorage` ou un fichier importé.
 *
 * Jamais de `spread` ni d'`Object.assign` : les champs inconnus sont ignorés
 * silencieusement, et une clé `__proto__` n'atteint jamais l'état.
 */
export function parseDraft(value: unknown): ParsedDraft | null {
  if (!isRecord(value)) {
    return null;
  }
  const name = asString(value.name, MAX_NAME) ?? '';
  const { choices, warnings } = asChoices(value.choices);
  const truncated: readonly DraftWarning[] =
    typeof value.name === 'string' && value.name.length > MAX_NAME
      ? [{ kind: 'value-truncated', field: 'name' }]
      : [];

  return {
    draft: {
      ...emptyDraft(),
      name,
      raceId: asNullableId(value.raceId),
      subraceId: asNullableId(value.subraceId),
      classId: asNullableId(value.classId),
      backgroundId: asNullableId(value.backgroundId),
      alignmentId: asNullableId(value.alignmentId),
      abilityMethod: asMethod(value.abilityMethod),
      baseAbilities: asScores(value.baseAbilities),
      choices,
      personalTraits: asTraits(value.personalTraits),
    },
    warnings: [...warnings, ...truncated],
  };
}
