import { describe, expect, it } from 'vitest';
import type { AbilityId } from './abilities';
import type { Catalogue } from './catalogue';
import type { SkillId } from './skills';
import { emptyDraft } from './draft';
import type { CharacterDraft } from './draft';
import { MINI_CATALOGUE as C, ROGUE } from './fixtures/miniCatalogue';
import { openChoices } from './openChoices';

const draftWith = (parts: Partial<CharacterDraft>): CharacterDraft => ({
  ...emptyDraft(),
  ...parts,
});

const slot = (draft: CharacterDraft, id: string) =>
  openChoices(draft, C).find((entry) => entry.id === id);

const optionIds = (draft: CharacterDraft, id: string): readonly string[] =>
  slot(draft, id)?.options.map((option) => option.id) ?? [];

describe('ouverture des créneaux', () => {
  it('n’ouvre aucun créneau sur un brouillon vide', () => {
    expect(openChoices(emptyDraft(), C)).toEqual([]);
  });

  it('demande 4 compétences à un roublard', () => {
    expect(slot(draftWith({ classId: 'roublard' }), 'class:roublard:skills')?.pick).toBe(
      4,
    );
  });

  it('nomme le créneau des compétences de roublard class:roublard:skills', () => {
    const ids = openChoices(draftWith({ classId: 'roublard' }), C).map((s) => s.id);
    expect(ids).toContain('class:roublard:skills');
  });

  it('n’ouvre les créneaux de sous-race que si une sous-race est choisie', () => {
    const withoutSubrace = openChoices(draftWith({ raceId: 'nain' }), C);
    expect(withoutSubrace).toEqual([]);
  });

  it('ouvre les deux créneaux du demi-elfe', () => {
    const ids = openChoices(draftWith({ raceId: 'demi-elfe' }), C).map((s) => s.id);
    expect(ids).toEqual(['race:demi-elfe:ability', 'race:demi-elfe:skills']);
  });

  it('ne pose aucun créneau de sort à une classe qui n’en lance pas', () => {
    const kinds = openChoices(draftWith({ classId: 'roublard' }), C).map((s) => s.kind);
    expect(kinds).not.toContain('cantrip');
  });

  it('propose les tours de magie du clerc', () => {
    const draft = draftWith({ classId: 'clerc' });
    expect(optionIds(draft, 'class:clerc:cantrips')).toEqual([
      'lumiere',
      'flamme-sacree',
      'assistance',
    ]);
  });

  it('recopie sans les modifier le titre et l’aide écrits dans les données', () => {
    const opened = slot(draftWith({ classId: 'roublard' }), 'class:roublard:skills');
    expect(opened?.title).toBe('Tes compétences de roublard');
    expect(opened?.help).toBe('Le roublard est la classe qui en maîtrise le plus.');
  });

  it('n’écrit pas le nombre dans le titre : `pick` en est la seule source', () => {
    const opened = slot(draftWith({ classId: 'roublard' }), 'class:roublard:skills');
    expect(opened?.title).not.toMatch(/\d/);
  });

  it('remplit les trois repères de chaque option', () => {
    const opened = slot(draftWith({ classId: 'clerc' }), 'class:clerc:cantrips');
    const options = opened?.options ?? [];
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(option.facts).toHaveLength(3);
    }
  });

  it('ne porte ni réponse ni état d’avancement dans le créneau', () => {
    const draft = draftWith({
      classId: 'roublard',
      choices: { 'class:roublard:skills': ['discretion'] },
    });
    const opened = slot(draft, 'class:roublard:skills');
    expect(opened).not.toHaveProperty('picked');
    expect(opened).not.toHaveProperty('complete');
  });
});

describe('options déjà acquises', () => {
  it('marque comme déjà acquise une compétence donnée par l’historique', () => {
    const draft = draftWith({ classId: 'roublard', backgroundId: 'acolyte' });
    const perception = slot(draft, 'class:roublard:skills')?.options.find(
      (option) => option.id === 'perception',
    );
    expect(perception?.unavailable).toEqual({
      kind: 'already-granted',
      source: 'background',
    });
  });

  it('laisse disponibles les compétences que rien n’a encore données', () => {
    const draft = draftWith({ classId: 'roublard', backgroundId: 'acolyte' });
    const discretion = slot(draft, 'class:roublard:skills')?.options.find(
      (option) => option.id === 'discretion',
    );
    expect(discretion?.unavailable).toBeNull();
  });

  it('ne marque jamais comme acquise une option que l’on vient de cocher', () => {
    const draft = draftWith({
      classId: 'roublard',
      choices: { 'class:roublard:skills': ['discretion'] },
    });
    const discretion = slot(draft, 'class:roublard:skills')?.options.find(
      (option) => option.id === 'discretion',
    );
    expect(discretion?.unavailable).toBeNull();
  });

  it('aboutit au même état que l’historique soit choisi avant ou après la classe', () => {
    const base = { classId: 'roublard', backgroundId: 'acolyte' } as const;
    const first = openChoices(draftWith(base), C);
    const second = openChoices(draftWith({ ...base }), C);
    expect(first).toEqual(second);
  });
});

describe('créneau plein', () => {
  it('bloque les options restantes quand le compte est atteint', () => {
    const draft = draftWith({
      classId: 'clerc',
      choices: { 'class:clerc:skills': ['histoire', 'medecine'] },
    });
    const religion = slot(draft, 'class:clerc:skills')?.options.find(
      (option) => option.id === 'religion',
    );
    expect(religion?.unavailable).toEqual({ kind: 'slot-full' });
  });

  it('laisse décochables les options déjà retenues', () => {
    const draft = draftWith({
      classId: 'clerc',
      choices: { 'class:clerc:skills': ['histoire', 'medecine'] },
    });
    const histoire = slot(draft, 'class:clerc:skills')?.options.find(
      (option) => option.id === 'histoire',
    );
    expect(histoire?.unavailable).toBeNull();
  });
});

