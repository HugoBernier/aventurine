/**
 * Fait passer une valeur par un aller-retour JSON, exactement comme le fait
 * `localStorage` ou un fichier exporté.
 *
 * Ce n'est PAS un clonage profond : `structuredClone` réussirait avec une
 * `Map` ou une `Date`, c'est-à-dire avec ce que les tests doivent justement
 * interdire. La propriété vérifiée est la fidélité de la sérialisation.
 */
export function throughJson(value: unknown): unknown {
  // eslint-disable-next-line unicorn/prefer-structured-clone
  return JSON.parse(JSON.stringify(value));
}
