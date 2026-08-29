import { describe, expect, it } from 'vitest';
import { isComplete, listMissingChoices } from './completeness';
import { emptyDraft } from './draft';
import type { CharacterDraft } from './draft';
import { MINI_CATALOGUE as C } from './fixtures/miniCatalogue';
import { STANDARD_ARRAY } from './pointBuy';

const draftWith = (parts: Partial<CharacterDraft>): CharacterDraft => ({
  ...emptyDraft(),
  ...parts,
});

const kinds = (draft: CharacterDraft): readonly string[] =>
  listMissingChoices(draft, C).map((missing) => missing.kind);

const missingOf = (draft: CharacterDraft, kind: string) =>
  listMissingChoices(draft, C).find((missing) => missing.kind === kind);

const COMPLETE: CharacterDraft = {
  name: 'Alric',
  raceId: 'nain',
  subraceId: 'nain-des-collines',
  classId: 'roublard',
  backgroundId: 'acolyte',
  alignmentId: 'loyal-bon',
  abilityMethod: 'standard-array',
  baseAbilities: {
    force: 15,
    dexterite: 14,
    constitution: 13,
    intelligence: 12,
    sagesse: 10,
    charisme: 8,
  },
  choices: {
    'background:acolyte:languages': ['elfique', 'gobelin'],
    'class:roublard:skills': ['acrobaties', 'athletisme', 'discretion', 'supercherie'],
    'class:roublard:equipment-1': ['rapiere'],
    'class:roublard:expertise': ['discretion', 'acrobaties'],
  },
  personalTraits: {
    trait: 'Je cite les textes.',
    ideal: 'La foi guide mes pas.',
    bond: 'Je dois tout à mon temple.',
    flaw: 'Je juge trop vite.',
  },
};

describe('ce qui manque', () => {
  it('signale la race, la classe et l’historique sur un brouillon vide', () => {
    expect(kinds(emptyDraft())).toContain('race');
    expect(kinds(emptyDraft())).toContain('class');
    expect(kinds(emptyDraft())).toContain('background');
  });

  it('signale la sous-race seulement pour une race qui en a', () => {
    expect(kinds(draftWith({ raceId: 'nain' }))).toContain('subrace');
    expect(kinds(draftWith({ raceId: 'demi-elfe' }))).not.toContain('subrace');
  });

  it('ne signale plus la sous-race une fois choisie', () => {
    const draft = draftWith({ raceId: 'nain', subraceId: 'nain-des-collines' });
    expect(kinds(draft)).not.toContain('subrace');
  });

  it('signale les points de répartition non dépensés avec leur nombre', () => {
    expect(missingOf(emptyDraft(), 'abilities')?.remaining).toBe(27);
  });

  it('signale un tableau standard mal affecté', () => {
    const draft = draftWith({ abilityMethod: 'standard-array' });
    expect(kinds(draft)).toContain('abilities');
  });

  it('ne signale rien sur les caractéristiques d’un tableau standard bien affecté', () => {
    const [force, dexterite, constitution, intelligence, sagesse, charisme] =
      STANDARD_ARRAY;
    const draft = draftWith({
      abilityMethod: 'standard-array',
      baseAbilities: {
        force,
        dexterite,
        constitution,
        intelligence,
        sagesse,
        charisme,
      },
    });
    expect(kinds(draft)).not.toContain('abilities');
  });

  it('signale « 1 compétence » quand une seule compétence manque', () => {
    const draft = draftWith({
      classId: 'clerc',
      choices: { 'class:clerc:skills': ['histoire'] },
    });
    expect(missingOf(draft, 'skill')?.remaining).toBe(1);
  });

  it('signale « 2 compétences » au pluriel', () => {
    expect(missingOf(draftWith({ classId: 'clerc' }), 'skill')?.remaining).toBe(2);
  });

  it('désigne le créneau concerné, pas seulement son genre', () => {
    const draft = draftWith({ classId: 'clerc' });
    expect(missingOf(draft, 'skill')?.target).toEqual({
      kind: 'slot',
      slotId: 'class:clerc:skills',
    });
  });

  it('désigne un champ pour ce qui n’est pas un créneau', () => {
    expect(missingOf(emptyDraft(), 'name')?.target).toEqual({
      kind: 'field',
      field: 'name',
    });
  });

  it('signale les traits de personnalité vides en les comptant', () => {
    expect(missingOf(emptyDraft(), 'personality')?.remaining).toBe(4);
  });

  it('place le créneau d’expertise après les compétences', () => {
    const draft = draftWith({ classId: 'roublard' });
    const slots = listMissingChoices(draft, C)
      .filter((missing) => missing.target.kind === 'slot')
      .map((missing) => missing.kind);
    expect(slots.indexOf('expertise')).toBeGreaterThan(slots.indexOf('skill'));
  });

  it('ne signale aucun manque pour un personnage complet', () => {
    expect(listMissingChoices(COMPLETE, C)).toEqual([]);
    expect(isComplete(COMPLETE, C)).toBe(true);
  });

  it('considère un personnage neuf comme incomplet', () => {
    expect(isComplete(emptyDraft(), C)).toBe(false);
  });
});
