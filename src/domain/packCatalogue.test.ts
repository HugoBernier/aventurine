import { describe, expect, it } from 'vitest';
import { MINI_CATALOGUE } from './fixtures/miniCatalogue';
import { catalogueWithPacks } from './packCatalogue';
import { findClass, spellsForClass } from './catalogue';
import type { ContentPack, GraftedSubclass } from './pack';

const pack: ContentPack = {
  info: {
    id: 'karn',
    name: 'Les Brumes de Karn',
    author: '',
    description: '',
    updatedAt: '2026-09-04T10:12:00.000Z',
  },
  spells: [
    {
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
    },
  ],
  subclasses: [],
};

describe('le catalogue augmenté des packs', () => {
  it('rend le catalogue tel quel quand rien n’est installé', () => {
    expect(catalogueWithPacks(MINI_CATALOGUE, [])).toBe(MINI_CATALOGUE);
  });

  it('offre le sort du pack au clerc, à côté de ceux du SRD', () => {
    const augmented = catalogueWithPacks(MINI_CATALOGUE, [pack]);
    const first = spellsForClass(augmented, 'clerc', 1);
    expect(first.map((entry) => entry.id)).toContain('karn-appel-des-brumes');
    expect(first.length).toBeGreaterThan(1);
  });

  it('ne touche pas au catalogue d’origine', () => {
    catalogueWithPacks(MINI_CATALOGUE, [pack]);
    expect(MINI_CATALOGUE.spells.map((entry) => entry.id)).not.toContain(
      'karn-appel-des-brumes',
    );
  });
});

const college: GraftedSubclass = {
  forClassId: 'clerc',
  subclass: {
    id: 'karn-domaine-des-brumes',
    name: 'Domaine des Brumes',
    blurb: 'Ton dieu parle dans le brouillard.',
    facts: ['Voile', 'Chant sourd', '—'],
    features: [{ level: 1, name: 'Voile', text: 'Tu appelles la brume.' }],
    proficiencies: null,
    alwaysPreparedSpells: [],
    unarmoredDefense: null,
    bonusHitPointsPerLevel: 0,
    choices: [],
  },
};

const grafting: ContentPack = { ...pack, spells: [], subclasses: [college] };

describe('une sous-classe greffée sur une classe du SRD', () => {
  it('vient s’ajouter aux voies de cette classe', () => {
    const augmented = catalogueWithPacks(MINI_CATALOGUE, [grafting]);
    const cleric = findClass(augmented, 'clerc');
    expect(cleric?.subclasses.map((entry) => entry.id)).toContain(
      'karn-domaine-des-brumes',
    );
  });

  it('n’enlève ni ne remplace aucune voie du SRD', () => {
    const before = findClass(MINI_CATALOGUE, 'clerc')?.subclasses ?? [];
    const after =
      findClass(catalogueWithPacks(MINI_CATALOGUE, [grafting]), 'clerc')?.subclasses ??
      [];
    expect(after.slice(0, before.length)).toEqual(before);
    expect(after).toHaveLength(before.length + 1);
  });

  it('ne touche pas aux classes qu’elle ne vise pas', () => {
    const augmented = catalogueWithPacks(MINI_CATALOGUE, [grafting]);
    expect(findClass(augmented, 'roublard')).toBe(findClass(MINI_CATALOGUE, 'roublard'));
  });

  it('laisse le catalogue d’origine intact quand le pack s’en va', () => {
    catalogueWithPacks(MINI_CATALOGUE, [grafting]);
    expect(findClass(MINI_CATALOGUE, 'clerc')?.subclasses.map((e) => e.id)).not.toContain(
      'karn-domaine-des-brumes',
    );
  });
});
