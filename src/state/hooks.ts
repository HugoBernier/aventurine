import { use, useCallback, useMemo } from 'react';
import type { Dispatch } from 'react';
import { abilityRows } from '../domain/abilityRows';
import type { AbilityRow } from '../domain/abilityRows';
import type { AbilityId } from '../domain/abilities';
import type { Catalogue } from '../domain/catalogue';
import type { ChoiceSlot, ChoiceSlotId } from '../domain/choice';
import type { AbilityMethod, CharacterDraft, PersonalTraits } from '../domain/draft';
import { pickedFor } from '../domain/draft';
import { draftIssues } from '../domain/issues';
import type { Issue } from '../domain/issues';
import { listMissingChoices } from '../domain/completeness';
import type { MissingChoice } from '../domain/completeness';
import { openChoices } from '../domain/openChoices';
import { pointsRemaining } from '../domain/pointBuy';
import { buildSheet } from '../domain/sheet';
import type { CharacterSheet } from '../domain/sheet';
import { WizardDispatchContext, WizardStateContext } from './WizardProvider';
import type { WizardContextValue } from './WizardProvider';
import { buildFlow, progressOf, screenForField, screenForSlot } from './flow';
import type { Progress } from './flow';
import type { Notice, Screen, ScreenId, StorageStatus, WizardAction } from './types';

function useWizardContext(): WizardContextValue {
  const value = use(WizardStateContext);
  if (value === null) {
    throw new Error(
      'Les composants de l’assistant doivent être rendus dans WizardProvider.',
    );
  }
  return value;
}

export function useWizardDispatch(): Dispatch<WizardAction> {
  const dispatch = use(WizardDispatchContext);
  if (dispatch === null) {
    throw new Error(
      'Les composants de l’assistant doivent être rendus dans WizardProvider.',
    );
  }
  return dispatch;
}

export function useDraft(): CharacterDraft {
  return useWizardContext().state.draft;
}

export function useCatalogue(): Catalogue {
  return useWizardContext().catalogue;
}

export interface WizardNavigation {
  readonly screen: Screen;
  readonly flow: readonly Screen[];
  readonly progress: Progress | null;
  readonly canGoBack: boolean;
  readonly canGoNext: boolean;
  readonly goNext: () => void;
  readonly goBack: () => void;
  readonly goTo: (screenId: ScreenId) => void;
}

export function useWizard(): WizardNavigation {
  const { state, catalogue } = useWizardContext();
  const dispatch = useWizardDispatch();
  const flow = useMemo(() => buildFlow(state.draft, catalogue), [state.draft, catalogue]);
  const index = flow.findIndex((screen) => screen.id === state.currentScreenId);
  const screen = flow[index] ?? flow[0];

  const goNext = useCallback(() => {
    dispatch({ type: 'GO_NEXT' });
  }, [dispatch]);
  const goBack = useCallback(() => {
    dispatch({ type: 'GO_BACK' });
  }, [dispatch]);
  const goTo = useCallback(
    (screenId: ScreenId) => {
      dispatch({ type: 'GO_TO', screenId });
    },
    [dispatch],
  );

  if (screen === undefined) {
    throw new Error('Le parcours de l’assistant ne peut pas être vide.');
  }

  return {
    screen,
    flow,
    progress: progressOf(flow, screen.id),
    canGoBack: index > 0,
    canGoNext: index !== -1 && index < flow.length - 1,
    goNext,
    goBack,
    goTo,
  };
}

export interface ChoiceSlotView {
  readonly slot: ChoiceSlot;
  readonly picked: readonly string[];
  readonly remaining: number;
  readonly toggle: (optionId: string) => void;
}

export function useChoiceSlot(slotId: ChoiceSlotId): ChoiceSlotView | null {
  const { state, catalogue } = useWizardContext();
  const dispatch = useWizardDispatch();
  const slot = useMemo(
    () =>
      openChoices(state.draft, catalogue).find((entry) => entry.id === slotId) ?? null,
    [state.draft, catalogue, slotId],
  );
  const toggle = useCallback(
    (optionId: string) => {
      dispatch({ type: 'TOGGLE_CHOICE', slotId, optionId });
    },
    [dispatch, slotId],
  );

  if (slot === null) {
    return null;
  }
  const picked = pickedFor(state.draft, slotId);
  return { slot, picked, remaining: slot.pick - picked.length, toggle };
}

