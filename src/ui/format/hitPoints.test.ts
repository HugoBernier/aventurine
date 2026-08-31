import { describe, expect, it } from 'vitest';
import { formatHitPointsPerLevel } from './hitPoints';

describe('ce que rapporte un niveau', () => {
  it('détaille le dé et la Constitution d’un magicien à Constitution 8', () => {
    // C'est le cas qui fait croire à une erreur : le d6 vaut 4, le total 3.
    expect(formatHitPointsPerLevel({ average: 4, constitution: -1, bonus: 0 })).toBe(
      '4 du dé, -1 de Constitution, soit +3 par niveau',
    );
  });

  it('ne mentionne pas une Constitution neutre', () => {
    expect(formatHitPointsPerLevel({ average: 4, constitution: 0, bonus: 0 })).toBe(
      '4 du dé, soit +4 par niveau',
    );
  });

  it('compte le bonus du peuple à part', () => {
    expect(formatHitPointsPerLevel({ average: 7, constitution: 2, bonus: 1 })).toBe(
      '7 du dé, +2 de Constitution, +1 de ton peuple, soit +10 par niveau',
    );
  });

  it('dit pourquoi le total ne descend pas sous 1', () => {
    expect(formatHitPointsPerLevel({ average: 4, constitution: -5, bonus: 0 })).toBe(
      '4 du dé, -5 de Constitution, soit +1 par niveau (jamais moins de 1)',
    );
  });
});
