import type { HitPointRow } from '../../domain/progression';
import { formatModifier } from './abilityBlock';

const SOURCE: Record<HitPointRow['source'], (hitDie: number) => string> = {
  max: (hitDie) => `d${String(hitDie)} au maximum`,
  rolled: (hitDie) => `ton lancer de d${String(hitDie)}`,
  average: (hitDie) => `moyenne du d${String(hitDie)}`,
};

/**
 * Une ligne du décompte : « 6 (moyenne du d10), Constitution -1 ». La valeur
 * d'abord, parce que c'est elle qu'on additionne ; le dé entre parenthèses,
 * avec sa taille. « Moyenne du dé 6 » se lisait « moyenne du d6 ». Le total de
 * la ligne s'affiche à côté, jamais dans la phrase.
 */
export function formatHitPointRow(row: HitPointRow, hitDie: number): string {
  const parts = [`${String(row.fromDie)} (${SOURCE[row.source](hitDie)})`];
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
