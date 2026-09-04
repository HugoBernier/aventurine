import { describe, expect, it } from 'vitest';
import type { ContentPack } from '../../domain/pack';
import {
  formatPackContents,
  formatPackDate,
  formatPackIssue,
  formatPackLine,
} from './pack';

const karn: ContentPack = {
  info: {
    id: 'karn',
    name: 'Les Brumes de Karn',
    author: 'Hugo',
    description: '',
    updatedAt: '2026-09-04T10:12:00.000Z',
  },
  spells: [],
};

describe('ce qu’on dit d’un pack', () => {
  it('donne la date pour version : c’est elle qu’on lit', () => {
    expect(formatPackLine(karn)).toBe('par Hugo, version du 4 septembre 2026');
  });

  it('se passe de l’auteur quand il n’est pas donné', () => {
    expect(formatPackLine({ ...karn, info: { ...karn.info, author: '' } })).toBe(
      'version du 4 septembre 2026',
    );
  });

  it('ne prétend pas dater ce qui n’est pas une date', () => {
    expect(formatPackDate('avant-hier')).toBe('');
  });

  it('compte ce que le pack apporte', () => {
    expect(formatPackContents(karn)).toBe('0 sort');
  });
});

describe('ce qu’on dit d’un pack refusé', () => {
  it('nomme le sort par son identifiant quand il en a un', () => {
    expect(formatPackIssue({ kind: 'bad-prefix', at: 2, entry: 'brume' })).toContain(
      'Sort « brume »',
    );
  });

  it('le nomme par son rang quand rien ne le désigne', () => {
    expect(
      formatPackIssue({ kind: 'missing-field', at: 3, entry: '', field: 'name' }),
    ).toBe('Sort n° 3 : il lui manque un nom.');
  });

  it('dit ce que cette version ne sait pas encore lire', () => {
    expect(formatPackIssue({ kind: 'not-yet-supported', section: 'classes' })).toContain(
      'des classes',
    );
  });
});
