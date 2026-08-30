import { describe, expect, it } from 'vitest';
import { formatHeavyWeapons } from './heavyWeapons';

describe('armes lourdes et petite taille', () => {
  it('met l’arme au singulier et en minuscule dans la phrase', () => {
    expect(formatHeavyWeapons(['Hache à deux mains'])).toBe(
      'Tu es de petite taille : ton arme lourde (hache à deux mains) s’utilise avec désavantage.',
    );
  });

  it('accorde tout au pluriel quand il y en a plusieurs', () => {
    expect(formatHeavyWeapons(['Hache à deux mains', 'Arc long'])).toBe(
      'Tu es de petite taille : tes armes lourdes (hache à deux mains, arc long) s’utilisent avec désavantage.',
    );
  });
});
