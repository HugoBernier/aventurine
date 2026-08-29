/** Les six caractéristiques. Ensemble fermé par les règles : on l'écrit une
 *  fois et on en dérive le type, plutôt que de maintenir les deux. */
export const ABILITIES = [
  'force',
  'dexterite',
  'constitution',
  'intelligence',
  'sagesse',
  'charisme',
] as const;

export type AbilityId = (typeof ABILITIES)[number];
export type AbilityScores = Readonly<Record<AbilityId, number>>;

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function isAbilityId(value: string): value is AbilityId {
  return (ABILITIES as readonly string[]).includes(value);
}

/**
 * Un score par caractéristique, toutes les clés présentes.
 */
export function abilityScores(fill: (ability: AbilityId) => number): AbilityScores {
  const scores = {} as Record<AbilityId, number>;
  for (const ability of ABILITIES) {
    scores[ability] = fill(ability);
  }
  return scores;
}
