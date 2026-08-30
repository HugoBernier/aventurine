import { describe, expect, it } from 'vitest';
import { throughJson } from '../test/throughJson';
import { emptyDraft } from './draft';
import { parseDraft } from './parseDraft';

describe('lecture défensive d’un brouillon', () => {
  it('refuse une valeur qui n’est pas un objet', () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft('Alric')).toBeNull();
    expect(parseDraft([1, 2])).toBeNull();
  });

  it('reconstruit un brouillon complet à l’identique', () => {
    const draft = { ...emptyDraft(), name: 'Alric', raceId: 'nain' };
    expect(parseDraft(throughJson(draft))?.draft).toEqual(draft);
  });

  it('ignore les champs inconnus', () => {
    const parsed = parseDraft({ ...emptyDraft(), xp: 9000 });
    expect(parsed?.draft).not.toHaveProperty('xp');
  });

  it('relit le niveau et le ramène dans les bornes', () => {
    expect(parseDraft({ ...emptyDraft(), level: 12 })?.draft.level).toBe(12);
    expect(parseDraft({ ...emptyDraft(), level: 99 })?.draft.level).toBe(20);
    expect(parseDraft({ ...emptyDraft(), level: 'trois' })?.draft.level).toBe(1);
  });

  it('donne le niveau 1 à une sauvegarde écrite avant que le niveau existe', () => {
    const before = { name: 'Alric', raceId: 'nain', classId: 'roublard' };
    expect(parseDraft(before)?.draft.level).toBe(1);
  });

  it('ignore une clé __proto__ présente dans le fichier', () => {
    const hostile = JSON.parse('{"name":"Alric","__proto__":{"pollue":true}}') as unknown;
    const parsed = parseDraft(hostile);
    expect(parsed?.draft.name).toBe('Alric');
    expect({}).not.toHaveProperty('pollue');
  });

  it('tronque un nom de plus de soixante caractères et le signale', () => {
    const parsed = parseDraft({ name: 'a'.repeat(200) });
    expect(parsed?.draft.name).toHaveLength(60);
    expect(parsed?.warnings).toContainEqual({ kind: 'value-truncated', field: 'name' });
  });

  it('signale et écarte un identifiant de créneau mal formé', () => {
    const parsed = parseDraft({ choices: { 'pas-un-creneau': ['x'] } });
    expect(parsed?.draft.choices).toEqual({});
    expect(parsed?.warnings).toContainEqual({
      kind: 'unknown-slot',
      slotId: 'pas-un-creneau',
    });
  });

  it('conserve un identifiant de créneau bien formé', () => {
    const parsed = parseDraft({ choices: { 'class:roublard:skills': ['discretion'] } });
    expect(parsed?.draft.choices).toEqual({ 'class:roublard:skills': ['discretion'] });
  });

  it('plafonne le nombre de réponses par créneau', () => {
    const many = Array.from({ length: 40 }, (_, index) => `s${String(index)}`);
    const parsed = parseDraft({ choices: { 'class:roublard:skills': many } });
    expect(parsed?.draft.choices['class:roublard:skills']).toHaveLength(12);
  });

  it('plafonne le nombre de créneaux', () => {
    const choices: Record<string, string[]> = {};
    for (let index = 0; index < 200; index += 1) {
      choices[`class:c${String(index)}:skills`] = ['x'];
    }
    expect(Object.keys(parseDraft({ choices })?.draft.choices ?? {})).toHaveLength(64);
  });

  it('borne un score aberrant plutôt que de le rejeter', () => {
    const parsed = parseDraft({ baseAbilities: { force: 999, dexterite: -5 } });
    expect(parsed?.draft.baseAbilities.force).toBe(20);
    expect(parsed?.draft.baseAbilities.dexterite).toBe(1);
  });

  it('remet à 8 un score qui n’est pas un entier', () => {
    const parsed = parseDraft({ baseAbilities: { force: 'douze' } });
    expect(parsed?.draft.baseAbilities.force).toBe(8);
  });

  it('retombe sur la répartition de points pour une méthode inconnue', () => {
    expect(parseDraft({ abilityMethod: 'jets' })?.draft.abilityMethod).toBe('point-buy');
  });

  it('ignore une valeur de choix qui n’est pas une chaîne', () => {
    const parsed = parseDraft({
      choices: { 'class:roublard:skills': [1, 'discretion'] },
    });
    expect(parsed?.draft.choices['class:roublard:skills']).toEqual(['discretion']);
  });
});
