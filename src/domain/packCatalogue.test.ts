import { describe, expect, it } from 'vitest';
import { MINI_CATALOGUE } from './fixtures/miniCatalogue';
import { catalogueWithPacks } from './packCatalogue';
import { findClass, findRace, spellsForClass } from './catalogue';
import type { ContentPack, GraftedSubclass } from './pack';
import type { Race } from './content';
import { NO_PROFICIENCIES } from './content';

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
  races: [],
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

const brumeux: Race = {
  id: 'karn-brumeux',
  name: 'Brumeux',
  blurb: 'Un peuple né d’une malédiction.',
  facts: ['+2 au choix', '7,50 m', 'Vision 18 m'],
  abilityBonuses: {},
  size: 'M',
  speed: 7.5,
  darkvision: 18,
  languages: ['commun'],
  skills: [],
  proficiencies: NO_PROFICIENCIES,
  resistances: [],
  features: [{ name: 'Voile natal', text: 'La brume ne te ralentit jamais.' }],
  choices: [],
  subraces: [],
};

describe('un peuple venu d’un pack', () => {
  const peopled: ContentPack = { ...pack, spells: [], races: [brumeux] };

  it('s’ajoute aux peuples du SRD, à la fin', () => {
    const augmented = catalogueWithPacks(MINI_CATALOGUE, [peopled]);
    expect(augmented.races.map((entry) => entry.id)).toEqual([
      ...MINI_CATALOGUE.races.map((entry) => entry.id),
      'karn-brumeux',
    ]);
  });

  it('n’enlève ni ne remplace aucun peuple du SRD', () => {
    const augmented = catalogueWithPacks(MINI_CATALOGUE, [peopled]);
    expect(findRace(augmented, 'nain')).toBe(findRace(MINI_CATALOGUE, 'nain'));
  });
});
