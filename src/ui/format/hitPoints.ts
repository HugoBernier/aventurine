import { formatModifier } from './abilityBlock';

interface PerLevel {
  readonly average: number;
  readonly constitution: number;
  readonly bonus: number;
}

/**
 * « 4 du dé, −1 de Constitution, soit +3 par niveau ». Le total seul laisse
 * croire à une erreur quand la Constitution est basse : un magicien monte de 3
 * alors que son dé vaut 4.
 */
export function formatHitPointsPerLevel(per: PerLevel): string {
  const parts = [`${String(per.average)} du dé`];
  if (per.constitution !== 0) {
    parts.push(`${formatModifier(per.constitution)} de Constitution`);
  }
  if (per.bonus !== 0) {
    parts.push(`${formatModifier(per.bonus)} de ton peuple`);
  }
  const total = Math.max(1, per.average + per.constitution) + per.bonus;
  const isFloored = per.average + per.constitution < 1;
  return `${parts.join(', ')}, soit ${formatModifier(total)} par niveau${
    isFloored ? ' (jamais moins de 1)' : ''
  }`;
}
