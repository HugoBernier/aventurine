import { ABILITIES, abilityScores } from '../domain/abilities';
import { clampLevel } from '../domain/progression';
import type { AbilityId } from '../domain/abilities';
import { findRace } from '../domain/catalogue';
import type { Catalogue } from '../domain/catalogue';
import { parseSlotId } from '../domain/choice';
import type { ChoiceSlot } from '../domain/choice';
import { emptyDraft, pickedFor } from '../domain/draft';
import type { AbilityMethod, CharacterDraft } from '../domain/draft';
import { openChoices } from '../domain/openChoices';
import {
  POINT_BUY_BUDGET,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  STANDARD_ARRAY,
  pointsSpent,
} from '../domain/pointBuy';
import { buildFlow } from './flow';
import { pruneChoices } from './prune';
import type { RemovedChoice } from './prune';
import type { Notice, NoticeReason, WizardAction, WizardState } from './types';

/** Les avis les plus anciens disparaissent : on n'empile pas les bandeaux. */
const MAX_NOTICES = 3;

export function initialState(draft: CharacterDraft = emptyDraft()): WizardState {
  return { draft, currentScreenId: 'race', notices: [], storage: 'ok' };
}

function noticeFor(removed: RemovedChoice): NoticeReason {
  const parsed = removed.reason === 'slot-closed' ? parseSlotId(removed.slotId) : null;
  if (parsed !== null) {
    return {
      kind: 'slot-closed',
      source: parsed.source,
      parentId: parsed.parentId,
      lost: removed.optionIds.length,
    };
  }
  return {
    kind: 'options-withdrawn',
    slotId: removed.slotId,
    optionIds: removed.optionIds,
  };
}

function withNotices(
  existing: readonly Notice[],
  reasons: readonly NoticeReason[],
): readonly Notice[] {
  const added = reasons.map((reason, index) => ({
    id: `${String(Date.now())}-${String(index)}`,
    reason,
  }));
  return [...existing, ...added].slice(-MAX_NOTICES);
}

/**
 * Point de passage unique de toute modification du brouillon : purge, avis,
 * puis réancrage de l'écran courant si le parcours l'a fait disparaître.
 * Il n'existe qu'un seul chemin, donc on ne peut pas oublier une cascade.
 */
function commit(
  state: WizardState,
  draft: CharacterDraft,
  catalogue: Catalogue,
  extra: readonly NoticeReason[] = [],
): WizardState {
  const { draft: pruned, removed } = pruneChoices(draft, catalogue);
  const flow = buildFlow(pruned, catalogue);
  const isStillThere = flow.some((screen) => screen.id === state.currentScreenId);
  const fallback = flow[0]?.id ?? 'race';

  return {
    draft: pruned,
    currentScreenId: isStillThere ? state.currentScreenId : fallback,
    notices: withNotices(state.notices, [
      ...extra,
      ...removed.map((entry) => noticeFor(entry)),
    ]),
    storage: state.storage,
  };
}

function move(state: WizardState, catalogue: Catalogue, offset: number): WizardState {
  const flow = buildFlow(state.draft, catalogue);
  const index = flow.findIndex((screen) => screen.id === state.currentScreenId);
  const target = flow[index + offset];
  return target === undefined ? state : { ...state, currentScreenId: target.id };
}

function initialScores(method: AbilityMethod): CharacterDraft['baseAbilities'] {
  if (method === 'point-buy') {
    return abilityScores(() => POINT_BUY_MIN);
  }
  // Le tableau standard part d'une affectation valide que le joueur réarrange :
  // pas de valeur « non assignée » à modéliser, donc pas d'état invalide à
  // traverser, donc jamais de « Suivant » bloqué sur cet écran.
  return abilityScores((ability) => STANDARD_ARRAY[ABILITIES.indexOf(ability)] ?? 8);
}

function assignPointBuy(
  draft: CharacterDraft,
  ability: AbilityId,
  score: number,
): CharacterDraft {
  if (score < POINT_BUY_MIN || score > POINT_BUY_MAX) {
    return draft;
  }
  const next = { ...draft.baseAbilities, [ability]: score };
  if (pointsSpent(next) > POINT_BUY_BUDGET) {
    return draft;
  }
  return { ...draft, baseAbilities: next };
}

/** Réutiliser une valeur déjà placée échange les deux : un seul geste. */
function assignStandardArray(
  draft: CharacterDraft,
  ability: AbilityId,
  score: number,
): CharacterDraft {
  if (!STANDARD_ARRAY.includes(score as (typeof STANDARD_ARRAY)[number])) {
    return draft;
  }
  const holder = ABILITIES.find(
    (other) => other !== ability && draft.baseAbilities[other] === score,
  );
  const previous = draft.baseAbilities[ability];
  const next = { ...draft.baseAbilities, [ability]: score };
  if (holder !== undefined) {
    next[holder] = previous;
  }
  return { ...draft, baseAbilities: next };
}

function toggle(
  draft: CharacterDraft,
  slot: ChoiceSlot,
  optionId: string,
): CharacterDraft {
  const picked = pickedFor(draft, slot.id);
  if (picked.includes(optionId)) {
    const rest = picked.filter((id) => id !== optionId);
    const choices = Object.fromEntries(
      Object.entries(draft.choices).filter(([id]) => id !== slot.id),
    );
    return {
      ...draft,
      choices: rest.length === 0 ? choices : { ...choices, [slot.id]: rest },
    };
  }

  const option = slot.options.find((entry) => entry.id === optionId);
  if (option?.unavailable != null) {
    return draft;
  }
  if (option === undefined) {
    return draft;
  }
  if (picked.length >= slot.pick) {
    // Un choix unique se remplace ; un choix multiple plein refuse, et
    // l'interface a déjà désactivé l'option en disant pourquoi.
    return slot.pick === 1
      ? { ...draft, choices: { ...draft.choices, [slot.id]: [optionId] } }
      : draft;
  }
  return { ...draft, choices: { ...draft.choices, [slot.id]: [...picked, optionId] } };
}

