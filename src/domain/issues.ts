import { ABILITIES } from './abilities';
import type { AbilityId } from './abilities';
import type { Catalogue } from './catalogue';
import { listMissingChoices } from './completeness';
import type { IssueTarget, MissingKind } from './completeness';
import { pickedFor } from './draft';
import type { CharacterDraft } from './draft';
import { openChoices } from './openChoices';
import {
  POINT_BUY_BUDGET,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  isStandardArrayAssignment,
  pointsSpent,
} from './pointBuy';

export type IssueSeverity = 'incomplete' | 'invalid';

/** Structuré, jamais rédigé : `ui/format/` compose la phrase française. */
export type IssueReason =
  | { readonly kind: 'missing'; readonly what: MissingKind; readonly remaining: number }
  | { readonly kind: 'over-budget'; readonly spent: number; readonly budget: number }
  | {
      readonly kind: 'score-out-of-range';
      readonly ability: AbilityId;
      readonly score: number;
    }
  | { readonly kind: 'invalid-standard-array' }
  | { readonly kind: 'too-many-choices'; readonly extra: number };

export interface Issue {
  readonly severity: IssueSeverity;
  readonly target: IssueTarget;
  readonly reason: IssueReason;
}

const ABILITIES_FIELD: IssueTarget = { kind: 'field', field: 'baseAbilities' };

function pointBuyIssues(draft: CharacterDraft): readonly Issue[] {
  if (draft.abilityMethod !== 'point-buy') {
    return [];
  }
  const outOfRange = ABILITIES.filter((ability) => {
    const score = draft.baseAbilities[ability];
    return score < POINT_BUY_MIN || score > POINT_BUY_MAX;
  }).map((ability): Issue => ({
    severity: 'invalid',
    target: ABILITIES_FIELD,
    reason: {
      kind: 'score-out-of-range',
      ability,
      score: draft.baseAbilities[ability],
    },
  }));

  const spent = pointsSpent(draft.baseAbilities);
  const overBudget: readonly Issue[] =
    spent > POINT_BUY_BUDGET
      ? [
          {
            severity: 'invalid',
            target: ABILITIES_FIELD,
            reason: { kind: 'over-budget', spent, budget: POINT_BUY_BUDGET },
          },
        ]
      : [];

  return [...outOfRange, ...overBudget];
}

function standardArrayIssues(draft: CharacterDraft): readonly Issue[] {
  if (
    draft.abilityMethod !== 'standard-array' ||
    isStandardArrayAssignment(draft.baseAbilities)
  ) {
    return [];
  }
  return [
    {
      severity: 'invalid',
      target: ABILITIES_FIELD,
      reason: { kind: 'invalid-standard-array' },
    },
  ];
}

/**
 * Un créneau qui porte plus de réponses qu'il n'accepte. Inatteignable par un
 * geste (le reducer refuse), mais atteignable en relisant une sauvegarde
 * ancienne ou modifiée à la main. On préfère rendre l'invalide irreprésentable
 * plutôt que le détecter ; le niveau existe parce qu'une sauvegarde n'est pas
 * une entrée de confiance.
 */
function overfilledSlots(draft: CharacterDraft, catalogue: Catalogue): readonly Issue[] {
  return openChoices(draft, catalogue).flatMap((slot): readonly Issue[] => {
    const extra = pickedFor(draft, slot.id).length - slot.pick;
    return extra > 0
      ? [
          {
            severity: 'invalid',
            target: { kind: 'slot', slotId: slot.id },
            reason: { kind: 'too-many-choices', extra },
          },
        ]
      : [];
  });
}

/**
 * Les anomalies du brouillon, incomplet ou invalide.
 *
 * La branche « incomplet » enveloppe `listMissingChoices` sans la recalculer :
 * deux fonctions qui calculent la même chose finissent par diverger.
 */
export function draftIssues(
  draft: CharacterDraft,
  catalogue: Catalogue,
): readonly Issue[] {
  const incomplete: readonly Issue[] = listMissingChoices(draft, catalogue).map(
    (missing): Issue => ({
      severity: 'incomplete',
      target: missing.target,
      reason: {
        kind: 'missing',
        what: missing.kind,
        remaining: missing.remaining,
      },
    }),
  );

  return [
    ...incomplete,
    ...pointBuyIssues(draft),
    ...standardArrayIssues(draft),
    ...overfilledSlots(draft, catalogue),
  ];
}
