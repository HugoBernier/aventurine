import type { Catalogue } from '../domain/catalogue';
import type { ChoiceSlotId } from '../domain/choice';
import type { CharacterDraft } from '../domain/draft';
import { openChoices } from '../domain/openChoices';

export interface RemovedChoice {
  readonly slotId: ChoiceSlotId;
  readonly optionIds: readonly string[];
  readonly reason: 'slot-closed' | 'option-withdrawn';
}

export interface PruneResult {
  readonly draft: CharacterDraft;
  readonly removed: readonly RemovedChoice[];
}

/** Une suppression ne fait qu'élargir la disponibilité : deux passes suffisent. */
const MAX_PASSES = 3;

function prunePass(draft: CharacterDraft, catalogue: Catalogue): PruneResult {
  const slots = new Map(openChoices(draft, catalogue).map((slot) => [slot.id, slot]));
  const kept: Record<ChoiceSlotId, readonly string[]> = {};
  const removed: RemovedChoice[] = [];

  for (const [slotId, picked] of Object.entries(draft.choices)) {
    const slot = slots.get(slotId);
    if (slot === undefined) {
      removed.push({ slotId, optionIds: picked, reason: 'slot-closed' });
      continue;
    }
    const survivors = picked.filter((optionId) =>
      slot.options.some(
        (option) => option.id === optionId && option.unavailable === null,
      ),
    );
    const withdrawn = picked.filter((optionId) => !survivors.includes(optionId));
    if (withdrawn.length > 0) {
      removed.push({ slotId, optionIds: withdrawn, reason: 'option-withdrawn' });
    }
    if (survivors.length > 0) {
      kept[slotId] = survivors;
    }
  }

  return {
    draft: removed.length === 0 ? draft : { ...draft, choices: kept },
    removed,
  };
}

/**
 * Retire ce qui est devenu caduc, à point fixe.
 *
 * Toute la cascade tient dans deux mécanismes déjà nécessaires par ailleurs :
 * l'identifiant de créneau porte la décision parente (§A3), donc changer de
 * classe ferme les créneaux de l'ancienne ; et une option retirée de la liste
 * d'un créneau encore ouvert disparaît des réponses. Aucune ligne par catégorie.
 */
export function pruneChoices(draft: CharacterDraft, catalogue: Catalogue): PruneResult {
  let current = draft;
  const removed: RemovedChoice[] = [];

  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    const result = prunePass(current, catalogue);
    if (result.removed.length === 0) {
      break;
    }
    current = result.draft;
    removed.push(...result.removed);
  }

  return { draft: current, removed };
}
