import { describe, expect, it } from 'vitest';
import { emptyDraft } from '../domain/draft';
import type { CharacterDraft } from '../domain/draft';
import { MINI_CATALOGUE as C } from '../domain/fixtures/miniCatalogue';
import { createWizardReducer, initialState } from './reducer';
import type { WizardAction, WizardState } from './types';

const reduce = createWizardReducer(C);

const run = (start: WizardState, ...actions: readonly WizardAction[]): WizardState => {
  let state = start;
  for (const action of actions) {
    state = reduce(state, action);
  }
  return state;
};

const from = (parts: Partial<CharacterDraft> = {}): WizardState =>
  initialState({ ...emptyDraft(), ...parts });

describe('décisions structurantes', () => {
  it('pose la race choisie', () => {
    expect(run(from(), { type: 'SELECT_RACE', raceId: 'nain' }).draft.raceId).toBe(
      'nain',
    );
  });

  it('ne fait rien quand on re-sélectionne la même race', () => {
    const state = from({ raceId: 'nain' });
    expect(run(state, { type: 'SELECT_RACE', raceId: 'nain' })).toBe(state);
  });

  it('oublie la sous-race quand on change de race', () => {
    const state = from({ raceId: 'nain', subraceId: 'nain-des-collines' });
    const next = run(state, { type: 'SELECT_RACE', raceId: 'demi-elfe' });
    expect(next.draft.subraceId).toBeNull();
  });

  it('ignore une sous-race qui n’appartient pas à la race courante', () => {
    const state = from({ raceId: 'demi-elfe' });
    expect(run(state, { type: 'SELECT_SUBRACE', subraceId: 'nain-des-collines' })).toBe(
      state,
    );
  });

  it('efface les compétences de roublard quand on passe à clerc', () => {
    const state = from({
      classId: 'roublard',
      choices: { 'class:roublard:skills': ['discretion'] },
    });
    const next = run(state, { type: 'SELECT_CLASS', classId: 'clerc' });
    expect(next.draft.choices).toEqual({});
  });

  it('annonce ce qu’un changement de classe a fait perdre', () => {
    const state = from({
      classId: 'roublard',
      choices: { 'class:roublard:skills': ['discretion', 'acrobaties'] },
    });
    const next = run(state, { type: 'SELECT_CLASS', classId: 'clerc' });
    expect(next.notices[0]?.reason).toEqual({
      kind: 'slot-closed',
      source: 'class',
      lost: 2,
    });
  });
});

describe('caractéristiques', () => {
  it('part de 8 partout en répartition de points', () => {
    expect(from().draft.baseAbilities.force).toBe(8);
  });

  it('part d’une affectation valide en tableau standard', () => {
    const next = run(from(), { type: 'SET_ABILITY_METHOD', method: 'standard-array' });
    expect(next.draft.baseAbilities.force).toBe(15);
    expect(next.draft.baseAbilities.charisme).toBe(8);
  });

  it('remet les scores à zéro quand on change de méthode, et le dit', () => {
    const state = run(
      from(),
      { type: 'ASSIGN_ABILITY', ability: 'force', score: 14 },
      { type: 'SET_ABILITY_METHOD', method: 'standard-array' },
    );
    expect(state.notices.at(-1)?.reason).toEqual({
      kind: 'abilities-reset',
      method: 'standard-array',
    });
  });

  it('accepte une augmentation que le budget permet', () => {
    const next = run(from(), { type: 'ASSIGN_ABILITY', ability: 'force', score: 15 });
    expect(next.draft.baseAbilities.force).toBe(15);
  });

  it('refuse une répartition qui dépasse 27 points', () => {
    const state = run(
      from(),
      { type: 'ASSIGN_ABILITY', ability: 'force', score: 15 },
      { type: 'ASSIGN_ABILITY', ability: 'dexterite', score: 15 },
      { type: 'ASSIGN_ABILITY', ability: 'constitution', score: 15 },
    );
    const blocked = run(state, {
      type: 'ASSIGN_ABILITY',
      ability: 'intelligence',
      score: 15,
    });
    expect(blocked).toBe(state);
  });

  it('refuse un score hors des bornes de la répartition', () => {
    const state = from();
    expect(run(state, { type: 'ASSIGN_ABILITY', ability: 'force', score: 18 })).toBe(
      state,
    );
  });

  it('échange les valeurs quand on assigne une valeur déjà prise', () => {
    const start = run(from(), {
      type: 'SET_ABILITY_METHOD',
      method: 'standard-array',
    });
    // Force vaut 15, Charisme vaut 8. On met 15 en Charisme.
    const next = run(start, { type: 'ASSIGN_ABILITY', ability: 'charisme', score: 15 });
    expect(next.draft.baseAbilities.charisme).toBe(15);
    expect(next.draft.baseAbilities.force).toBe(8);
  });
});

