import { ABILITIES, abilityModifier, abilityScores } from './abilities';
import type { AbilityId, AbilityScores } from './abilities';
import {
  findArmor,
  findBackground,
  findClass,
  findRace,
  findSubrace,
  findWeapon,
} from './catalogue';
import type { Catalogue } from './catalogue';
import type { ChoiceSource } from './choice';
import type {
  Armor,
  DamageType,
  ItemLine,
  PreparationMode,
  Proficiencies,
  UnarmoredDefense,
} from './content';
import { NO_PROFICIENCIES } from './content';
import type { CharacterDraft } from './draft';
import { openChoices } from './openChoices';
import { ALL_SKILLS, skillAbility } from './skills';
import type { SkillId } from './skills';

export const PROFICIENCY_BONUS_LEVEL_1 = 2;

function sum(parts: readonly BreakdownPart[]): number {
  let total = 0;
  for (const part of parts) {
    total += part.value;
  }
  return total;
}

/** Le domaine porte des identifiants ; `ui/` va chercher les noms dans `data/`. */
export interface BreakdownPart {
  readonly source: 'base' | 'ability' | 'armor' | 'shield' | 'feature';
  readonly id: string | null;
  readonly value: number;
}

export interface ValueBreakdown {
  readonly total: number;
  readonly parts: readonly BreakdownPart[];
}

export interface RollLine {
  readonly id: string;
  readonly ability: AbilityId;
  readonly proficient: boolean;
  readonly expert: boolean;
  readonly bonus: number;
}

export interface Attack {
  readonly weaponId: string;
  readonly attackBonus: number;
  readonly damageDice: string;
  readonly damageBonus: number;
  readonly damageType: DamageType;
  readonly rangeMeters: readonly [number, number] | null;
}

export interface SpellcastingSheet {
  readonly ability: AbilityId;
  readonly saveDc: number;
  readonly attackBonus: number;
  readonly level1Slots: number;
  readonly preparation: PreparationMode;
  readonly preparedCount: number | null;
  readonly cantripIds: readonly string[];
  readonly spellIds: readonly string[];
  readonly alwaysPreparedIds: readonly string[];
}

export interface SheetFeature {
  readonly source: ChoiceSource;
  readonly name: string;
  readonly text: string;
}

export interface CharacterSheet {
  readonly abilities: AbilityScores;
  readonly modifiers: AbilityScores;
  readonly proficiencyBonus: number;
  readonly maxHitPoints: number | null;
  readonly hitDice: { readonly count: number; readonly die: number } | null;
  readonly armorClass: ValueBreakdown | null;
  readonly initiative: number;
  readonly speedMeters: number | null;
  readonly speedReducedByArmor: boolean;
  /** 0 quand la race n'y voit pas mieux qu'un humain ; `null` avant tout choix. */
  readonly darkvisionMeters: number | null;
  readonly saves: readonly RollLine[];
  readonly skills: readonly RollLine[];
  readonly attacks: readonly Attack[];
  readonly spellcasting: SpellcastingSheet | null;
  readonly proficiencies: Proficiencies;
  readonly languageIds: readonly string[];
  readonly equipment: readonly ItemLine[];
  readonly goldPieces: number;
  readonly features: readonly SheetFeature[];
}

function pickedByKind(
  draft: CharacterDraft,
  catalogue: Catalogue,
  kinds: readonly string[],
): readonly string[] {
  const picked: string[] = [];
  for (const slot of openChoices(draft, catalogue)) {
    if (kinds.includes(slot.kind)) {
      picked.push(...(draft.choices[slot.id] ?? []));
    }
  }
  return picked;
}

/** Base + race + sous-race + créneaux `ability`. Aucun plafond au niveau 1. */
function finalAbilities(draft: CharacterDraft, catalogue: Catalogue): AbilityScores {
  const race = findRace(catalogue, draft.raceId);
  const subrace = findSubrace(catalogue, draft.raceId, draft.subraceId);
  const chosen = pickedByKind(draft, catalogue, ['ability']);

  return abilityScores((ability) => {
    const racial = race?.abilityBonuses[ability] ?? 0;
    const subracial = subrace?.abilityBonuses[ability] ?? 0;
    const bonusCount = chosen.filter((id) => id === ability).length;
    return draft.baseAbilities[ability] + racial + subracial + bonusCount;
  });
}

