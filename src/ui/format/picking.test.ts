import { describe, expect, it } from 'vitest';
import { formatPickSource, formatPicking } from './picking';

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

  it('dit que c’est complet en une poignée de mots : il partage sa ligne', () => {
    expect(formatPicking(0, 4, 'spell')).toBe('Tu as tes 4 sorts');
    expect(formatPicking(0, 3, 'equipment')).toBe('C’est complet');
  });
});

describe('d’où vient un nombre de sorts préparés', () => {
  it('pose les deux termes du calcul, pour un demi-lanceur', () => {
    const from = { ability: 'charisme', modifier: -1, casterLevel: 3, halved: true };
    expect(formatPickSource(2, from, 'Charisme')).toBe(
      'Tu en prépares 2 : la moitié de ton niveau (3) plus ton Charisme (-1).',
    );
  });

  it('ne parle pas de moitié à un lanceur complet', () => {
    const from = { ability: 'sagesse', modifier: 3, casterLevel: 7, halved: false };
    expect(formatPickSource(10, from, 'Sagesse')).toBe(
      'Tu en prépares 10 : ton niveau (7) plus ta Sagesse (+3).',
    );
  });

  it('accorde le possessif, élision comprise', () => {
    const from = { ability: 'intelligence', modifier: 2, casterLevel: 5, halved: false };
    expect(formatPickSource(7, from, 'Intelligence')).toContain('ton Intelligence');
  });
});