describe('choix', () => {
  it('coche puis décoche une option', () => {
    const state = from({ classId: 'clerc' });
    const checked = run(state, {
      type: 'TOGGLE_CHOICE',
      slotId: 'class:clerc:skills',
      optionId: 'histoire',
    });
    expect(checked.draft.choices['class:clerc:skills']).toEqual(['histoire']);
    const unchecked = run(checked, {
      type: 'TOGGLE_CHOICE',
      slotId: 'class:clerc:skills',
      optionId: 'histoire',
    });
    expect(unchecked.draft.choices).toEqual({});
  });

  it('refuse une troisième compétence quand on n’en choisit que deux', () => {
    const state = from({
      classId: 'clerc',
      choices: { 'class:clerc:skills': ['histoire', 'medecine'] },
    });
    expect(
      run(state, {
        type: 'TOGGLE_CHOICE',
        slotId: 'class:clerc:skills',
        optionId: 'religion',
      }),
    ).toBe(state);
  });

  it('remplace la sélection d’un choix unique', () => {
    const state = from({
      classId: 'roublard',
      choices: { 'class:roublard:equipment-1': ['rapiere'] },
    });
    const next = run(state, {
      type: 'TOGGLE_CHOICE',
      slotId: 'class:roublard:equipment-1',
      optionId: 'epee-courte',
    });
    expect(next.draft.choices['class:roublard:equipment-1']).toEqual(['epee-courte']);
  });

  it('refuse une option déjà acquise par une autre source', () => {
    const state = from({ classId: 'roublard', backgroundId: 'acolyte' });
    expect(
      run(state, {
        type: 'TOGGLE_CHOICE',
        slotId: 'class:roublard:skills',
        optionId: 'perception',
      }),
    ).toBe(state);
  });

  it('ignore un créneau qui n’est pas ouvert', () => {
    const state = from();
    expect(
      run(state, {
        type: 'TOGGLE_CHOICE',
        slotId: 'class:clerc:skills',
        optionId: 'histoire',
      }),
    ).toBe(state);
  });
});

describe('navigation', () => {
  it('avance dans le parcours', () => {
    // Le nain porte des sous-races : l'écran suivant naît de son choix de race.
    const next = run(from({ raceId: 'nain' }), { type: 'GO_NEXT' });
    expect(next.currentScreenId).toBe('subrace');
  });

  it('laisse avancer avec un choix incomplet', () => {
    const next = run(from(), { type: 'GO_NEXT' });
    expect(next.currentScreenId).toBe('class');
  });

  it('ne recule pas au-delà du premier écran', () => {
    const state = from();
    expect(run(state, { type: 'GO_BACK' })).toBe(state);
  });

  it('saute à un écran présent dans le parcours', () => {
    const next = run(from(), { type: 'GO_TO', screenId: 'name' });
    expect(next.currentScreenId).toBe('name');
  });

  it('ignore un saut vers un écran absent du parcours', () => {
    const state = from();
    expect(run(state, { type: 'GO_TO', screenId: 'subrace' })).toBe(state);
  });

  it('replace l’écran courant quand le parcours le fait disparaître', () => {
    const onSubrace = run(
      from(),
      { type: 'SELECT_RACE', raceId: 'nain' },
      { type: 'GO_TO', screenId: 'subrace' },
    );
    expect(onSubrace.currentScreenId).toBe('subrace');
    const moved = run(onSubrace, { type: 'SELECT_RACE', raceId: 'demi-elfe' });
    expect(moved.currentScreenId).not.toBe('subrace');
  });
});

