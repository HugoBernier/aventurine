import { parseDraft } from '../../domain/parseDraft';
import { SCHEMA_VERSION } from './DraftStorage';
import type { PersistedSession } from './DraftStorage';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Garde de forme écrite à la main : un seul schéma, un seul point d'entrée.
 * Une dépendance de validation coûterait plus que ces quelques lignes testées.
 */
export function parseSession(value: unknown): PersistedSession | null {
  if (!isRecord(value)) {
    return null;
  }
  if (value.version !== SCHEMA_VERSION) {
    return null;
  }
  const parsed = parseDraft(value.draft);
  if (parsed === null) {
    return null;
  }
  return {
    version: SCHEMA_VERSION,
    savedAt: typeof value.savedAt === 'string' ? value.savedAt : '',
    draft: parsed.draft,
    currentScreenId:
      typeof value.currentScreenId === 'string' ? value.currentScreenId : 'race',
  };
}
