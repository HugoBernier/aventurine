import { parseDraft } from '../../domain/parseDraft';
import { SCHEMA_VERSION } from './DraftStorage';
import type { PersistedCharacter, PersistedSession } from './DraftStorage';
import type { ScreenId } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Garde de forme écrite à la main : un seul schéma, un seul point d'entrée.
 * Une dépendance de validation coûterait plus que ces quelques lignes testées.
 */
function asScreenId(value: unknown): ScreenId {
  return typeof value === 'string' ? value : 'race';
}

function parseCharacter(value: unknown, fallbackId: string): PersistedCharacter | null {
  if (!isRecord(value)) {
    return null;
  }
  const parsed = parseDraft(value.draft);
  if (parsed === null) {
    return null;
  }
  return {
    id: typeof value.id === 'string' && value.id !== '' ? value.id : fallbackId,
    draft: parsed.draft,
    currentScreenId: asScreenId(value.currentScreenId),
  };
}

export function parseSession(value: unknown): PersistedSession | null {
  if (!isRecord(value)) {
    return null;
  }
  if (value.version !== SCHEMA_VERSION || !Array.isArray(value.characters)) {
    return null;
  }
  const characters = value.characters
    .map((entry, index) => parseCharacter(entry, `perso-${String(index + 1)}`))
    .filter((entry): entry is PersistedCharacter => entry !== null);
  if (characters.length === 0) {
    return null;
  }
  const wanted = typeof value.currentId === 'string' ? value.currentId : '';
  const current = characters.some((entry) => entry.id === wanted)
    ? wanted
    : (characters[0]?.id ?? '');
  return {
    version: SCHEMA_VERSION,
    savedAt: typeof value.savedAt === 'string' ? value.savedAt : '',
    characters,
    currentId: current,
  };
}

/**
 * La sauvegarde v1 ne contenait qu'un brouillon. On la relit une fois pour ne
 * perdre personne, et elle devient le premier personnage de la bibliothèque.
 */
export function parseLegacySession(value: unknown): PersistedSession | null {
  if (!isRecord(value) || value.version !== 1) {
    return null;
  }
  const parsed = parseDraft(value.draft);
  if (parsed === null) {
    return null;
  }
  return {
    version: SCHEMA_VERSION,
    savedAt: typeof value.savedAt === 'string' ? value.savedAt : '',
    characters: [
      {
        id: 'perso-1',
        draft: parsed.draft,
        currentScreenId: asScreenId(value.currentScreenId),
      },
    ],
    currentId: 'perso-1',
  };
}
