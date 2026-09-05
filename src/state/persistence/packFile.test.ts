import { describe, expect, it } from 'vitest';
import { MINI_CATALOGUE } from '../../domain/fixtures/miniCatalogue';
import type { ContentPack } from '../../domain/pack';
import { APP_MAJOR_VERSION } from './appVersion';
import { emptyPackDraft, emptySpellDraft } from '../../domain/packDraft';
import {
  MAX_PACK_BYTES,
  packDraftFileText,
  packFileName,
  packFileText,
  readPackFile,
} from './packFile';

const karn: ContentPack = {
  info: {
    id: 'karn',
    name: 'Les Brumes de Karn',
    author: 'Hugo',
    description: 'Une campagne gothique.',
    updatedAt: '2026-09-04T10:12:00.000Z',
  },
  spells: [
    {
      id: 'karn-appel-des-brumes',
      name: 'Appel des brumes',
      level: 1,
      school: 'invocation',
      castingTime: '1 action',
      range: '18 mètres',
      components: { verbal: true, somatic: true, material: 'une fiole de rosée' },
      duration: '10 minutes',
      concentration: true,
      ritual: false,
      summary: 'Une brume épaisse se lève et masque le champ de bataille.',
      classes: ['clerc'],
    },
  ],
  subclasses: [],
  races: [],
  backgrounds: [],
};

describe('le fichier d’un pack', () => {
  it('revient identique après l’aller-retour', () => {
    const parsed = readPackFile(packFileText(karn), MINI_CATALOGUE);
    expect(parsed).toEqual({ kind: 'ok', pack: karn });
  });

  it('montre les genres qu’un pack peut porter, même vides', () => {
    const written: unknown = JSON.parse(packFileText(karn));
    expect(written).toMatchObject({ races: [], classes: [], backgrounds: [] });
  });

  it('porte la version d’Aventurine qui l’a écrit', () => {
    expect(packFileText(karn)).toContain(`"aventurine": ${String(APP_MAJOR_VERSION)}`);
  });

  it('prend le nom du pack pour nom de fichier', () => {
    expect(packFileName(karn)).toBe('pack-karn.json');
  });

  it('refuse un pack venu d’une Aventurine plus récente', () => {
    const future = JSON.stringify({ aventurine: APP_MAJOR_VERSION + 1, pack: karn.info });
    expect(readPackFile(future, MINI_CATALOGUE)).toEqual({
      kind: 'too-new',
      wrote: APP_MAJOR_VERSION + 1,
    });
  });

  it('refuse ce qui n’est pas du JSON', () => {
    expect(readPackFile('{ pas du json', MINI_CATALOGUE)).toEqual({ kind: 'unreadable' });
  });

  it('refuse un JSON sans le numéro d’Aventurine', () => {
    expect(readPackFile(JSON.stringify({ pack: karn.info }), MINI_CATALOGUE)).toEqual({
      kind: 'unreadable',
    });
  });

  it('arrête l’absurde avant même d’analyser', () => {
    const huge = JSON.stringify({ aventurine: 1, big: 'x'.repeat(MAX_PACK_BYTES) });
    const parsed = readPackFile(huge, MINI_CATALOGUE);
    expect(parsed.kind).toBe('too-big');
  });

  it('remonte les raisons du refus plutôt qu’un simple non', () => {
    const broken = JSON.stringify({
      aventurine: APP_MAJOR_VERSION,
      pack: karn.info,
      spells: [{ ...karn.spells[0], id: 'appel-des-brumes' }],
    });
    expect(readPackFile(broken, MINI_CATALOGUE)).toEqual({
      kind: 'invalid',
      issues: [{ kind: 'bad-prefix', at: 1, entry: 'appel-des-brumes', what: 'spell' }],
    });
  });

  it('installe le fichier que le créateur vient d’écrire', () => {
    // Le seul aller-retour qui compte vraiment : ce qui sort du créateur doit
    // entrer par l'import, enveloppe comprise.
    const written = packDraftFileText(
      {
        ...emptyPackDraft(),
        id: 'karn',
        name: 'Les Brumes de Karn',
        spells: [
          {
            ...emptySpellDraft(),
            id: 'karn-appel-des-brumes',
            name: 'Appel des brumes',
            level: 1,
            school: 'invocation',
            summary: 'Une brume épaisse se lève.',
            classes: ['clerc'],
          },
        ],
      },
      '2026-09-04T10:12:00.000Z',
    );
    const parsed = readPackFile(written, MINI_CATALOGUE);
    expect(parsed.kind).toBe('ok');
  });
});
