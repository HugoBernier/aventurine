import { describe, expect, it } from 'vitest';
import { emptyDraft } from '../../domain/draft';
import { APP_MAJOR_VERSION } from './appVersion';
import { characterFileName, characterFileText, readCharacterFile } from './characterFile';

const alric = {
  ...emptyDraft(),
  name: 'Alric',
  raceId: 'nain',
  classId: 'clerc',
  level: 5,
  choices: { 'class:clerc:skills': ['medecine', 'religion'] },
};

describe('le fichier d’un personnage', () => {
  it('revient identique après l’aller-retour', () => {
    const result = readCharacterFile(characterFileText(alric));
    expect(result).toEqual({ kind: 'ok', draft: alric, warnings: [] });
  });

  it('s’écrit indenté, pour rester lisible à l’œil', () => {
    expect(characterFileText(alric)).toContain(
      `\n  "aventurine": ${String(APP_MAJOR_VERSION)}`,
    );
  });

  it('refuse un fichier écrit par une Aventurine plus récente', () => {
    const futur = JSON.stringify({
      aventurine: APP_MAJOR_VERSION + 1,
      character: alric,
    });
    expect(readCharacterFile(futur)).toEqual({
      kind: 'too-new',
      wrote: APP_MAJOR_VERSION + 1,
    });
  });

  it('refuse ce qui n’est pas du JSON', () => {
    expect(readCharacterFile('{ceci n’est pas')).toEqual({ kind: 'unreadable' });
  });

  it('refuse un JSON sans le numéro d’Aventurine', () => {
    // Un brouillon nu, sans enveloppe : on ne saurait pas quoi en faire demain.
    expect(readCharacterFile(JSON.stringify(alric))).toEqual({ kind: 'unreadable' });
  });

  it('refuse un personnage qui n’en est pas un', () => {
    expect(readCharacterFile(JSON.stringify({ aventurine: 1, character: 42 }))).toEqual({
      kind: 'unreadable',
    });
  });

  it('signale ce qu’il n’a pas compris plutôt que de le taire', () => {
    const bricole = JSON.stringify({
      aventurine: 1,
      character: { ...alric, choices: { 'pas-un-creneau': ['x'] } },
    });
    const result = readCharacterFile(bricole);
    expect(result.kind === 'ok' ? result.warnings : []).toEqual([
      { kind: 'unknown-slot', slotId: 'pas-un-creneau' },
    ]);
  });
});

describe('le nom du fichier', () => {
  it('reprend le nom du personnage, sans accent ni espace', () => {
    expect(characterFileName('Élodie la Rusée')).toBe('personnage-elodie-la-rusee.json');
  });

  it('a un nom de repli quand le personnage n’en a pas', () => {
    expect(characterFileName('')).toBe('personnage-sans-nom.json');
  });
});
