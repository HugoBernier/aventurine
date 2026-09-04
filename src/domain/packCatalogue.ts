import type { Catalogue } from './catalogue';
import type { ContentPack } from './pack';

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
    spells: [...base.spells, ...packs.flatMap((pack) => pack.spells)],
  };
}
