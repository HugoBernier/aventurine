import { findRace } from './catalogue';
import type { Catalogue } from './catalogue';
import type { ChoiceKind, ChoiceSlotId } from './choice';
import { pickedFor } from './draft';
import type { CharacterDraft, PersonalTraits } from './draft';
import { openChoices } from './openChoices';
import { isStandardArrayAssignment, pointsRemaining } from './pointBuy';

/** Ce que désigne une anomalie : un créneau de choix, ou un champ du brouillon. */
export type IssueTarget =
  | { readonly kind: 'slot'; readonly slotId: ChoiceSlotId }
  | { readonly kind: 'field'; readonly field: string };

export type MissingKind =
  | ChoiceKind
  | 'race'
  | 'subrace'
  | 'class'
  | 'background'
  | 'alignment'
  | 'name'
  | 'abilities'
  | 'personality';

export interface MissingChoice {
  readonly kind: MissingKind;
  /** Toujours au moins 1 : on ne signale pas un manque de zéro. */
  readonly remaining: number;
  readonly target: IssueTarget;
}

const field = (name: string): IssueTarget => ({ kind: 'field', field: name });

function missingDecision(
  value: string | null,
  kind: MissingKind,
  fieldName: string,
): readonly MissingChoice[] {
  return value === null ? [{ kind, remaining: 1, target: field(fieldName) }] : [];
}

function missingSubrace(
  draft: CharacterDraft,
  catalogue: Catalogue,
): readonly MissingChoice[] {
  const race = findRace(catalogue, draft.raceId);
  if (race === null || race.subraces.length === 0 || draft.subraceId !== null) {
    return [];
  }
  return [{ kind: 'subrace', remaining: 1, target: field('subraceId') }];
}

function missingAbilities(draft: CharacterDraft): readonly MissingChoice[] {
  if (draft.abilityMethod === 'standard-array') {
    return isStandardArrayAssignment(draft.baseAbilities)
      ? []
      : [{ kind: 'abilities', remaining: 1, target: field('baseAbilities') }];
  }
  const remaining = pointsRemaining(draft.baseAbilities);
  return remaining > 0
    ? [{ kind: 'abilities', remaining, target: field('baseAbilities') }]
    : [];
}

function missingPersonalTraits(draft: CharacterDraft): readonly MissingChoice[] {
  const fields: readonly (keyof PersonalTraits)[] = ['trait', 'ideal', 'bond', 'flaw'];
  const empty = fields.filter((name) => draft.personalTraits[name].trim() === '');
  return empty.length === 0
    ? []
    : [{ kind: 'personality', remaining: empty.length, target: field('personalTraits') }];
}

/**
 * Tout ce qu'il reste à décider, dans l'ordre du parcours. Source unique :
 * `draftIssues` enveloppe ce résultat pour sa branche « incomplet » plutôt que
 * de le recalculer (docs/plans/00-arbitrage.md §A24).
 *
 * Ne rédige aucune phrase : `ui/format/` compose le français.
 */
export function listMissingChoices(
  draft: CharacterDraft,
  catalogue: Catalogue,
): readonly MissingChoice[] {
  const slots = openChoices(draft, catalogue).flatMap(
    (slot): readonly MissingChoice[] => {
      const remaining = slot.pick - pickedFor(draft, slot.id).length;
      return remaining > 0
        ? [{ kind: slot.kind, remaining, target: { kind: 'slot', slotId: slot.id } }]
        : [];
    },
  );

  return [
    ...missingDecision(draft.raceId, 'race', 'raceId'),
    ...missingSubrace(draft, catalogue),
    ...missingDecision(draft.classId, 'class', 'classId'),
    ...missingAbilities(draft),
    ...missingDecision(draft.backgroundId, 'background', 'backgroundId'),
    ...slots,
    ...(draft.name.trim() === ''
      ? [{ kind: 'name' as const, remaining: 1, target: field('name') }]
      : []),
    ...missingDecision(draft.alignmentId, 'alignment', 'alignmentId'),
    ...missingPersonalTraits(draft),
  ];
}

export function isComplete(draft: CharacterDraft, catalogue: Catalogue): boolean {
  return listMissingChoices(draft, catalogue).length === 0;
}
