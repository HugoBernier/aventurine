import { describe, expect, it } from 'vitest';
import { slotId } from '../domain/choice';
import { isWellFormedSlotId } from '../domain/choice';
import type { ChoiceSpec } from '../domain/choiceSpec';
import { ALL_SKILLS } from '../domain/skills';
import { CATALOGUE as C } from './catalogue';

const ids = (entries: readonly { readonly id: string }[]): readonly string[] =>
  entries.map((entry) => entry.id);

const duplicates = (values: readonly string[]): readonly string[] =>
  values.filter((value, index) => values.indexOf(value) !== index);

const TABLES = {
  abilities: C.abilities,
  skills: C.skills,
  races: C.races,
  classes: C.classes,
  backgrounds: C.backgrounds,
  alignments: C.alignments,
  languages: C.languages,
  tools: C.tools,
  weapons: C.weapons,
  armor: C.armor,
  items: C.items,
  spells: C.spells,
  ancestries: C.ancestries,
  fightingStyles: C.fightingStyles,
};

interface OwnedSpec {
  readonly slot: string;
  readonly spec: ChoiceSpec;
}

const own = (
  source: 'race' | 'class' | 'background',
  parentId: string,
  specs: readonly ChoiceSpec[],
): readonly OwnedSpec[] =>
  specs.map((spec) => ({ slot: slotId(source, parentId, spec.subject), spec }));

const raceSpecs = (): readonly OwnedSpec[] =>
  C.races.flatMap((race) => [
    ...own('race', race.id, race.choices),
    ...race.subraces.flatMap((subrace) => own('race', subrace.id, subrace.choices)),
  ]);

const classSpecs = (): readonly OwnedSpec[] =>
  C.classes.flatMap((entry) => [
    ...own('class', entry.id, entry.choices),
    ...own('class', entry.id, entry.subclass?.choices ?? []),
  ]);

const backgroundSpecs = (): readonly OwnedSpec[] =>
  C.backgrounds.flatMap((background) =>
    own('background', background.id, background.choices),
  );

/** Chaque spec, avec la source et le parent qui la déclarent. */
const allSpecs = (): readonly OwnedSpec[] => [
  ...raceSpecs(),
  ...classSpecs(),
  ...backgroundSpecs(),
];

const byName = (a: string, b: string): number => a.localeCompare(b, 'fr');

// `import.meta.glob` de Vite plutôt que `node:fs` : le test lit les sources
// sans ouvrir les types Node à toute l'application.
const sourcesOf = (
  modules: Record<string, string>,
): readonly { readonly file: string; readonly text: string }[] =>
  Object.entries(modules)
    .filter(([file]) => !file.endsWith('.test.ts'))
    .map(([file, text]) => ({ file, text }));

describe('unicité des identifiants', () => {
  it('n’a aucun identifiant en double dans une même table', () => {
    for (const [name, entries] of Object.entries(TABLES)) {
      expect({ [name]: duplicates(ids(entries)) }).toEqual({ [name]: [] });
    }
  });

  it('n’a aucun identifiant de sous-race en double', () => {
    const subraces = C.races.flatMap((race) => ids(race.subraces));
    expect(duplicates(subraces)).toEqual([]);
  });

  it('n’a aucun identifiant de créneau en double dans tout le catalogue', () => {
    expect(duplicates(allSpecs().map((entry) => entry.slot))).toEqual([]);
  });

  it('forme tous les identifiants de créneau en source:parent:sujet', () => {
    for (const { slot } of allSpecs()) {
      expect({ slot, wellFormed: isWellFormedSlotId(slot) }).toEqual({
        slot,
        wellFormed: true,
      });
    }
  });

  it('n’écrit aucun identifiant avec un accent ou une majuscule', () => {
    const every = Object.values(TABLES).flatMap((entries) => ids(entries));
    const wrong = every.filter((id) => !/^[a-z0-9-]+$/.test(id));
    expect(wrong).toEqual([]);
  });
});

