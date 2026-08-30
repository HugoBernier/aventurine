import { ABILITIES, abilityScores } from './abilities';
import type { AbilityScores } from './abilities';
import type { ChoiceSlotId } from './choice';
import { MIN_LEVEL } from './progression';

/** Les jets 4d6 sont hors périmètre v1 (docs/plans/00-arbitrage.md §B1). */
export type AbilityMethod = 'point-buy' | 'standard-array';

/** Moyenne fixe, ou le dé que le joueur a lancé à sa table et saisi ici. */
export type HitPointMethod = 'average' | 'rolled';

export interface PersonalTraits {
  readonly trait: string;
  readonly ideal: string;
  readonly bond: string;
  readonly flaw: string;
}

/**
 * Ce que le joueur a tapé ou touché, et rien d'autre.
 *
 * Aucune valeur dérivable n'y figure : points de vie, classe d'armure, bonus
 * de maîtrise, modificateurs et caractéristiques finales se recalculent tous
 * depuis `buildSheet`. Une valeur calculable stockée serait une seconde source
 * de vérité, donc une divergence à venir.
 *
 * Tout est JSON pur : ni `Map`, ni `Set`, ni `Date`, ni instance de classe.
 * C'est cette propriété, et elle seule, qui fait marcher `localStorage` et
 * l'import/export sans une ligne de sérialisation.
 */
export interface CharacterDraft {
  readonly name: string;
  /** De 1 à 20. Tout le reste en découle : maîtrise, points de vie, emplacements. */
  readonly level: number;
  readonly raceId: string | null;
  readonly subraceId: string | null;
  readonly classId: string | null;
  readonly backgroundId: string | null;
  readonly alignmentId: string | null;
  readonly abilityMethod: AbilityMethod;
  readonly hitPointMethod: HitPointMethod;
  /** Niveau (en clé) vers le dé lancé. Une clé absente vaut la moyenne fixe. */
  readonly hitPointRolls: Readonly<Record<string, number>>;
  /** Scores AVANT bonus raciaux. Les six clés sont toujours présentes. */
  readonly baseAbilities: AbilityScores;
  /** Un dictionnaire unique. Clé absente = créneau jamais touché. */
  readonly choices: Readonly<Record<ChoiceSlotId, readonly string[]>>;
  readonly personalTraits: PersonalTraits;
}

export const EMPTY_PERSONAL_TRAITS: PersonalTraits = {
  trait: '',
  ideal: '',
  bond: '',
  flaw: '',
};

export function emptyDraft(): CharacterDraft {
  return {
    name: '',
    level: MIN_LEVEL,
    raceId: null,
    subraceId: null,
    classId: null,
    backgroundId: null,
    alignmentId: null,
    abilityMethod: 'point-buy',
    hitPointMethod: 'average',
    hitPointRolls: {},
    baseAbilities: abilityScores(() => 8),
    choices: {},
    personalTraits: EMPTY_PERSONAL_TRAITS,
  };
}

/** Les réponses d'un créneau, ou un tableau vide s'il n'a jamais été touché. */
export function pickedFor(draft: CharacterDraft, slot: ChoiceSlotId): readonly string[] {
  return draft.choices[slot] ?? [];
}

export function hasAnyContent(draft: CharacterDraft): boolean {
  return (
    draft.name !== '' ||
    draft.raceId !== null ||
    draft.classId !== null ||
    draft.backgroundId !== null ||
    draft.alignmentId !== null ||
    Object.keys(draft.choices).length > 0 ||
    ABILITIES.some((ability) => draft.baseAbilities[ability] !== 8)
  );
}
