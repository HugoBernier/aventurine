import type { MissingChoice, MissingKind } from '../../domain/completeness';
import { counted } from './plural';

const NOUNS: Partial<Record<MissingKind, readonly [string, string]>> = {
  skill: ['compétence', 'compétences'],
  expertise: ['spécialité', 'spécialités'],
  language: ['langue', 'langues'],
  tool: ['outil', 'outils'],
  cantrip: ['tour de magie', 'tours de magie'],
  spell: ['sort', 'sorts'],
  equipment: ['choix d’équipement', 'choix d’équipement'],
};

const SENTENCES: Partial<Record<MissingKind, string>> = {
  race: 'Tu n’as pas encore choisi ta race',
  subrace: 'Tu n’as pas encore choisi ta branche',
  class: 'Tu n’as pas encore choisi ta classe',
  background: 'Tu n’as pas encore choisi ton historique',
  alignment: 'Tu n’as pas encore choisi ton alignement',
  name: 'Ton personnage n’a pas encore de nom',
  'fighting-style': 'Il te reste à choisir ta façon de te battre',
  ancestry: 'Il te reste à choisir ton ascendance',
};

/** Le domaine rend `{ kind, remaining }` ; la phrase se compose ici. */
export function formatMissing(missing: MissingChoice): string {
  const sentence = SENTENCES[missing.kind];
  if (sentence !== undefined) {
    return sentence;
  }
  if (missing.kind === 'abilities') {
    return missing.remaining === 1
      ? 'Tes caractéristiques ne sont pas encore réparties'
      : `Il te reste ${counted(missing.remaining, 'point à répartir', 'points à répartir')}`;
  }
  if (missing.kind === 'advancement') {
    return 'Tu as un choix de progression à faire';
  }
  if (missing.kind === 'feat') {
    return 'Il te reste un don à choisir';
  }
  if (missing.kind === 'improvement') {
    return `Il te reste ${counted(missing.remaining, 'point de caractéristique à placer', 'points de caractéristique à placer')}`;
  }
  if (missing.kind === 'ability') {
    // « à placer », pas « à choisir » : on ne choisit pas le bonus, on choisit
    // où il va. « Bonus » est invariable.
    const noun = 'bonus de caractéristique à placer';
    return `Il te reste ${counted(missing.remaining, noun, noun)}`;
  }
  if (missing.kind === 'personality') {
    return `Il te reste ${counted(missing.remaining, 'trait de personnalité à écrire', 'traits de personnalité à écrire')}`;
  }
  const noun = NOUNS[missing.kind];
  if (noun === undefined) {
    return 'Il te reste un choix à faire';
  }
  return `Il te reste ${counted(missing.remaining, noun[0], noun[1])} à choisir`;
}

export function formatMissingTitle(count: number): string {
  return count === 1
    ? 'Il te reste 1 choix à faire'
    : `Il te reste ${String(count)} choix à faire`;
}
