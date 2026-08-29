import { describe, expect, it } from 'vitest';
import { emptyDraft } from '../domain/draft';
import type { CharacterDraft } from '../domain/draft';
import { MINI_CATALOGUE as C } from '../domain/fixtures/miniCatalogue';
import {
  applicableSteps,
  buildFlow,
  progressOf,
  screenForField,
  screenForSlot,
} from './flow';

const draftWith = (parts: Partial<CharacterDraft>): CharacterDraft => ({
  ...emptyDraft(),
  ...parts,
});

const screenIds = (draft: CharacterDraft): readonly string[] =>
  buildFlow(draft, C).map((screen) => screen.id);

describe('construction du parcours', () => {
  it('commence par la race et finit par la personnalité', () => {
    const ids = screenIds(emptyDraft());
    expect(ids[0]).toBe('race');
    expect(ids.at(-1)).toBe('personality');
  });

  it('n’affiche l’écran de sous-race que pour les races qui en ont', () => {
    expect(screenIds(draftWith({ raceId: 'nain' }))).toContain('subrace');
    expect(screenIds(draftWith({ raceId: 'demi-elfe' }))).not.toContain('subrace');
  });

  it('n’insère les écrans de sorts que pour une classe qui en lance', () => {
    expect(screenIds(draftWith({ classId: 'clerc' }))).toContain(
      'choice:class:clerc:cantrips',
    );
    const rogue = buildFlow(draftWith({ classId: 'roublard' }), C);
    expect(rogue.some((screen) => screen.step === 'spells')).toBe(false);
  });

  it('retire du parcours une étape sans écran plutôt que de la griser', () => {
    const steps = applicableSteps(buildFlow(draftWith({ classId: 'roublard' }), C));
    expect(steps).not.toContain('spells');
  });

  it('regroupe les compétences de toutes les sources dans l’étape des maîtrises', () => {
    const draft = draftWith({
      raceId: 'demi-elfe',
      classId: 'roublard',
      backgroundId: 'personnalise',
    });
    const proficiencies = buildFlow(draft, C)
      .filter((screen) => screen.step === 'proficiencies')
      .map((screen) => screen.id);
    expect(proficiencies).toEqual([
      'choice:race:demi-elfe:skills',
      'choice:background:personnalise:skills',
      'choice:class:roublard:skills',
      'choice:class:roublard:expertise',
    ]);
  });

  it('place les choix de compétences après l’historique', () => {
    const draft = draftWith({ classId: 'roublard', backgroundId: 'acolyte' });
    const ids = screenIds(draft);
    expect(ids.indexOf('choice:class:roublard:skills')).toBeGreaterThan(
      ids.indexOf('background'),
    );
  });

  it('place l’expertise après tous les choix de compétences', () => {
    const draft = draftWith({ classId: 'roublard' });
    const ids = screenIds(draft);
    expect(ids.indexOf('choice:class:roublard:expertise')).toBeGreaterThan(
      ids.indexOf('choice:class:roublard:skills'),
    );
  });

  it('sépare la méthode de répartition de la répartition elle-même', () => {
    const ids = screenIds(emptyDraft());
    expect(ids).toContain('ability-method');
    expect(ids).toContain('ability-assign');
  });
});

describe('repère de progression', () => {
  it('annonce l’étape sur le nombre d’étapes applicables', () => {
    const flow = buildFlow(draftWith({ classId: 'roublard' }), C);
    const progress = progressOf(flow, 'race');
    const steps = applicableSteps(flow);
    expect(progress?.step).toBe('race');
    expect(progress?.stepIndex).toBe(1);
    expect(progress?.stepCount).toBe(steps.length);
  });

  it('mesure la barre fine en écrans, pas en étapes', () => {
    const flow = buildFlow(emptyDraft(), C);
    expect(progressOf(flow, 'race')?.screenCount).toBe(flow.length);
  });

  it('rend null pour un écran absent du parcours', () => {
    const flow = buildFlow(emptyDraft(), C);
    expect(progressOf(flow, 'inconnu')).toBeNull();
  });
});

describe('localisation d’une anomalie', () => {
  it('rattache un créneau à son écran', () => {
    const flow = buildFlow(draftWith({ classId: 'clerc' }), C);
    expect(screenForSlot(flow, 'class:clerc:skills')).toBe('choice:class:clerc:skills');
  });

  it('rend null pour un créneau absent du parcours courant', () => {
    const flow = buildFlow(emptyDraft(), C);
    expect(screenForSlot(flow, 'class:clerc:skills')).toBeNull();
  });

  it('rattache un champ du brouillon à son écran', () => {
    expect(screenForField('name')).toBe('name');
    expect(screenForField('baseAbilities')).toBe('ability-assign');
  });

  it('rend null pour un champ sans écran dédié', () => {
    expect(screenForField('abilityMethod')).toBeNull();
  });
});
