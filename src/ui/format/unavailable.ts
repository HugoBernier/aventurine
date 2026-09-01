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
      if (kind === 'ability') {
        return 'Elle a déjà reçu un bonus';
      }
      // Une compétence et une langue sont féminines, un outil ne l'est pas.
      const already = kind === 'tool' ? 'Déjà acquis' : 'Déjà acquise';
      return `${already} grâce à ${SOURCE_LABEL[reason.source]}`;
    }
    case 'slot-full': {
      return 'Décoche-en une pour en changer';
    }
    case 'max-ability': {
      return `Déjà au maximum de ${String(reason.max)}`;
    }
  }
}
