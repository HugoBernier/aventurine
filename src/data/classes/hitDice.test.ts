import { describe, expect, it } from 'vitest';
import { emptyDraft } from '../../domain/draft';
import { averageRoll, hitPointRows } from '../../domain/progression';
import { buildSheet } from '../../domain/sheet';
import { CATALOGUE as C } from '../catalogue';

/** SRD 5.1, ligne « Hit Dice » de chaque classe. */
const SRD_HIT_DICE: Readonly<Record<string, number>> = {
  barbare: 12,
  guerrier: 10,
  paladin: 10,
  rodeur: 10,
  barde: 8,
  clerc: 8,
  druide: 8,
  moine: 8,
  roublard: 8,
  occultiste: 8,
  ensorceleur: 6,
  magicien: 6,
};

describe('les dés de vie des douze classes', () => {
  it('donne à chaque classe le dé du SRD', () => {
    const actual = Object.fromEntries(C.classes.map((entry) => [entry.id, entry.hitDie]));
    expect(actual).toEqual(SRD_HIT_DICE);
  });

  it('n’oublie aucune classe', () => {
    expect(C.classes).toHaveLength(Object.keys(SRD_HIT_DICE).length);
  });
});

describe('la réserve de dés de vie', () => {
  it('compte un dé par niveau, pas un seul', () => {
    const draft = { ...emptyDraft(), classId: 'paladin', level: 5 };
    expect(buildSheet(draft, C).hitDice).toEqual({ count: 5, die: 10 });
  });
});

describe('ce qu’un niveau ajoute', () => {
  it('donne six au paladin qui prend la moyenne, la moitié du d10 plus un', () => {
    expect(averageRoll(10)).toBe(6);
    const [premier, second] = hitPointRows(2, 10, 0, 0);
    expect(premier?.fromDie).toBe(10);
    expect(second?.fromDie).toBe(6);
  });

  it('suit le dé de chaque classe', () => {
    // d6 → 4, d8 → 5, d10 → 6, d12 → 7 : la moitié arrondie au supérieur.
    expect([6, 8, 10, 12].map((die) => averageRoll(die))).toEqual([4, 5, 6, 7]);
  });
});
