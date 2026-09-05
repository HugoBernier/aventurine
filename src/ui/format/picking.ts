import type { ChoiceKind, PickBreakdown } from '../../domain/choice';
import { formatModifier } from './abilityBlock';
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
 * Court des deux côtés : la phrase partage sa ligne avec le niveau, dans un
 * bandeau qui ne défile pas, et une ligne de plus là est une ligne de moins de
 * cartes. Elle ne dit donc pas comment décocher — chaque carte devenue
 * indisponible le dit déjà, à l'endroit exact où on essaie.
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
  return noun === undefined ? 'C’est complet' : `Tu as tes ${counted(pick, ...noun)}`;
}

/**
 * « ta Force », « ton Charisme » : le français ne se déduit pas d'un
 * identifiant. Ne sont listées que les caractéristiques FÉMININES à initiale
 * consonne — l'Intelligence est féminine mais prend « ton », par élision.
 */
const TAKES_TA = new Set(['force', 'dexterite', 'constitution', 'sagesse']);

/**
 * Le calcul derrière un nombre de sorts préparés, écrit en toutes lettres.
 *
 * « Deux sorts au niveau 7 » a tout d'une erreur tant qu'on ne voit pas que le
 * Charisme est à 9. La phrase pose donc les deux termes et leur valeur, dans
 * l'ordre où la règle les énonce, et le joueur sait aussitôt lequel faire
 * monter.
 */
export function formatPickSource(
  pick: number,
  from: PickBreakdown,
  abilityName: string,
): string {
  const level = from.halved
    ? `la moitié de ton niveau (${String(from.casterLevel)})`
    : `ton niveau (${String(from.casterLevel)})`;
  const ability = `${TAKES_TA.has(from.ability) ? 'ta' : 'ton'} ${abilityName}`;
  return `Tu en prépares ${String(pick)} : ${level} plus ${ability} (${formatModifier(from.modifier)}).`;
}
