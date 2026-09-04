import { describe, expect, it } from 'vitest';
import { MINI_CATALOGUE } from './fixtures/miniCatalogue';
import { catalogueWithPacks } from './packCatalogue';
import { spellsForClass } from './catalogue';
import type { ContentPack } from './pack';

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
