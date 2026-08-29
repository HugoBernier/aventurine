import { describe, expect, it } from 'vitest';
import { isDeferredKind } from './choiceSpec';

describe('regroupement des créneaux de maîtrise', () => {
  it('diffère les compétences, langues et outils vers l’étape des maîtrises', () => {
    expect(isDeferredKind('skill')).toBe(true);
    expect(isDeferredKind('language')).toBe(true);
    expect(isDeferredKind('tool')).toBe(true);
  });

  it('diffère l’expertise, dont les options sont les compétences déjà acquises', () => {
    expect(isDeferredKind('expertise')).toBe(true);
  });

  it('laisse les sorts et l’équipement derrière leur propre étape', () => {
    expect(isDeferredKind('cantrip')).toBe(false);
    expect(isDeferredKind('spell')).toBe(false);
    expect(isDeferredKind('equipment')).toBe(false);
  });

  it('laisse les choix propres à la race ou à la classe à leur place', () => {
    expect(isDeferredKind('ability')).toBe(false);
    expect(isDeferredKind('ancestry')).toBe(false);
    expect(isDeferredKind('fighting-style')).toBe(false);
  });
});
