import { emptyPackDraft, packDraftFile, parsePackDraft } from '../../domain/packDraft';
import type { PackDraft } from '../../domain/packDraft';

/**
 * Le pack en cours d'écriture, sous sa propre clé. Le fichier reste la vérité
 * qu'on emporte ; ceci n'est que le filet — un onglet fermé au milieu d'une
 * classe ne doit pas coûter deux heures de travail. « Enregistrer le fichier »
 * redevient donc un geste délibéré, pas la seule façon de ne rien perdre.
 */
const CREATOR_KEY = 'aventurine:creator:v1';

function probe(): Storage | null {
  try {
    const storage = globalThis.localStorage;
    const key = `${CREATOR_KEY}:probe`;
    storage.setItem(key, '1');
    storage.removeItem(key);
    return storage;
  } catch {
    return null;
  }
}

export function loadPackDraft(): PackDraft {
  const raw = probe()?.getItem(CREATOR_KEY) ?? null;
  if (raw === null) {
    return emptyPackDraft();
  }
  try {
    return parsePackDraft(JSON.parse(raw));
  } catch {
    return emptyPackDraft();
  }
}

export function savePackDraft(draft: PackDraft): void {
  try {
    // La même forme que le fichier : l'aller-retour est celui qu'un test fixe
    // déjà, et il n'y a pas deux façons de relire un brouillon.
    probe()?.setItem(CREATOR_KEY, JSON.stringify(packDraftFile(draft, '')));
  } catch {
    // Le brouillon est un filet, pas la vérité : un quota plein ne doit pas
    // interrompre l'écriture. Le fichier, lui, reste toujours exportable.
  }
}
