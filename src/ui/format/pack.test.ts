import { describe, expect, it } from 'vitest';
import type { ContentPack, GraftedSubclass } from '../../domain/pack';
import type { Spell } from '../../domain/content';
import {
  formatPackContents,
  formatPackDate,
  formatPackIssue,
  formatPackLine,
} from './pack';

const spell: Spell = {
  id: 'karn-appel-des-brumes',
  name: 'Appel des brumes',
  level: 1,
  school: 'invocation',
  castingTime: '1 action',
  range: '18 mètres',
  components: { verbal: true, somatic: true, material: null },
  duration: 'instantanée',
  concentration: false,
  ritual: false,
  summary: 'Une brume épaisse se lève.',
  classes: ['clerc'],
};

const graft: GraftedSubclass = {
  forClassId: 'clerc',
  subclass: {
    id: 'karn-domaine-des-brumes',
    name: 'Domaine des Brumes',
    blurb: 'Ton dieu parle dans le brouillard.',
    facts: ['Voile', '—', '—'],
    features: [{ level: 1, name: 'Voile', text: 'Tu appelles la brume.' }],
    proficiencies: null,
    alwaysPreparedSpells: [],
    unarmoredDefense: null,
    bonusHitPointsPerLevel: 0,
    choices: [],
  },
};

const karn: ContentPack = {
  info: {
    id: 'karn',
    name: 'Les Brumes de Karn',
    author: 'Hugo',
    description: '',
    updatedAt: '2026-09-04T10:12:00.000Z',
  },
  spells: [],
  subclasses: [],
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

  it('compte ce que le pack apporte, genre par genre', () => {
    expect(formatPackContents({ ...karn, spells: [spell], subclasses: [graft] })).toBe(
      '1 sort · 1 sous-classe',
    );
  });

  it('ne compte pas un genre absent : « 0 sous-classe » est du bruit', () => {
    expect(formatPackContents({ ...karn, spells: [spell] })).toBe('1 sort');
  });

  it('le dit quand le pack est encore vide', () => {
    expect(formatPackContents(karn)).toBe('rien pour l’instant');
  });
});

describe('ce qu’on dit d’un pack refusé', () => {
  it('nomme le sort par son identifiant quand il en a un', () => {
    expect(
      formatPackIssue({ kind: 'bad-prefix', at: 2, entry: 'brume', what: 'spell' }),
    ).toContain('Sort « brume »');
  });

  it('le nomme par son rang quand rien ne le désigne', () => {
    expect(
      formatPackIssue({
        kind: 'missing-field',
        at: 3,
        entry: '',
        what: 'spell',
        field: 'name',
      }),
    ).toBe('Sort n° 3 : il lui manque un nom.');
  });

  it('dit ce que cette version ne sait pas encore lire', () => {
    expect(formatPackIssue({ kind: 'not-yet-supported', section: 'classes' })).toContain(
      'des classes',
    );
  });
});
