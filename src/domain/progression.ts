/**
 * Ce que le NIVEAU seul décide : bonus de maîtrise, points de vie, dés de vie
 * et emplacements de sorts. Aucune de ces quatre valeurs ne dépend d'un choix
 * du joueur, elles se calculent toutes depuis le niveau et la classe.
 */

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 20;

/** Un niveau venu d'un fichier importé n'est pas de confiance. */
export function clampLevel(level: number): number {
  if (!Number.isSafeInteger(level)) {
    return MIN_LEVEL;
  }
  return Math.min(Math.max(level, MIN_LEVEL), MAX_LEVEL);
}

/** SRD, « Beyond 1st Level » : +2, puis +1 tous les quatre niveaux. */
export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((clampLevel(level) - 1) / 4);
}

/**
 * Niveau 1 : le maximum du dé. Ensuite la moyenne fixe, `dé / 2 + 1`, qui est
 * l'option sans jet du SRD — les jets sont hors périmètre (§B1). La
 * Constitution compte à chaque niveau, y compris le premier.
 */
export function maxHitPoints(
  level: number,
  hitDie: number,
  constitutionModifier: number,
  bonusPerLevel: number,
): number {
  const levels = clampLevel(level);
  const perLevel = constitutionModifier + bonusPerLevel;
  const afterFirst = (levels - 1) * (Math.floor(hitDie / 2) + 1 + perLevel);
  // Un personnage ne tombe jamais sous 1 point de vie par niveau, même avec
  // une Constitution désastreuse.
  return Math.max(hitDie + perLevel + afterFirst, levels);
}

/** Emplacements du niveau 1 au niveau 9, index 0 = sorts de niveau 1. */
export type SpellSlots = readonly number[];

/** SRD, table des lanceurs de sorts complets : barde, clerc, druide… */
const FULL_CASTER: readonly SpellSlots[] = [
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

/** Paladin et rôdeur : rien au niveau 1, puis la moitié du rythme. */
const HALF_CASTER: readonly SpellSlots[] = [
  [],
  [2],
  [3],
  [3],
  [4, 2],
  [4, 2],
  [4, 3],
  [4, 3],
  [4, 3, 2],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2],
];

/** Occultiste : peu d'emplacements, tous du même niveau, tous récupérés vite. */
const PACT_SLOTS = [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4];
const PACT_SLOT_LEVEL = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];

export type CastingProgression = 'full' | 'half' | 'pact';

/** Ce que l'occultiste a de particulier : peu d'emplacements, d'un seul niveau. */
export interface PactMagic {
  readonly slots: number;
  readonly slotLevel: number;
}

export function spellSlots(
  progression: Exclude<CastingProgression, 'pact'>,
  level: number,
): SpellSlots {
  const table = progression === 'full' ? FULL_CASTER : HALF_CASTER;
  return table[clampLevel(level) - 1] ?? [];
}

export function pactMagic(level: number): PactMagic {
  const index = clampLevel(level) - 1;
  return {
    slots: PACT_SLOTS[index] ?? 1,
    slotLevel: PACT_SLOT_LEVEL[index] ?? 1,
  };
}
