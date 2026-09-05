import { describe, expect, it } from 'vitest';
import { formatPicking } from './picking';

describe('ce qu’il reste à choisir', () => {
  it('compte ce qui manque, pas ce qui est fait', () => {
    expect(formatPicking(2, 4, 'spell')).toBe('Encore 2 sorts à choisir');
  });

  it('met le nom au singulier quand il n’en reste qu’un', () => {
    expect(formatPicking(1, 4, 'spell')).toBe('Encore 1 sort à choisir');
  });

  it('nomme ce qu’on choisit, genre par genre', () => {
    expect(formatPicking(2, 2, 'skill')).toBe('Encore 2 compétences à choisir');
    expect(formatPicking(2, 2, 'language')).toBe('Encore 2 langues à choisir');
    expect(formatPicking(1, 1, 'tool')).toBe('Encore 1 outil à choisir');
  });

  it('se passe de nom pour un genre qui n’en a pas', () => {
    expect(formatPicking(2, 3, 'equipment')).toBe('Encore 2 à choisir');
  });

  it('dit que c’est complet, et comment en changer', () => {
    expect(formatPicking(0, 4, 'spell')).toBe(
      'C’est complet : tu as tes 4 sorts. Décoche pour en changer.',
    );
    expect(formatPicking(0, 3, 'equipment')).toBe(
      'C’est complet. Décoche pour en changer.',
    );
  });
});
