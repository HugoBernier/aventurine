// Contenu dérivé du SRD 5.1 (CC BY 4.0) — traduction Aventurine.
//
// Module d'agrégation À L'INTÉRIEUR de la couche `data` : autorisé par la
// charte, qui n'interdit que les barils à la racine de `src/` ou d'une couche.
import type { CharacterClass } from '../../domain/content';
import { BARBARIAN, FIGHTER, MONK, ROGUE } from './martial';
import { BARD, CLERIC, DRUID, SORCERER, WARLOCK, WIZARD } from './casters';
import { PALADIN, RANGER } from './halfCasters';

/** Ordre alphabétique français : c'est celui que l'écran affiche. */
export const CLASS_ENTRIES: readonly CharacterClass[] = [
  BARBARIAN,
  BARD,
  CLERIC,
  DRUID,
  SORCERER,
  FIGHTER,
  WIZARD,
  MONK,
  WARLOCK,
  PALADIN,
  RANGER,
  ROGUE,
];
