import type { NoticeReason } from '../../state/types';
import { counted } from './plural';

/**
 * Le libellé porte sa préposition déjà contractée. Coller « à » devant un
 * libellé qui commence par son article donnait « à le tableau standard » :
 * une contraction ne peut pas se faire au moment du collage.
 */
const METHOD_LABEL = {
  'point-buy': 'à la répartition de points',
  'standard-array': 'au tableau standard',
} as const;

const SOURCE_LABEL = {
  race: 'de race',
  class: 'de classe',
  background: 'd’historique',
} as const;

/** L'avis explique ce qu'une cascade vient de retirer, et pourquoi. */
export function formatNotice(reason: NoticeReason): string {
  switch (reason.kind) {
    case 'slot-closed': {
      // Le parent n'est pas nommé : on n'a ici que son identifiant, et
      // « nain-des-collines » n'est pas du français. Le libellé de source dit
      // déjà ce qui a changé.
      return reason.lost > 1
        ? `Tu as changé ${SOURCE_LABEL[reason.source]} : les ${String(reason.lost)} choix qui en dépendaient ont été remis à zéro.`
        : `Tu as changé ${SOURCE_LABEL[reason.source]} : le choix qui en dépendait a été remis à zéro.`;
    }
    case 'options-withdrawn': {
      const count = reason.optionIds.length;
      return `${counted(count, 'option n’est', 'options ne sont')} plus disponible${count > 1 ? 's' : ''} : une autre source te ${count > 1 ? 'les' : 'la'} donne déjà.`;
    }
    case 'too-many': {
      const count = reason.optionIds.length;
      return `Ce niveau t’en accorde moins : ${counted(count, 'réponse a été retirée', 'réponses ont été retirées')}.`;
    }
    case 'abilities-reset': {
      return `Tu es passé ${METHOD_LABEL[reason.method]} : tes caractéristiques repartent de zéro.`;
    }
  }
}
