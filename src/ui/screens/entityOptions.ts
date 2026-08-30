import type { ChoiceOption } from '../../domain/choice';
import type { Facts } from '../../domain/content';

interface Comparable {
  readonly id: string;
  readonly name: string;
  readonly blurb: string;
  readonly facts: Facts;
}

/** Race, classe, historique et alignement se choisissent tous de la même façon. */
export function entityOptions(entries: readonly Comparable[]): readonly ChoiceOption[] {
  return entries.map((entry) => ({
    id: entry.id,
    label: entry.name,
    blurb: entry.blurb,
    facts: entry.facts,
    details: [],
    unavailable: null,
  }));
}
