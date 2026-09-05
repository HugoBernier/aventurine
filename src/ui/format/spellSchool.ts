/**
 * Les huit écoles de magie, nommées en français avec ce qu'elles font.
 * Ici plutôt qu'en `data/` : ce sont des libellés d'interface, et le domaine
 * n'en connaît que les identifiants.
 */
export const MAGIC_SCHOOLS: readonly {
  readonly id: string;
  readonly name: string;
  readonly purpose: string;
}[] = [
  { id: 'abjuration', name: 'Abjuration', purpose: 'protéger, repousser' },
  { id: 'divination', name: 'Divination', purpose: 'savoir, voir au loin' },
  { id: 'enchantement', name: 'Enchantement', purpose: 'charmer, contraindre' },
  { id: 'evocation', name: 'Évocation', purpose: 'feu, foudre, force brute' },
  { id: 'illusion', name: 'Illusion', purpose: 'tromper les sens' },
  { id: 'invocation', name: 'Invocation', purpose: 'appeler, déplacer' },
  { id: 'necromancie', name: 'Nécromancie', purpose: 'la vie et la mort' },
  { id: 'transmutation', name: 'Transmutation', purpose: 'changer la matière' },
];

/** L'identifiant tel quel quand il n'en est pas un : on n'invente pas de nom. */
export function formatSchool(id: string): string {
  return MAGIC_SCHOOLS.find((school) => school.id === id)?.name ?? id;
}
