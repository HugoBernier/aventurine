import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { catalogueWithPacks } from '../domain/packCatalogue';
import type { Catalogue } from '../domain/catalogue';
import type { ContentPack } from '../domain/pack';
import { loadPacks, savePacks } from './persistence/packStorage';

export interface PacksValue {
  readonly packs: readonly ContentPack[];
  /** Le SRD augmenté de ce qui est installé : ce que voit l'application. */
  readonly catalogue: Catalogue;
  /** Réinstaller un pack le REMPLACE : c'est la mise à jour, pas un doublon. */
  readonly install: (pack: ContentPack) => void;
  readonly remove: (packId: string) => void;
  readonly isStorageFull: boolean;
}

const PacksContext = createContext<PacksValue | null>(null);

export interface PacksProviderProps {
  /** Le contenu du SRD, seul socle : les packs se posent dessus. */
  readonly base: Catalogue;
  readonly children: ReactNode;
}

export function PacksProvider({ base, children }: PacksProviderProps): ReactNode {
  // Initialiseur paresseux : la relecture est synchrone, comme celle des
  // personnages, donc pas d'écran de chargement.
  const [packs, setPacks] = useState<readonly ContentPack[]>(() => loadPacks(base));
  const [isStorageFull, setStorageFull] = useState(false);

  const write = useCallback((next: readonly ContentPack[]): void => {
    setPacks(next);
    setStorageFull(savePacks(next).kind === 'quota');
  }, []);

  const value = useMemo<PacksValue>(
    () => ({
      packs,
      catalogue: catalogueWithPacks(base, packs),
      install: (pack) => {
        write([...packs.filter((kept) => kept.info.id !== pack.info.id), pack]);
      },
      remove: (packId) => {
        write(packs.filter((kept) => kept.info.id !== packId));
      },
      isStorageFull,
    }),
    [base, packs, isStorageFull, write],
  );

  return <PacksContext value={value}>{children}</PacksContext>;
}

export function usePacks(): PacksValue {
  const value = useContext(PacksContext);
  if (value === null) {
    throw new Error('usePacks hors de PacksProvider');
  }
  return value;
}