function selectRace(
  state: WizardState,
  catalogue: Catalogue,
  raceId: string,
): WizardState {
  const { draft } = state;
  return draft.raceId === raceId
    ? state
    : commit(state, { ...draft, raceId, subraceId: null }, catalogue);
}

function selectSubrace(
  state: WizardState,
  catalogue: Catalogue,
  subraceId: string,
): WizardState {
  const { draft } = state;
  const race = findRace(catalogue, draft.raceId);
  const isKnown = race?.subraces.some((entry) => entry.id === subraceId) ?? false;
  return isKnown && draft.subraceId !== subraceId
    ? commit(state, { ...draft, subraceId }, catalogue)
    : state;
}

function setAbilityMethod(
  state: WizardState,
  catalogue: Catalogue,
  method: AbilityMethod,
): WizardState {
  const { draft } = state;
  if (draft.abilityMethod === method) {
    return state;
  }
  return commit(
    state,
    { ...draft, abilityMethod: method, baseAbilities: initialScores(method) },
    catalogue,
    [{ kind: 'abilities-reset', method }],
  );
}

function assignAbility(
  state: WizardState,
  catalogue: Catalogue,
  ability: AbilityId,
  score: number | null,
): WizardState {
  const { draft } = state;
  if (score === null) {
    return state;
  }
  const next =
    draft.abilityMethod === 'point-buy'
      ? assignPointBuy(draft, ability, score)
      : assignStandardArray(draft, ability, score);
  return next === draft ? state : commit(state, next, catalogue);
}

function toggleChoice(
  state: WizardState,
  catalogue: Catalogue,
  slotId: string,
  optionId: string,
): WizardState {
  const { draft } = state;
  const slot = openChoices(draft, catalogue).find((entry) => entry.id === slotId);
  if (slot === undefined) {
    return state;
  }
  const next = toggle(draft, slot, optionId);
  return next === draft ? state : commit(state, next, catalogue);
}

function goTo(state: WizardState, catalogue: Catalogue, screenId: string): WizardState {
  const flow = buildFlow(state.draft, catalogue);
  return flow.some((screen) => screen.id === screenId)
    ? { ...state, currentScreenId: screenId }
    : state;
}

function withDraft(state: WizardState, draft: CharacterDraft): WizardState {
  return { ...state, draft };
}

export function createWizardReducer(
  catalogue: Catalogue,
): (state: WizardState, action: WizardAction) => WizardState {
  return function wizardReducer(state: WizardState, action: WizardAction): WizardState {
    const { draft } = state;

    switch (action.type) {
      case 'SET_LEVEL': {
        const level = clampLevel(action.level);
        // `commit` purge : redescendre de niveau referme les paliers passés et
        // retire leurs réponses, sans laisser de bonus fantôme sur la fiche.
        return draft.level === level
          ? state
          : commit(state, { ...draft, level }, catalogue);
      }
      case 'SELECT_RACE': {
        return selectRace(state, catalogue, action.raceId);
      }
      case 'SELECT_SUBRACE': {
        return selectSubrace(state, catalogue, action.subraceId);
      }
      case 'SELECT_CLASS': {
        return draft.classId === action.classId
          ? state
          : commit(state, { ...draft, classId: action.classId }, catalogue);
      }
      case 'SELECT_BACKGROUND': {
        return draft.backgroundId === action.backgroundId
          ? state
          : commit(state, { ...draft, backgroundId: action.backgroundId }, catalogue);
      }
      case 'SELECT_ALIGNMENT': {
        return withDraft(state, { ...draft, alignmentId: action.alignmentId });
      }
      case 'SET_ABILITY_METHOD': {
        return setAbilityMethod(state, catalogue, action.method);
      }
      case 'ASSIGN_ABILITY': {
        return assignAbility(state, catalogue, action.ability, action.score);
      }
      case 'TOGGLE_CHOICE': {
        return toggleChoice(state, catalogue, action.slotId, action.optionId);
      }
      case 'SET_NAME': {
        return withDraft(state, { ...draft, name: action.name.slice(0, 60) });
      }
      case 'SET_PERSONAL_TRAIT': {
        return withDraft(state, {
          ...draft,
          personalTraits: {
            ...draft.personalTraits,
            [action.field]: action.text.slice(0, 300),
          },
        });
      }
      case 'GO_NEXT': {
        return move(state, catalogue, 1);
      }
      case 'GO_BACK': {
        return move(state, catalogue, -1);
      }
      case 'GO_TO': {
        return goTo(state, catalogue, action.screenId);
      }
      case 'DISMISS_NOTICE': {
        return {
          ...state,
          notices: state.notices.filter((notice) => notice.id !== action.noticeId),
        };
      }
      case 'REPLACE_DRAFT': {
        return commit(initialState(action.draft), action.draft, catalogue);
      }
      case 'RESET': {
        return { ...initialState(), storage: state.storage };
      }
      case 'SET_STORAGE_STATUS': {
        return { ...state, storage: action.status };
      }
    }
  };
}
