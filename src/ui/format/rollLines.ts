import type { RollLine } from '../../domain/sheet';
import { formatModifier } from './abilityBlock';

/** « +5 » et, quand il y a lieu, d'où vient le doublement. */
export function formatRollBonus(line: RollLine): string {
  return formatModifier(line.bonus);
}

/** Ce qui distingue une ligne maîtrisée : le mot, jamais la couleur seule. */
export function formatMastery(line: RollLine): string | null {
  if (line.expert) {
    return 'expertise';
  }
  return line.proficient ? 'maîtrisée' : null;
}
