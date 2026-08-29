import { beforeEach, describe, expect, it } from 'vitest';
import { throughJson } from '../../test/throughJson';
import { emptyDraft } from '../../domain/draft';
import { SCHEMA_VERSION, STORAGE_KEY } from './DraftStorage';
import type { PersistedSession } from './DraftStorage';
import { localStorageDraftStorage } from './localStorageDraftStorage';
import { memoryDraftStorage } from './memoryDraftStorage';
import { parseSession } from './parseSession';

const session: PersistedSession = {
  version: SCHEMA_VERSION,
  savedAt: '2026-08-29T12:00:00.000Z',
  draft: { ...emptyDraft(), name: 'Alric', raceId: 'nain' },
  currentScreenId: 'class',
};

describe('stockage en mémoire', () => {
  it('rend une session vide au départ', () => {
    expect(memoryDraftStorage().load()).toEqual({ kind: 'empty' });
  });

  it('relit ce qu’il vient d’écrire', () => {
    const storage = memoryDraftStorage();
    expect(storage.save(session)).toEqual({ kind: 'ok' });
    expect(storage.load()).toEqual({ kind: 'session', session });
  });

  it('oublie tout après effacement', () => {
    const storage = memoryDraftStorage();
    storage.save(session);
    storage.clear();
    expect(storage.load()).toEqual({ kind: 'empty' });
  });
});

describe('garde de forme d’une session', () => {
  it('accepte une session bien formée', () => {
    expect(parseSession(throughJson(session))).toEqual(session);
  });

  it('refuse une version inconnue plutôt que de deviner', () => {
    expect(parseSession({ ...session, version: 2 })).toBeNull();
  });

  it('refuse ce qui n’est pas un objet', () => {
    expect(parseSession('bonjour')).toBeNull();
  });

  it('refuse une session sans brouillon lisible', () => {
    expect(parseSession({ version: SCHEMA_VERSION, draft: 42 })).toBeNull();
  });

  it('retombe sur le premier écran si l’écran mémorisé est illisible', () => {
    const parsed = parseSession({ ...session, currentScreenId: 7 });
    expect(parsed?.currentScreenId).toBe('race');
  });
});

describe('stockage du navigateur', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('reprend la session enregistrée après un rechargement', () => {
    const storage = localStorageDraftStorage();
    storage.save(session);
    expect(localStorageDraftStorage().load()).toEqual({ kind: 'session', session });
  });

  it('repart d’un brouillon vide si le JSON est corrompu, et nettoie la clé', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, '{ceci n’est pas du JSON');
    expect(localStorageDraftStorage().load()).toEqual({
      kind: 'unreadable',
      cause: 'json',
    });
    expect(globalThis.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('repart d’un brouillon vide si la version du schéma est inconnue', () => {
    globalThis.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...session, version: 99 }),
    );
    expect(localStorageDraftStorage().load()).toEqual({
      kind: 'unreadable',
      cause: 'shape',
    });
  });

  it('rend une session vide quand rien n’a jamais été enregistré', () => {
    expect(localStorageDraftStorage().load()).toEqual({ kind: 'empty' });
  });

  it('efface la sauvegarde à la demande', () => {
    const storage = localStorageDraftStorage();
    storage.save(session);
    storage.clear();
    expect(storage.load()).toEqual({ kind: 'empty' });
  });
});
