import { describe, expect, it } from 'vitest';
import { ABILITIES, abilityModifier, abilityScores, isAbilityId } from './abilities';

describe('modificateur de caractéristique', () => {
  it('donne un modificateur de -1 pour une valeur de 8', () => {
    expect(abilityModifier(8)).toBe(-1);
  });

  it('donne un modificateur de 0 pour 10 comme pour 11', () => {
    expect(abilityModifier(10)).toBe(0);
    expect(abilityModifier(11)).toBe(0);
  });

  it('donne un modificateur de +4 pour une valeur de 18', () => {
    expect(abilityModifier(18)).toBe(4);
  });

  it('arrondit vers le bas pour les valeurs impaires basses', () => {
    expect(abilityModifier(7)).toBe(-2);
    expect(abilityModifier(9)).toBe(-1);
  });
});

describe('table des caractéristiques', () => {
  it('contient les six caractéristiques du jeu', () => {
    expect(ABILITIES).toHaveLength(6);
  });

  it('reconnaît un identifiant de caractéristique valide', () => {
    expect(isAbilityId('sagesse')).toBe(true);
    expect(isAbilityId('perception')).toBe(false);
  });

  it('remplit les six clés sans en oublier', () => {
    expect(Object.keys(abilityScores(() => 8))).toHaveLength(6);
  });
});
