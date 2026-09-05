import { describe, expect, it } from 'vitest';
import { MINI_CATALOGUE } from './fixtures/miniCatalogue';
import { parseBackground } from './parseBackground';

const background = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'karn-batelier-des-brumes',
  name: 'Batelier des brumes',
  blurb: 'Tu passais les gens d’une rive à l’autre, quand nul autre n’osait.',
  facts: ['Perception, Survie', 'Outils de navigateur', 'Perche, 10 po'],
  skills: ['perception', 'survie'],
  ...over,
});

const parsed = (over: Record<string, unknown> = {}) =>
  parseBackground(background(over), 1, 'karn-', MINI_CATALOGUE);

describe('la lecture d’un historique', () => {
  it('accepte un historique minimal : il ne dépend de rien d’autre', () => {
    const { background: kept, issues } = parsed();
    expect(issues).toEqual([]);
    expect(kept?.name).toBe('Batelier des brumes');
    expect(kept?.skills).toEqual(['perception', 'survie']);
  });

  it('n’a pas besoin d’aptitude : le champ peut manquer', () => {
    expect(parsed().background?.feature).toBeNull();
  });

  it('refuse une aptitude à moitié écrite', () => {
    expect(parsed({ feature: { name: 'Passeur' } }).issues).toEqual([
      {
        kind: 'missing-field',
        at: 1,
        entry: 'karn-batelier-des-brumes',
        what: 'background',
        field: 'feature',
      },
    ]);
  });

  it('garde l’aptitude entière quand elle l’est', () => {
    const { background: kept } = parsed({
      feature: { name: 'Passeur', text: 'On te laisse traverser sans payer.' },
    });
    expect(kept?.feature).toEqual({
      name: 'Passeur',
      text: 'On te laisse traverser sans payer.',
    });
  });

  it('ne garde de l’équipement que ce qui existe, avec sa quantité', () => {
    const { background: kept } = parsed({
      equipment: [
        { itemId: 'bouclier', quantity: 3 },
        { itemId: 'perche-de-brume', quantity: 1 },
      ],
    });
    expect(kept?.equipment).toEqual([{ itemId: 'bouclier', quantity: 3 }]);
  });

  it('ramène une quantité absurde à une unité', () => {
    const { background: kept } = parsed({
      equipment: [{ itemId: 'bouclier', quantity: 0 }],
    });
    expect(kept?.equipment).toEqual([{ itemId: 'bouclier', quantity: 1 }]);
  });

  it('garde les amorces de personnalité, colonne par colonne', () => {
    const { background: kept } = parsed({
      suggestedTraits: {
        traits: ['Je parle peu.'],
        ideals: ['Le passage est dû à tous.'],
        bonds: ['Ma barque est tout ce que j’ai.'],
        flaws: ['Je ne rends jamais un service gratuitement.'],
      },
    });
    expect(kept?.suggestedTraits.traits).toEqual(['Je parle peu.']);
    expect(kept?.suggestedTraits.flaws).toHaveLength(1);
  });

  it('refuse de donner une maîtrise d’arme, qu’un historique n’accorde pas', () => {
    expect(parsed({ proficiencies: { weapons: ['rapiere'] } }).issues).toEqual([
      {
        kind: 'field-not-yet-supported',
        at: 1,
        entry: 'karn-batelier-des-brumes',
        what: 'background',
        field: 'weapons',
      },
    ]);
  });

  it('accepte la maîtrise d’outil, qui est ce que le SRD lui accorde', () => {
    const { background: kept, issues } = parsed({
      proficiencies: { tools: ['outils-de-forgeron'] },
    });
    expect(issues).toEqual([]);
    expect(kept?.proficiencies.tools).toEqual(['outils-de-forgeron']);
  });

  it('ne revendique jamais les règles génériques du SRD', () => {
    // Ce drapeau dit « écrit pour Aventurine » : le revendiquer pour le
    // contenu de quelqu'un d'autre serait faux. Le nom du pack le dit mieux.
    expect(
      parsed({ assembledFromGenericRules: true }).background?.assembledFromGenericRules,
    ).toBe(false);
  });

  it('n’ouvre que les choix qu’un historique peut ouvrir', () => {
    const origin = {
      kind: 'ability',
      subject: 'origin-2',
      title: 'Où mettre ton +2 ?',
      help: 'Un historique ne donne pas de bonus d’origine.',
      pick: 1,
      bonus: 2,
    };
    expect(parsed({ choices: [origin] }).issues).toEqual([
      {
        kind: 'missing-field',
        at: 1,
        entry: 'karn-batelier-des-brumes',
        what: 'background',
        field: 'choices',
      },
    ]);
  });

  it('ouvre un choix de langues, qui est sa forme habituelle', () => {
    const { background: kept, issues } = parsed({
      choices: [
        {
          kind: 'language',
          subject: 'languages',
          title: 'Les langues du fleuve',
          help: 'On apprend en passant les gens.',
          pick: 2,
          from: ['commun', 'nain'],
        },
      ],
    });
    expect(issues).toEqual([]);
    expect(kept?.choices[0]).toMatchObject({ kind: 'language', pick: 2 });
  });

  it('exige le préfixe du pack', () => {
    const { issues } = parseBackground(
      background({ id: 'batelier' }),
      1,
      'karn-',
      MINI_CATALOGUE,
    );
    expect(issues).toEqual([
      { kind: 'bad-prefix', at: 1, entry: 'batelier', what: 'background' },
    ]);
  });
});
