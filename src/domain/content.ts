import type { AbilityId, AbilityScores } from './abilities';
import type { CastingProgression } from './progression';
import type { ChoiceSpec } from './choiceSpec';
import type { SkillId } from './skills';

/** Trois repères alignés, dans le même ordre sur toutes les options d'un choix. */
export type Facts = readonly [string, string, string];

export interface Feature {
  readonly name: string;
  readonly text: string;
}

/** Une aptitude de classe, acquise à un niveau précis. */
export interface LeveledFeature extends Feature {
  readonly level: number;
}

export type ArmorCategory = 'legere' | 'intermediaire' | 'lourde' | 'bouclier';
export type WeaponCategory = 'courantes' | 'de-guerre';
export type DamageType =
  | 'tranchant'
  | 'perforant'
  | 'contondant'
  | 'feu'
  | 'froid'
  | 'foudre'
  | 'acide'
  | 'poison'
  | 'psychique'
  | 'necrotique'
  | 'radiant'
  | 'force'
  | 'tonnerre';

export interface Proficiencies {
  readonly armor: readonly ArmorCategory[];
  readonly weaponCategories: readonly WeaponCategory[];
  readonly weapons: readonly string[];
  readonly tools: readonly string[];
}

export const NO_PROFICIENCIES: Proficiencies = {
  armor: [],
  weaponCategories: [],
  weapons: [],
  tools: [],
};

export interface Named {
  readonly id: string;
  readonly name: string;
}

export interface AbilityEntry extends Named {
  readonly id: AbilityId;
  /** « Frapper, porter, briser. » — pour qui n'a jamais joué. */
  readonly purpose: string;
}

export interface Skill extends Named {
  readonly ability: AbilityId;
  /** Une phrase d'usage, pour qui n'a jamais joué : « Se cacher, avancer sans bruit ». */
  readonly usage: string;
}

export interface Language extends Named {
  readonly script: string;
  readonly exotic: boolean;
}

export interface Alignment extends Named {
  readonly blurb: string;
}

export interface Tool extends Named {
  readonly category: string;
  readonly costGp: number;
}

export interface Ancestry extends Named {
  readonly blurb: string;
  readonly damageType: DamageType;
  readonly breathWeapon: string;
}

export interface FightingStyle extends Named {
  readonly text: string;
  readonly armorClassBonusWithArmor: number;
}

export interface Item extends Named {
  readonly weightKg: number;
}

export interface ItemLine {
  readonly itemId: string;
  readonly quantity: number;
}

export type DexterityContribution = 'full' | 'capped-2' | 'none';

export interface Armor extends Named {
  readonly category: ArmorCategory;
  readonly base: number;
  readonly dexterity: DexterityContribution;
  /** Force minimale sous laquelle l'armure lourde réduit la vitesse de 3 m. */
  readonly strengthRequired: number;
}

export interface Weapon extends Named {
  readonly category: WeaponCategory;
  readonly damageDice: string;
  readonly damageType: DamageType;
  readonly finesse: boolean;
  readonly ranged: boolean;
  readonly rangeMeters: readonly [number, number] | null;
  readonly properties: readonly string[];
}

export interface EquipmentOption extends Named {
  readonly blurb: string;
  readonly facts: Facts;
  readonly items: readonly ItemLine[];
}

export type MagicSchool =
  | 'abjuration'
  | 'divination'
  | 'enchantement'
  | 'evocation'
  | 'illusion'
  | 'invocation'
  | 'necromancie'
  | 'transmutation';

export type SpellLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface Spell extends Named {
  /** 0 = tour de magie. Le SRD 5.1 monte jusqu'au neuvième. */
  readonly level: SpellLevel;
  readonly school: MagicSchool;
  readonly castingTime: string;
  readonly range: string;
  readonly components: {
    readonly verbal: boolean;
    readonly somatic: boolean;
    readonly material: string | null;
  };
  readonly duration: string;
  readonly concentration: boolean;
  readonly ritual: boolean;
  /** Une à trois phrases. La prose longue viendra plus tard (§A19). */
  readonly summary: string;
  /** Seule source de vérité des listes de sorts par classe. */
  readonly classes: readonly string[];
}

export interface Subrace extends Named {
  readonly blurb: string;
  readonly facts: Facts;
  readonly abilityBonuses: Partial<AbilityScores>;
  readonly skills: readonly SkillId[];
  readonly proficiencies: Proficiencies;
  readonly features: readonly Feature[];
  readonly bonusHitPointsPerLevel: number;
  readonly speed: number | null;
  /** `null` : la sous-race garde la portée de sa race. L'elfe noir la double. */
  readonly darkvision: number | null;
  readonly choices: readonly ChoiceSpec[];
}