export interface AbilitiesView {
  readonly method: AbilityMethod;
  readonly rows: readonly AbilityRow[];
  readonly pointsLeft: number | null;
  readonly setMethod: (method: AbilityMethod) => void;
  readonly assign: (ability: AbilityId, score: number) => void;
}

export function useAbilities(): AbilitiesView {
  const { state, catalogue } = useWizardContext();
  const dispatch = useWizardDispatch();
  const rows = useMemo(
    () => abilityRows(state.draft, catalogue),
    [state.draft, catalogue],
  );
  const setMethod = useCallback(
    (method: AbilityMethod) => {
      dispatch({ type: 'SET_ABILITY_METHOD', method });
    },
    [dispatch],
  );
  const assign = useCallback(
    (ability: AbilityId, score: number) => {
      dispatch({ type: 'ASSIGN_ABILITY', ability, score });
    },
    [dispatch],
  );

  return {
    method: state.draft.abilityMethod,
    rows,
    pointsLeft:
      state.draft.abilityMethod === 'point-buy'
        ? pointsRemaining(state.draft.baseAbilities)
        : null,
    setMethod,
    assign,
  };
}

export function useCharacterSheet(): CharacterSheet {
  const { state, catalogue } = useWizardContext();
  return useMemo(() => buildSheet(state.draft, catalogue), [state.draft, catalogue]);
}

export interface LocatedIssue extends Issue {
  readonly screenId: ScreenId | null;
}

export function useIssues(): readonly LocatedIssue[] {
  const { state, catalogue } = useWizardContext();
  return useMemo(() => {
    const flow = buildFlow(state.draft, catalogue);
    return draftIssues(state.draft, catalogue).map((issue) => ({
      ...issue,
      screenId:
        issue.target.kind === 'slot'
          ? screenForSlot(flow, issue.target.slotId)
          : screenForField(issue.target.field),
    }));
  }, [state.draft, catalogue]);
}

export function useScreenIssues(screenId: ScreenId): readonly LocatedIssue[] {
  const issues = useIssues();
  return useMemo(
    () => issues.filter((issue) => issue.screenId === screenId),
    [issues, screenId],
  );
}

export interface LocatedMissing extends MissingChoice {
  readonly screenId: ScreenId | null;
}

export function useMissingChoices(): readonly LocatedMissing[] {
  const { state, catalogue } = useWizardContext();
  return useMemo(() => {
    const flow = buildFlow(state.draft, catalogue);
    return listMissingChoices(state.draft, catalogue).map((missing) => ({
      ...missing,
      screenId:
        missing.target.kind === 'slot'
          ? screenForSlot(flow, missing.target.slotId)
          : screenForField(missing.target.field),
    }));
  }, [state.draft, catalogue]);
}

export interface NoticesView {
  readonly notices: readonly Notice[];
  readonly dismiss: (noticeId: string) => void;
}

export function useNotices(): NoticesView {
  const { state } = useWizardContext();
  const dispatch = useWizardDispatch();
  const dismiss = useCallback(
    (noticeId: string) => {
      dispatch({ type: 'DISMISS_NOTICE', noticeId });
    },
    [dispatch],
  );
  return { notices: state.notices, dismiss };
}

export function useStorageStatus(): StorageStatus {
  return useWizardContext().state.storage;
}

export interface DraftTextField {
  readonly initial: string;
  readonly commit: (text: string) => void;
}

/**
 * Le champ garde sa frappe en local et ne remonte qu'au `blur` : une touche ne
 * déclenche donc ni purge, ni validation, ni sauvegarde. C'est la seule
 * optimisation réellement nécessaire de tout le lot.
 */
export function useDraftText(field: 'name' | keyof PersonalTraits): DraftTextField {
  const { state } = useWizardContext();
  const dispatch = useWizardDispatch();
  const commit = useCallback(
    (text: string) => {
      if (field === 'name') {
        dispatch({ type: 'SET_NAME', name: text });
      } else {
        dispatch({ type: 'SET_PERSONAL_TRAIT', field, text });
      }
    },
    [dispatch, field],
  );
  return {
    initial: field === 'name' ? state.draft.name : state.draft.personalTraits[field],
    commit,
  };
}
