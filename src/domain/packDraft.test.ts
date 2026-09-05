import { describe, expect, it } from 'vitest';
import { MINI_CATALOGUE } from './fixtures/miniCatalogue';
import {
  allIds,
  emptyBackgroundDraft,
  emptyChoiceDraft,
  emptyClassDraft,
  emptyPackDraft,
  emptyRaceDraft,
  emptySpellDraft,
  emptySubraceDraft,
  packDraftFile,
  parsePackDraft,
  slug,
  uniqueId,
} from './packDraft';
import type {
  BackgroundDraft,
  ClassDraft,
  PackDraft,
  RaceDraft,
  SpellDraft,
  SubclassDraft,
} from './packDraft';
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
      {
        kind: 'missing-field',
        at: 1,
        entry: 'karn-appel-des-brumes',
        what: 'spell',
        field: 'summary',
      },
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

describe('une sous-classe dans le brouillon', () => {
  const college: SubclassDraft = {
    id: 'karn-domaine-des-brumes',
    name: 'Domaine des Brumes',
    blurb: 'Ton dieu parle dans le brouillard.',
    forClassId: 'clerc',
    facts: ['Voile', 'Chant sourd', ''],
    features: [{ level: 1, name: 'Voile', text: 'Tu appelles la brume.' }],
  };
  const withCollege: PackDraft = { ...karn, spells: [], subclasses: [college] };

  it('passe la validation de l’import telle quelle', () => {
    const parsed = parsePack(packDraftFile(withCollege, ''), MINI_CATALOGUE);
    expect(parsed.kind).toBe('ok');
  });

  it('revient identique après l’aller-retour', () => {
    expect(parsePackDraft(packDraftFile(withCollege, ''))).toEqual(withCollege);
  });

  it('nomme sa classe cible sous le champ `for` du fichier', () => {
    const written: unknown = packDraftFile(withCollege, '').subclasses;
    expect(written).toEqual([
      expect.objectContaining({ for: 'clerc', id: 'karn-domaine-des-brumes' }),
    ]);
  });
});

describe('un peuple dans le brouillon', () => {
  const brumeux: RaceDraft = {
    ...emptyRaceDraft(),
    id: 'karn-brumeux',
    name: 'Brumeux',
    blurb: 'Un peuple né d’une malédiction.',
    facts: ['+2 au choix', '7,50 m', 'Vision 18 m'],
    speed: 7.5,
    darkvision: 18,
    languages: ['commun'],
    features: [{ level: 1, name: 'Voile natal', text: 'La brume ne te ralentit pas.' }],
    choices: [
      {
        ...emptyChoiceDraft('ability', 'origin-2'),
        title: 'Où mettre ton +2 ?',
        help: 'Dans ce que ton personnage fera le plus souvent.',
        bonus: 2,
      },
    ],
    subraces: [
      {
        ...emptySubraceDraft(),
        id: 'karn-brumeux-des-marais',
        name: 'Brumeux des marais',
        blurb: 'Plus vif, plus silencieux.',
        features: [{ level: 1, name: 'Pas feutré', text: 'Tu ne fais pas de bruit.' }],
        bonusHitPointsPerLevel: 1,
      },
    ],
  };
  const withRace: PackDraft = { ...karn, spells: [], races: [brumeux] };

  it('passe la validation de l’import telle quelle', () => {
    const parsed = parsePack(packDraftFile(withRace, ''), MINI_CATALOGUE);
    expect(parsed.kind === 'invalid' ? parsed.issues : []).toEqual([]);
  });

  it('revient identique après l’aller-retour, branches comprises', () => {
    expect(parsePackDraft(packDraftFile(withRace, ''))).toEqual(withRace);
  });

  it('n’écrit d’un choix que ce que son genre emploie', () => {
    const written: unknown = packDraftFile(withRace, '');
    expect(written).toMatchObject({
      races: [
        {
          choices: [{ kind: 'ability', bonus: 2, subject: 'origin-2' }],
        },
      ],
    });
    const [race] = (written as { races: { choices: Record<string, unknown>[] }[] }).races;
    expect(Object.keys(race?.choices[0] ?? {})).not.toContain('listFrom');
  });
});

