import type { NoticeReason } from '../../state/types';
import { counted } from './plural';

const METHOD_LABEL = {
  'point-buy': 'la répartition de points',
  'standard-array': 'le tableau standard',
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
      const what = counted(reason.lost, 'choix', 'choix');
      return `Tu as changé ${SOURCE_LABEL[reason.source]} : tes ${what} liés à « ${reason.parentId} » ont été remis à zéro.`;
    }
    case 'options-withdrawn': {
      const count = reason.optionIds.length;
      return `${counted(count, 'option n’est', 'options ne sont')} plus disponible${count > 1 ? 's' : ''} : une autre source te ${count > 1 ? 'les' : 'la'} donne déjà.`;
    }
    case 'abilities-reset': {
      return `Tu es passé à ${METHOD_LABEL[reason.method]} : tes caractéristiques repartent de zéro.`;
    }
  }
}
