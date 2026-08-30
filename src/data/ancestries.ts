// Contenu dérivé du SRD 5.1 (CC BY 4.0), traduction Aventurine.
import type { Ancestry } from '../domain/content';

const CONE = 'cône de 4,50 m';
const LINE = 'ligne de 9 m';

export const ANCESTRY_ENTRIES: readonly Ancestry[] = [
  {
    id: 'airain',
    name: 'Airain',
    blurb: 'Le souffle des dragons d’airain.',
    damageType: 'feu',
    breathWeapon: LINE,
  },
  {
    id: 'argent',
    name: 'Argent',
    blurb: 'Le souffle des dragons d’argent.',
    damageType: 'froid',
    breathWeapon: CONE,
  },
  {
    id: 'blanc',
    name: 'Blanc',
    blurb: 'Le souffle des dragons blancs.',
    damageType: 'froid',
    breathWeapon: CONE,
  },
  {
    id: 'bleu',
    name: 'Bleu',
    blurb: 'Le souffle des dragons bleus.',
    damageType: 'foudre',
    breathWeapon: LINE,
  },
  {
    id: 'bronze',
    name: 'Bronze',
    blurb: 'Le souffle des dragons de bronze.',
    damageType: 'foudre',
    breathWeapon: LINE,
  },
  {
    id: 'cuivre',
    name: 'Cuivre',
    blurb: 'Le souffle des dragons de cuivre.',
    damageType: 'acide',
    breathWeapon: LINE,
  },
  {
    id: 'noir',
    name: 'Noir',
    blurb: 'Le souffle des dragons noirs.',
    damageType: 'acide',
    breathWeapon: LINE,
  },
  {
    id: 'or',
    name: 'Or',
    blurb: 'Le souffle des dragons d’or.',
    damageType: 'feu',
    breathWeapon: CONE,
  },
  {
    id: 'rouge',
    name: 'Rouge',
    blurb: 'Le souffle des dragons rouges.',
    damageType: 'feu',
    breathWeapon: CONE,
  },
  {
    id: 'vert',
    name: 'Vert',
    blurb: 'Le souffle des dragons verts.',
    damageType: 'poison',
    breathWeapon: CONE,
  },
];
