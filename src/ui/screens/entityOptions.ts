import type { ChoiceDetail, ChoiceOption } from '../../domain/choice';
import type { Facts } from '../../domain/content';

interface Comparable {
  readonly id: string;
  readonly name: string;
  readonly blurb: string;
  readonly facts: Facts;
}

/**
 * Race, classe, historique et alignement se choisissent tous de la même façon.
 *
 * `describe` reste facultatif : une entrée sans fiche rend `details` vide, et
 * la carte n'affiche alors aucun dépliant.
 */
export function entityOptions<T extends Comparable>(
  entries: readonly T[],
  describe?: (entry: T) => readonly ChoiceDetail[],
): readonly ChoiceOption[] {
  return entries.map((entry) => ({
    id: entry.id,
    label: entry.name,
    blurb: entry.blurb,
    facts: entry.facts,
    details: describe?.(entry) ?? [],
    unavailable: null,
  }));
}
