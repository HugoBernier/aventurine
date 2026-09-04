import type { CharacterDraft } from '../../domain/draft';
import type { ScreenId, WizardView } from '../types';

export const STORAGE_KEY = 'aventurine:library:v2';
/** La v1 ne gardait qu'un personnage. On la relit une fois, puis on l'oublie. */
export const LEGACY_KEY = 'aventurine:draft:v1';
export const SCHEMA_VERSION = 2;

export interface PersistedCharacter {
  readonly id: string;
  readonly draft: CharacterDraft;
  readonly currentScreenId: ScreenId;
}

export interface PersistedSession {
  readonly version: number;
  readonly savedAt: string;
  readonly characters: readonly PersistedCharacter[];
  readonly currentId: string;
  /** Ce qu'on regardait : recharger doit ramener au même endroit. */
  readonly view: WizardView;
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
 * est une frontière réelle. Deux implémentations, pas une : celle en mémoire
 * sert aux tests et à la navigation privée, où `localStorage` peut lever.
 */
export interface DraftStorage {
  load(): LoadResult;
  save(session: PersistedSession): SaveResult;
  clear(): void;
}
