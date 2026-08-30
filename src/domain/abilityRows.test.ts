import { describe, expect, it } from 'vitest';
import { abilityRows } from './abilityRows';
import { emptyDraft } from './draft';
import type { CharacterDraft } from './draft';
import { MINI_CATALOGUE as C } from './fixtures/miniCatalogue';

const draftWith = (parts: Partial<CharacterDraft>): CharacterDraft => ({
  ...emptyDraft(),
  ...parts,
});

const withScores = (
  parts: Partial<CharacterDraft>,
  scores: Partial<Record<string, number>>,
): CharacterDraft => {
  const draft = draftWith(parts);
  return { ...draft, baseAbilities: { ...draft.baseAbilities, ...scores } };
};

const rowFor = (draft: CharacterDraft, ability: string) =>
  abilityRows(draft, C).find((row) => row.id === ability);

describe('lignes de caractéristiques', () => {
  it('rend une ligne par caractéristique', () => {
    expect(abilityRows(emptyDraft(), C)).toHaveLength(6);
  });

  it('additionne le score de base et le +2 posé par le joueur', () => {
    const draft = withScores(
      { raceId: 'nain', choices: { 'race:nain:origin-2': ['constitution'] } },
      { constitution: 14 },
    );
    const row = rowFor(draft, 'constitution');
    expect(row?.score).toBe(14);
    expect(row?.racialBonus).toBe(2);
    expect(row?.total).toBe(16);
    expect(row?.modifier).toBe(3);
  });

  it('cite le créneau de chaque bonus, race et sous-race distinctes', () => {
    const draft = draftWith({
      raceId: 'nain',
      subraceId: 'nain-des-collines',
      choices: {
        'race:nain:origin-2': ['constitution'],
        'race:nain-des-collines:origin-1': ['sagesse'],
      },
    });
    expect(rowFor(draft, 'constitution')?.bonusSources).toEqual(['race:nain:origin-2']);
    expect(rowFor(draft, 'sagesse')?.bonusSources).toEqual([
      'race:nain-des-collines:origin-1',
    ]);
  });

  it('cite le créneau de choix comme source d’un +1 choisi', () => {
    const draft = draftWith({
      raceId: 'demi-elfe',
      choices: { 'race:demi-elfe:ability': ['force'] },
    });
    expect(rowFor(draft, 'force')?.bonusSources).toEqual(['race:demi-elfe:ability']);
  });

  it('n’attribue aucune source quand il n’y a pas de bonus', () => {
    expect(rowFor(emptyDraft(), 'force')?.bonusSources).toEqual([]);
  });
});

describe('boutons de la répartition de points', () => {
  it('facture 1 point le passage de 8 à 9', () => {
    expect(rowFor(emptyDraft(), 'force')?.increaseCost).toBe(1);
  });

  it('laisse augmenter tant que le budget suffit', () => {
    expect(rowFor(emptyDraft(), 'force')?.canIncrease).toBe(true);
  });

  it('interdit de descendre en dessous de 8', () => {
    expect(rowFor(emptyDraft(), 'force')?.canDecrease).toBe(false);
  });

  it('laisse redescendre un score déjà monté', () => {
    expect(rowFor(withScores({}, { force: 12 }), 'force')?.canDecrease).toBe(true);
  });

  it('bloque au-delà de 15 et dit pourquoi', () => {
    const row = rowFor(withScores({}, { force: 15 }), 'force');
    expect(row?.canIncrease).toBe(false);
    expect(row?.blockedBy).toEqual({ kind: 'max-score', max: 15 });
  });

  it('laisse monter tant que le coût tient dans ce qui reste', () => {
    // 15 + 15 + 14 coûte 9 + 9 + 7 = 25 : il reste 2 points, et passer de
    // 14 à 15 en coûte exactement 2.
    const draft = withScores({}, { force: 15, dexterite: 15, constitution: 14 });
    const row = rowFor(draft, 'constitution');
    expect(row?.increaseCost).toBe(2);
    expect(row?.canIncrease).toBe(true);
  });

  it('bloque une augmentation trop chère en indiquant le coût et le reste', () => {
    // 15 + 15 + 15 coûte 27 : le budget est épuisé, et monter un 8 coûte 1.
    const draft = withScores({}, { force: 15, dexterite: 15, constitution: 15 });
    const row = rowFor(draft, 'intelligence');
    expect(row?.increaseCost).toBe(1);
    expect(row?.canIncrease).toBe(false);
    expect(row?.blockedBy).toEqual({
      kind: 'not-enough-points',
      required: 1,
      remaining: 0,
    });
  });

  it('explique toujours pourquoi le bouton est inactif, même à 8', () => {
    // Un bouton grisé sans raison est un cul-de-sac pour qui découvre le jeu.
    const draft = withScores({}, { force: 15, dexterite: 15, constitution: 15 });
    const row = rowFor(draft, 'charisme');
    expect(row?.score).toBe(8);
    expect(row?.canIncrease).toBe(false);
    expect(row?.blockedBy).not.toBeNull();
  });

  it('n’expose ni bouton ni coût en mode tableau standard', () => {
    const draft = draftWith({ abilityMethod: 'standard-array' });
    const row = rowFor(draft, 'force');
    expect(row?.canIncrease).toBe(false);
    expect(row?.canDecrease).toBe(false);
    expect(row?.increaseCost).toBeNull();
    expect(row?.blockedBy).toBeNull();
  });
});
