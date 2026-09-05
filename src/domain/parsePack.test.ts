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
      { kind: 'bad-prefix', at: 1, entry: 'appel-des-brumes', what: 'spell' },
    ]);
  });

  it('nomme le champ manquant, et le rang de l’entrée', () => {
    expect(issuesOfSpells(spell(), spell({ id: 'karn-x', summary: '' }))).toEqual([
      { kind: 'missing-field', at: 2, entry: 'karn-x', what: 'spell', field: 'summary' },
    ]);
  });

  it('refuse un niveau de sort hors des dix du SRD', () => {
    expect(issuesOfSpells(spell({ level: 10 }))).toEqual([
      {
        kind: 'missing-field',
        at: 1,
        entry: 'karn-appel-des-brumes',
        what: 'spell',
        field: 'level',
      },
    ]);
  });

  it('refuse une école de magie inventée', () => {
    expect(issuesOfSpells(spell({ school: 'brumes' }))).toEqual([
      {
        kind: 'missing-field',
        at: 1,
        entry: 'karn-appel-des-brumes',
        what: 'spell',
        field: 'school',
      },
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
        what: 'spell',
        value: 'karn-brumeur',
      },
      {
        kind: 'missing-field',
        at: 1,
        entry: 'karn-appel-des-brumes',
        what: 'spell',
        field: 'classes',
      },
    ]);
  });

  it('refuse deux fois le même identifiant : les réponses basculeraient', () => {
    expect(issuesOfSpells(spell(), spell())).toEqual([
      { kind: 'duplicate-id', at: 2, entry: 'karn-appel-des-brumes', what: 'spell' },
    ]);
  });

  it('refuse plutôt que de perdre en silence un genre qu’il ne lit pas encore', () => {
    expect(issuesOf(file({ classes: [{ id: 'karn-brumeur' }] }))).toEqual([
      { kind: 'not-yet-supported', section: 'classes' },
    ]);
  });

  it('partage le jeu d’identifiants entre les peuples et leurs branches', () => {
    const twins = {
      id: 'karn-brumeux',
      name: 'Brumeux',
      blurb: 'Un peuple de la brume.',
      speed: 7.5,
      features: [{ name: 'Voile', text: 'La brume te porte.' }],
      subraces: [
        {
          id: 'karn-brumeux',
          name: 'Doublon',
          blurb: 'Le même identifiant que son peuple.',
          features: [{ name: 'Rien', text: 'Rien.' }],
        },
      ],
    };
    expect(issuesOf(file({ spells: [], races: [twins] }))).toEqual([
      { kind: 'duplicate-id', at: 1, entry: 'karn-brumeux', what: 'subrace' },
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

const subclass = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'karn-college-des-brumes',
  name: 'Collège des brumes',
  blurb: 'Tu chantes ce que la brume cache, et elle t’obéit.',
  for: 'clerc',
  facts: ['Voile de brume', 'Chant sourd', 'Pas silencieux'],
  features: [
    { level: 3, name: 'Voile', text: 'Tu te caches dans une brume que tu appelles.' },
  ],
  ...over,
});

const issuesOfSubclasses = (...subclasses: readonly unknown[]): readonly PackIssue[] =>
  issuesOf(file({ subclasses }));

describe('une sous-classe greffée', () => {
  it('s’ajoute à une classe qui existe, sans rien y remplacer', () => {
    const parsed = parsePack(file({ subclasses: [subclass()] }), MINI_CATALOGUE);
    expect(parsed.kind).toBe('ok');
    if (parsed.kind !== 'ok') return;
    const [grafted] = parsed.pack.subclasses;
    expect(grafted?.forClassId).toBe('clerc');
    expect(grafted?.subclass.name).toBe('Collège des brumes');
    expect(grafted?.subclass.features).toEqual([
      { level: 3, name: 'Voile', text: 'Tu te caches dans une brume que tu appelles.' },
    ]);
  });

  it('exige de savoir à quelle classe elle s’ajoute', () => {
    expect(issuesOfSubclasses(subclass({ for: '' }))).toEqual([
      {
        kind: 'missing-field',
        at: 1,
        entry: 'karn-college-des-brumes',
        what: 'subclass',
        field: 'for',
      },
    ]);
  });

  it('refuse de se greffer sur une classe qui n’existe pas', () => {
    expect(issuesOfSubclasses(subclass({ for: 'karn-brumeur' }))).toEqual([
      {
        kind: 'unknown-class',
        at: 1,
        entry: 'karn-college-des-brumes',
        what: 'subclass',
        value: 'karn-brumeur',
      },
    ]);
  });

  it('exige au moins une aptitude : une voie vide n’en est pas une', () => {
    expect(issuesOfSubclasses(subclass({ features: [] }))).toEqual([
      {
        kind: 'missing-field',
        at: 1,
        entry: 'karn-college-des-brumes',
        what: 'subclass',
        field: 'features',
      },
    ]);
  });

  it('refuse une aptitude sans niveau jouable', () => {
    const broken = subclass({ features: [{ level: 0, name: 'Voile', text: 'Rien.' }] });
    expect(issuesOfSubclasses(broken)).toHaveLength(1);
  });

  it('remplace les repères absents par un tiret, sans en faire une faute', () => {
    const parsed = parsePack(
      file({ subclasses: [subclass({ facts: ['Voile'] })] }),
      MINI_CATALOGUE,
    );
    if (parsed.kind !== 'ok') throw new Error('pack refusé');
    expect(parsed.pack.subclasses[0]?.subclass.facts).toEqual(['Voile', '—', '—']);
  });

  it('refuse plutôt que de perdre un champ qu’il ne sait pas encore porter', () => {
    const withSpells = subclass({ alwaysPreparedSpells: ['lumiere'] });
    expect(issuesOfSubclasses(withSpells)).toEqual([
      {
        kind: 'field-not-yet-supported',
        at: 1,
        entry: 'karn-college-des-brumes',
        what: 'subclass',
        field: 'alwaysPreparedSpells',
      },
    ]);
  });

  it('ne bronche pas sur ces mêmes champs laissés vides', () => {
    const empty = subclass({
      proficiencies: null,
      alwaysPreparedSpells: [],
      unarmoredDefense: null,
      bonusHitPointsPerLevel: 0,
      choices: [],
    });
    expect(parsePack(file({ subclasses: [empty] }), MINI_CATALOGUE).kind).toBe('ok');
  });

  it('partage le jeu d’identifiants avec les sorts', () => {
    // Un sort et une sous-classe du même nom rendraient la provenance
    // ambiguë : le préfixe protège d'un autre pack, pas de soi-même.
    const clash = subclass({ id: 'karn-appel-des-brumes' });
    const both = file({ spells: [spell()], subclasses: [clash] });
    expect(issuesOf(both)).toEqual([
      {
        kind: 'duplicate-id',
        at: 1,
        entry: 'karn-appel-des-brumes',
        what: 'subclass',
      },
    ]);
  });
});
