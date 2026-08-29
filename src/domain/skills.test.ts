import { describe, expect, it } from 'vitest';
import { ALL_SKILLS, isSkillId, skillAbility } from './skills';

describe('compétences', () => {
  it('couvre les dix-huit compétences du SRD', () => {
    expect(ALL_SKILLS).toHaveLength(18);
  });

  it('rattache Athlétisme à la Force', () => {
    expect(skillAbility('athletisme')).toBe('force');
  });

  it('rattache Discrétion à la Dextérité', () => {
    expect(skillAbility('discretion')).toBe('dexterite');
  });

  it('rattache les quatre compétences de Sagesse attendues', () => {
    const wisdom = ALL_SKILLS.filter((skill) => skillAbility(skill) === 'sagesse');
    expect(wisdom).toEqual([
      'dressage',
      'medecine',
      'perception',
      'perspicacite',
      'survie',
    ]);
  });

  it('refuse un identifiant qui n’est pas une compétence', () => {
    expect(isSkillId('athletisme')).toBe(true);
    expect(isSkillId('natation')).toBe(false);
  });
});
