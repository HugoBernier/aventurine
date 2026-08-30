// Contenu dérivé du SRD 5.1 (CC BY 4.0) — traduction Aventurine.
import type { Armor } from '../domain/content';

const light = (id: string, name: string, base: number): Armor => ({
  id,
  name,
  category: 'legere',
  base,
  dexterity: 'full',
  strengthRequired: 0,
});

const medium = (id: string, name: string, base: number): Armor => ({
  id,
  name,
  category: 'intermediaire',
  base,
  dexterity: 'capped-2',
  strengthRequired: 0,
});

const heavy = (id: string, name: string, base: number, strength: number): Armor => ({
  id,
  name,
  category: 'lourde',
  base,
  dexterity: 'none',
  strengthRequired: strength,
});

export const ARMOR_ENTRIES: readonly Armor[] = [
  light('armure-matelassee', 'Armure matelassée', 11),
  light('armure-de-cuir', 'Armure de cuir', 11),
  light('armure-de-cuir-clairsemee', 'Armure de cuir clouté', 12),

  medium('chemise-de-mailles', 'Chemise de mailles', 13),
  medium('armure-d-ecailles', 'Armure d’écailles', 14),
  medium('cuirasse', 'Cuirasse', 14),
  medium('demi-plate', 'Demi-plate', 15),

  heavy('broigne', 'Broigne', 14, 13),
  heavy('cotte-de-mailles', 'Cotte de mailles', 16, 13),
  heavy('clibanion', 'Clibanion', 17, 15),
  heavy('harnois', 'Harnois', 18, 15),

  {
    id: 'bouclier',
    name: 'Bouclier',
    category: 'bouclier',
    base: 2,
    dexterity: 'none',
    strengthRequired: 0,
  },
];
