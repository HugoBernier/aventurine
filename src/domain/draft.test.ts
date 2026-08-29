import { describe, expect, it } from 'vitest';
import { throughJson } from '../test/throughJson';
import { ABILITIES } from './abilities';
import { emptyDraft, hasAnyContent, pickedFor } from './draft';

describe('brouillon vide', () => {
  it('démarre sans race, sans classe et sans historique', () => {
    const draft = emptyDraft();
    expect(draft.raceId).toBeNull();
    expect(draft.classId).toBeNull();
    expect(draft.backgroundId).toBeNull();
  });

  it('démarre à 8 dans les six caractéristiques', () => {
    const draft = emptyDraft();
    for (const ability of ABILITIES) {
      expect(draft.baseAbilities[ability]).toBe(8);
    }
  });

  it('produit un brouillon identique après un aller-retour par JSON', () => {
    const draft = emptyDraft();
    expect(throughJson(draft)).toEqual(draft);
  });

  it('ne stocke aucune valeur dérivable', () => {
    const forbidden =
      /^(hp|maxHitPoints|ac|armorClass|modifier|proficiencyBonus|initiative|speed|total)$/i;
    const walk = (value: unknown): void => {
      if (typeof value !== 'object' || value === null) {
        return;
      }
      for (const [key, child] of Object.entries(value)) {
        expect(key).not.toMatch(forbidden);
        walk(child);
      }
    };
    walk(emptyDraft());
  });
});

describe('lecture du brouillon', () => {
  it('rend un tableau vide pour un créneau jamais touché', () => {
    expect(pickedFor(emptyDraft(), 'class:roublard:skills')).toEqual([]);
  });

  it('rend les réponses enregistrées pour un créneau touché', () => {
    const draft = {
      ...emptyDraft(),
      choices: { 'class:roublard:skills': ['discretion'] },
    };
    expect(pickedFor(draft, 'class:roublard:skills')).toEqual(['discretion']);
  });

  it('considère un brouillon neuf comme vide', () => {
    expect(hasAnyContent(emptyDraft())).toBe(false);
  });

  it('considère un brouillon nommé comme non vide', () => {
    expect(hasAnyContent({ ...emptyDraft(), name: 'Alric' })).toBe(true);
  });

  it('considère un score modifié comme du contenu', () => {
    const draft = emptyDraft();
    expect(
      hasAnyContent({
        ...draft,
        baseAbilities: { ...draft.baseAbilities, force: 15 },
      }),
    ).toBe(true);
  });
});