export interface Race extends Named {
  readonly blurb: string;
  readonly facts: Facts;
  readonly abilityBonuses: Partial<AbilityScores>;
  readonly size: 'P' | 'M';
  /** En mètres : c'est l'usage français, et aucune conversion n'existe. */
  readonly speed: number;
  readonly darkvision: number;
  readonly languages: readonly string[];
  readonly skills: readonly SkillId[];
  readonly proficiencies: Proficiencies;
  readonly resistances: readonly DamageType[];
  readonly features: readonly Feature[];
  readonly choices: readonly ChoiceSpec[];
  readonly subraces: readonly Subrace[];
}

export interface UnarmoredDefense {
  readonly base: number;
  readonly addedAbilities: readonly AbilityId[];
  readonly shieldAllowed: boolean;
}

export type PreparationMode = 'known' | 'prepared' | 'spellbook';

export interface Spellcasting {
  readonly ability: AbilityId;
  /** Rythme d'accès aux emplacements : les nombres se lisent dans une table. */
  readonly progression: CastingProgression;
  readonly preparation: PreparationMode;
  readonly ritual: boolean;
}

/**
 * Sous-classe obtenue au niveau 1. Le SRD n'en propose qu'une par classe
 * concernée : elle s'applique d'office, ce n'est donc pas un choix.
 */
export interface Subclass extends Named {
  readonly blurb: string;
  readonly features: readonly Feature[];
  readonly proficiencies: Proficiencies | null;
  readonly alwaysPreparedSpells: readonly string[];
  readonly unarmoredDefense: UnarmoredDefense | null;
  readonly bonusHitPointsPerLevel: number;
  readonly choices: readonly ChoiceSpec[];
}

/**
 * Un don. Le SRD 5.1 n'en publie qu'un, le Lutteur, et présente les dons comme
 * une règle optionnelle : les autres sont écrits pour ce projet (CLAUDE.md,
 * « Sources et droits »).
 */
export interface Feat extends Named {
  readonly blurb: string;
  readonly facts: Facts;
  readonly text: string;
  readonly fromSrd: boolean;
}

/**
 * Ce qu'une classe gagne à un niveau d'amélioration : le choix amont, puis les
 * trois suites possibles. Les quatre specs vivent dans `data/` parce qu'elles
 * portent de la prose ; le domaine ne fait que choisir laquelle ouvrir.
 */
export interface Advancement {
  readonly level: number;
  readonly mode: ChoiceSpec;
  readonly abilityMajor: ChoiceSpec;
  readonly abilityMinor: ChoiceSpec;
  readonly feat: ChoiceSpec;
}

export interface CharacterClass extends Named {
  readonly blurb: string;
  readonly facts: Facts;
  readonly hitDie: 6 | 8 | 10 | 12;
  readonly saves: readonly [AbilityId, AbilityId];
  readonly proficiencies: Proficiencies;
  readonly unarmoredDefense: UnarmoredDefense | null;
  /** Rangées par niveau : la fiche n'affiche que celles déjà atteintes. */
  readonly features: readonly LeveledFeature[];
  readonly choices: readonly ChoiceSpec[];
  readonly equipmentOptions: readonly EquipmentOption[];
  readonly fixedEquipment: readonly ItemLine[];
  readonly spellcasting: Spellcasting | null;
  readonly subclass: Subclass | null;
  /** Les niveaux où la classe améliore ses caractéristiques ou prend un don. */
  readonly advancements: readonly Advancement[];
}

export interface SuggestedTraits {
  readonly traits: readonly string[];
  readonly ideals: readonly string[];
  readonly bonds: readonly string[];
  readonly flaws: readonly string[];
}

export interface Background extends Named {
  readonly blurb: string;
  readonly facts: Facts;
  readonly skills: readonly SkillId[];
  readonly proficiencies: Proficiencies;
  readonly choices: readonly ChoiceSpec[];
  readonly equipment: readonly ItemLine[];
  readonly goldPieces: number;
  readonly feature: Feature | null;
  readonly suggestedTraits: SuggestedTraits;
  /**
   * Vrai pour l'historique « Personnalisé », assemblé à partir des règles
   * génériques d'historique du SRD. L'interface le signale explicitement
   * (CLAUDE.md, « Sources et droits »).
   */
  readonly assembledFromGenericRules: boolean;
}
