/**
 * Où on en était dans la page, par écran, le temps de l'onglet.
 *
 * `sessionStorage` et non `localStorage` : ce n'est pas le personnage, c'est
 * la lecture en cours. Elle n'a pas à survivre à la fermeture de l'onglet, et
 * elle ne doit pas voyager avec l'export du personnage.
 *
 * Tout est gardé : en navigation privée, `sessionStorage` lève à la lecture
 * comme à l'écriture, et une fiche qui ne se souvient pas de sa position vaut
 * mieux qu'une page blanche.
 */
const KEY = 'aventurine:scroll';

function read(): Record<string, number> {
  try {
    const raw = globalThis.sessionStorage.getItem(KEY);
    const parsed: unknown = raw === null ? null : JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, number>)
      : {};
  } catch {
    return {};
  }
}

export function rememberedScroll(screenKey: string): number {
  const top = read()[screenKey];
  return typeof top === 'number' && Number.isFinite(top) && top > 0 ? top : 0;
}

export function rememberScroll(screenKey: string, top: number): void {
  const positions = { ...read(), [screenKey]: Math.max(0, Math.round(top)) };
  try {
    globalThis.sessionStorage.setItem(KEY, JSON.stringify(positions));
  } catch {
    // Rien à faire : la position de lecture n'est pas une donnée à sauver deux
    // fois, et l'échec ne coûte qu'un retour en haut de page.
  }
}
