import { describe, expect, it } from 'vitest';
import { ABILITIES } from './abilities';
import { MINI_CATALOGUE } from './fixtures/miniCatalogue';
import {
  BACKGROUND_CHOICE_KINDS,
  CLASS_CHOICE_KINDS,
  RACE_CHOICE_KINDS,
  parseChoiceSpec,
} from './parseChoice';

/** Ce qu'un choix porte toujours, quel que soit son genre. */
const base = {
  subject: 'langues',
  title: 'Quelle langue parles-tu ?',
  help: 'Celle des gens que tu as fréquentés.',
};

function read(value: unknown, allowed = RACE_CHOICE_KINDS): unknown {
  return parseChoiceSpec(value, MINI_CATALOGUE, allowed);
}

/** Les genres qu'une classe ouvre, et qu'un peuple n'ouvre pas. */
function asClass(value: unknown): unknown {
  return read(value, CLASS_CHOICE_KINDS);
}

describe('la forme commune d’un choix', () => {
  it('refuse ce qui n’est pas un objet', () => {
    expect(read('un choix')).toBeNull();
  });

  it('refuse un genre que cette entrée n’a pas le droit d’ouvrir', () => {
    expect(read({ ...base, kind: 'spell', listFrom: 'clerc' })).toBeNull();
  });

  it('refuse un genre que le fichier n’écrit même pas en texte', () => {
    expect(read({ ...base, kind: 12 })).toBeNull();
  });

  it('refuse un sujet qui ne peut pas nommer un créneau', () => {
    expect(read({ ...base, kind: 'ancestry', subject: 'Deux mots' })).toBeNull();
  });

  it('refuse un choix sans question ni phrase d’aide', () => {
    expect(read({ ...base, kind: 'ancestry', title: '' })).toBeNull();
    expect(read({ ...base, kind: 'ancestry', help: ' ' })).toBeNull();
  });

  it('en fait choisir un quand le fichier ne dit pas combien', () => {
    expect(read({ ...base, kind: 'ancestry' })).toMatchObject({ pick: 1 });
  });

  it('en fait choisir un plutôt que zéro : un choix vide n’en est pas un', () => {
    expect(read({ ...base, kind: 'ancestry', pick: 0 })).toMatchObject({ pick: 1 });
  });

  it('lit le nombre quand il tient dans la borne', () => {
    expect(read({ ...base, kind: 'ancestry', pick: 3 })).toMatchObject({ pick: 3 });
  });

  it('rend un choix de dragon d’origine sans rien lui ajouter', () => {
    expect(read({ ...base, kind: 'ancestry', subject: 'ancestry' })).toEqual({
      ...base,
      subject: 'ancestry',
      kind: 'ancestry',
      pick: 1,
    });
  });
});

describe('un choix qui liste des identifiants du catalogue', () => {
  it('garde les compétences que le catalogue connaît', () => {
    expect(
      read({ ...base, kind: 'skill', subject: 'skills', from: ['perception', 'survie'] }),
    ).toMatchObject({ kind: 'skill', from: ['perception', 'survie'] });
  });

  it('jette une compétence inventée', () => {
    expect(
      read({ ...base, kind: 'skill', subject: 'skills', from: ['perception', 'vol'] }),
    ).toMatchObject({ from: ['perception'] });
  });

  it('refuse une liste vidée de ses références mortes', () => {
    expect(read({ ...base, kind: 'skill', subject: 'skills', from: ['vol'] })).toBeNull();
  });

  it('garde les langues que le catalogue connaît', () => {
    expect(
      read({ ...base, kind: 'language', from: ['nain', 'draconique'] }),
    ).toMatchObject({ kind: 'language', from: ['nain'] });
  });

  it('refuse une liste de langues entièrement inconnue', () => {
    expect(read({ ...base, kind: 'language', from: ['draconique'] })).toBeNull();
  });

  it('garde les outils que le catalogue connaît', () => {
    expect(
      read({
        ...base,
        kind: 'tool',
        subject: 'outils',
        from: ['outils-de-voleur', 'cornemuse'],
      }),
    ).toMatchObject({ kind: 'tool', from: ['outils-de-voleur'] });
  });

  it('refuse une liste d’outils sans aucun outil', () => {
    expect(read({ ...base, kind: 'tool', subject: 'outils', from: [] })).toBeNull();
  });
});

describe('un bonus de caractéristique laissé au joueur', () => {
  const bonus = { ...base, kind: 'ability', subject: 'origin-2' };

  it('ouvre les six caractéristiques quand le fichier n’en nomme aucune', () => {
    expect(read({ ...bonus, bonus: 2 })).toMatchObject({ bonus: 2, from: ABILITIES });
  });

  it('se restreint à celles que le fichier nomme', () => {
    expect(read({ ...bonus, bonus: 1, from: ['force', 'chance'] })).toMatchObject({
      bonus: 1,
      from: ['force'],
    });
  });

  it('refuse un bonus de zéro : ce ne serait plus un bonus', () => {
    expect(read({ ...bonus, bonus: 0 })).toBeNull();
  });

  it('refuse un bonus hors borne', () => {
    expect(read({ ...bonus, bonus: 7 })).toBeNull();
  });
});

