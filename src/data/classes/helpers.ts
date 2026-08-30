// Contenu dérivé du SRD 5.1 (CC BY 4.0) — traduction Aventurine.
import type { ChoiceSpec, SkillSpec, SpellSpec } from '../../domain/choiceSpec';
import type {
  EquipmentOption,
  Facts,
  ItemLine,
  Proficiencies,
} from '../../domain/content';
import type { SkillId } from '../../domain/skills';

export const NONE: Proficiencies = {
  armor: [],
  weaponCategories: [],
  weapons: [],
  tools: [],
};

export function proficiencies(part: Partial<Proficiencies>): Proficiencies {
  return { ...NONE, ...part };
}

export function item(itemId: string, quantity = 1): ItemLine {
  return { itemId, quantity };
}

export function equipmentOption(
  id: string,
  name: string,
  blurb: string,
  facts: Facts,
  items: readonly ItemLine[],
): EquipmentOption {
  return { id, name, blurb, facts, items };
}

export function skillChoice(
  title: string,
  help: string,
  pick: number,
  from: readonly SkillId[],
): SkillSpec {
  return { kind: 'skill', subject: 'skills', title, help, pick, from };
}

export function cantripChoice(classId: string, pick: number, help: string): SpellSpec {
  return {
    kind: 'cantrip',
    subject: 'cantrips',
    title: 'Tes tours de magie',
    help,
    pick,
    listFrom: classId,
  };
}

export function spellChoice(classId: string, pick: number, help: string): SpellSpec {
  return {
    kind: 'spell',
    subject: 'spells',
    title: 'Tes sorts de niveau 1',
    help,
    pick,
    listFrom: classId,
  };
}

export function equipmentChoice(
  subject: string,
  title: string,
  help: string,
  from: readonly string[],
): ChoiceSpec {
  return { kind: 'equipment', subject, title, help, pick: 1, from };
}