describe('équipement, ascendance et style de combat', () => {
  it('propose les options d’équipement déclarées par la classe', () => {
    const draft = draftWith({ classId: 'roublard' });
    expect(optionIds(draft, 'class:roublard:equipment-1')).toEqual([
      'rapiere',
      'epee-courte',
    ]);
  });

  it('ignore une option d’équipement introuvable plutôt que de casser l’écran', () => {
    const draft = draftWith({ classId: 'roublard' });
    expect(optionIds(draft, 'class:roublard:equipment-1')).not.toContain('arme-inconnue');
  });

  it('décrit chaque option d’équipement par trois repères alignés', () => {
    const draft = draftWith({ classId: 'roublard' });
    const rapiere = slot(draft, 'class:roublard:equipment-1')?.options[0];
    expect(rapiere?.facts).toEqual(['1d8 perforant', 'Finesse', 'Corps à corps']);
  });

  it('propose toutes les ascendances draconiques du catalogue', () => {
    const draft = draftWith({ classId: 'clerc' });
    expect(optionIds(draft, 'class:clerc:ancestry')).toEqual(['or', 'argent']);
  });

  it('décrit une ascendance par son type de dégâts et son souffle', () => {
    const draft = draftWith({ classId: 'clerc' });
    const or = slot(draft, 'class:clerc:ancestry')?.options[0];
    expect(or?.facts).toEqual(['feu', 'cône de 4,50 m', '—']);
  });

  it('propose tous les styles de combat du catalogue', () => {
    const draft = draftWith({ classId: 'clerc' });
    expect(optionIds(draft, 'class:clerc:fighting-style')).toEqual(['defense', 'duel']);
  });
});

describe('identifiants inconnus du catalogue', () => {
  // Un contenu peut disparaître entre deux versions, et un fichier importé
  // peut nommer ce qu'on ne connaît plus. L'écran doit rester utilisable :
  // on retombe sur l'identifiant brut plutôt que d'afficher « undefined ».
  const withUnknownReferences: Catalogue = {
    ...C,
    classes: [
      {
        ...ROGUE,
        id: 'inconnaisseur',
        choices: [
          {
            kind: 'skill',
            subject: 'skills',
            title: 'Compétences',
            help: 'Aide',
            pick: 1,
            from: ['scaphandrie' as SkillId],
          },
          {
            kind: 'language',
            subject: 'languages',
            title: 'Langues',
            help: 'Aide',
            pick: 1,
            from: ['martien'],
          },
          {
            kind: 'tool',
            subject: 'tools',
            title: 'Outils',
            help: 'Aide',
            pick: 1,
            from: ['tournevis'],
          },
          {
            kind: 'ability',
            subject: 'ability',
            title: 'Caractéristiques',
            help: 'Aide',
            pick: 1,
            bonus: 1,
            from: ['bravoure' as AbilityId],
          },
        ],
      },
    ],
  };

  const openUnknown = (subject: string) =>
    openChoices(draftWith({ classId: 'inconnaisseur' }), withUnknownReferences).find(
      (entry) => entry.id === `class:inconnaisseur:${subject}`,
    );

  it('affiche l’identifiant brut d’une compétence inconnue', () => {
    expect(openUnknown('skills')?.options[0]?.label).toBe('scaphandrie');
  });

  it('affiche l’identifiant brut d’une langue inconnue', () => {
    expect(openUnknown('languages')?.options[0]?.label).toBe('martien');
  });

  it('n’affiche aucun prix pour un outil inconnu plutôt que « undefined »', () => {
    expect(openUnknown('tools')?.options[0]?.facts[1]).toBe('0 po');
  });

  it('affiche l’identifiant brut d’une caractéristique inconnue', () => {
    expect(openUnknown('ability')?.options[0]?.label).toBe('bravoure');
  });

  it('remplit toujours les trois repères, même sans donnée', () => {
    expect(openUnknown('skills')?.options[0]?.facts).toHaveLength(3);
  });
});

describe('expertise', () => {
  it('place le créneau d’expertise en dernier', () => {
    const draft = draftWith({ classId: 'roublard', backgroundId: 'acolyte' });
    const opened = openChoices(draft, C);
    expect(opened.at(-1)?.kind).toBe('expertise');
  });

  it('rend un créneau d’expertise vide de compétences quand aucune n’est acquise', () => {
    const draft = draftWith({ classId: 'roublard' });
    expect(optionIds(draft, 'class:roublard:expertise')).toEqual(['outils-de-voleur']);
  });

  it('ne propose à l’expertise que les compétences que le personnage maîtrise', () => {
    const draft = draftWith({
      classId: 'roublard',
      choices: { 'class:roublard:skills': ['discretion', 'acrobaties'] },
    });
    expect(optionIds(draft, 'class:roublard:expertise')).toEqual([
      'discretion',
      'acrobaties',
      'outils-de-voleur',
    ]);
  });

  it('compte dans l’expertise une compétence reçue de l’historique', () => {
    const draft = draftWith({ classId: 'roublard', backgroundId: 'acolyte' });
    expect(optionIds(draft, 'class:roublard:expertise')).toContain('perspicacite');
  });

  it('n’offre pas à l’expertise un outil que le personnage ne maîtrise pas', () => {
    const draft = draftWith({ classId: 'clerc' });
    const opened = openChoices(draft, C).find((s) => s.kind === 'expertise');
    expect(opened).toBeUndefined();
  });
});
