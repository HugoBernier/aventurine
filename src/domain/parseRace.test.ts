import { describe, expect, it } from 'vitest';
import { MINI_CATALOGUE } from './fixtures/miniCatalogue';
import { parseRace } from './parseRace';

const race = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'karn-brumeux',
  name: 'Brumeux',
  blurb: 'Un peuple né d’une malédiction, qui vit la nuit.',
  facts: ['+2 au choix', '7,50 m · taille moyenne', 'Vision 18 m'],
  size: 'M',
  speed: 7.5,
  darkvision: 18,
  features: [{ name: 'Voile natal', text: 'La brume ne te ralentit jamais.' }],
  ...over,
});

const parsed = (over: Record<string, unknown> = {}) =>
  parseRace(race(over), 1, 'karn-', MINI_CATALOGUE);

describe('la lecture d’un peuple', () => {
  it('accepte un peuple minimal', () => {
    const { race: kept, issues } = parsed();
    expect(issues).toEqual([]);
    expect(kept?.name).toBe('Brumeux');
    expect(kept?.speed).toBe(7.5);
    expect(kept?.darkvision).toBe(18);
    expect(kept?.size).toBe('M');
  });

  it('exige une vitesse : sans elle, la fiche ne sait pas quoi écrire', () => {
    expect(parsed({ speed: 0 }).issues).toEqual([
      {
        kind: 'missing-field',
        at: 1,
        entry: 'karn-brumeux',
        what: 'race',
        field: 'speed',
      },
    ]);
  });

  it('refuse une vitesse absurde plutôt que de la garder', () => {
    expect(parsed({ speed: 400 }).race).toBeNull();
  });

  it('exige le préfixe du pack', () => {
    expect(parseRace(race({ id: 'brumeux' }), 1, 'karn-', MINI_CATALOGUE).issues).toEqual(
      [{ kind: 'bad-prefix', at: 1, entry: 'brumeux', what: 'race' }],
    );
  });

  it('remplace les repères absents par un tiret', () => {
    expect(parsed({ facts: [] }).race?.facts).toEqual(['—', '—', '—']);
  });

  it('écarte une référence morte au lieu de refuser tout le peuple', () => {
    // Une liste garde ce qui existe : une langue inventée n'empêche pas les
    // autres de servir, et le peuple reste jouable.
    const { race: kept, issues } = parsed({
      languages: ['commun', 'karn-brumeux-parler'],
    });
    expect(issues).toEqual([]);
    expect(kept?.languages).toEqual(['commun']);
  });

  it('ne garde que les compétences qui existent', () => {
    expect(parsed({ skills: ['discretion', 'nage-en-brume'] }).race?.skills).toEqual([
      'discretion',
    ]);
  });

  it('ne garde que les résistances qui sont des types de dégâts', () => {
    expect(parsed({ resistances: ['poison', 'brume'] }).race?.resistances).toEqual([
      'poison',
    ]);
  });

  it('donne les six +1 de l’humain quand le peuple les demande', () => {
    expect(parsed({ everyAbilityPlusOne: true }).race?.abilityBonuses).toEqual({
      force: 1,
      dexterite: 1,
      constitution: 1,
      intelligence: 1,
      sagesse: 1,
      charisme: 1,
    });
  });

  it('laisse les bonus vides sinon : c’est le joueur qui les place', () => {
    expect(parsed().race?.abilityBonuses).toEqual({});
  });
});

const withChoice = (choice: Record<string, unknown>) => parsed({ choices: [choice] });

const CHOICE_BASE = {
  subject: 'origin-2',
  title: 'Où mettre ton +2 ?',
  help: 'À toi de voir.',
};

const subrace = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'karn-brumeux-des-marais',
  name: 'Brumeux des marais',
  blurb: 'Plus vif, plus silencieux.',
  features: [{ name: 'Pas feutré', text: 'Tu ne fais pas de bruit dans l’eau.' }],
  ...over,
});

describe('les choix qu’un peuple ouvre', () => {
  it('ouvre un bonus de caractéristique à placer', () => {
    const { race: kept } = withChoice({
      ...CHOICE_BASE,
      kind: 'ability',
      pick: 1,
      bonus: 2,
    });
    expect(kept?.choices[0]).toMatchObject({ kind: 'ability', bonus: 2, pick: 1 });
  });

  it('ouvre un choix de compétences dans une liste', () => {
    const { race: kept } = withChoice({
      subject: 'skills',
      title: 'Deux compétences',
      help: 'Ce que ton peuple t’apprend.',
      kind: 'skill',
      pick: 2,
      from: ['discretion', 'perception'],
    });
    expect(kept?.choices[0]).toMatchObject({ kind: 'skill', pick: 2 });
  });

  it('donne au tour de magie sa forme unique : un, dès le niveau 1', () => {
    const { race: kept } = withChoice({
      subject: 'cantrip',
      title: 'Ton tour de magie',
      help: 'Un petit sort appris tôt.',
      kind: 'cantrip',
      listFrom: 'clerc',
    });
    expect(kept?.choices[0]).toMatchObject({ kind: 'cantrip', listFrom: 'clerc' });
  });

  it('refuse un choix qui appartient à une classe, pas à un peuple', () => {
    expect(withChoice({ ...CHOICE_BASE, kind: 'subclass', pick: 1 }).issues).toEqual([
      {
        kind: 'missing-field',
        at: 1,
        entry: 'karn-brumeux',
        what: 'race',
        field: 'choices',
      },
    ]);
  });

  it('refuse un sujet qui n’est pas un identifiant : le créneau en dépend', () => {
    expect(
      withChoice({ ...CHOICE_BASE, subject: 'Origine 2', kind: 'ability', bonus: 2 })
        .race,
    ).toBeNull();
  });

  it('refuse une liste vide : un choix sans option n’est pas un choix', () => {
    expect(withChoice({ ...CHOICE_BASE, kind: 'skill', from: [] }).race).toBeNull();
  });
});

describe('les branches d’un peuple', () => {
  it('s’ajoutent au peuple, avec leurs propres aptitudes', () => {
    const { race: kept, issues } = parsed({ subraces: [subrace()] });
    expect(issues).toEqual([]);
    expect(kept?.subraces).toHaveLength(1);
    expect(kept?.subraces[0]?.name).toBe('Brumeux des marais');
  });

  it('gardent la vitesse de leur peuple quand elles n’en donnent pas', () => {
    expect(parsed({ subraces: [subrace()] }).race?.subraces[0]?.speed).toBeNull();
  });

  it('peuvent la remplacer, comme l’elfe des bois', () => {
    expect(
      parsed({ subraces: [subrace({ speed: 10.5 })] }).race?.subraces[0]?.speed,
    ).toBe(10.5);
  });

  it('peuvent donner des points de vie par niveau, comme le nain des collines', () => {
    const { race: kept } = parsed({ subraces: [subrace({ bonusHitPointsPerLevel: 1 })] });
    expect(kept?.subraces[0]?.bonusHitPointsPerLevel).toBe(1);
  });

  it('portent le préfixe du pack, elles aussi', () => {
    const { issues } = parsed({ subraces: [subrace({ id: 'brumeux-des-marais' })] });
    expect(issues).toEqual([
      {
        kind: 'missing-field',
        at: 1,
        entry: 'karn-brumeux',
        what: 'subrace',
        field: 'prefix',
      },
    ]);
  });
});
