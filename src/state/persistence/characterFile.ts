import { parseDraft } from '../../domain/parseDraft';
import type { DraftWarning } from '../../domain/parseDraft';
import type { CharacterDraft } from '../../domain/draft';
import { APP_MAJOR_VERSION } from './appVersion';

export type CharacterFileResult =
  | {
      readonly kind: 'ok';
      readonly draft: CharacterDraft;
      readonly warnings: readonly DraftWarning[];
    }
  /** Écrit par une Aventurine plus récente : on ne sait pas ce qu'on lirait. */
  | { readonly kind: 'too-new'; readonly wrote: number }
  | { readonly kind: 'unreadable' };

/**
 * Le fichier qu'on emporte. Indenté, parce qu'un joueur peut vouloir l'ouvrir,
 * et enveloppé plutôt que nu : sans le numéro, une version future n'aurait
 * aucun moyen de refuser proprement ce qu'elle ne sait pas lire.
 */
export function characterFileText(draft: CharacterDraft): string {
  return JSON.stringify({ aventurine: APP_MAJOR_VERSION, character: draft }, null, 2);
}

/** `personnage-alric.json` : reconnaissable dans un dossier de téléchargements. */
export function characterFileName(name: string): string {
  const slug = name
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, '-')
    .replaceAll(/^-|-$/gu, '');
  return `personnage-${slug === '' ? 'sans-nom' : slug}.json`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Un fichier venu du disque n'est pas de confiance, même quand c'est nous qui
 * l'avons écrit : il a pu être modifié à la main, ou arriver d'un autre
 * appareil. Le refus est net et sans réparation.
 */
export function parseCharacterFile(value: unknown): CharacterFileResult {
  if (!isRecord(value) || typeof value.aventurine !== 'number') {
    return { kind: 'unreadable' };
  }
  if (value.aventurine > APP_MAJOR_VERSION) {
    return { kind: 'too-new', wrote: value.aventurine };
  }
  const parsed = parseDraft(value.character);
  return parsed === null
    ? { kind: 'unreadable' }
    : { kind: 'ok', draft: parsed.draft, warnings: parsed.warnings };
}

/** Le texte brut d'un fichier : tout ce qui n'est pas du JSON s'arrête ici. */
export function readCharacterFile(text: string): CharacterFileResult {
  try {
    return parseCharacterFile(JSON.parse(text));
  } catch {
    return { kind: 'unreadable' };
  }
}
