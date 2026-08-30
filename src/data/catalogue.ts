// Contenu dérivé du SRD 5.1 (CC BY 4.0), traduction Aventurine.
//
// Module d'agrégation à l'intérieur de la couche `data` : il compose le
// contenu, il ne ré-exporte aucune autre couche.
import type { Catalogue } from '../domain/catalogue';
import { ABILITY_ENTRIES } from './abilities';
import { ALIGNMENT_ENTRIES } from './alignments';
import { ANCESTRY_ENTRIES } from './ancestries';
import { ARMOR_ENTRIES } from './armor';
import { BACKGROUND_ENTRIES } from './backgrounds';
import { FEAT_ENTRIES } from './feats';
import { CLASS_ENTRIES } from './classes/index';
import { FIGHTING_STYLE_ENTRIES } from './fightingStyles';
import { ITEM_ENTRIES } from './gear';
import { LANGUAGE_ENTRIES } from './languages';
import { RACE_ENTRIES } from './races';
import { SKILL_ENTRIES } from './skills';
import { SPELL_ENTRIES } from './spells';
import { TOOL_ENTRIES } from './tools';
import { WEAPON_ENTRIES } from './weapons';

export const CATALOGUE: Catalogue = {
  abilities: ABILITY_ENTRIES,
  skills: SKILL_ENTRIES,
  races: RACE_ENTRIES,
  classes: CLASS_ENTRIES,
  backgrounds: BACKGROUND_ENTRIES,
  feats: FEAT_ENTRIES,
  alignments: ALIGNMENT_ENTRIES,
  languages: LANGUAGE_ENTRIES,
  tools: TOOL_ENTRIES,
  weapons: WEAPON_ENTRIES,
  armor: ARMOR_ENTRIES,
  items: ITEM_ENTRIES,
  spells: SPELL_ENTRIES,
  ancestries: ANCESTRY_ENTRIES,
  fightingStyles: FIGHTING_STYLE_ENTRIES,
};
