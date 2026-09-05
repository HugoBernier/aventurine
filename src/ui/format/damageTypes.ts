import type { DamageType } from '../../domain/content';

/**
 * Le nom affiché d'un type de dégâts, et sa forme après « à ».
 *
 * Les deux sont stockés plutôt que déduits : « au feu », « à la foudre »,
 * « à l’acide » dépendent du genre et de l’initiale, et une règle qui devine
 * se trompe sur trois entrées. Treize lignes explicites ne se trompent jamais.
 *
 * Les identifiants du domaine ne sont PAS des libellés : `necrotique` s’écrit
 * sans accent pour rester une clé stable, il s’affiche avec.
 */
const LABELS: Record<DamageType, { readonly name: string; readonly withA: string }> = {
  tranchant: { name: 'tranchant', withA: 'au tranchant' },
  perforant: { name: 'perforant', withA: 'au perforant' },
  contondant: { name: 'contondant', withA: 'au contondant' },
  feu: { name: 'feu', withA: 'au feu' },
  froid: { name: 'froid', withA: 'au froid' },
  foudre: { name: 'foudre', withA: 'à la foudre' },
  acide: { name: 'acide', withA: 'à l’acide' },
  poison: { name: 'poison', withA: 'au poison' },
  psychique: { name: 'psychique', withA: 'au psychique' },
  necrotique: { name: 'nécrotique', withA: 'au nécrotique' },
  radiant: { name: 'radiant', withA: 'au radiant' },
  force: { name: 'force', withA: 'à la force' },
  tonnerre: { name: 'tonnerre', withA: 'au tonnerre' },
};

export function damageTypeName(type: DamageType): string {
  return LABELS[type].name;
}

/** Les treize types, prêts à cocher dans le créateur. */
export const DAMAGE_TYPE_OPTIONS: readonly {
  readonly id: string;
  readonly name: string;
}[] = Object.entries(LABELS).map(([id, label]) => ({ id, name: label.name }));

/** « résiste au feu », « résiste à la foudre », « résiste à l’acide ». */
export function formatResistances(types: readonly DamageType[]): string | null {
  return types.length === 0
    ? null
    : `résiste ${types.map((type) => LABELS[type].withA).join(', ')}`;
}

export function formatDamageTypeList(types: readonly DamageType[]): string {
  return types.map((type) => LABELS[type].name).join(', ');
}
