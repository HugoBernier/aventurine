import type { AbilityId } from './abilities';

/** Les 18 compétences du SRD et la caractéristique qui les gouverne.
 *  `satisfies` vérifie les valeurs sans élargir le type des clés : `SkillId`
 *  reste l'union littérale des 18 identifiants. */
export const SKILL_ABILITY = {
  acrobaties: 'dexterite',
  arcanes: 'intelligence',
  athletisme: 'force',
  discretion: 'dexterite',
  dressage: 'sagesse',
  escamotage: 'dexterite',
  histoire: 'intelligence',
  intimidation: 'charisme',
  investigation: 'intelligence',
  medecine: 'sagesse',
  nature: 'intelligence',
  perception: 'sagesse',
  perspicacite: 'sagesse',
  persuasion: 'charisme',
  religion: 'intelligence',
  representation: 'charisme',
  supercherie: 'charisme',
  survie: 'sagesse',
} as const satisfies Record<string, AbilityId>;

export type SkillId = keyof typeof SKILL_ABILITY;

export const ALL_SKILLS = Object.keys(SKILL_ABILITY) as readonly SkillId[];

export function skillAbility(skill: SkillId): AbilityId {
  return SKILL_ABILITY[skill];
}

export function isSkillId(value: string): value is SkillId {
  return value in SKILL_ABILITY;
}
