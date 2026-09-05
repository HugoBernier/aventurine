import type {
  AbilityEntry,
  Alignment,
  Ancestry,
  Armor,
  Background,
  Feat,
  CharacterClass,
  FightingStyle,
  Item,
  Language,
  Race,
  Skill,
  Spell,
  Subrace,
  Tool,
  Weapon,
} from './content';

/**
 * Tout le contenu, injecté au domaine plutôt qu'importé par lui : c'est ce qui
 * permet à `domain/` de ne dépendre de rien, et aux tests de travailler sur un
 * catalogue de deux entrées au lieu de charger le SRD entier.
 */
export interface Catalogue {
  readonly abilities: readonly AbilityEntry[];
  readonly skills: readonly Skill[];
  readonly races: readonly Race[];
  readonly classes: readonly CharacterClass[];
  readonly backgrounds: readonly Background[];
  readonly feats: readonly Feat[];
  readonly alignments: readonly Alignment[];
  readonly languages: readonly Language[];
  readonly tools: readonly Tool[];
  readonly weapons: readonly Weapon[];
  readonly armor: readonly Armor[];
  readonly items: readonly Item[];
  readonly spells: readonly Spell[];
  readonly ancestries: readonly Ancestry[];
  readonly fightingStyles: readonly FightingStyle[];
}

function byId<T extends { readonly id: string }>(
  entries: readonly T[],
  id: string | null,
): T | null {
  if (id === null) {
    return null;
  }
  return entries.find((entry) => entry.id === id) ?? null;
}

// Un accesseur par table : la table est fixée par la fonction, on ne peut donc
// pas chercher un identifiant de classe dans la liste des races.
export const findRace = (c: Catalogue, id: string | null): Race | null =>
  byId(c.races, id);
export const findClass = (c: Catalogue, id: string | null): CharacterClass | null =>
  byId(c.classes, id);
export const findBackground = (c: Catalogue, id: string | null): Background | null =>
  byId(c.backgrounds, id);
export const findAlignment = (c: Catalogue, id: string | null): Alignment | null =>
  byId(c.alignments, id);
export const findSkill = (c: Catalogue, id: string | null): Skill | null =>
  byId(c.skills, id);
export const findAbility = (c: Catalogue, id: string | null): AbilityEntry | null =>
  byId(c.abilities, id);
export const findLanguage = (c: Catalogue, id: string | null): Language | null =>
  byId(c.languages, id);
export const findTool = (c: Catalogue, id: string | null): Tool | null =>
  byId(c.tools, id);
export const findWeapon = (c: Catalogue, id: string | null): Weapon | null =>
  byId(c.weapons, id);
export const findArmor = (c: Catalogue, id: string | null): Armor | null =>
  byId(c.armor, id);
export const findItem = (c: Catalogue, id: string | null): Item | null =>
  byId(c.items, id);
export const findSpell = (c: Catalogue, id: string | null): Spell | null =>
  byId(c.spells, id);
export const findAncestry = (c: Catalogue, id: string | null): Ancestry | null =>
  byId(c.ancestries, id);
export const findFightingStyle = (
  c: Catalogue,
  id: string | null,
): FightingStyle | null => byId(c.fightingStyles, id);

/** La sous-race choisie, cherchée dans la race qui la contient. */
export function findSubrace(
  catalogue: Catalogue,
  raceId: string | null,
  subraceId: string | null,
): Subrace | null {
  const race = findRace(catalogue, raceId);
  if (race === null) {
    return null;
  }
  return byId(race.subraces, subraceId);
}

/**
 * Les sorts d'une classe, dérivés de `Spell.classes` : une liste de classe
 * n'est jamais recopiée ailleurs. Du niveau `from` au niveau `to` inclus : une
 * plage plutôt qu'un niveau, parce qu'à partir du niveau 3 un lanceur choisit
 * parmi tout ce qu'il sait lancer, pas seulement parmi le dernier palier.
 *
 * Rangés par NIVEAU d'abord, par nom ensuite. C'est l'ordre dans lequel on
 * choisit un sort — on sait quel niveau on veut remplir avant de savoir lequel
 * on prend — et c'est déjà l'ordre de la fiche. L'ordre des fichiers de
 * contenu ne le donne pas : un pack s'ajoute à la fin, et le complément SRD
 * lui-même range ses niveaux 0 et 1 après les niveaux 9.
 */
export function spellsForClass(
  catalogue: Catalogue,
  classId: string | null,
  from: number,
  to: number = from,
): readonly Spell[] {
  if (classId === null) {
    return [];
  }
  return catalogue.spells
    .filter(
      (spell) =>
        spell.level >= from && spell.level <= to && spell.classes.includes(classId),
    )
    .toSorted((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'fr'));
}
