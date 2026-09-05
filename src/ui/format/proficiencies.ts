import type { Catalogue } from '../../domain/catalogue';
import { findTool, findWeapon } from '../../domain/catalogue';
import type { ArmorCategory, Proficiencies, WeaponCategory } from '../../domain/content';

/**
 * Les catégories de maîtrise en toutes lettres. Elles vivent ici et non dans
 * `data/` : ce sont des libellés d'affichage, et le domaine ne rédige pas.
 */
export const ARMOR_LABELS: Record<ArmorCategory, string> = {
  legere: 'Armures légères',
  intermediaire: 'Armures intermédiaires',
  lourde: 'Armures lourdes',
  bouclier: 'Boucliers',
};

export const WEAPON_CATEGORY_LABELS: Record<WeaponCategory, string> = {
  courantes: 'Armes courantes',
  'de-guerre': 'Armes de guerre',
};

/**
 * Un identifiant inconnu se rend tel quel plutôt que de disparaître : un pack
 * qui référence une arme absente doit se voir, pas se taire.
 */
function nameOf(id: string, found: { readonly name: string } | null): string {
  return found?.name ?? id;
}

export function armorLine(proficiencies: Proficiencies): string | null {
  const armor = proficiencies.armor.map((category) => ARMOR_LABELS[category]);
  return armor.length === 0 ? null : armor.join(', ');
}

export function weaponLine(
  proficiencies: Proficiencies,
  catalogue: Catalogue,
): string | null {
  const categories = proficiencies.weaponCategories.map(
    (category) => WEAPON_CATEGORY_LABELS[category],
  );
  const named = proficiencies.weapons.map((id) => nameOf(id, findWeapon(catalogue, id)));
  const all = [...categories, ...named];
  return all.length === 0 ? null : all.join(', ');
}

export function toolLine(
  proficiencies: Proficiencies,
  catalogue: Catalogue,
): string | null {
  const tools = proficiencies.tools.map((id) => nameOf(id, findTool(catalogue, id)));
  return tools.length === 0 ? null : tools.join(', ');
}
