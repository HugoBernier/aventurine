import { describe, expect, it } from 'vitest';
import type { SpellcastingSheet } from '../../domain/sheet';
import { formatEmptyLevel, formatSlots, slotLevels, slotsAtLevel } from './spellbook';

const pact = (slots: number): SpellcastingSheet => ({
  ability: 'charisme',
  saveDc: 13,
  attackBonus: 5,
  slots: [],
  pact: { slots, slotLevel: 1 },
  preparation: 'known',
  preparedCount: null,
  cantripIds: [],
  spellIds: [],
  alwaysPreparedIds: [],
});

describe('emplacements de pacte', () => {
  it('accorde le participe sur le nombre d’emplacements', () => {
    // Un occultiste de niveau 1 n'en a qu'un : « rendus » était figé au pluriel.
    expect(formatSlots(pact(1))).toBe(
      '1 emplacement de niveau 1, rendu par un repos court',
    );
  });

  it('passe tout au pluriel au-delà', () => {
    expect(formatSlots(pact(2))).toBe(
      '2 emplacements de niveau 1, rendus par un repos court',
    );
  });
});

const caster = (
  slots: readonly number[],
  preparation: SpellcastingSheet['preparation'],
): SpellcastingSheet => ({
  ...pact(1),
  slots,
  pact: null,
  preparation,
});

describe('cases d’emplacements', () => {
  it('ne retient que les niveaux qui ont un emplacement', () => {
    expect(slotLevels(caster([4, 3, 2, 0, 0], 'spellbook'))).toEqual([1, 2, 3]);
  });

  it('donne au pacte son seul niveau', () => {
    expect(slotLevels(pact(2))).toEqual([1]);
  });

  it('compte une case par emplacement du niveau', () => {
    expect(slotsAtLevel(caster([4, 3, 2], 'spellbook'), 2)).toBe(3);
  });

  it('ne donne aucune case à un niveau sans emplacement', () => {
    expect(slotsAtLevel(caster([4, 3, 2], 'spellbook'), 5)).toBe(0);
  });

  it('donne ses cases au niveau du pacte, et à lui seul', () => {
    expect(slotsAtLevel(pact(2), 1)).toBe(2);
    expect(slotsAtLevel(pact(2), 2)).toBe(0);
  });
});

describe('un niveau sans sort', () => {
  it('invite le clerc à noter ce qu’il prépare', () => {
    expect(formatEmptyLevel(caster([4], 'prepared'))).toBe(
      'À remplir au crayon, chaque matin.',
    );
  });

  it('constate le vide pour un magicien', () => {
    expect(formatEmptyLevel(caster([4], 'spellbook'))).toBe(
      'Rien à ce niveau pour l’instant.',
    );
  });
});
