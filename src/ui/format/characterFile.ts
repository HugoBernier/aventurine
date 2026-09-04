import type { CharacterFileResult } from '../../state/persistence/characterFile';
import { counted, plural } from './plural';

export interface ImportMessage {
  readonly tone: 'error' | 'reminder';
  readonly text: string;
}

/**
 * Ce qu'on dit après avoir ouvert un fichier, là où l'on vient de cliquer :
 * c'est un compte rendu du FICHIER, pas une conséquence de règle, et il se lit
 * tout de suite ou pas du tout. `null` quand tout s'est bien passé — un message
 * qui annonce que rien d'anormal n'est arrivé est du bruit.
 *
 * Le refus est net et sans réparation : on ne doit rien à qui modifie son
 * fichier à la main, et proposer de « corriger » un JSON cassé serait promettre
 * ce qu'on ne sait pas tenir.
 */
export function formatImportResult(result: CharacterFileResult): ImportMessage | null {
  switch (result.kind) {
    case 'unreadable': {
      return {
        tone: 'error',
        text: 'Ce fichier n’est pas un personnage Aventurine.',
      };
    }
    case 'too-new': {
      return {
        tone: 'error',
        text: 'Ce fichier a été écrit par une version plus récente d’Aventurine. Recharge la page, puis réessaie.',
      };
    }
    case 'ok': {
      const lost = result.warnings.length;
      return lost === 0
        ? null
        : {
            tone: 'reminder',
            text: `Personnage ouvert. ${counted(lost, 'donnée du fichier n’a pas été comprise', 'données du fichier n’ont pas été comprises')} : ${plural(lost, 'elle est ignorée', 'elles sont ignorées')}.`,
          };
    }
  }
}
