import { beforeEach, describe, expect, it } from 'vitest';
import { throughJson } from '../../test/throughJson';
import { emptyDraft } from '../../domain/draft';
import { LEGACY_KEY, SCHEMA_VERSION, STORAGE_KEY } from './DraftStorage';
import type { PersistedSession } from './DraftStorage';
import { localStorageDraftStorage } from './localStorageDraftStorage';
import { memoryDraftStorage } from './memoryDraftStorage';
import { parseLegacySession, parseSession } from './parseSession';

const session: PersistedSession = {
  version: SCHEMA_VERSION,
  savedAt: '2026-08-29T12:00:00.000Z',
  characters: [
    {
      id: 'perso-1',
      draft: { ...emptyDraft(), name: 'Alric', raceId: 'nain' },
      currentScreenId: 'class',
    },
  ],
  currentId: 'perso-1',
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
    // La v2 est la version courante : c'est une v3 hypothétique qu'on refuse.
    expect(parseSession({ ...session, version: 3 })).toBeNull();
    expect(parseSession({ ...session, version: 1 })).toBeNull();
  });

  it('refuse ce qui n’est pas un objet', () => {
    expect(parseSession('bonjour')).toBeNull();
  });

  it('refuse une session sans brouillon lisible', () => {
    expect(
      parseSession({ version: SCHEMA_VERSION, characters: [{ draft: 42 }] }),
    ).toBeNull();
  });

  it('retombe sur le premier écran si l’écran mémorisé est illisible', () => {
    const parsed = parseSession({
      ...session,
      characters: [{ ...session.characters[0], currentScreenId: 7 }],
    });
    expect(parsed?.characters[0]?.currentScreenId).toBe('race');
  });

  it('reprend une sauvegarde de la version 1, qui ne gardait qu’un personnage', () => {
    const v1 = {
      version: 1,
      savedAt: '2026-08-29T12:00:00.000Z',
      draft: { ...emptyDraft(), name: 'Alric' },
      currentScreenId: 'class',
    };
    const parsed = parseLegacySession(v1);
    expect(parsed?.characters).toHaveLength(1);
    expect(parsed?.characters[0]?.draft.name).toBe('Alric');
    expect(parsed?.currentId).toBe(parsed?.characters[0]?.id);
  });

  it('désigne le premier personnage quand l’identifiant courant est inconnu', () => {
    const parsed = parseSession({ ...session, currentId: 'inexistant' });
    expect(parsed?.currentId).toBe('perso-1');
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

describe('reprise d’une sauvegarde de la version 1', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('récupère le personnage et efface l’ancienne clé', () => {
    globalThis.localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({
        version: 1,
        savedAt: '2026-08-29T12:00:00.000Z',
        draft: { ...emptyDraft(), name: 'Alric' },
        currentScreenId: 'class',
      }),
    );

    const result = localStorageDraftStorage().load();
    const name =
      result.kind === 'session' ? result.session.characters[0]?.draft.name : null;
    expect(name).toBe('Alric');
    // Relue une fois, jamais deux : sinon un « nouveau personnage » ferait
    // réapparaître l'ancien au rechargement suivant.
    expect(globalThis.localStorage.getItem(LEGACY_KEY)).toBeNull();
  });
});
