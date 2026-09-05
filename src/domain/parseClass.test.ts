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

/** L'anomalie attendue quand un champ manque ou n'a pas la forme voulue. */
function field(name: string, entry = 'karn-brumeur'): unknown {
  return [{ kind: 'missing-field', at: 1, entry, what: 'class', field: name }];
}

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

describe('ce qu’une classe doit dire avant d’entrer', () => {
  it('refuse ce qui n’est même pas une classe', () => {
    expect(parseClass('une classe', 1, 'karn-', MINI_CATALOGUE).issues).toEqual(
      field('classe', ''),
    );
  });

  it('refuse un identifiant absent ou mal formé', () => {
    expect(parsed({ id: undefined }).issues).toEqual(field('id', 'Brumeur'));
    expect(parsed({ id: 'karn Brumeur' }).issues).toEqual(field('id', 'karn Brumeur'));
  });

  it('exige un nom et une phrase de présentation', () => {
    expect(parsed({ name: undefined }).issues).toEqual(field('name'));
    expect(parsed({ blurb: '  ' }).issues).toEqual(field('blurb'));
  });

  it('refuse une aptitude sans niveau, sans nom ou sans texte', () => {
    expect(parsed({ features: [{ name: 'Appel', text: 'La brume.' }] }).issues).toEqual(
      field('features'),
    );
    expect(parsed({ features: ['Appel'] }).issues).toEqual(field('features'));
  });

  it('refuse un lot de départ sans nom ou mal nommé', () => {
    expect(parsed({ equipmentOptions: [{ id: 'hache' }] }).issues).toEqual(
      field('equipmentOptions'),
    );
    expect(
      parsed({ equipmentOptions: [{ id: 'Hache !', name: 'Une hache' }] }).issues,
    ).toEqual(field('equipmentOptions'));
    expect(parsed({ equipmentOptions: ['une hache'] }).issues).toEqual(
      field('equipmentOptions'),
    );
  });

  it('refuse un choix qui n’a pas la forme d’un choix', () => {
    expect(parsed({ choices: ['une compétence'] }).issues).toEqual(field('choices'));
  });
});

describe('ce qu’une classe sait manier', () => {
  it('ne garde que les catégories, armes et outils que le catalogue connaît', () => {
    const { entry } = parsed({
      proficiencies: {
        armor: ['legere', 'magique'],
        weaponCategories: ['courantes', 'de-siege'],
        weapons: ['rapiere', 'arbalete-lourde'],
        tools: ['outils-de-voleur', 'cornemuse'],
      },
    });
    expect(entry?.base.proficiencies).toEqual({
      armor: ['legere'],
      weaponCategories: ['courantes'],
      weapons: ['rapiere'],
      tools: ['outils-de-voleur'],
    });
  });

  it('ne maîtrise rien quand le fichier ne le dit pas', () => {
    expect(parsed({ proficiencies: 'toutes' }).entry?.base.proficiencies).toEqual({
      armor: [],
      weaponCategories: [],
      weapons: [],
      tools: [],
    });
  });

  it('jette une ligne d’équipement dont l’objet n’existe pas', () => {
    const { entry } = parsed({
      fixedEquipment: [
        { itemId: 'rapiere', quantity: 2 },
        { itemId: 'lanterne-sourde' },
        'une corde',
        { quantity: 1 },
      ],
    });
    expect(entry?.base.fixedEquipment).toEqual([{ itemId: 'rapiere', quantity: 2 }]);
  });

  it('compte un objet quand le fichier ne dit pas combien', () => {
    expect(
      parsed({ fixedEquipment: [{ itemId: 'bouclier' }] }).entry?.base.fixedEquipment,
    ).toEqual([{ itemId: 'bouclier', quantity: 1 }]);
  });
});

describe('la défense sans armure', () => {
  it('n’est pas obligatoire : presque aucune classe n’en a', () => {
    expect(parsed().entry?.base.unarmoredDefense).toBeNull();
    expect(parsed({ unarmoredDefense: null }).entry?.base.unarmoredDefense).toBeNull();
  });

  it('lit sa base, ce qu’elle ajoute et si le bouclier reste permis', () => {
    const { entry } = parsed({
      unarmoredDefense: {
        base: 10,
        addedAbilities: ['dexterite', 'constitution', 'chance'],
        shieldAllowed: true,
      },
    });
    expect(entry?.base.unarmoredDefense).toEqual({
      base: 10,
      addedAbilities: ['dexterite', 'constitution'],
      shieldAllowed: true,
    });
  });

  it('refuse une défense sans base plutôt que d’en inventer une', () => {
    expect(
      parsed({ unarmoredDefense: { addedAbilities: ['sagesse'] } }).entry,
    ).toBeNull();
    expect(parsed({ unarmoredDefense: 'sans armure' }).entry).toBeNull();
  });
});