describe('un choix ouvert par une classe', () => {
  it('garde les façons de se battre que le catalogue connaît', () => {
    expect(
      asClass({
        ...base,
        kind: 'fighting-style',
        subject: 'style',
        level: 2,
        from: ['defense', 'esquive'],
      }),
    ).toMatchObject({ kind: 'fighting-style', level: 2, from: ['defense'] });
  });

  it('place la façon de se battre au niveau 1 quand le fichier se tait', () => {
    expect(
      asClass({ ...base, kind: 'fighting-style', subject: 'style', from: ['duel'] }),
    ).toMatchObject({ level: 1 });
  });

  it('refuse une façon de se battre sans aucune option connue', () => {
    expect(
      asClass({ ...base, kind: 'fighting-style', subject: 'style', from: ['esquive'] }),
    ).toBeNull();
  });

  it('ne retient de l’expertise que les outils qu’on peut y ajouter', () => {
    expect(
      asClass({
        ...base,
        kind: 'expertise',
        subject: 'expertise',
        tools: ['outils-de-voleur', 'cornemuse'],
      }),
    ).toMatchObject({ kind: 'expertise', tools: ['outils-de-voleur'] });
  });

  it('accepte une expertise sans outil : ses options sont les compétences acquises', () => {
    expect(asClass({ ...base, kind: 'expertise', subject: 'expertise' })).toMatchObject({
      kind: 'expertise',
      tools: [],
    });
  });

  it('donne UN tour de magie, dès le niveau 1', () => {
    const cantrip = asClass({
      ...base,
      kind: 'cantrip',
      subject: 'cantrip',
      listFrom: 'clerc',
    });
    expect(cantrip).toMatchObject({ kind: 'cantrip', listFrom: 'clerc' });
    expect((cantrip as { count: { byLevel: number[] } }).count.byLevel[0]).toBe(1);
  });

  it('refuse un tour de magie qui ne dit pas dans quelle liste le prendre', () => {
    expect(asClass({ ...base, kind: 'cantrip', subject: 'cantrip' })).toBeNull();
  });
});

describe('le nombre de sorts d’un choix de sorts', () => {
  const spell = { ...base, kind: 'spell', subject: 'sorts', listFrom: 'clerc' };
  const withCount = (count: unknown): unknown => asClass({ ...spell, count });

  it('accepte le calcul « caractéristique + niveau » des classes qui préparent', () => {
    expect(withCount({ kind: 'prepared' })).toMatchObject({
      count: { kind: 'prepared' },
    });
  });

  it('étale une table de paliers sur les vingt niveaux', () => {
    const parsed = withCount({ kind: 'known', steps: { 1: 2, 4: 3 } });
    const table = (parsed as { count: { byLevel: number[] } }).count.byLevel;
    expect([table[0], table[2], table[3], table[19]]).toEqual([2, 2, 3, 3]);
  });

  it('refuse un nombre de sorts qui n’est pas un objet', () => {
    expect(withCount('beaucoup')).toBeNull();
  });

  it('refuse une table dont le nombre n’en est pas un', () => {
    expect(withCount({ kind: 'known', steps: { 1: 'deux' } })).toBeNull();
  });

  it('refuse une table dont le palier n’est pas un niveau', () => {
    expect(withCount({ kind: 'known', steps: { zero: 2 } })).toBeNull();
  });

  it('refuse une table sans aucun palier', () => {
    expect(withCount({ kind: 'known', steps: {} })).toBeNull();
  });

  it('refuse une table qui ne dit pas comment elle se lit', () => {
    expect(withCount({ steps: { 1: 2 } })).toBeNull();
  });

  it('refuse un choix de sorts sans liste où les prendre', () => {
    expect(
      read({ ...spell, listFrom: '', count: { kind: 'prepared' } }, CLASS_CHOICE_KINDS),
    ).toBeNull();
  });
});

describe('ce qu’un historique a le droit d’ouvrir', () => {
  it('ouvre les compétences, les langues et les outils', () => {
    expect([...BACKGROUND_CHOICE_KINDS]).toEqual(['skill', 'language', 'tool']);
  });

  it('n’ouvre ni magie ni bonus d’origine : ce n’est pas son rôle', () => {
    expect(
      read(
        { ...base, kind: 'ability', subject: 'origin-2', bonus: 2 },
        BACKGROUND_CHOICE_KINDS,
      ),
    ).toBeNull();
  });
});
