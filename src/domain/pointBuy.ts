import { ABILITIES } from './abilities';
import type { AbilityScores } from './abilities';

export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;

/** Coût cumulé d'un score, SRD « Variante : personnalisation ». */
const POINT_BUY_COST: Readonly<Record<number, number>> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

/** `null` hors des bornes : le domaine ne lève jamais d'exception. */
export function pointBuyCost(score: number): number | null {
  return POINT_BUY_COST[score] ?? null;
}

/** Ce que coûte le passage de `score` à `score + 1`. */
export function increaseCost(score: number): number | null {
  const current = pointBuyCost(score);
  const next = pointBuyCost(score + 1);
  if (current === null || next === null) {
    return null;
  }
  return next - current;
}

export function pointsSpent(scores: AbilityScores): number {
  let total = 0;
  for (const ability of ABILITIES) {
    total += pointBuyCost(scores[ability]) ?? 0;
  }
  return total;
}

export function pointsRemaining(scores: AbilityScores): number {
  return POINT_BUY_BUDGET - pointsSpent(scores);
}

/** Vrai si les six scores sont exactement le tableau standard, une fois chacun. */
export function isStandardArrayAssignment(scores: AbilityScores): boolean {
  const unused: number[] = [...STANDARD_ARRAY];
  for (const ability of ABILITIES) {
    const index = unused.indexOf(scores[ability]);
    if (index === -1) {
      return false;
    }
    unused.splice(index, 1);
  }
  return unused.length === 0;
}
