import { createContext, useEffect, useMemo, useReducer } from 'react';
import type { Dispatch, ReactNode } from 'react';
import type { Catalogue } from '../domain/catalogue';
import { buildFlow } from './flow';
import { SCHEMA_VERSION } from './persistence/DraftStorage';
import type { DraftStorage } from './persistence/DraftStorage';
import { localStorageDraftStorage } from './persistence/localStorageDraftStorage';
import { createWizardReducer, initialState } from './reducer';
import type { StorageStatus, WizardAction, WizardState } from './types';

export interface WizardContextValue {
  readonly state: WizardState;
  readonly catalogue: Catalogue;
}

export const WizardStateContext = createContext<WizardContextValue | null>(null);
/** Contexte séparé, référence stable : ce qui ne lit que `dispatch` ne re-rend jamais. */
export const WizardDispatchContext = createContext<Dispatch<WizardAction> | null>(null);

const SAVE_DEBOUNCE_MS = 400;

function statusFor(kind: 'ok' | 'quota' | 'unavailable'): StorageStatus {
  return kind === 'unavailable' ? 'memory' : kind;
}

function restore(storage: DraftStorage, catalogue: Catalogue): WizardState {
  const result = storage.load();
  if (result.kind !== 'session') {
    const status: StorageStatus = result.kind === 'unavailable' ? 'memory' : 'ok';
    return { ...initialState(), storage: status };
  }
  // L'écran mémorisé peut avoir disparu si le contenu a changé de version.
  const flow = buildFlow(result.session.draft, catalogue);
  const isKnown = flow.some((screen) => screen.id === result.session.currentScreenId);
  return {
    ...initialState(result.session.draft),
    currentScreenId: isKnown ? result.session.currentScreenId : (flow[0]?.id ?? 'race'),
  };
}

export interface WizardProviderProps {
  readonly catalogue: Catalogue;
  readonly storage?: DraftStorage;
  readonly children: ReactNode;
}

export function WizardProvider({
  catalogue,
  storage,
  children,
}: WizardProviderProps): ReactNode {
  const store = useMemo(() => storage ?? localStorageDraftStorage(), [storage]);
  const reducer = useMemo(() => createWizardReducer(catalogue), [catalogue]);

  // Initialiseur paresseux : la reprise est synchrone, donc pas d'écran de
  // chargement ni de clignotement au démarrage.
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    restore(store, catalogue),
  );

  const { draft, currentScreenId, storage: storageStatus } = state;
  // L'état du stockage suffit à savoir qu'il ne sert à rien de réessayer :
  // une ref de plus serait une seconde source de vérité.
  const hasStorageFailed = storageStatus === 'quota' || storageStatus === 'memory';

  useEffect(() => {
    const write = (): void => {
      if (hasStorageFailed) {
        return;
      }
      const result = store.save({
        version: SCHEMA_VERSION,
        savedAt: new Date().toISOString(),
        draft,
        currentScreenId,
      });
      if (result.kind !== 'ok') {
        // On cesse d'insister : réessayer à chaque frappe consommerait du
        // temps pour le même échec, et l'interface l'a déjà annoncé.
        dispatch({ type: 'SET_STORAGE_STATUS', status: statusFor(result.kind) });
      }
    };

    const timer = globalThis.setTimeout(write, SAVE_DEBOUNCE_MS);
    // Sur mobile l'onglet est tué sans `beforeunload` : on écrit aussi ici.
    const flush = (): void => {
      globalThis.clearTimeout(timer);
      write();
    };
    globalThis.addEventListener('pagehide', flush);
    return () => {
      globalThis.clearTimeout(timer);
      globalThis.removeEventListener('pagehide', flush);
    };
  }, [draft, currentScreenId, store, hasStorageFailed]);

  const value = useMemo<WizardContextValue>(
    () => ({ state, catalogue }),
    [state, catalogue],
  );

  return (
    <WizardStateContext value={value}>
      <WizardDispatchContext value={dispatch}>{children}</WizardDispatchContext>
    </WizardStateContext>
  );
}
