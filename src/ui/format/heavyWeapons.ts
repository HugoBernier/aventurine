import { plural } from './plural';

/** « Hache à deux mains » en tête de fiche, « hache à deux mains » dans une phrase. */
function lowerFirst(name: string): string {
  return name.charAt(0).toLocaleLowerCase('fr-FR') + name.slice(1);
}

/**
 * Le SRD donne le désavantage à l'arme lourde pour une créature de petite
 * taille. La règle ne vaut la peine d'être dite que quand le personnage porte
 * effectivement une de ces armes, et elle se nomme alors.
 */
export function formatHeavyWeapons(names: readonly string[]): string {
  const listed = names.map((name) => lowerFirst(name)).join(', ');
  const weapon = plural(names.length, 'ton arme lourde', 'tes armes lourdes');
  const uses = plural(names.length, 's’utilise', 's’utilisent');
  return `Tu es de petite taille : ${weapon} (${listed}) ${uses} avec désavantage.`;
}
