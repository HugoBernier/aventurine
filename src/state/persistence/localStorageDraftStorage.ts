import { STORAGE_KEY } from './DraftStorage';
import type {
  DraftStorage,
  LoadResult,
  PersistedSession,
  SaveResult,
} from './DraftStorage';
import { parseSession } from './parseSession';

/**
 * `localStorage` peut lever à la simple lecture de `window.localStorage` :
 * navigation privée verrouillée, cookies bloqués, iframe tierce. On teste donc
 * l'accès ET une écriture sonde, tous deux sous `try`.
 */
function probe(): Storage | null {
  try {
    const storage = globalThis.localStorage;
    const key = `${STORAGE_KEY}:probe`;
    storage.setItem(key, '1');
    storage.removeItem(key);
    return storage;
  } catch {
    return null;
  }
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

export function localStorageDraftStorage(): DraftStorage {
  return {
    load(): LoadResult {
      const storage = probe();
      if (storage === null) {
        return { kind: 'unavailable' };
      }
      const raw = storage.getItem(STORAGE_KEY);
      if (raw === null) {
        return { kind: 'empty' };
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        // Conserver un blob corrompu consomme du quota et bloque le joueur.
        storage.removeItem(STORAGE_KEY);
        return { kind: 'unreadable', cause: 'json' };
      }
      const session = parseSession(parsed);
      if (session === null) {
        storage.removeItem(STORAGE_KEY);
        return { kind: 'unreadable', cause: 'shape' };
      }
      return { kind: 'session', session };
    },

    save(session: PersistedSession): SaveResult {
      const storage = probe();
      if (storage === null) {
        return { kind: 'unavailable' };
      }
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(session));
        return { kind: 'ok' };
      } catch (error) {
        // On ne supprime jamais la sauvegarde existante pour faire de la place.
        return isQuotaError(error) ? { kind: 'quota' } : { kind: 'unavailable' };
      }
    },

    clear(): void {
      probe()?.removeItem(STORAGE_KEY);
    },
  };
}
