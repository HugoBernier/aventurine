import type { Catalogue } from './catalogue';
import type { CharacterClass } from './content';
import type { ContentPack } from './pack';

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
): Catalogue {
  if (packs.length === 0) {
    return base;
  }
  return {
    ...base,
    classes: withGrafts(base.classes, packs),
    spells: [...base.spells, ...packs.flatMap((pack) => pack.spells)],
  };
}
