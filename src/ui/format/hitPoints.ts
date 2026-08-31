import type { HitPointRow } from '../../domain/progression';
import { formatModifier } from './abilityBlock';

const SOURCE: Record<HitPointRow['source'], string> = {
  max: 'dé au maximum',
  rolled: 'ton dé',
  average: 'moyenne du dé',
};

/**
 * Une ligne du décompte : « moyenne du dé 7, Constitution -1 ». Le total de la
 * ligne s'affiche à côté, jamais dans la phrase : c'est le nombre qu'on
 * additionne du regard pour retrouver la somme.
 */
export function formatHitPointRow(row: HitPointRow): string {
  const parts = [`${SOURCE[row.source]} ${String(row.die)}`];
  if (row.constitution !== 0) {
    parts.push(`Constitution ${formatModifier(row.constitution)}`);
  }
  if (row.bonus !== 0) {
    parts.push(`peuple ${formatModifier(row.bonus)}`);
  }
  if (row.isFloored) {
    parts.push('minimum 1');
  }
  return parts.join(', ');
}

/** Ce qu'il faut dire quand une saisie ne peut pas sortir de ce dé. */
export function formatIgnoredRoll(row: HitPointRow, hitDie: number): string | null {
  return row.ignoredRoll === null
    ? null
    : `${String(row.ignoredRoll)} est impossible sur un d${String(hitDie)} : la moyenne est utilisée.`;
}
