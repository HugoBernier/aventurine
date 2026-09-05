import { parsePack } from '../../domain/parsePack';
import type { Catalogue } from '../../domain/catalogue';
import { packDraftFile } from '../../domain/packDraft';
import type { PackDraft } from '../../domain/packDraft';
import type { ContentPack, PackIssue } from '../../domain/pack';
import { APP_MAJOR_VERSION } from './appVersion';

/**
 * Trois fois tout le SRD. Le plafond n'est pas là pour border les auteurs — un
 * supplément de campagne réaliste pèse une trentaine de kio — mais pour
 * arrêter l'absurde : un fichier de 50 Mio fige le téléphone à l'analyse.
 * Vérifié sur le texte brut, avant d'analyser quoi que ce soit.
 */
export const MAX_PACK_BYTES = 1024 * 1024;

export type PackFileResult =
  | { readonly kind: 'ok'; readonly pack: ContentPack }
  /** Écrit par une Aventurine plus récente : on ne sait pas ce qu'on lirait. */
  | { readonly kind: 'too-new'; readonly wrote: number }
  | { readonly kind: 'too-big'; readonly bytes: number }
  | { readonly kind: 'unreadable' }
  | { readonly kind: 'invalid'; readonly issues: readonly PackIssue[] };

/**
 * Le fichier d'un pack. Les tableaux des genres à venir sont écrits vides
 * plutôt qu'omis : le format est celui du §2 du plan, et un lecteur humain
 * doit voir ce qu'un pack peut porter.
 */
export function packFileText(pack: ContentPack): string {
  return JSON.stringify(
    {
      aventurine: APP_MAJOR_VERSION,
      pack: pack.info,
      races: [],
      classes: [],
      backgrounds: [],
      spells: pack.spells,
    },
    null,
    2,
  );
}

/**
 * Le fichier d'un pack encore en écriture. L'enveloppe est la MÊME : un pack
 * inachevé s'enregistre, se rouvre dans le créateur, et s'installera le jour
 * où il sera complet — sans jamais changer de forme entre-temps.
 */
export function packDraftFileText(draft: PackDraft, updatedAt: string): string {
  return JSON.stringify(
    { aventurine: APP_MAJOR_VERSION, ...packDraftFile(draft, updatedAt) },
    null,
    2,
  );
}

/** `pack-karn.json` : reconnaissable dans un dossier de téléchargements. */
export function packFileName(pack: ContentPack): string {
  return `pack-${pack.info.id}.json`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Le texte brut d'un fichier : tout ce qui n'est pas du JSON s'arrête ici. */
export function readPackFile(text: string, catalogue: Catalogue): PackFileResult {
  const bytes = new TextEncoder().encode(text).length;
  if (bytes > MAX_PACK_BYTES) {
    return { kind: 'too-big', bytes };
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { kind: 'unreadable' };
  }
  if (!isRecord(value) || typeof value.aventurine !== 'number') {
    return { kind: 'unreadable' };
  }
  if (value.aventurine > APP_MAJOR_VERSION) {
    return { kind: 'too-new', wrote: value.aventurine };
  }
  const parsed = parsePack(value, catalogue);
  return parsed.kind === 'ok'
    ? { kind: 'ok', pack: parsed.pack }
    : { kind: 'invalid', issues: parsed.issues };
}
