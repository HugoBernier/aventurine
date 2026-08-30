import type { BlockedReason } from '../../domain/abilityRows';
import { counted } from './plural';

/**
 * Un bouton grisé sans raison est un cul-de-sac pour qui découvre le jeu :
 * chaque blocage s'explique en toutes lettres.
 */
export function formatBlocked(reason: BlockedReason, abilityName: string): string {
  switch (reason.kind) {
    case 'not-enough-points': {
      return `Il te reste ${counted(reason.remaining, 'point', 'points')}, monter ${abilityName} en coûte ${String(reason.required)}.`;
    }
    case 'max-score': {
      return `${abilityName} est au maximum de ${String(reason.max)} avant les bonus.`;
    }
  }
}

export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${String(modifier)}` : String(modifier);
}
