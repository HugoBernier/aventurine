import { describe, expect, it } from 'vitest';
import { MINI_CATALOGUE } from './fixtures/miniCatalogue';
import { parsePack } from './parsePack';
import type { PackIssue } from './pack';

const spell = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'karn-appel-des-brumes',
  name: 'Appel des brumes',
  level: 1,
  school: 'invocation',
  summary: 'Une brume épaisse se lève et masque le champ de bataille.',
  classes: ['clerc'],
  ...over,
});

const file = (
  over: { readonly pack?: Record<string, unknown> } & Record<string, unknown> = {},
): Record<string, unknown> => {
  const { pack, ...rest } = over;
  return {
    pack: { id: 'karn', name: 'Les Brumes de Karn', ...pack },
    spells: [spell()],
    ...rest,
  };
};

const issuesOf = (value: unknown): readonly PackIssue[] => {
  const parsed = parsePack(value, MINI_CATALOGUE);
  return parsed.kind === 'invalid' ? parsed.issues : [];
};

/** Le cas courant : un pack correct dont on n'abîme que les sorts. */
const issuesOfSpells = (...spells: readonly unknown[]): readonly PackIssue[] =>
  issuesOf(file({ spells }));

describe('la lecture d’un pack de contenu', () => {
  it('accepte un pack minimal : un identifiant, un nom, un sort', () => {
    const parsed = parsePack(file(), MINI_CATALOGUE);
    expect(parsed.kind).toBe('ok');
    if (parsed.kind !== 'ok') return;
    expect(parsed.pack.info.name).toBe('Les Brumes de Karn');
    expect(parsed.pack.spells).toHaveLength(1);
  });

  it('complète les champs de forme par leur valeur habituelle', () => {
    const parsed = parsePack(file(), MINI_CATALOGUE);
    if (parsed.kind !== 'ok') throw new Error('pack refusé');
    const [first] = parsed.pack.spells;
    expect(first?.castingTime).toBe('1 action');
    expect(first?.duration).toBe('instantanée');
    expect(first?.components).toEqual({ verbal: false, somatic: false, material: null });
  });

  it('garde l’auteur et la description, qui nomment le pack six mois plus tard', () => {
    const parsed = parsePack(
      file({ pack: { author: 'Hugo', description: 'Une campagne gothique.' } }),
      MINI_CATALOGUE,
    );
    if (parsed.kind !== 'ok') throw new Error('pack refusé');
    expect(parsed.pack.info.author).toBe('Hugo');
    expect(parsed.pack.info.description).toBe('Une campagne gothique.');
  });

  it('refuse ce qui n’est pas un objet', () => {
    expect(issuesOf('un pack')).toEqual([{ kind: 'not-a-pack' }]);
  });

  it('refuse un identifiant de pack qui n’est pas un identifiant', () => {
    expect(issuesOf(file({ pack: { id: 'Les Brumes !' } }))).toEqual([
      { kind: 'bad-pack-id', value: 'Les Brumes !' },
    ]);
  });

  it('exige un nom de pack : sans lui, rien ne le désigne', () => {
    const blank = ' '.repeat(3);
    expect(issuesOf(file({ pack: { name: blank } }))).toEqual([{ kind: 'missing-name' }]);
  });

  it('exige le préfixe du pack sur tout ce qu’il définit', () => {
    expect(issuesOfSpells(spell({ id: 'appel-des-brumes' }))).toEqual([
      { kind: 'bad-prefix', at: 1, entry: 'appel-des-brumes' },
    ]);
  });

  it('nomme le champ manquant, et le rang de l’entrée', () => {
    expect(issuesOfSpells(spell(), spell({ id: 'karn-x', summary: '' }))).toEqual([
      { kind: 'missing-field', at: 2, entry: 'karn-x', field: 'summary' },
    ]);
  });

  it('refuse un niveau de sort hors des dix du SRD', () => {
    expect(issuesOfSpells(spell({ level: 10 }))).toEqual([
      { kind: 'missing-field', at: 1, entry: 'karn-appel-des-brumes', field: 'level' },
    ]);
  });

  it('refuse une école de magie inventée', () => {
    expect(issuesOfSpells(spell({ school: 'brumes' }))).toEqual([
      { kind: 'missing-field', at: 1, entry: 'karn-appel-des-brumes', field: 'school' },
    ]);
  });

  it('laisse un sort rejoindre la liste d’une classe du SRD', () => {
    const parsed = parsePack(
      file({ spells: [spell({ classes: ['clerc', 'roublard'] })] }),
      MINI_CATALOGUE,
    );
    if (parsed.kind !== 'ok') throw new Error('pack refusé');
    expect(parsed.pack.spells[0]?.classes).toEqual(['clerc', 'roublard']);
  });

  it('refuse une classe que le pack n’a pas le droit d’inventer', () => {
    expect(issuesOfSpells(spell({ classes: ['karn-brumeur'] }))).toEqual([
      {
        kind: 'unknown-class',
        at: 1,
        entry: 'karn-appel-des-brumes',
        value: 'karn-brumeur',
      },
      {
        kind: 'missing-field',
        at: 1,
        entry: 'karn-appel-des-brumes',
        field: 'classes',
      },
    ]);
  });

  it('refuse deux fois le même identifiant : les réponses basculeraient', () => {
    expect(issuesOfSpells(spell(), spell())).toEqual([
      { kind: 'duplicate-id', at: 2, entry: 'karn-appel-des-brumes' },
    ]);
  });

  it('refuse plutôt que de perdre en silence un genre qu’il ne lit pas encore', () => {
    expect(issuesOf(file({ classes: [{ id: 'karn-brumeur' }] }))).toEqual([
      { kind: 'not-yet-supported', section: 'classes' },
    ]);
  });

  it('ne bronche pas sur les tableaux vides des genres à venir', () => {
    expect(parsePack(file({ races: [], classes: [] }), MINI_CATALOGUE).kind).toBe('ok');
  });

  it('n’atteint jamais l’état avec une clé de prototype', () => {
    const parsed = parsePack(
      file({ spells: [spell({ __proto__: { pollue: true } })] }),
      MINI_CATALOGUE,
    );
    if (parsed.kind !== 'ok') throw new Error('pack refusé');
    expect(Object.keys(parsed.pack.spells[0] ?? {})).not.toContain('pollue');
    expect(({} as Record<string, unknown>).pollue).toBeUndefined();
  });
});
