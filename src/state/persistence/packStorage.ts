import type { SaveResult } from './DraftStorage';
import { APP_MAJOR_VERSION } from './appVersion';

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
 * Ce qu'on a rangé : les FICHIERS, tels qu'on les a reçus.
 *
 * On a d'abord rangé un résumé de ce que l'analyse en avait tiré, et ce résumé
 * a cessé de tout dire le jour où un pack a porté des peuples, des classes et
 * des voies : un pack de neuf kio revenait à deux cent vingt et un octets, et
 * sa classe avait disparu au rechargement suivant. Le texte, lui, ne peut pas
 * cesser de tout dire — c'est ce que l'auteur a écrit.
 *
 * Il sert aussi à le lui rendre : « enregistrer le fichier » redonne les
 * mêmes octets, et « modifier » les rouvre dans le créateur.
 */
export function loadPackFiles(): readonly string[] {
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
  return value.flatMap((entry) => migrated(entry));
}

/**
 * L'ancienne forme rangeait `{ pack, spells }`. C'est exactement le fichier
 * qu'on écrivait alors, moins son enveloppe : on la lui remet plutôt que de
 * jeter l'entrée. Le pack revient amputé de ce que l'ancienne forme avait
 * déjà perdu, mais il revient.
 */
function migrated(entry: unknown): readonly string[] {
  if (typeof entry === 'string') {
    return [entry];
  }
  if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
    return [];
  }
  return [JSON.stringify({ aventurine: APP_MAJOR_VERSION, ...entry })];
}

/**
 * Le même compte rendu que la sauvegarde d'un personnage : un échec se dit, il
 * ne se tait pas. On ne supprime jamais ce qui est déjà rangé pour faire de la
 * place — perdre un pack installé pour en écrire un autre serait un marché que
 * personne n'a demandé.
 */
export function savePackFiles(files: readonly string[]): SaveResult {
  const storage = probe();
  if (storage === null) {
    return { kind: 'unavailable' };
  }
  try {
    storage.setItem(PACKS_KEY, JSON.stringify(files));
    return { kind: 'ok' };
  } catch (error) {
    return isQuotaError(error) ? { kind: 'quota' } : { kind: 'unavailable' };
  }
}
