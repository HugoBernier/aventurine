import type { CharacterDraft } from '../../domain/draft';
import type { ScreenId } from '../types';

export const STORAGE_KEY = 'aventurine:draft:v1';
export const SCHEMA_VERSION = 1;

export interface PersistedSession {
  readonly version: number;
  readonly savedAt: string;
  readonly draft: CharacterDraft;
  readonly currentScreenId: ScreenId;
}

export type LoadResult =
  | { readonly kind: 'empty' }
  | { readonly kind: 'session'; readonly session: PersistedSession }
  | { readonly kind: 'unreadable'; readonly cause: 'json' | 'version' | 'shape' }
  | { readonly kind: 'unavailable' };

export type SaveResult =
  { readonly kind: 'ok' } | { readonly kind: 'quota' } | { readonly kind: 'unavailable' };

/**
 * Seule interface du lot, et la charte l'autorise nommément : la persistance
 * est une frontière réelle. Deux implémentations, pas une — celle en mémoire
 * sert aux tests et à la navigation privée, où `localStorage` peut lever.
 */
export interface DraftStorage {
  load(): LoadResult;
  save(session: PersistedSession): SaveResult;
  clear(): void;
}
