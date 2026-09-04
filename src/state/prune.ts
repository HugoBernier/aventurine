import { findBackground, findClass, findRace } from '../domain/catalogue';
import type { Catalogue } from '../domain/catalogue';
import { parseSlotId } from '../domain/choice';
import type { ChoiceSlot, ChoiceSlotId } from '../domain/choice';
import type { CharacterDraft } from '../domain/draft';
import { openChoices } from '../domain/openChoices';

export interface RemovedChoice {
  readonly slotId: ChoiceSlotId;
  readonly optionIds: readonly string[];
  readonly reason: 'slot-closed' | 'option-withdrawn' | 'too-many';
}

export interface PruneResult {
  readonly draft: CharacterDraft;
  readonly removed: readonly RemovedChoice[];
}

/** Une suppression ne fait qu'élargir la disponibilité : deux passes suffisent. */
const MAX_PASSES = 3;

/**
 * Le parent d'un créneau existe-t-il encore dans le catalogue ?
 *
 * Deux fermetures se ressemblent et n'ont rien à voir : le joueur a changé de
 * classe, ou le contenu a disparu de l'appareil. Seule cette question les
 * distingue, et elle décide si l'on efface ou si l'on attend.
 */
function isParentKnown(slotId: ChoiceSlotId, catalogue: Catalogue): boolean {
  const parsed = parseSlotId(slotId);
  if (parsed === null) {
    return false;
  }
  const { source, parentId } = parsed;
  switch (source) {
    case 'race': {
      return (
        findRace(catalogue, parentId) !== null ||
        catalogue.races.some((race) =>
          race.subraces.some((subrace) => subrace.id === parentId),
        )
      );
    }
    case 'class': {
      return findClass(catalogue, parentId) !== null;
    }
    case 'background': {
      return findBackground(catalogue, parentId) !== null;
    }
  }
}

/**
 * L'option nomme-t-elle encore un contenu que le catalogue connaît ?
 *
 * C'est la troisième ligne de la règle : un créneau peut rester grand ouvert
 * pendant que l'option, elle, s'en va — un sort venu d'un pack se choisit dans
 * le créneau du magicien du SRD. Sans cette question, désinstaller un pack
 * effacerait la réponse au lieu de l'endormir.
 *
 * Les autres genres d'options sont énumérés dans le contenu SRD lui-même
 * (`spec.from`) : leur liste ne perd rien quand un pack s'en va, donc une
 * absence y est toujours un retrait légitime.
 */
function isOptionKnown(
  slot: ChoiceSlot,
  optionId: string,
  catalogue: Catalogue,
): boolean {
  if (slot.options.some((option) => option.id === optionId)) {
    return true;
  }
  return slot.kind === 'spell' || slot.kind === 'cantrip'
    ? catalogue.spells.some((spell) => spell.id === optionId)
    : true;
}

function prunePass(draft: CharacterDraft, catalogue: Catalogue): PruneResult {
  const slots = new Map(openChoices(draft, catalogue).map((slot) => [slot.id, slot]));
  const kept: Record<ChoiceSlotId, readonly string[]> = {};
  const removed: RemovedChoice[] = [];

  for (const [slotId, picked] of Object.entries(draft.choices)) {
    const slot = slots.get(slotId);
    if (slot === undefined) {
      // Le contenu manque : on ne sait pas ce que ces réponses valent, donc on
      // n'y touche pas. Elles dorment, invisibles, et le jour où le contenu
      // revient la fiche redevient exactement ce qu'elle était.
      if (!isParentKnown(slotId, catalogue)) {
        kept[slotId] = picked;
        continue;
      }
      removed.push({ slotId, optionIds: picked, reason: 'slot-closed' });
      continue;
    }
    // On garde ce que le créneau offre encore, ET ce qu'il n'offre plus faute
    // du contenu qui le portait : la seconde catégorie dort, elle ne meurt pas.
    const isKept = (optionId: string): boolean =>
      slot.options.some(
        (option) => option.id === optionId && option.unavailable === null,
      ) || !isOptionKnown(slot, optionId, catalogue);
    const survivors = picked.filter((optionId) => isKept(optionId));
    const withdrawn = picked.filter((optionId) => !isKept(optionId));
    if (withdrawn.length > 0) {
      removed.push({ slotId, optionIds: withdrawn, reason: 'option-withdrawn' });
    }
    // Le niveau peut redescendre, et le nombre de sorts connus avec lui : on ne
    // garde jamais plus de réponses que le créneau n'en attend.
    const excess = survivors.slice(slot.pick);
    if (excess.length > 0) {
      removed.push({ slotId, optionIds: excess, reason: 'too-many' });
    }
    const remaining = survivors.slice(0, slot.pick);
    if (remaining.length > 0) {
      kept[slotId] = remaining;
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
