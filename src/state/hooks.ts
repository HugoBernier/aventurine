import { use, useCallback, useMemo } from 'react';
import { MAX_LEVEL, MIN_LEVEL } from '../domain/progression';
import type { Dispatch } from 'react';
import { abilityRows } from '../domain/abilityRows';
import type { AbilityRow } from '../domain/abilityRows';
import type { AbilityId } from '../domain/abilities';
import { findClass, findRace, findSpell } from '../domain/catalogue';
import type { Catalogue } from '../domain/catalogue';
import type { ChoiceSlot, ChoiceSlotId } from '../domain/choice';
import type {
  AbilityMethod,
  HitPointMethod,
  CharacterDraft,
  PersonalTraits,
} from '../domain/draft';
import { pickedFor } from '../domain/draft';
import { draftIssues } from '../domain/issues';
import type { Issue } from '../domain/issues';
import { listMissingChoices } from '../domain/completeness';
import type { MissingChoice } from '../domain/completeness';
import { openChoices } from '../domain/openChoices';
import { pointsRemaining } from '../domain/pointBuy';
import { buildSheet } from '../domain/sheet';
import type { CharacterSheet, SpellcastingSheet } from '../domain/sheet';
import type { Spell } from '../domain/content';
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

/** `null` quand l'écran courant n'est pas un créneau : un hook ne se conditionne pas. */
export function useChoiceSlot(slotId: ChoiceSlotId | null): ChoiceSlotView | null {
  const { state, catalogue } = useWizardContext();
  const dispatch = useWizardDispatch();
  const slot = useMemo(
    () =>
      openChoices(state.draft, catalogue).find((entry) => entry.id === slotId) ?? null,
    [state.draft, catalogue, slotId],
  );
  const toggle = useCallback(
    (optionId: string) => {
      if (slotId !== null) {
        dispatch({ type: 'TOGGLE_CHOICE', slotId, optionId });
      }
    },
    [dispatch, slotId],
  );

  if (slot === null || slotId === null) {
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

export interface LevelView {
  readonly level: number;
  readonly canDecrease: boolean;
  readonly canIncrease: boolean;
  readonly setLevel: (level: number) => void;
  readonly hitPointMethod: HitPointMethod;
  readonly hitPointRolls: Readonly<Record<string, number>>;
  readonly setHitPointMethod: (method: HitPointMethod) => void;
  readonly setHitPointRoll: (level: number, roll: number | null) => void;
}

export function useLevel(): LevelView {
  const { state } = useWizardContext();
  const dispatch = useWizardDispatch();
  const setLevel = useCallback(
    (level: number) => {
      dispatch({ type: 'SET_LEVEL', level });
    },
    [dispatch],
  );
  const setHitPointMethod = useCallback(
    (method: HitPointMethod) => {
      dispatch({ type: 'SET_HIT_POINT_METHOD', method });
    },
    [dispatch],
  );
  const setHitPointRoll = useCallback(
    (level: number, roll: number | null) => {
      dispatch({ type: 'SET_HIT_POINT_ROLL', level, roll });
    },
    [dispatch],
  );
  const { level } = state.draft;
  return {
    level,
    canDecrease: level > MIN_LEVEL,
    canIncrease: level < MAX_LEVEL,
    setLevel,
    hitPointMethod: state.draft.hitPointMethod,
    hitPointRolls: state.draft.hitPointRolls,
    setHitPointMethod,
    setHitPointRoll,
  };
}

export interface CharacterEntry {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly isCurrent: boolean;
}

export interface LibraryView {
  readonly characters: readonly CharacterEntry[];
  readonly create: () => void;
  readonly switchTo: (id: string) => void;
  readonly remove: (id: string) => void;
}

/** Le personnage courant en tête, puis les autres : l'ordre ne saute pas. */
export function useLibrary(): LibraryView {
  const { state, catalogue } = useWizardContext();
  const dispatch = useWizardDispatch();

  const describe = useCallback(
    (draft: CharacterDraft): string => {
      const race = findRace(catalogue, draft.raceId)?.name;
      const characterClass = findClass(catalogue, draft.classId)?.name;
      const parts = [race, characterClass].filter((part) => part !== undefined);
      const level = `niveau ${String(draft.level)}`;
      return parts.length === 0 ? level : `${parts.join(' ')} · ${level}`;
    },
    [catalogue],
  );

  const characters = useMemo(
    () => [
      {
        id: state.currentId,
        name: state.draft.name === '' ? 'Sans nom' : state.draft.name,
        summary: describe(state.draft),
        isCurrent: true,
      },
      ...state.others.map((entry) => ({
        id: entry.id,
        name: entry.draft.name === '' ? 'Sans nom' : entry.draft.name,
        summary: describe(entry.draft),
        isCurrent: false,
      })),
    ],
    [state.currentId, state.draft, state.others, describe],
  );

  return {
    characters,
    create: useCallback(() => {
      dispatch({ type: 'NEW_CHARACTER' });
    }, [dispatch]),
    switchTo: useCallback(
      (id: string) => {
        dispatch({ type: 'SWITCH_CHARACTER', id });
      },
      [dispatch],
    ),
    remove: useCallback(
      (id: string) => {
        dispatch({ type: 'DELETE_CHARACTER', id });
      },
      [dispatch],
    ),
  };
}

export interface SpellbookGroup {
  readonly level: number;
  readonly spells: readonly Spell[];
}

export interface SpellbookView {
  readonly casting: SpellcastingSheet | null;
  /** Les tours de magie, qui ne coûtent jamais d'emplacement. */
  readonly cantrips: readonly Spell[];
  /** Les sorts choisis, rangés par niveau : c'est ainsi qu'on les lance. */
  readonly groups: readonly SpellbookGroup[];
  /** Les sorts que le domaine ou le serment donne d'office. */
  readonly alwaysPrepared: readonly Spell[];
  /** Où retourner pour changer d'avis, `null` si l'écran n'existe pas. */
  readonly cantripScreenId: ScreenId | null;
  readonly spellScreenId: ScreenId | null;
}

/**
 * Le grimoire du personnage : ce qu'il sait lancer, et par où le changer.
 * Les identifiants du domaine sont résolus ici en sorts complets, parce que
 * l'interface a besoin du nom et de la portée, pas d'une clé.
 */
export function useSpellbook(): SpellbookView {
  const { state, catalogue } = useWizardContext();
  return useMemo(() => {
    const sheet = buildSheet(state.draft, catalogue);
    const casting = sheet.spellcasting;
    const flow = buildFlow(state.draft, catalogue);
    const slots = openChoices(state.draft, catalogue);
    const screenOf = (kind: string): ScreenId | null => {
      const slot = slots.find((entry) => entry.kind === kind);
      return slot === undefined ? null : screenForSlot(flow, slot.id);
    };
    const resolve = (ids: readonly string[]): readonly Spell[] =>
      ids.flatMap((id) => {
        const spell = findSpell(catalogue, id);
        return spell === null ? [] : [spell];
      });

    const spells = resolve(casting?.spellIds ?? []);
    const levels = [...new Set(spells.map((spell) => spell.level))].toSorted(
      (a, b) => a - b,
    );
    return {
      casting,
      cantrips: resolve(casting?.cantripIds ?? []),
      groups: levels.map((level) => ({
        level,
        spells: spells.filter((spell) => spell.level === level),
      })),
      alwaysPrepared: resolve(casting?.alwaysPreparedIds ?? []),
      cantripScreenId: screenOf('cantrip'),
      spellScreenId: screenOf('spell'),
    };
  }, [state.draft, catalogue]);
}