describe('texte libre et remise à zéro', () => {
  it('coupe un nom trop long', () => {
    const next = run(from(), { type: 'SET_NAME', name: 'a'.repeat(80) });
    expect(next.draft.name).toHaveLength(60);
  });

  it('enregistre un trait de personnalité', () => {
    const next = run(from(), {
      type: 'SET_PERSONAL_TRAIT',
      field: 'ideal',
      text: 'La foi guide mes pas.',
    });
    expect(next.draft.personalTraits.ideal).toBe('La foi guide mes pas.');
  });

  it('repart d’un brouillon vide et conserve l’état du stockage', () => {
    const state = run(
      from({ raceId: 'nain' }),
      { type: 'SET_STORAGE_STATUS', status: 'memory' },
      { type: 'RESET' },
    );
    expect(state.draft.raceId).toBeNull();
    expect(state.currentScreenId).toBe('race');
    expect(state.storage).toBe('memory');
  });

  it('remplace le brouillon à l’import en purgeant ce qui ne tient plus', () => {
    const imported: CharacterDraft = {
      ...emptyDraft(),
      classId: 'clerc',
      choices: { 'class:roublard:skills': ['discretion'] },
    };
    const next = run(from(), { type: 'REPLACE_DRAFT', draft: imported });
    expect(next.draft.classId).toBe('clerc');
    expect(next.draft.choices).toEqual({});
  });

  it('retire un avis qu’on a fermé', () => {
    const withNotice = run(
      from({ classId: 'roublard', choices: { 'class:roublard:skills': ['discretion'] } }),
      { type: 'SELECT_CLASS', classId: 'clerc' },
    );
    const noticeId = withNotice.notices[0]?.id ?? '';
    const cleared = run(withNotice, { type: 'DISMISS_NOTICE', noticeId });
    expect(cleared.notices).toEqual([]);
  });
});

describe('niveau', () => {
  it('ramène un niveau hors bornes dans l’intervalle', () => {
    expect(run(from(), { type: 'SET_LEVEL', level: 99 }).draft.level).toBe(20);
    expect(run(from(), { type: 'SET_LEVEL', level: 0 }).draft.level).toBe(1);
  });

  it('ne recrée pas l’état quand le niveau ne change pas', () => {
    const state = from();
    expect(run(state, { type: 'SET_LEVEL', level: 1 })).toBe(state);
  });

  it('oublie le choix d’un palier quand on redescend sous son niveau', () => {
    const atFour = run(from({ classId: 'roublard' }), { type: 'SET_LEVEL', level: 4 });
    const chosen = run(atFour, {
      type: 'TOGGLE_CHOICE',
      slotId: 'class:roublard:niveau-4',
      optionId: 'feat',
    });
    expect(chosen.draft.choices['class:roublard:niveau-4']).toEqual(['feat']);

    const back = run(chosen, { type: 'SET_LEVEL', level: 3 });
    // La purge retire la réponse d'un créneau refermé : aucun don fantôme.
    expect(back.draft.choices['class:roublard:niveau-4']).toBeUndefined();
  });
});

describe('points de vie lancés', () => {
  it('retient le dé saisi pour un niveau', () => {
    const next = run(from(), { type: 'SET_HIT_POINT_ROLL', level: 2, roll: 7 });
    expect(next.draft.hitPointRolls).toEqual({ '2': 7 });
  });

  it('efface le jet plutôt que d’enregistrer un zéro quand le champ est vidé', () => {
    const filled = run(from(), { type: 'SET_HIT_POINT_ROLL', level: 2, roll: 7 });
    const cleared = run(filled, { type: 'SET_HIT_POINT_ROLL', level: 2, roll: null });
    // « Pas de jet » et « jet de 0 » ne veulent pas dire la même chose : le
    // premier retombe sur la moyenne, le second serait un total faux.
    expect(cleared.draft.hitPointRolls).toEqual({});
  });

  it('garde les jets quand on revient à la moyenne fixe', () => {
    const rolled = run(from(), { type: 'SET_HIT_POINT_ROLL', level: 2, roll: 7 });
    const back = run(rolled, { type: 'SET_HIT_POINT_METHOD', method: 'average' });
    expect(back.draft.hitPointRolls).toEqual({ '2': 7 });
    expect(back.draft.hitPointMethod).toBe('average');
  });
});
