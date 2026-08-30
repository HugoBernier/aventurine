import type { ChoiceKind, ChoiceSource, UnavailableReason } from '../../domain/choice';

const SOURCE_LABEL: Record<ChoiceSource, string> = {
  race: 'ta race',
  class: 'ta classe',
  background: 'ton historique',
};

export function formatUnavailable(reason: UnavailableReason, kind: ChoiceKind): string {
  switch (reason.kind) {
    case 'already-granted': {
      // Une caractéristique ne s'« acquiert » pas : elle a déjà pris un bonus,
      // et la règle interdit d'en empiler un second dessus.
      return kind === 'ability'
        ? 'Elle a déjà reçu un bonus'
        : `Déjà acquise grâce à ${SOURCE_LABEL[reason.source]}`;
    }
    case 'slot-full': {
      return 'Décoche-en une pour en changer';
    }
    case 'max-ability': {
      return `Déjà au maximum de ${String(reason.max)}`;
    }
  }
}
