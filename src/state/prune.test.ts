import { describe, expect, it } from 'vitest';
import { emptyDraft } from '../domain/draft';
import type { CharacterDraft } from '../domain/draft';
import { MINI_CATALOGUE as C } from '../domain/fixtures/miniCatalogue';
import { pruneChoices } from './prune';

const draftWith = (parts: Partial<CharacterDraft>): CharacterDraft => ({
  ...emptyDraft(),
  ...parts,
});

describe('invalidation en cascade', () => {
  it('oublie les compétences de roublard quand on passe à clerc', () => {
    const asRogue = draftWith({
      classId: 'roublard',
      choices: { 'class:roublard:skills': ['discretion', 'acrobaties'] },
    });
    const asCleric = { ...asRogue, classId: 'clerc' };
    const { draft, removed } = pruneChoices(asCleric, C);

    expect(draft.choices).toEqual({});
    expect(removed).toEqual([
      {
        slotId: 'class:roublard:skills',
        optionIds: ['discretion', 'acrobaties'],
        reason: 'slot-closed',
      },
    ]);
  });

  it('emporte l’expertise avec les compétences dans la même passe', () => {
    const asRogue = draftWith({
      classId: 'roublard',
      choices: {
        'class:roublard:skills': ['discretion'],
        'class:roublard:expertise': ['discretion'],
      },
    });
    const { draft } = pruneChoices({ ...asRogue, classId: 'clerc' }, C);
    expect(draft.choices).toEqual({});
  });

  it('ne touche à rien quand on re-sélectionne la même classe', () => {
    const draft = draftWith({
      classId: 'roublard',
      choices: { 'class:roublard:skills': ['discretion'] },
    });
    const result = pruneChoices(draft, C);
    expect(result.removed).toEqual([]);
    // Identité conservée : rien n'a bougé, donc rien ne se re-rend.
    expect(result.draft).toBe(draft);
  });

  it('conserve les compétences de classe quand on change seulement de sous-race', () => {
    const draft = draftWith({
      raceId: 'nain',
      subraceId: 'nain-des-collines',
      classId: 'roublard',
      choices: { 'class:roublard:skills': ['discretion'] },
    });
    const { draft: pruned } = pruneChoices({ ...draft, subraceId: null }, C);
    expect(pruned.choices['class:roublard:skills']).toEqual(['discretion']);
  });

  it('retire une compétence que l’historique vient de donner', () => {
    const chosenFirst = draftWith({
      classId: 'roublard',
      choices: { 'class:roublard:skills': ['perception', 'discretion'] },
    });
    const { draft, removed } = pruneChoices(
      { ...chosenFirst, backgroundId: 'acolyte' },
      C,
    );
    expect(draft.choices['class:roublard:skills']).toEqual(['discretion']);
    expect(removed).toEqual([
      {
        slotId: 'class:roublard:skills',
        optionIds: ['perception'],
        reason: 'option-withdrawn',
      },
    ]);
  });

  it('aboutit au même état que l’historique soit choisi avant ou après la classe', () => {
    const both = { classId: 'roublard', backgroundId: 'acolyte' } as const;
    const classFirst = pruneChoices(
      draftWith({ ...both, choices: { 'class:roublard:skills': ['discretion'] } }),
      C,
    );
    const backgroundFirst = pruneChoices(
      draftWith({ ...both, choices: { 'class:roublard:skills': ['discretion'] } }),
      C,
    );
    expect(classFirst.draft.choices).toEqual(backgroundFirst.draft.choices);
  });

  it('supprime les réponses d’un créneau dont la source a disparu', () => {
    const draft = draftWith({
      backgroundId: 'acolyte',
      choices: { 'background:acolyte:languages': ['elfique'] },
    });
    const { draft: pruned } = pruneChoices({ ...draft, backgroundId: null }, C);
    expect(pruned.choices).toEqual({});
  });

  it('se stabilise : une seconde passe ne retire plus rien', () => {
    const draft = draftWith({
      classId: 'clerc',
      choices: { 'class:roublard:skills': ['discretion'] },
    });
    const first = pruneChoices(draft, C);
    const second = pruneChoices(first.draft, C);
    expect(second.removed).toEqual([]);
    expect(second.draft).toBe(first.draft);
  });

  it('laisse intact un brouillon sans aucun choix', () => {
    const draft = emptyDraft();
    expect(pruneChoices(draft, C).draft).toBe(draft);
  });
});

describe('un niveau qui redescend', () => {
  it('retire les réponses que le nouveau niveau n’accorde plus', () => {
    // Le clerc du catalogue de test connaît trois tours de magie au niveau 4,
    // deux au niveau 1 : le dernier choisi s'en va.
    const atFour = draftWith({
      classId: 'clerc',
      level: 4,
      choices: {
        'class:clerc:cantrips': ['lumiere', 'flamme-sacree', 'assistance'],
      },
    });
    const { draft, removed } = pruneChoices({ ...atFour, level: 1 }, C);

    expect(draft.choices['class:clerc:cantrips']).toEqual(['lumiere', 'flamme-sacree']);
    expect(removed).toEqual([
      {
        slotId: 'class:clerc:cantrips',
        optionIds: ['assistance'],
        reason: 'too-many',
      },
    ]);
  });

  it('ne touche à rien tant que le niveau tient ses promesses', () => {
    const atFour = draftWith({
      classId: 'clerc',
      level: 4,
      choices: {
        'class:clerc:cantrips': ['lumiere', 'flamme-sacree', 'assistance'],
      },
    });
    expect(pruneChoices(atFour, C).removed).toEqual([]);
  });
});