describe('intégrité référentielle', () => {
  const skillIds = new Set<string>(ALL_SKILLS);
  const languageIds = new Set(ids(C.languages));
  const toolIds = new Set(ids(C.tools));
  const itemIds = new Set(ids(C.items));
  const classIds = new Set(ids(C.classes));
  const spellIds = new Set(ids(C.spells));

  it('ne référence que des compétences existantes', () => {
    const referenced = [
      ...C.races.flatMap((race) => [
        ...race.skills,
        ...race.subraces.flatMap((subrace) => subrace.skills),
      ]),
      ...C.backgrounds.flatMap((background) => background.skills),
      ...allSpecs().flatMap(({ spec }) => (spec.kind === 'skill' ? spec.from : [])),
    ];
    expect(referenced.filter((id) => !skillIds.has(id))).toEqual([]);
  });

  it('ne référence que des langues existantes', () => {
    const referenced = [
      ...C.races.flatMap((race) => race.languages),
      ...allSpecs().flatMap(({ spec }) => (spec.kind === 'language' ? spec.from : [])),
    ];
    expect(referenced.filter((id) => !languageIds.has(id))).toEqual([]);
  });

  it('ne référence que des outils existants', () => {
    const referenced = [
      ...C.races.flatMap((race) => race.proficiencies.tools),
      ...C.classes.flatMap((entry) => entry.proficiencies.tools),
      ...allSpecs().flatMap(({ spec }) => {
        if (spec.kind === 'tool') {
          return spec.from;
        }
        return spec.kind === 'expertise' ? spec.tools : [];
      }),
    ];
    expect(referenced.filter((id) => !toolIds.has(id))).toEqual([]);
  });

  it('ne référence que des objets existants dans l’équipement', () => {
    const referenced = [
      ...C.classes.flatMap((entry) => [
        ...entry.fixedEquipment.map((line) => line.itemId),
        ...entry.equipmentOptions.flatMap((option) =>
          option.items.map((line) => line.itemId),
        ),
      ]),
      ...C.backgrounds.flatMap((background) =>
        background.equipment.map((line) => line.itemId),
      ),
    ];
    expect(referenced.filter((id) => !itemIds.has(id))).toEqual([]);
  });

  it('ne référence que des options d’équipement déclarées par la classe', () => {
    for (const entry of C.classes) {
      const declared = new Set(ids(entry.equipmentOptions));
      const referenced = entry.choices.flatMap((spec) =>
        spec.kind === 'equipment' ? spec.from : [],
      );
      const missing = referenced.filter((id) => !declared.has(id));
      expect({ classe: entry.id, missing }).toEqual({ classe: entry.id, missing: [] });
    }
  });

  it('ne référence que des classes existantes dans les listes de sorts', () => {
    const referenced = [
      ...C.spells.flatMap((entry) => entry.classes),
      ...allSpecs().flatMap(({ spec }) =>
        spec.kind === 'cantrip' || spec.kind === 'spell' ? [spec.listFrom] : [],
      ),
    ];
    expect(referenced.filter((id) => !classIds.has(id))).toEqual([]);
  });

  it('ne référence que des sorts existants dans les sorts toujours préparés', () => {
    const referenced = C.classes.flatMap(
      (entry) => entry.subclass?.alwaysPreparedSpells ?? [],
    );
    expect(referenced.filter((id) => !spellIds.has(id))).toEqual([]);
  });
});

describe('complétude du contenu', () => {
  it('contient les douze classes et les neuf races du SRD', () => {
    expect(C.classes).toHaveLength(12);
    expect(C.races).toHaveLength(9);
  });

  it('couvre exactement les dix-huit compétences déclarées par le domaine', () => {
    expect(ids(C.skills).toSorted(byName)).toEqual([...ALL_SKILLS].toSorted(byName));
  });

  it('donne à chaque classe deux jets de sauvegarde et un dé de vie', () => {
    for (const entry of C.classes) {
      expect({ id: entry.id, saves: entry.saves.length }).toEqual({
        id: entry.id,
        saves: 2,
      });
      expect([6, 8, 10, 12]).toContain(entry.hitDie);
    }
  });

  it('donne à chaque classe un choix de compétences', () => {
    for (const entry of C.classes) {
      const hasSkills = entry.choices.some((spec) => spec.kind === 'skill');
      expect({ id: entry.id, hasSkills }).toEqual({ id: entry.id, hasSkills: true });
    }
  });

  it('donne à chaque sort un résumé français non vide', () => {
    for (const entry of C.spells) {
      expect({ id: entry.id, empty: entry.summary.trim() === '' }).toEqual({
        id: entry.id,
        empty: false,
      });
    }
  });

  it('donne trois repères à chaque entité comparable', () => {
    const comparable = [...C.races, ...C.classes, ...C.backgrounds];
    for (const entry of comparable) {
      expect({ id: entry.id, facts: entry.facts.length }).toEqual({
        id: entry.id,
        facts: 3,
      });
    }
  });

  it('propose au moins un tour de magie à chaque classe qui lance des sorts', () => {
    for (const entry of C.classes) {
      if (entry.spellcasting === null) {
        continue;
      }
      const cantrips = C.spells.filter(
        (spell) => spell.level === 0 && spell.classes.includes(entry.id),
      );
      expect({ id: entry.id, cantrips: cantrips.length > 0 }).toEqual({
        id: entry.id,
        cantrips: true,
      });
    }
  });
});

