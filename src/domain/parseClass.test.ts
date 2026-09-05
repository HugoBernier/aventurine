import { describe, expect, it } from 'vitest';
import { MINI_CATALOGUE } from './fixtures/miniCatalogue';
import { parseClass } from './parseClass';

const characterClass = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'karn-brumeur',
  name: 'Brumeur',
  blurb: 'Tu appelles la brume, et elle te répond.',
  facts: ['d8', 'Dextérité + Sagesse', 'Lanceur de sorts'],
  hitDie: 8,
  saves: ['dexterite', 'sagesse'],
  features: [{ level: 1, name: 'Appel', text: 'Tu appelles une brume légère.' }],
  subclassChoice: {
    level: 3,
    title: 'Ta voie de brume',
    help: 'La façon dont la brume te répond.',
  },
  advancements: [4, 8, 12, 16, 19],
  ...over,
});

const parsed = (over: Record<string, unknown> = {}) =>
  parseClass(characterClass(over), 1, 'karn-', MINI_CATALOGUE);

describe('la lecture d’une classe', () => {
  it('accepte une classe complète', () => {
    const { entry, issues } = parsed();
    expect(issues).toEqual([]);
    expect(entry?.base.name).toBe('Brumeur');
    expect(entry?.base.hitDie).toBe(8);
    expect(entry?.base.saves).toEqual(['dexterite', 'sagesse']);
  });

  it('refuse un dé de vie qui n’en est pas un', () => {
    expect(parsed({ hitDie: 7 }).issues).toEqual([
      {
        kind: 'missing-field',
        at: 1,
        entry: 'karn-brumeur',
        what: 'class',
        field: 'hitDie',
      },
    ]);
  });

  it('exige deux jets de sauvegarde, et deux différents', () => {
    expect(parsed({ saves: ['force'] }).entry).toBeNull();
    expect(parsed({ saves: ['force', 'force'] }).entry).toBeNull();
  });

  it('exige de dire quand la voie se choisit', () => {
    expect(parsed({ subclassChoice: { level: 3 } }).issues).toEqual([
      {
        kind: 'missing-field',
        at: 1,
        entry: 'karn-brumeur',
        what: 'class',
        field: 'subclassChoice',
      },
    ]);
  });

  it('ne garde de ses paliers que les niveaux, triés et sans doublon', () => {
    expect(parsed({ advancements: [8, 4, 8, 1, 40] }).entry?.advancementLevels).toEqual([
      4, 8,
    ]);
  });

  it('n’a pas besoin de magie : la moitié des classes n’en lance pas', () => {
    expect(parsed().entry?.base.spellcasting).toBeNull();
  });

  it('lit une magie complète', () => {
    const { entry } = parsed({
      spellcasting: {
        ability: 'sagesse',
        progression: 'full',
        preparation: 'prepared',
        ritual: true,
      },
    });
    expect(entry?.base.spellcasting).toEqual({
      ability: 'sagesse',
      progression: 'full',
      preparation: 'prepared',
      ritual: true,
    });
  });

  it('refuse une magie à moitié écrite plutôt que d’en deviner la moitié', () => {
    expect(parsed({ spellcasting: { ability: 'sagesse' } }).entry).toBeNull();
  });

  it('n’ouvre pas ses voies elle-même : elles se greffent, comme sur le SRD', () => {
    expect(parsed({ subclasses: [{ id: 'karn-voie' }] }).entry?.base.subclasses).toEqual(
      [],
    );
  });

  it('relie un choix d’équipement à ses propres lots de départ', () => {
    const { entry, issues } = parsed({
      equipmentOptions: [
        {
          id: 'perche',
          name: 'Une perche',
          blurb: 'Longue et solide.',
          facts: ['1d4', 'Allonge', '—'],
          items: [{ itemId: 'bouclier', quantity: 1 }],
        },
      ],
      choices: [
        {
          kind: 'equipment',
          subject: 'equipement-1',
          title: 'Ce que tu emportes',
          help: 'Choisis ton premier lot.',
          pick: 1,
          from: ['perche'],
        },
      ],
    });
    expect(issues).toEqual([]);
    expect(entry?.base.choices[0]).toMatchObject({ kind: 'equipment', from: ['perche'] });
  });

  it('refuse un choix d’équipement qui ne nomme aucun lot connu', () => {
    const { entry } = parsed({
      choices: [
        {
          kind: 'equipment',
          subject: 'equipement-1',
          title: 'Ce que tu emportes',
          help: 'Choisis.',
          pick: 1,
          from: ['jamais-defini'],
        },
      ],
    });
    expect(entry).toBeNull();
  });

  it('lit une table de sorts connus en paliers, pas en vingt nombres', () => {
    const { entry, issues } = parsed({
      choices: [
        {
          kind: 'spell',
          subject: 'sorts',
          title: 'Tes sorts',
          help: 'Ce que tu sais lancer.',
          listFrom: 'clerc',
          count: { kind: 'known', steps: { 1: 2, 4: 3 } },
        },
      ],
    });
    expect(issues).toEqual([]);
    const [choice] = entry?.base.choices ?? [];
    expect(choice).toMatchObject({ kind: 'spell', listFrom: 'clerc' });
  });

  it('exige le préfixe du pack', () => {
    expect(
      parseClass(characterClass({ id: 'brumeur' }), 1, 'karn-', MINI_CATALOGUE).issues,
    ).toEqual([{ kind: 'bad-prefix', at: 1, entry: 'brumeur', what: 'class' }]);
  });
});
