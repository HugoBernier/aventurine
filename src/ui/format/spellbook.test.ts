import { describe, expect, it } from 'vitest';
import type { SpellcastingSheet } from '../../domain/sheet';
import { formatSlots } from './spellbook';

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
