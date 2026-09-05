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

/** Les niveaux de sort réellement proposés à l'écran des sorts. */
const spellLevelsOffered = (draft: CharacterDraft): readonly number[] => {
  const slot = openChoices(draft, C).find((entry) => entry.kind === 'spell');
  const levels = (slot?.options ?? []).map(
    (option) => C.spells.find((spell) => spell.id === option.id)?.level ?? -1,
  );
  return [...new Set(levels)].toSorted((a, b) => a - b);
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

  it('donne au clerc ses tours de magie par table', () => {
    expect(cantripSlot(character('clerc', 5))).toBe(4);
  });
});

/**
 * SRD, mot pour mot pour le clerc, le druide et le paladin : « choose a number
 * of spells equal to your <caractéristique> modifier + your <classe> level ».
 * Le joueur les choisit une fois et les garde : la liste ne change qu'après un
 * repos long, et rien ne l'oblige à en changer.
 */
describe('les sorts préparés se choisissent, ils ne se laissent pas en blanc', () => {
  it('en donne modificateur + niveau au clerc', () => {
    // Sagesse 16 : +3, plus cinq niveaux, donc huit sorts préparés.
    expect(spellSlot(character('clerc', 5, { sagesse: 16 }))).toBe(8);
  });

  it('en donne au moins un, même avec une caractéristique faible', () => {
    expect(spellSlot(character('clerc', 1, { sagesse: 6 }))).toBe(1);
  });

  it('compte la moitié du niveau pour le paladin', () => {
    // Charisme 14 : +2, plus deux niveaux de lanceur au niveau 5.
    expect(spellSlot(character('paladin', 5, { charisme: 14 }))).toBe(4);
  });

  it('n’ouvre rien au paladin de niveau 1, qui ne lance encore rien', () => {
    expect(spellSlot(character('paladin', 1, { charisme: 14 }))).toBeNull();
  });

  it('n’en donne que deux à un paladin de niveau 7 au Charisme 9', () => {
    // Le cas qui a l'air d'un bug : niveau 7, deux sorts. C'est la règle —
    // trois pour la moitié du niveau, moins un pour le Charisme.
    expect(spellSlot(character('paladin', 7, { charisme: 9 }))).toBe(2);
  });

  it('dit de quoi ce nombre est fait, pour que l’écran puisse l’expliquer', () => {
    const draft = character('paladin', 7, { charisme: 9 });
    const slot = openChoices(draft, C).find((entry) => entry.kind === 'spell');
    expect(slot?.pickFrom).toEqual({
      ability: 'charisme',
      modifier: -1,
      casterLevel: 3,
      halved: true,
    });
  });

  it('n’explique rien là où le nombre est écrit dans les données', () => {
    const known = openChoices(character('barde', 5), C).find(
      (entry) => entry.kind === 'spell',
    );
    expect(known?.pickFrom).toBeNull();
  });

  it('donne le même nombre que celui annoncé sur la fiche', () => {
    const draft = character('druide', 7, { sagesse: 18 });
    expect(spellSlot(draft)).toBe(buildSheet(draft, C).spellcasting?.preparedCount);
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

/**
 * SRD, à l'identique pour le barde, l'ensorceleur, l'occultiste et le rôdeur :
 * « Each of these spells must be of a level for which you have spell slots. »
 * Aucune règle ne fixe de quota par niveau de sort — le clerc, le magicien et
 * le paladin disent même « in any combination ». Le seul plafond est le plus
 * haut niveau d'emplacement ouvert.
 */
describe('ce qu’on a le droit d’apprendre', () => {
  it('ne propose que du niveau 1 à un barde débutant', () => {
    expect(spellLevelsOffered(character('barde', 1))).toEqual([1]);
  });

  it('ouvre le niveau 2 au barde dès qu’il en a l’emplacement', () => {
    expect(spellLevelsOffered(character('barde', 3))).toEqual([1, 2]);
    expect(spellLevelsOffered(character('barde', 5))).toEqual([1, 2, 3]);
  });

  it('laisse le mélange libre : six sorts de niveau 1 au niveau 3', () => {
    // Le nombre connu ne se répartit pas par niveau de sort : rien n'oblige
    // un barde de niveau 3 à prendre deux sorts de niveau 2.
    expect(spellSlot(character('barde', 3))).toBe(6);
    const niveauUn = openChoices(character('barde', 3), C)
      .find((entry) => entry.kind === 'spell')
      ?.options.filter(
        (option) => C.spells.find((spell) => spell.id === option.id)?.level === 1,
      );
    expect(niveauUn?.length ?? 0).toBeGreaterThanOrEqual(6);
  });

  it('suit le niveau d’emplacement du pacte pour l’occultiste', () => {
    // Le sien monte par paliers : au niveau 6, ses emplacements sont de
    // niveau 3, et il peut apprendre du 1, du 2 ou du 3.
    expect(spellLevelsOffered(character('occultiste', 6))).toEqual([1, 2, 3]);
  });

  it('s’arrête au niveau 2 pour un rôdeur de niveau 5', () => {
    expect(spellLevelsOffered(character('rodeur', 5))).toEqual([1, 2]);
  });
});

describe('l’écran de choix montre de quel niveau est chaque sort', () => {
  it('annonce le niveau de chaque option', () => {
    const options =
      openChoices(character('barde', 3), C).find((entry) => entry.kind === 'spell')
        ?.options ?? [];
    const parNiveau = new Set(options.map((option) => option.facts[0]));
    expect([...parNiveau].toSorted((a, b) => a.localeCompare(b, 'fr'))).toEqual([
      '1',
      '2',
    ]);
  });

  it('met le temps d’incantation en tête pour un tour de magie, qui n’a pas de niveau', () => {
    const options =
      openChoices(character('barde', 3), C).find((entry) => entry.kind === 'cantrip')
        ?.options ?? [];
    const isAligned = options.every(
      (option) =>
        option.facts[0] === C.spells.find((spell) => spell.id === option.id)?.castingTime,
    );
    expect({ options: options.length > 0, isAligned }).toEqual({
      options: true,
      isAligned: true,
    });
  });
});
