import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { catalogueWithPacks } from '../domain/packCatalogue';
import type { AdvancementFor } from '../domain/packCatalogue';
import type { Catalogue } from '../domain/catalogue';
import type { ContentPack } from '../domain/pack';
import { readPackFile } from './persistence/packFile';
import { loadPackFiles, savePackFiles } from './persistence/packStorage';

/** Un pack installé : ce que l'application en lit, et le fichier qui l'a écrit. */
export interface InstalledPack {
  readonly pack: ContentPack;
  readonly file: string;
}

export interface PacksValue {
  readonly packs: readonly ContentPack[];
  /** Le SRD augmenté de ce qui est installé : ce que voit l'application. */
  readonly catalogue: Catalogue;
  /** Réinstaller un pack le REMPLACE : c'est la mise à jour, pas un doublon. */
  readonly install: (pack: ContentPack, file: string) => void;
  readonly remove: (packId: string) => void;
  /**
   * Le fichier tel qu'on l'a reçu. C'est lui qu'on rend à l'auteur, et lui
   * qu'on rouvre pour modifier : reconstruire un fichier depuis ce que
   * l'analyse en a tiré perdrait ce qu'elle n'a pas eu à comprendre.
   */
  readonly fileOf: (packId: string) => string | null;
  readonly isStorageFull: boolean;
}

const PacksContext = createContext<PacksValue | null>(null);

export interface PacksProviderProps {
  /** Le contenu du SRD, seul socle : les packs se posent dessus. */
  readonly base: Catalogue;
  /** Injecté depuis `data/`, comme le socle : la prose française y vit. */
  readonly advancementFor: AdvancementFor;
  readonly children: ReactNode;
}

export function PacksProvider({
  base,
  advancementFor,
  children,
}: PacksProviderProps): ReactNode {
  // Initialiseur paresseux : la relecture est synchrone, comme celle des
  // personnages, donc pas d'écran de chargement.
  const [files, setFiles] = useState<readonly string[]>(loadPackFiles);
  const [isStorageFull, setStorageFull] = useState(false);

  const write = useCallback((next: readonly string[]): void => {
    setFiles(next);
    setStorageFull(savePackFiles(next).kind === 'quota');
  }, []);

  // Le MÊME lecteur que l'import : un pack rangé repasse par l'enveloppe, la
  // borne de taille et la validation, sans quoi ce qui entre par le stockage
  // n'aurait pas franchi ce qui entre par le fichier. Un pack qui ne repasse
  // plus — parce que le catalogue a changé sous lui — est écarté en silence
  // plutôt que de faire échouer le démarrage.
  const installed = useMemo<readonly InstalledPack[]>(
    () =>
      files.flatMap((file) => {
        const read = readPackFile(file, base);
        return read.kind === 'ok' ? [{ pack: read.pack, file }] : [];
      }),
    [files, base],
  );

  const value = useMemo<PacksValue>(() => {
    const packs = installed.map((entry) => entry.pack);
    const without = (packId: string): readonly string[] =>
      installed.filter((kept) => kept.pack.info.id !== packId).map((kept) => kept.file);
    return {
      packs,
      catalogue: catalogueWithPacks(base, packs, advancementFor),
      install: (pack, file) => {
        write([...without(pack.info.id), file]);
      },
      remove: (packId) => {
        write(without(packId));
      },
      fileOf: (packId) =>
        installed.find((entry) => entry.pack.info.id === packId)?.file ?? null,
      isStorageFull,
    };
  }, [base, installed, isStorageFull, write, advancementFor]);

  return <PacksContext value={value}>{children}</PacksContext>;
}

export function usePacks(): PacksValue {
  const value = useContext(PacksContext);
  if (value === null) {
    throw new Error('usePacks hors de PacksProvider');
  }
  return value;
}
