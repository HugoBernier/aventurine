import { describe, expect, it } from 'vitest';
import { emptyDraft } from '../../domain/draft';
import type { CharacterDraft } from '../../domain/draft';
import { openChoices } from '../../domain/openChoices';
import { buildSheet } from '../../domain/sheet';
import { CATALOGUE as C } from '../catalogue';

const character = (classId: string, level: number, scores = {}): CharacterDraft => ({
  ...emptyDraft(),
  classId,
  level,
  baseAbilities: {
    force: 10,
    dexterite: 10,
    constitution: 10,
    intelligence: 10,
    sagesse: 10,
    charisme: 10,
    ...scores,
  },
});

const spellSlot = (draft: CharacterDraft): number | null => {
  const slot = openChoices(draft, C).find((entry) => entry.kind === 'spell');
  return slot?.pick ?? null;
};

const cantripSlot = (draft: CharacterDraft): number | null => {
  const slot = openChoices(draft, C).find((entry) => entry.kind === 'cantrip');
  return slot?.pick ?? null;
};

describe('ce qu’on connaît monte avec le niveau', () => {
  it('donne quatre sorts au barde débutant et quatorze au niveau 10', () => {
    expect(spellSlot(character('barde', 1))).toBe(4);
    expect(spellSlot(character('barde', 10))).toBe(14);
  });

  it('fait passer les tours de magie du barde de deux à quatre', () => {
    expect(cantripSlot(character('barde', 1))).toBe(2);
    expect(cantripSlot(character('barde', 4))).toBe(3);
    expect(cantripSlot(character('barde', 10))).toBe(4);
  });

  it('ajoute deux sorts au grimoire du magicien à chaque niveau', () => {
    expect(spellSlot(character('magicien', 1))).toBe(6);
    expect(spellSlot(character('magicien', 3))).toBe(10);
    expect(spellSlot(character('magicien', 20))).toBe(44);
  });

  it('n’ouvre le choix des sorts qu’aux classes qui en choisissent', () => {
    // Le clerc prépare depuis toute la liste de sa classe : rien à choisir.
    expect(spellSlot(character('clerc', 5))).toBeNull();
    expect(cantripSlot(character('clerc', 5))).toBe(4);
  });
});

describe('le paladin et le rôdeur, demi-lanceurs', () => {
  it('ne donne aucune magie au niveau 1', () => {
    expect(buildSheet(character('paladin', 1), C).spellcasting).toBeNull();
    expect(buildSheet(character('rodeur', 1), C).spellcasting).toBeNull();
  });

  it('n’ouvre aucun choix de sort au rôdeur de niveau 1', () => {
    expect(spellSlot(character('rodeur', 1))).toBeNull();
  });

  it('ouvre la magie au niveau 2', () => {
    expect(buildSheet(character('paladin', 2), C).spellcasting?.slots).toEqual([2]);
    expect(spellSlot(character('rodeur', 2))).toBe(2);
  });

  it('fait connaître quatre sorts au rôdeur de niveau 5', () => {
    expect(spellSlot(character('rodeur', 5))).toBe(4);
  });

  it('ne donne aucun tour de magie, ni à l’un ni à l’autre', () => {
    expect(cantripSlot(character('paladin', 5))).toBeNull();
    expect(cantripSlot(character('rodeur', 5))).toBeNull();
  });

  it('prépare sur la moitié du niveau, arrondie à l’inférieur', () => {
    // Charisme 16, niveau 5 : +3 et deux niveaux de lanceur, donc cinq sorts.
    const sheet = buildSheet(character('paladin', 5, { charisme: 16 }), C);
    expect(sheet.spellcasting?.preparedCount).toBe(5);
  });

  it('en prépare toujours au moins un', () => {
    const sheet = buildSheet(character('paladin', 2, { charisme: 8 }), C);
    expect(sheet.spellcasting?.preparedCount).toBe(1);
  });

  it('laisse le rôdeur connaître ses sorts, sans en préparer', () => {
    const sheet = buildSheet(character('rodeur', 5), C);
    expect(sheet.spellcasting?.preparedCount).toBeNull();
  });

  it('monte deux fois moins vite qu’un lanceur complet', () => {
    const paladin = buildSheet(character('paladin', 20), C).spellcasting?.slots;
    const clerc = buildSheet(character('clerc', 20), C).spellcasting?.slots;
    expect(paladin).toEqual([4, 3, 3, 3, 2]);
    expect(clerc).toHaveLength(9);
  });
});
