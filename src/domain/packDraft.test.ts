import { describe, expect, it } from 'vitest';
import { MINI_CATALOGUE } from './fixtures/miniCatalogue';
import {
  emptyPackDraft,
  emptySpellDraft,
  packDraftFile,
  parsePackDraft,
  slug,
} from './packDraft';
import type { PackDraft, SpellDraft } from './packDraft';
import { parsePack } from './parsePack';

const brume: SpellDraft = {
  ...emptySpellDraft(),
  id: 'karn-appel-des-brumes',
  name: 'Appel des brumes',
  level: 1,
  school: 'invocation',
  summary: 'Une brume épaisse se lève.',
  classes: ['clerc'],
};

const karn: PackDraft = {
  ...emptyPackDraft(),
  id: 'karn',
  name: 'Les Brumes de Karn',
  author: 'Hugo',
  spells: [brume],
};

describe('le brouillon du créateur', () => {
  it('fabrique un identifiant sans accent ni espace', () => {
    expect(slug('Appel des Brumes ')).toBe('appel-des-brumes');
  });

  it('rend au format du fichier ce que le formulaire retient', () => {
    const parsed = parsePack(
      packDraftFile(karn, '2026-09-04T10:12:00.000Z'),
      MINI_CATALOGUE,
    );
    expect(parsed.kind).toBe('ok');
  });

  it('fait juger le créateur par la MÊME fonction que l’import', () => {
    const incomplete: PackDraft = { ...karn, spells: [{ ...brume, summary: '' }] };
    const parsed = parsePack(packDraftFile(incomplete, ''), MINI_CATALOGUE);
    expect(parsed.kind === 'invalid' && parsed.issues).toEqual([
      { kind: 'missing-field', at: 1, entry: 'karn-appel-des-brumes', field: 'summary' },
    ]);
  });

  it('revient identique après l’aller-retour, pour qu’on puisse reprendre', () => {
    expect(parsePackDraft(packDraftFile(karn, ''))).toEqual(karn);
  });

  it('rouvre un pack inachevé plutôt que de le refuser : ici on écrit', () => {
    const draft = parsePackDraft({
      pack: { id: 'karn' },
      spells: [{ name: 'Sans rien' }],
    });
    expect(draft.name).toBe('');
    expect(draft.spells[0]?.name).toBe('Sans rien');
    expect(draft.spells[0]?.summary).toBe('');
  });

  it('ne prend rien d’un fichier qui n’en est pas un', () => {
    expect(parsePackDraft('un pack')).toEqual(emptyPackDraft());
  });
});