function mergeProficiencies(
  parts: readonly (Proficiencies | null | undefined)[],
): Proficiencies {
  const armor = new Set<Proficiencies['armor'][number]>();
  const weaponCategories = new Set<Proficiencies['weaponCategories'][number]>();
  const weapons = new Set<string>();
  const tools = new Set<string>();
  for (const part of parts) {
    if (part == null) {
      continue;
    }
    for (const entry of part.armor) {
      armor.add(entry);
    }
    for (const entry of part.weaponCategories) {
      weaponCategories.add(entry);
    }
    for (const entry of part.weapons) {
      weapons.add(entry);
    }
    for (const entry of part.tools) {
      tools.add(entry);
    }
  }
  return {
    armor: [...armor],
    weaponCategories: [...weaponCategories],
    weapons: [...weapons],
    tools: [...tools],
  };
}

function collectEquipment(
  draft: CharacterDraft,
  catalogue: Catalogue,
): { readonly lines: readonly ItemLine[]; readonly gold: number } {
  const lines: ItemLine[] = [];
  const characterClass = findClass(catalogue, draft.classId);
  const background = findBackground(catalogue, draft.backgroundId);

  if (characterClass !== null) {
    lines.push(...characterClass.fixedEquipment);
    const chosen = pickedByKind(draft, catalogue, ['equipment']);
    for (const optionId of chosen) {
      const option = characterClass.equipmentOptions.find(
        (entry) => entry.id === optionId,
      );
      if (option !== undefined) {
        lines.push(...option.items);
      }
    }
  }
  if (background !== null) {
    lines.push(...background.equipment);
  }
  return { lines, gold: background?.goldPieces ?? 0 };
}

function wornArmor(
  lines: readonly ItemLine[],
  catalogue: Catalogue,
): { readonly armor: Armor | null; readonly hasShield: boolean } {
  let armor: Armor | null = null;
  let hasShield = false;
  for (const line of lines) {
    const found = findArmor(catalogue, line.itemId);
    if (found === null) {
      continue;
    }
    if (found.category === 'bouclier') {
      hasShield = true;
    } else if (armor === null || found.base > armor.base) {
      armor = found;
    }
  }
  return { armor, hasShield };
}

function dexterityContribution(armor: Armor, dexterityModifier: number): number {
  switch (armor.dexterity) {
    case 'full': {
      return dexterityModifier;
    }
    case 'capped-2': {
      return Math.min(dexterityModifier, 2);
    }
    case 'none': {
      return 0;
    }
  }
}

const SHIELD_BONUS = 2;

function shieldParts(hasShield: boolean): readonly BreakdownPart[] {
  return hasShield ? [{ source: 'shield', id: 'bouclier', value: SHIELD_BONUS }] : [];
}

function candidate(parts: readonly BreakdownPart[]): ValueBreakdown {
  return { total: sum(parts), parts };
}

/** Sans armure et sans aptitude : 10 + Dextérité. Toujours disponible. */
function plainCandidate(modifiers: AbilityScores, hasShield: boolean): ValueBreakdown {
  return candidate([
    { source: 'base', id: null, value: 10 },
    { source: 'ability', id: 'dexterite', value: modifiers.dexterite },
    ...shieldParts(hasShield),
  ]);
}

/** Défense sans armure : barbare, moine, ensorceleur draconique. */
function unarmoredDefenseCandidate(
  defense: UnarmoredDefense,
  modifiers: AbilityScores,
  hasShield: boolean,
): ValueBreakdown {
  const abilityParts = defense.addedAbilities.map((ability): BreakdownPart => ({
    source: 'ability',
    id: ability,
    value: modifiers[ability],
  }));
  return candidate([
    { source: 'base', id: null, value: defense.base },
    ...abilityParts,
    ...shieldParts(hasShield && defense.shieldAllowed),
  ]);
}

function armoredCandidate(
  armor: Armor,
  modifiers: AbilityScores,
  hasShield: boolean,
  styleBonus: number,
): ValueBreakdown {
  const dexterity = dexterityContribution(armor, modifiers.dexterite);
  return candidate([
    { source: 'armor', id: armor.id, value: armor.base },
    ...(dexterity === 0
      ? []
      : [{ source: 'ability' as const, id: 'dexterite', value: dexterity }]),
    ...shieldParts(hasShield),
    ...(styleBonus === 0
      ? []
      : [{ source: 'feature' as const, id: 'style-de-combat', value: styleBonus }]),
  ]);
}

