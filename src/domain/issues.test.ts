import { describe, expect, it } from 'vitest';
import { emptyDraft } from './draft';
import type { CharacterDraft } from './draft';
import { MINI_CATALOGUE as C } from './fixtures/miniCatalogue';
import { draftIssues } from './issues';

const draftWith = (parts: Partial<CharacterDraft>): CharacterDraft => ({
  ...emptyDraft(),
  ...parts,
});

const invalid = (draft: CharacterDraft) =>
  draftIssues(draft, C).filter((issue) => issue.severity === 'invalid');

describe('incomplet contre invalide', () => {
  it('classe un choix non fait comme incomplet, jamais comme invalide', () => {
    const issues = draftIssues(emptyDraft(), C);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every((issue) => issue.severity === 'incomplete')).toBe(true);
  });

  it('n’écrit aucune phrase française : les raisons sont structurées', () => {
    for (const issue of draftIssues(emptyDraft(), C)) {
      expect(typeof issue.reason.kind).toBe('string');
      expect(issue.reason).not.toHaveProperty('message');
    }
  });

  it('reprend telle quelle la cible calculée par la complétude', () => {
    const draft = draftWith({ classId: 'clerc' });
    const skill = draftIssues(draft, C).find(
      (issue) => issue.reason.kind === 'missing' && issue.reason.what === 'skill',
    );
    expect(skill?.target).toEqual({ kind: 'slot', slotId: 'class:clerc:skills' });
  });
});

describe('anomalies invalides', () => {
  it('signale une répartition qui dépasse 27 points', () => {
    const draft = draftWith({
      baseAbilities: {
        force: 15,
        dexterite: 15,
        constitution: 15,
        intelligence: 15,
        sagesse: 8,
        charisme: 8,
      },
    });
    expect(invalid(draft)[0]?.reason).toEqual({
      kind: 'over-budget',
      spent: 36,
      budget: 27,
    });
  });

  it('signale un score hors des bornes de la répartition', () => {
    const draft = draftWith({
      baseAbilities: { ...emptyDraft().baseAbilities, force: 18 },
    });
    expect(
      invalid(draft).some((issue) => issue.reason.kind === 'score-out-of-range'),
    ).toBe(true);
  });

  it('signale un tableau standard mal affecté', () => {
    const draft = draftWith({ abilityMethod: 'standard-array' });
    expect(
      invalid(draft).some((issue) => issue.reason.kind === 'invalid-standard-array'),
    ).toBe(true);
  });

  it('ne contrôle pas le budget quand la méthode est le tableau standard', () => {
    const draft = draftWith({
      abilityMethod: 'standard-array',
      baseAbilities: {
        force: 15,
        dexterite: 14,
        constitution: 13,
        intelligence: 12,
        sagesse: 10,
        charisme: 8,
      },
    });
    expect(invalid(draft)).toEqual([]);
  });

  it('signale un créneau qui porte plus de réponses qu’il n’en accepte', () => {
    const draft = draftWith({
      classId: 'clerc',
      choices: { 'class:clerc:skills': ['histoire', 'medecine', 'religion'] },
    });
    expect(invalid(draft)[0]?.reason).toEqual({ kind: 'too-many-choices', extra: 1 });
  });
});
