// Contenu dérivé du SRD 5.1 (CC BY 4.0), traduction Aventurine.
import { ABILITIES } from '../../domain/abilities';
import type {
  ChoiceSpec,
  FightingStyleSpec,
  SkillSpec,
  SpellSpec,
  SubclassSpec,
} from '../../domain/choiceSpec';
import type {
  Advancement,
  EquipmentOption,
  Facts,
  ItemLine,
  Proficiencies,
} from '../../domain/content';
import type { SkillId } from '../../domain/skills';

export const NONE: Proficiencies = {
  armor: [],
  weaponCategories: [],
  weapons: [],
  tools: [],
};

export function proficiencies(part: Partial<Proficiencies>): Proficiencies {
  return { ...NONE, ...part };
}

export function item(itemId: string, quantity = 1): ItemLine {
  return { itemId, quantity };
}

export function equipmentOption(
  id: string,
  name: string,
  blurb: string,
  facts: Facts,
  items: readonly ItemLine[],
): EquipmentOption {
  return { id, name, blurb, facts, items };
}

export function skillChoice(
  title: string,
  help: string,
  pick: number,
  from: readonly SkillId[],
): SkillSpec {
  return { kind: 'skill', subject: 'skills', title, help, pick, from };
}

/**
 * Les styles ouverts à chaque classe. Le SRD n'en donne pas les mêmes aux
 * trois : le paladin ne tire pas à l'arc, le rôdeur ne porte pas de bouclier
 * pour couvrir un allié.
 */
export const FIGHTER_STYLES = [
  'archerie',
  'defense',
  'duel',
  'combat-a-deux-mains',
  'protection',
  'combat-a-deux-armes',
];

export const PALADIN_STYLES = ['defense', 'duel', 'combat-a-deux-mains', 'protection'];

export const RANGER_STYLES = ['archerie', 'defense', 'duel', 'combat-a-deux-armes'];

/** Le style de combat, au niveau où la classe l'ouvre. */
export function fightingStyleChoice(
  level: number,
  from: readonly string[],
  help: string,
): FightingStyleSpec {
  return {
    kind: 'fighting-style',
    subject: 'fighting-style',
    title: 'Ta façon de te battre',
    help,
    pick: 1,
    level,
    from,
  };
}

export function cantripChoice(
  classId: string,
  knownByLevel: readonly number[],
  help: string,
): SpellSpec {
  return {
    kind: 'cantrip',
    subject: 'cantrips',
    title: 'Tes tours de magie',
    help,
    knownByLevel,
    listFrom: classId,
  };
}

/**
 * Le titre ne nomme pas un niveau de sort : dès que le personnage a des
 * emplacements de niveau 2, la liste proposée en contient.
 */
export function spellChoice(
  classId: string,
  knownByLevel: readonly number[],
  help: string,
): SpellSpec {
  return {
    kind: 'spell',
    subject: 'spells',
    title: 'Tes sorts',
    help,
    knownByLevel,
    listFrom: classId,
  };
}

export function equipmentChoice(
  subject: string,
  title: string,
  help: string,
  from: readonly string[],
): ChoiceSpec {
  return { kind: 'equipment', subject, title, help, pick: 1, from };
}

/**
 * Le créneau qui fait choisir sa voie. Chaque classe l'ouvre à son niveau et
 * lui donne son nom : le clerc parle de domaine, le guerrier d'archétype.
 *
 * Le SRD 5.1 n'en publie qu'une par classe. On la fait choisir quand même :
 * une voie imposée en silence est une voie que le joueur ne sait pas avoir.
 */
export function subclassChoice(level: number, title: string, help: string): SubclassSpec {
  return { kind: 'subclass', subject: 'subclass', title, help, pick: 1, level };
}

/**
 * Un palier d'amélioration : le choix amont, puis les trois suites possibles.
 * Le domaine n'ouvre que celle que le joueur a désignée, et c'est pourquoi les
 * quatre specs sont écrites ici, où la prose française a sa place.
 */
export function advancement(level: number): Advancement {
  const at = String(level);
  return {
    level,
    mode: {
      kind: 'advancement',
      subject: `niveau-${at}`,
      title: `Niveau ${at} : améliorer ou apprendre ?`,
      help: 'À ce niveau, ton personnage progresse. Deux routes : muscler ce qu’il sait déjà faire, ou apprendre quelque chose de neuf.',
      pick: 1,
      from: [
        {
          id: 'ability-2',
          label: '+2 dans une caractéristique',
          blurb: 'Tout ce qui en dépend monte d’un cran : attaques, jets, sorts.',
        },
        {
          id: 'ability-1-1',
          label: '+1 dans deux caractéristiques',
          blurb: 'Plus prudent : deux scores impairs deviennent pairs.',
        },
        {
          id: 'feat',
          label: 'Un don',
          blurb: 'Une aptitude que personne d’autre n’a. Souvent plus amusant.',
        },
      ],
    },
    abilityMajor: {
      kind: 'improvement',
      subject: `niveau-${at}-majeur`,
      title: 'Où mettre ton +2 ?',
      help: 'Un seul score gagne deux points. Rien ne peut dépasser 20.',
      pick: 1,
      bonus: 2,
      from: ABILITIES,
    },
    abilityMinor: {
      kind: 'improvement',
      subject: `niveau-${at}-mineur`,
      title: 'Où mettre tes deux +1 ?',
      help: 'Deux scores différents gagnent un point chacun. Rien ne peut dépasser 20.',
      pick: 2,
      bonus: 1,
      from: ABILITIES,
    },
    feat: {
      kind: 'feat',
      subject: `niveau-${at}-don`,
      title: 'Quel don prends-tu ?',
      help: 'Un don remplace l’amélioration de caractéristique. Certains en donnent une petite au passage.',
      pick: 1,
    },
  };
}

/** SRD : niveaux 4, 8, 12, 16 et 19 pour toutes les classes. */
export const ADVANCEMENTS: readonly Advancement[] = [4, 8, 12, 16, 19].map((level) =>
  advancement(level),
);

/** Le guerrier en gagne deux de plus, aux niveaux 6 et 14. */
export const FIGHTER_ADVANCEMENTS: readonly Advancement[] = [4, 6, 8, 12, 14, 16, 19].map(
  (level) => advancement(level),
);

/** Le roublard en gagne un de plus, au niveau 10. */
export const ROGUE_ADVANCEMENTS: readonly Advancement[] = [4, 8, 10, 12, 16, 19].map(
  (level) => advancement(level),
);
