import type { ChoiceKind } from '../../domain/choice';
import { counted } from './plural';

/**
 * Le nom de ce qu'on choisit, quand le dire vaut mieux que « à choisir ».
 * Un genre absent se passe de nom : la phrase reste juste sans lui.
 */
const NOUNS: Partial<Record<ChoiceKind, readonly [string, string]>> = {
  skill: ['compétence', 'compétences'],
  language: ['langue', 'langues'],
  tool: ['outil', 'outils'],
  spell: ['sort', 'sorts'],
  cantrip: ['tour de magie', 'tours de magie'],
  expertise: ['expertise', 'expertises'],
};

/**
 * Ce qu'il reste à choisir, écrit du point de vue du joueur : ce qui manque
 * plutôt que ce qui est fait. « Encore 2 sorts à choisir » se comprend sans
 * soustraction, là où « 2 sur 4 » demande de la faire.
 *
 * Aucun participe accordé : « tes 4 compétences » et « tes 4 sorts » se disent
 * de la même façon, donc une seule phrase suffit pour les deux genres.
 */
export function formatPicking(remaining: number, pick: number, kind: ChoiceKind): string {
  const noun = NOUNS[kind];
  if (remaining > 0) {
    const what = noun === undefined ? String(remaining) : counted(remaining, ...noun);
    return `Encore ${what} à choisir`;
  }
  return noun === undefined
    ? 'C’est complet. Décoche pour en changer.'
    : `C’est complet : tu as tes ${counted(pick, ...noun)}. Décoche pour en changer.`;
}