function best(candidates: readonly ValueBreakdown[]): ValueBreakdown | null {
  let winner: ValueBreakdown | null = null;
  for (const entry of candidates) {
    if (winner === null || entry.total > winner.total) {
      winner = entry;
    }
  }
  return winner;
}

/** On calcule tous les candidats et on garde le meilleur, avec sa provenance. */
function armorClass(
  draft: CharacterDraft,
  catalogue: Catalogue,
  modifiers: AbilityScores,
  lines: readonly ItemLine[],
): ValueBreakdown | null {
  const characterClass = findClass(catalogue, draft.classId);
  if (characterClass === null) {
    return null;
  }
  const { armor, hasShield } = wornArmor(lines, catalogue);
  const defense =
    characterClass.subclass?.unarmoredDefense ?? characterClass.unarmoredDefense;

  return best([
    plainCandidate(modifiers, hasShield),
    ...(defense !== null && armor === null
      ? [unarmoredDefenseCandidate(defense, modifiers, hasShield)]
      : []),
    ...(armor === null
      ? []
      : [
          armoredCandidate(
            armor,
            modifiers,
            hasShield,
            fightingStyleArmorBonus(draft, catalogue),
          ),
        ]),
  ]);
}

function fightingStyleArmorBonus(draft: CharacterDraft, catalogue: Catalogue): number {
  const chosen = pickedByKind(draft, catalogue, ['fighting-style']);
  let bonus = 0;
  for (const id of chosen) {
    const style = catalogue.fightingStyles.find((entry) => entry.id === id);
    bonus += style?.armorClassBonusWithArmor ?? 0;
  }
  return bonus;
}

function grantedSkills(
  draft: CharacterDraft,
  catalogue: Catalogue,
): { readonly proficient: ReadonlySet<string>; readonly expert: ReadonlySet<string> } {
  const proficient = new Set<string>();
  const expert = new Set<string>();

  const race = findRace(catalogue, draft.raceId);
  const subrace = findSubrace(catalogue, draft.raceId, draft.subraceId);
  const background = findBackground(catalogue, draft.backgroundId);
  const fixedSkills = [
    ...(race?.skills ?? []),
    ...(subrace?.skills ?? []),
    ...(background?.skills ?? []),
  ];
  for (const skill of fixedSkills) {
    proficient.add(skill);
  }

  for (const slot of openChoices(draft, catalogue)) {
    const picked = draft.choices[slot.id] ?? [];
    if (slot.kind === 'skill') {
      for (const id of picked) {
        proficient.add(id);
      }
    } else if (slot.kind === 'expertise') {
      for (const id of picked) {
        expert.add(id);
      }
    }
  }
  return { proficient, expert };
}

function spellcastingSheet(
  draft: CharacterDraft,
  catalogue: Catalogue,
  modifiers: AbilityScores,
): SpellcastingSheet | null {
  const characterClass = findClass(catalogue, draft.classId);
  const casting = characterClass?.spellcasting;
  if (characterClass === null || casting == null) {
    return null;
  }
  const modifier = modifiers[casting.ability];
  const isPrepared =
    casting.preparation === 'prepared' || casting.preparation === 'spellbook';

  return {
    ability: casting.ability,
    saveDc: 8 + PROFICIENCY_BONUS_LEVEL_1 + modifier,
    attackBonus: PROFICIENCY_BONUS_LEVEL_1 + modifier,
    level1Slots: casting.level1Slots,
    preparation: casting.preparation,
    preparedCount: isPrepared ? Math.max(1, modifier + 1) : null,
    cantripIds: pickedByKind(draft, catalogue, ['cantrip']),
    spellIds: pickedByKind(draft, catalogue, ['spell']),
    alwaysPreparedIds: characterClass.subclass?.alwaysPreparedSpells ?? [],
  };
}

function attacks(
  lines: readonly ItemLine[],
  catalogue: Catalogue,
  modifiers: AbilityScores,
  proficiencies: Proficiencies,
): readonly Attack[] {
  const result: Attack[] = [];
  for (const line of lines) {
    const weapon = findWeapon(catalogue, line.itemId);
    if (weapon === null) {
      continue;
    }
    const isDexterityBased =
      weapon.ranged || (weapon.finesse && modifiers.dexterite > modifiers.force);
    const modifier = isDexterityBased ? modifiers.dexterite : modifiers.force;
    const isProficient =
      proficiencies.weaponCategories.includes(weapon.category) ||
      proficiencies.weapons.includes(weapon.id);
    result.push({
      weaponId: weapon.id,
      attackBonus: modifier + (isProficient ? PROFICIENCY_BONUS_LEVEL_1 : 0),
      damageDice: weapon.damageDice,
      damageBonus: modifier,
      damageType: weapon.damageType,
      rangeMeters: weapon.rangeMeters,
    });
  }
  return result;
}

