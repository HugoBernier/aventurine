import type { ChoiceSource, UnavailableReason } from '../../domain/choice';

const SOURCE_LABEL: Record<ChoiceSource, string> = {
  race: 'ta race',
  class: 'ta classe',
  background: 'ton historique',
};

export function formatUnavailable(reason: UnavailableReason): string {
  switch (reason.kind) {
    case 'already-granted': {
      return `Déjà acquise grâce à ${SOURCE_LABEL[reason.source]}`;
    }
    case 'slot-full': {
      return 'Décoche-en une pour en changer';
    }
  }
}
