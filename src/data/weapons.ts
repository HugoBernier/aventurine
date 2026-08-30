// Contenu dérivé du SRD 5.1 (CC BY 4.0), traduction Aventurine.
import type { Weapon } from '../domain/content';

interface Draft {
  readonly id: string;
  readonly name: string;
  readonly dice: string;
  readonly type: Weapon['damageType'];
  readonly finesse?: true;
  readonly range?: readonly [number, number];
  readonly properties?: readonly string[];
}

const make =
  (category: Weapon['category']) =>
  (draft: Draft): Weapon => ({
    id: draft.id,
    name: draft.name,
    category,
    damageDice: draft.dice,
    damageType: draft.type,
    finesse: draft.finesse === true,
    ranged: draft.range !== undefined,
    rangeMeters: draft.range ?? null,
    properties: draft.properties ?? [],
  });

const simple = make('courantes');
const martial = make('de-guerre');

export const WEAPON_ENTRIES: readonly Weapon[] = [
  // Armes courantes de corps à corps
  simple({
    id: 'baton',
    name: 'Bâton',
    dice: '1d6',
    type: 'contondant',
    properties: ['polyvalente (1d8)'],
  }),
  simple({
    id: 'dague',
    name: 'Dague',
    dice: '1d4',
    type: 'perforant',
    finesse: true,
    properties: ['légère', 'lancer'],
  }),
  simple({
    id: 'gourdin',
    name: 'Gourdin',
    dice: '1d4',
    type: 'contondant',
    properties: ['légère'],
  }),
  simple({
    id: 'hachette',
    name: 'Hachette',
    dice: '1d6',
    type: 'tranchant',
    properties: ['légère', 'lancer'],
  }),
  simple({
    id: 'javeline',
    name: 'Javeline',
    dice: '1d6',
    type: 'perforant',
    properties: ['lancer'],
  }),
  simple({
    id: 'lance',
    name: 'Lance',
    dice: '1d6',
    type: 'perforant',
    properties: ['lancer', 'polyvalente (1d8)'],
  }),
  simple({ id: 'masse-d-armes', name: 'Masse d’armes', dice: '1d6', type: 'contondant' }),
  simple({
    id: 'marteau-leger',
    name: 'Marteau léger',
    dice: '1d4',
    type: 'contondant',
    properties: ['légère', 'lancer'],
  }),
  simple({
    id: 'gourdin-lourd',
    name: 'Massue',
    dice: '1d8',
    type: 'contondant',
    properties: ['à deux mains'],
  }),
  simple({
    id: 'faucille',
    name: 'Faucille',
    dice: '1d4',
    type: 'tranchant',
    properties: ['légère'],
  }),

  // Armes courantes à distance
  simple({
    id: 'arbalete-legere',
    name: 'Arbalète légère',
    dice: '1d8',
    type: 'perforant',
    range: [24, 96],
    properties: ['munitions', 'chargement', 'à deux mains'],
  }),
  simple({
    id: 'arc-court',
    name: 'Arc court',
    dice: '1d6',
    type: 'perforant',
    range: [24, 96],
    properties: ['munitions', 'à deux mains'],
  }),
  simple({
    id: 'fronde',
    name: 'Fronde',
    dice: '1d4',
    type: 'contondant',
    range: [9, 36],
    properties: ['munitions'],
  }),
  simple({
    id: 'flechette',
    name: 'Fléchette',
    dice: '1d4',
    type: 'perforant',
    finesse: true,
    range: [6, 18],
    properties: ['lancer'],
  }),

  // Armes de guerre de corps à corps
  martial({
    id: 'epee-longue',
    name: 'Épée longue',
    dice: '1d8',
    type: 'tranchant',
    properties: ['polyvalente (1d10)'],
  }),
  martial({
    id: 'epee-courte',
    name: 'Épée courte',
    dice: '1d6',
    type: 'perforant',
    finesse: true,
    properties: ['légère'],
  }),
  martial({
    id: 'epee-a-deux-mains',
    name: 'Épée à deux mains',
    dice: '2d6',
    type: 'tranchant',
    properties: ['lourde', 'à deux mains'],
  }),
  martial({
    id: 'rapiere',
    name: 'Rapière',
    dice: '1d8',
    type: 'perforant',
    finesse: true,
  }),
  martial({
    id: 'cimeterre',
    name: 'Cimeterre',
    dice: '1d6',
    type: 'tranchant',
    finesse: true,
    properties: ['légère'],
  }),
  martial({
    id: 'hache-d-armes',
    name: 'Hache d’armes',
    dice: '1d8',
    type: 'tranchant',
    properties: ['polyvalente (1d10)'],
  }),
  martial({
    id: 'hache-a-deux-mains',
    name: 'Hache à deux mains',
    dice: '1d12',
    type: 'tranchant',
    properties: ['lourde', 'à deux mains'],
  }),
  martial({
    id: 'marteau-de-guerre',
    name: 'Marteau de guerre',
    dice: '1d8',
    type: 'contondant',
    properties: ['polyvalente (1d10)'],
  }),
  martial({
    id: 'fleau-d-armes',
    name: 'Fléau d’armes',
    dice: '1d8',
    type: 'contondant',
  }),
  martial({
    id: 'hallebarde',
    name: 'Hallebarde',
    dice: '1d10',
    type: 'tranchant',
    properties: ['lourde', 'allonge', 'à deux mains'],
  }),
  martial({
    id: 'pique',
    name: 'Pique',
    dice: '1d10',
    type: 'perforant',
    properties: ['lourde', 'allonge', 'à deux mains'],
  }),
  martial({
    id: 'trident',
    name: 'Trident',
    dice: '1d6',
    type: 'perforant',
    properties: ['lancer', 'polyvalente (1d8)'],
  }),

  // Armes de guerre à distance
  martial({
    id: 'arc-long',
    name: 'Arc long',
    dice: '1d8',
    type: 'perforant',
    range: [45, 180],
    properties: ['munitions', 'lourde', 'à deux mains'],
  }),
  martial({
    id: 'arbalete-lourde',
    name: 'Arbalète lourde',
    dice: '1d10',
    type: 'perforant',
    range: [30, 120],
    properties: ['munitions', 'chargement', 'lourde', 'à deux mains'],
  }),
  martial({
    id: 'arbalete-de-poing',
    name: 'Arbalète de poing',
    dice: '1d6',
    type: 'perforant',
    range: [9, 36],
    properties: ['munitions', 'légère', 'chargement'],
  }),
];