/**
 * Seul producteur de valeurs dérivées. Tolère un brouillon incomplet : ce qui
 * n'est pas encore calculable vaut `null`, jamais zéro — un zéro se confondrait
 * avec un vrai résultat.
 */
export function buildSheet(draft: CharacterDraft, catalogue: Catalogue): CharacterSheet {
  const abilities = finalAbilities(draft, catalogue);
  const modifiers = abilityScores((ability) => abilityModifier(abilities[ability]));

  const race = findRace(catalogue, draft.raceId);
  const subrace = findSubrace(catalogue, draft.raceId, draft.subraceId);
  const characterClass = findClass(catalogue, draft.classId);
  const background = findBackground(catalogue, draft.backgroundId);

  const { lines, gold } = collectEquipment(draft, catalogue);
  const proficiencies = mergeProficiencies([
    race?.proficiencies,
    subrace?.proficiencies,
    characterClass?.proficiencies,
    characterClass?.subclass?.proficiencies,
    background?.proficiencies,
  ]);

  const bonusHitPoints =
    (subrace?.bonusHitPointsPerLevel ?? 0) +
    (characterClass?.subclass?.bonusHitPointsPerLevel ?? 0);

  const { proficient, expert } = grantedSkills(draft, catalogue);
  const { armor } = wornArmor(lines, catalogue);
  const speed = subrace?.speed ?? race?.speed ?? null;
  const darkvision = subrace?.darkvision ?? race?.darkvision ?? null;
  const isSpeedReducedByArmor =
    armor !== null &&
    armor.strengthRequired > 0 &&
    abilities.force < armor.strengthRequired;

  const saves: readonly RollLine[] = ABILITIES.map((ability) => {
    const isProficient = characterClass?.saves.includes(ability) ?? false;
    return {
      id: ability,
      ability,
      proficient: isProficient,
      expert: false,
      bonus: modifiers[ability] + (isProficient ? PROFICIENCY_BONUS_LEVEL_1 : 0),
    };
  });

  const skills: readonly RollLine[] = ALL_SKILLS.map((skill: SkillId) => {
    const ability = skillAbility(skill);
    const isProficient = proficient.has(skill);
    const isExpert = expert.has(skill);
    let multiplier = 0;
    if (isExpert) {
      multiplier = 2;
    } else if (isProficient) {
      multiplier = 1;
    }
    return {
      id: skill,
      ability,
      proficient: isProficient,
      expert: isExpert,
      bonus: modifiers[ability] + multiplier * PROFICIENCY_BONUS_LEVEL_1,
    };
  });

  const features: readonly SheetFeature[] = [
    ...(race?.features ?? []).map((f) => ({ source: 'race' as const, ...f })),
    ...(subrace?.features ?? []).map((f) => ({ source: 'race' as const, ...f })),
    ...(characterClass?.features ?? []).map((f) => ({ source: 'class' as const, ...f })),
    ...(characterClass?.subclass?.features ?? []).map((f) => ({
      source: 'class' as const,
      ...f,
    })),
    ...(background?.feature == null
      ? []
      : [{ source: 'background' as const, ...background.feature }]),
  ];

  return {
    abilities,
    modifiers,
    proficiencyBonus: PROFICIENCY_BONUS_LEVEL_1,
    maxHitPoints:
      characterClass === null
        ? null
        : characterClass.hitDie + modifiers.constitution + bonusHitPoints,
    hitDice: characterClass === null ? null : { count: 1, die: characterClass.hitDie },
    armorClass: armorClass(draft, catalogue, modifiers, lines),
    initiative: modifiers.dexterite,
    speedMeters: speed,
    speedReducedByArmor: isSpeedReducedByArmor,
    darkvisionMeters: darkvision,
    saves,
    skills,
    attacks: attacks(lines, catalogue, modifiers, proficiencies),
    spellcasting: spellcastingSheet(draft, catalogue, modifiers),
    proficiencies: characterClass === null ? NO_PROFICIENCIES : proficiencies,
    languageIds: race?.languages ?? [],
    equipment: lines,
    goldPieces: gold,
    features,
  };
}