describe('un historique dans le brouillon', () => {
  const batelier: BackgroundDraft = {
    ...emptyBackgroundDraft(),
    id: 'karn-batelier-des-brumes',
    name: 'Batelier des brumes',
    blurb: 'Tu passais les gens d’une rive à l’autre.',
    facts: ['Perception, Survie', 'Outils de navigateur', 'Perche, 10 po'],
    skills: ['perception', 'survie'],
    equipment: [{ itemId: 'bouclier', quantity: 1 }],
    goldPieces: 10,
    featureName: 'Passeur',
    featureText: 'On te laisse traverser sans payer.',
    traits: ['Je parle peu.'],
    ideals: ['Le passage est dû à tous.'],
  };
  const withBackground: PackDraft = { ...karn, spells: [], backgrounds: [batelier] };

  it('passe la validation de l’import telle quelle', () => {
    const parsed = parsePack(packDraftFile(withBackground, ''), MINI_CATALOGUE);
    expect(parsed.kind === 'invalid' ? parsed.issues : []).toEqual([]);
  });

  it('revient identique après l’aller-retour', () => {
    expect(parsePackDraft(packDraftFile(withBackground, ''))).toEqual(withBackground);
  });

  it('écrit « aucune aptitude » plutôt qu’une aptitude vide', () => {
    const without: PackDraft = {
      ...withBackground,
      backgrounds: [{ ...batelier, featureName: '', featureText: '' }],
    };
    const written: unknown = packDraftFile(without, '');
    expect(written).toMatchObject({ backgrounds: [{ feature: null }] });
  });
});

describe('une classe dans le brouillon', () => {
  const brumeur: ClassDraft = {
    ...emptyClassDraft(),
    id: 'karn-brumeur',
    name: 'Brumeur',
    blurb: 'Tu appelles la brume, et elle te répond.',
    facts: ['d8', 'Dextérité + Sagesse', 'Lanceur de sorts'],
    saves: ['dexterite', 'sagesse'],
    armor: ['legere'],
    features: [{ level: 1, name: 'Appel', text: 'Tu appelles une brume légère.' }],
    casts: true,
    castingAbility: 'sagesse',
    progression: 'full',
    preparation: 'prepared',
    ritual: true,
    subclassTitle: 'Ta voie de brume',
    subclassHelp: 'La façon dont la brume te répond.',
  };
  const withClass: PackDraft = { ...karn, spells: [], classes: [brumeur] };

  it('passe la validation de l’import telle quelle', () => {
    const parsed = parsePack(packDraftFile(withClass, ''), MINI_CATALOGUE);
    expect(parsed.kind === 'invalid' ? parsed.issues : []).toEqual([]);
  });

  it('revient identique après l’aller-retour', () => {
    expect(parsePackDraft(packDraftFile(withClass, ''))).toEqual(withClass);
  });

  it('écrit « pas de magie » plutôt qu’une magie vide', () => {
    const without: PackDraft = {
      ...withClass,
      classes: [{ ...brumeur, casts: false }],
    };
    expect(packDraftFile(without, '')).toMatchObject({
      classes: [{ spellcasting: null }],
    });
  });

  it('n’écrit que les niveaux de ses paliers, pas leur prose', () => {
    expect(packDraftFile(withClass, '')).toMatchObject({
      classes: [{ advancements: [4, 8, 12, 16, 19] }],
    });
  });

  it('garde une voie de son propre pack, déclarée comme une greffe', () => {
    const withOwnVoie: PackDraft = {
      ...withClass,
      subclasses: [
        {
          id: 'karn-voie-des-marais',
          name: 'Voie des marais',
          blurb: 'La brume te suit dans l’eau.',
          forClassId: 'karn-brumeur',
          facts: ['Voile', '—', '—'],
          features: [{ level: 3, name: 'Voile', text: 'Tu disparais dans la brume.' }],
        },
      ],
    };
    const parsed = parsePack(packDraftFile(withOwnVoie, ''), MINI_CATALOGUE);
    expect(parsed.kind === 'invalid' ? parsed.issues : []).toEqual([]);
  });
});

describe('les identifiants que le créateur fabrique', () => {
  it('se déduisent du nom, sans accent ni espace', () => {
    expect(uniqueId('karn', 'Appel des Brumes', [])).toBe('karn-appel-des-brumes');
  });

  it('se numérotent plutôt que de refuser deux entrées du même nom', () => {
    const taken = ['karn-brumeux'];
    expect(uniqueId('karn', 'Brumeux', taken)).toBe('karn-brumeux-2');
    expect(uniqueId('karn', 'Brumeux', [...taken, 'karn-brumeux-2'])).toBe(
      'karn-brumeux-3',
    );
  });

  it('voit tout ce que le pack a déjà nommé, branches comprises', () => {
    const draft: PackDraft = {
      ...emptyPackDraft(),
      spells: [{ ...emptySpellDraft(), id: 'karn-brume' }],
      races: [
        {
          ...emptyRaceDraft(),
          id: 'karn-brumeux',
          subraces: [{ ...emptySubraceDraft(), id: 'karn-brumeux-des-marais' }],
        },
      ],
    };
    expect(allIds(draft)).toEqual([
      'karn-brume',
      'karn-brumeux',
      'karn-brumeux-des-marais',
    ]);
  });
});
