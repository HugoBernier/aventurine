import type { Catalogue } from './catalogue';
import type { Advancement, CharacterClass } from './content';
import type { ContentPack } from './pack';

/**
 * Comment l'application fabrique un palier d'amélioration à partir de son seul
 * niveau. Injecté depuis `data/`, où vit la prose française : ces quatre choix
 * sont identiques d'une classe à l'autre, et un pack qui les recopierait
 * figerait dans son fichier un texte que l'application a le droit d'améliorer.
 */
export type AdvancementFor = (level: number) => Advancement;

/**
 * Verse les sous-classes greffées dans la classe qu'elles visent.
 *
 * Tout le prix de la greffe est ici : en aval, `openChoices`, `buildSheet`, le
 * parcours et l'impression voient une classe qui a une voie de plus, et rien
 * d'autre ne change. Le créneau qui la propose existe déjà — celui que la
 * classe ouvre au niveau qu'elle fixe.
 */
function withGrafts(
  classes: readonly CharacterClass[],
  packs: readonly ContentPack[],
): readonly CharacterClass[] {
  const grafts = packs.flatMap((pack) => pack.subclasses);
  if (grafts.length === 0) {
    return classes;
  }
  return classes.map((entry) => {
    const added = grafts
      .filter((graft) => graft.forClassId === entry.id)
      .map((graft) => graft.subclass);
    return added.length === 0
      ? entry
      : { ...entry, subclasses: [...entry.subclasses, ...added] };
  });
}

/** Les classes d'un pack, leurs paliers remontés à partir de leurs niveaux. */
function packClasses(
  packs: readonly ContentPack[],
  advancementFor: AdvancementFor,
): readonly CharacterClass[] {
  return packs.flatMap((pack) =>
    pack.classes.map((entry) => ({
      ...entry.base,
      advancements: entry.advancementLevels.map((level) => advancementFor(level)),
    })),
  );
}

/**
 * Le catalogue que voit l'application : le SRD, plus ce que les packs
 * installés ajoutent. Les packs n'écrasent rien — le préfixe obligatoire rend
 * la collision impossible — et rien du SRD ne peut être masqué : qui ne veut
 * pas d'une entrée ne la choisit pas.
 *
 * Aucun contenu n'est copié : un pack qui s'en va laisse le SRD intact, et les
 * réponses d'un personnage qui pointaient le pack dorment sans être touchées
 * (`state/prune.ts`).
 */
export function catalogueWithPacks(
  base: Catalogue,
  packs: readonly ContentPack[],
  advancementFor: AdvancementFor,
): Catalogue {
  if (packs.length === 0) {
    return base;
  }
  return {
    ...base,
    // Les peuples s'ajoutent à la fin : un joueur qui vient d'installer un pack
    // retrouve les neuf du SRD là où il les a laissés (§13.8).
    races: [...base.races, ...packs.flatMap((pack) => pack.races)],
    backgrounds: [...base.backgrounds, ...packs.flatMap((pack) => pack.backgrounds)],
    classes: withGrafts([...base.classes, ...packClasses(packs, advancementFor)], packs),
    spells: [...base.spells, ...packs.flatMap((pack) => pack.spells)],
  };
}
