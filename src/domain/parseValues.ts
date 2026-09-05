/**
 * Les gestes qu'on répète en relisant un fichier : est-ce un objet, est-ce du
 * texte utilisable, est-ce un nombre plausible. Rassemblés ici parce que
 * quatre analyseurs les écrivaient à l'identique, et que deux copies finissent
 * toujours par diverger sur une borne.
 *
 * Ce module ne connaît ni le SRD ni les packs : il ne sait que dire non à ce
 * qui n'a pas la forme attendue.
 */

export const MAX_ID = 64;
export const MAX_NAME = 60;
export const MAX_LINE = 120;
export const MAX_TEXT = 600;
export const MAX_LIST = 40;

/** Minuscules, chiffres et tirets : le même jeu que les identifiants du SRD. */
export const ID_SHAPE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** `null` dès que ce n'est pas du texte utilisable : vide et trop long compris. */
export function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === '' || trimmed.length > max ? null : trimmed;
}

/** Facultatif : absent et vide sont la même chose, et ne sont pas une faute. */
export function optionalText(value: unknown, max: number): string {
  return text(value, max) ?? '';
}

export function strings(value: unknown, max: number = MAX_LIST): readonly string[] {
  return Array.isArray(value)
    ? value.slice(0, max).filter((entry): entry is string => typeof entry === 'string')
    : [];
}

/** Un entier borné des deux côtés, ou `null` : jamais une valeur réparée en douce. */
export function count(value: unknown, max: number, min = 0): number | null {
  return typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= min &&
    value <= max
    ? value
    : null;
}

/** Ne garde que ce qui existe : une référence morte n'est pas une définition. */
export function keptAmong(
  from: readonly string[],
  allowed: readonly string[],
): readonly string[] {
  return from.filter((id) => allowed.includes(id));
}

/** Trois repères alignés ; `'—'` quand l'un n'a rien à dire. */
export function facts(value: unknown): readonly [string, string, string] {
  const from = Array.isArray(value) ? value : [];
  const at = (index: number): string => optionalText(from[index], MAX_LINE) || '—';
  return [at(0), at(1), at(2)];
}

/** De quoi nommer une entrée fautive : son identifiant, à défaut son nom. */
export function labelOf(value: unknown): string {
  if (!isRecord(value)) {
    return '';
  }
  return text(value.id, MAX_ID) ?? text(value.name, MAX_NAME) ?? '';
}
