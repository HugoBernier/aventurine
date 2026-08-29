import { describe, expect, it } from 'vitest';
import { abilityScores } from './abilities';
import type { AbilityScores } from './abilities';
import {
  POINT_BUY_BUDGET,
  STANDARD_ARRAY,
  increaseCost,
  isStandardArrayAssignment,
  pointBuyCost,
  pointsRemaining,
  pointsSpent,
} from './pointBuy';

const scores = (partial: Partial<AbilityScores>): AbilityScores =>
  abilityScores((ability) => partial[ability] ?? 8);

describe('coût de la répartition de points', () => {
  it('ne coûte rien pour un score de 8', () => {
    expect(pointBuyCost(8)).toBe(0);
  });

  it('coûte 9 points pour un score de 15', () => {
    expect(pointBuyCost(15)).toBe(9);
  });

  it('refuse un score hors des bornes de la répartition', () => {
    expect(pointBuyCost(7)).toBeNull();
    expect(pointBuyCost(16)).toBeNull();
  });

  it('facture 2 points le passage de 13 à 14', () => {
    expect(increaseCost(13)).toBe(2);
  });

  it('facture 1 point le passage de 12 à 13', () => {
    expect(increaseCost(12)).toBe(1);
  });

  it('ne facture aucune augmentation au-delà de 15', () => {
    expect(increaseCost(15)).toBeNull();
  });
});

describe('budget de la répartition de points', () => {
  it('dépense exactement 27 points pour 15/15/15/8/8/8', () => {
    const spent = pointsSpent(scores({ force: 15, dexterite: 15, constitution: 15 }));
    expect(spent).toBe(POINT_BUY_BUDGET);
  });

  it('ne laisse plus rien à dépenser sur une répartition complète', () => {
    expect(pointsRemaining(scores({ force: 15, dexterite: 15, constitution: 15 }))).toBe(
      0,
    );
  });

  it('laisse 27 points sur une répartition à 8 partout', () => {
    expect(pointsRemaining(scores({}))).toBe(POINT_BUY_BUDGET);
  });

  it('compte comme dépassement une répartition trop chère', () => {
    const spent = pointsSpent(
      scores({ force: 15, dexterite: 15, constitution: 15, intelligence: 15 }),
    );
    expect(spent).toBeGreaterThan(POINT_BUY_BUDGET);
    expect(
      pointsRemaining(
        scores({ force: 15, dexterite: 15, constitution: 15, intelligence: 15 }),
      ),
    ).toBeLessThan(0);
  });

  it('ignore un score hors bornes plutôt que de lever une exception', () => {
    expect(pointsSpent(scores({ force: 18 }))).toBe(0);
  });
});

describe('tableau standard', () => {
  it('propose 15, 14, 13, 12, 10 et 8', () => {
    expect([...STANDARD_ARRAY]).toEqual([15, 14, 13, 12, 10, 8]);
  });

  it('accepte une affectation qui utilise chaque valeur une fois', () => {
    const assigned = scores({
      force: 15,
      dexterite: 14,
      constitution: 13,
      intelligence: 12,
      sagesse: 10,
      charisme: 8,
    });
    expect(isStandardArrayAssignment(assigned)).toBe(true);
  });

  it('refuse une affectation qui réutilise deux fois la même valeur', () => {
    const assigned = scores({
      force: 15,
      dexterite: 15,
      constitution: 13,
      intelligence: 12,
      sagesse: 10,
      charisme: 8,
    });
    expect(isStandardArrayAssignment(assigned)).toBe(false);
  });
});
