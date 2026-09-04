import { parsePack } from '../../domain/parsePack';
import type { Catalogue } from '../../domain/catalogue';
import type { ContentPack } from '../../domain/pack';
import type { SaveResult } from './DraftStorage';

/**
 * Les packs gardent leur propre clé : un échec d'écriture de leur côté — un
 * quota atteint par un gros supplément — ne doit jamais toucher les
 * personnages, qui sont ce qu'on ne peut pas reconstruire.
 */
const PACKS_KEY = 'aventurine:packs:v1';

function probe(): Storage | null {
  try {
    const storage = globalThis.localStorage;
    const key = `${PACKS_KEY}:probe`;
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

/**
 * Ce qu'on a rangé, relu par la MÊME validation que l'import : rien n'entre
 * dans l'application sans passer par elle, y compris ce qui en sort. Un pack
 * qui ne repasse plus — parce que le catalogue a changé sous lui — est écarté
 * en silence plutôt que de faire échouer le démarrage.
 */
export function loadPacks(catalogue: Catalogue): readonly ContentPack[] {
  const storage = probe();
  if (storage === null) {
    return [];
  }
  const raw = storage.getItem(PACKS_KEY);
  if (raw === null) {
    return [];
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    storage.removeItem(PACKS_KEY);
    return [];
  }
  if (!Array.isArray(value)) {
    storage.removeItem(PACKS_KEY);
    return [];
  }
  const packs: ContentPack[] = [];
  for (const entry of value) {
    const parsed = parsePack(entry, catalogue);
    if (parsed.kind === 'ok') {
      packs.push(parsed.pack);
    }
  }
  return packs;
}

/**
 * Le même compte rendu que la sauvegarde d'un personnage : un échec se dit, il
 * ne se tait pas. On ne supprime jamais ce qui est déjà rangé pour faire de la
 * place — perdre un pack installé pour en écrire un autre serait un marché que
 * personne n'a demandé.
 */
export function savePacks(packs: readonly ContentPack[]): SaveResult {
  const storage = probe();
  if (storage === null) {
    return { kind: 'unavailable' };
  }
  try {
    storage.setItem(
      PACKS_KEY,
      JSON.stringify(packs.map((pack) => ({ pack: pack.info, spells: pack.spells }))),
    );
    return { kind: 'ok' };
  } catch (error) {
    return isQuotaError(error) ? { kind: 'quota' } : { kind: 'unavailable' };
  }
}
