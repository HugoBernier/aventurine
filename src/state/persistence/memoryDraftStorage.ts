import type {
  DraftStorage,
  LoadResult,
  PersistedSession,
  SaveResult,
} from './DraftStorage';

/** Repli quand `localStorage` est refusé, et support des tests. */
export function memoryDraftStorage(): DraftStorage {
  let held: PersistedSession | null = null;
  return {
    load(): LoadResult {
      return held === null ? { kind: 'empty' } : { kind: 'session', session: held };
    },
    save(session: PersistedSession): SaveResult {
      held = session;
      return { kind: 'ok' };
    },
    clear(): void {
      held = null;
    },
  };
}
