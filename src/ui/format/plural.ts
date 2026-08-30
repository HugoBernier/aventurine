/**
 * En français, 0 et 1 prennent le singulier. Trois lignes ; ce n'est pas une
 * couche d'internationalisation, l'application n'a qu'une langue.
 */
export function plural(count: number, singular: string, pluralForm: string): string {
  return count > 1 ? pluralForm : singular;
}

export function counted(count: number, singular: string, pluralForm: string): string {
  return `${String(count)} ${plural(count, singular, pluralForm)}`;
}