describe('garde-fous de la charte', () => {
  const domainSources = sourcesOf(
    import.meta.glob('../domain/*.ts', {
      query: '?raw',
      eager: true,
      import: 'default',
    }),
  );
  const dataSources = sourcesOf(
    import.meta.glob('./*.ts', { query: '?raw', eager: true, import: 'default' }),
  );

  // Un mot peut désigner À LA FOIS un genre de règle et un contenu. « bouclier »
  // est une catégorie d'armure — vocabulaire fermé par les règles, que le
  // domaine a le droit de nommer — et aussi le sort Bouclier. L'exception est
  // nommée ici plutôt que le test affaibli : si cette liste s'allonge, c'est
  // le signal qu'un identifiant de contenu a fui dans le domaine.
  const RULE_VOCABULARY = new Set(['bouclier']);

  it('n’écrit aucun identifiant de contenu dans src/domain/', () => {
    // Le domaine branche sur des genres de règle, jamais sur du contenu :
    // ajouter une race doit rester une entrée de données.
    const contentIds = [
      ...ids(C.races),
      ...C.races.flatMap((race) => ids(race.subraces)),
      ...ids(C.classes),
      ...ids(C.backgrounds),
      ...ids(C.spells),
    ].filter((id) => !RULE_VOCABULARY.has(id));
    for (const { file, text } of domainSources) {
      const found = contentIds.filter((id) => text.includes(`'${id}'`));
      expect({ file, found }).toEqual({ file, found: [] });
    }
  });

  it('n’écrit aucune URL commençant par une barre oblique dans src/data/', () => {
    // Le site est publié sous un sous-chemin : une URL absolue y casserait.
    for (const { file, text } of dataSources) {
      expect({ file, absolute: /["'`]\/[a-z]/.test(text) }).toEqual({
        file,
        absolute: false,
      });
    }
  });
});

/** Les valeurs des bonus d'origine qu'une entrée laisse placer au joueur. */
const originValues = (entity: { readonly choices: readonly ChoiceSpec[] } | undefined) =>
  (entity?.choices ?? [])
    .filter((spec) => spec.kind === 'ability' && spec.subject.startsWith('origin-'))
    .map((spec) => (spec.kind === 'ability' ? spec.bonus : 0));

const subraceOf = (raceId: string, subraceId: string) =>
  C.races
    .find((race) => race.id === raceId)
    ?.subraces.find((subrace) => subrace.id === subraceId);

describe('sous-races du SRD 5.1', () => {
  it('donne un +1 à placer à l’elfe noir', () => {
    expect(originValues(subraceOf('elfe', 'elfe-noir'))).toEqual([1]);
  });

  it('donne à l’elfe noir une vision dans le noir supérieure, à 36 m', () => {
    expect(subraceOf('elfe', 'elfe-noir')?.darkvision).toBe(36);
  });

  it('donne un +1 à placer au gnome des forêts', () => {
    expect(originValues(subraceOf('gnome', 'gnome-des-forets'))).toEqual([1]);
  });

  it('propose les trois sous-races d’elfe et les deux de gnome', () => {
    expect(C.races.find((race) => race.id === 'elfe')?.subraces).toHaveLength(3);
    expect(C.races.find((race) => race.id === 'gnome')?.subraces).toHaveLength(2);
  });
});
