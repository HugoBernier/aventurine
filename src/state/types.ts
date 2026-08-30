import type { AbilityId } from '../domain/abilities';
import type { ChoiceSlotId, ChoiceSource } from '../domain/choice';
import type {
  AbilityMethod,
  HitPointMethod,
  CharacterDraft,
  PersonalTraits,
} from '../domain/draft';

export type StepId =
  | 'race'
  | 'class'
  | 'abilities'
  | 'advancement'
  | 'background'
  | 'proficiencies'
  | 'spells'
  | 'equipment'
  | 'identity';

export type AnchorId =
  | 'race'
  | 'subrace'
  | 'class'
  | 'level'
  | 'ability-method'
  | 'ability-assign'
  | 'background'
  | 'name'
  | 'alignment'
  | 'personality'
  | 'summary';

export type ScreenId = string;

/**
 * Un écran = une décision. Un écran d'ancrage est codé en dur ; un écran de
 * créneau est engendré par `openChoices`, donc ajouter une race n'ajoute
 * aucun code de navigation.
 */
export type Screen =
  | {
      readonly id: ScreenId;
      readonly step: StepId;
      readonly kind: 'anchor';
      readonly anchor: AnchorId;
    }
  | {
      readonly id: ScreenId;
      readonly step: StepId;
      readonly kind: 'choice';
      readonly slotId: ChoiceSlotId;
    };

/** Ce qu'une cascade vient de retirer. Structuré : `ui/format/` le rédige. */
export type NoticeReason =
  | {
      readonly kind: 'slot-closed';
      readonly source: ChoiceSource;
      readonly parentId: string;
      readonly lost: number;
    }
  | {
      readonly kind: 'options-withdrawn';
      readonly slotId: ChoiceSlotId;
      readonly optionIds: readonly string[];
    }
  | { readonly kind: 'abilities-reset'; readonly method: AbilityMethod };

export interface Notice {
  readonly id: string;
  readonly reason: NoticeReason;
}

export type StorageStatus = 'ok' | 'memory' | 'quota' | 'unavailable';

export interface WizardState {
  readonly draft: CharacterDraft;
  /** Un identifiant, jamais un indice : le parcours change de longueur. */
  readonly currentScreenId: ScreenId;
  readonly notices: readonly Notice[];
  readonly storage: StorageStatus;
}

export type WizardAction =
  | { readonly type: 'SET_LEVEL'; readonly level: number }
  | { readonly type: 'SET_HIT_POINT_METHOD'; readonly method: HitPointMethod }
  | {
      readonly type: 'SET_HIT_POINT_ROLL';
      readonly level: number;
      readonly roll: number | null;
    }
  | { readonly type: 'SELECT_RACE'; readonly raceId: string }
  | { readonly type: 'SELECT_SUBRACE'; readonly subraceId: string }
  | { readonly type: 'SELECT_CLASS'; readonly classId: string }
  | { readonly type: 'SELECT_BACKGROUND'; readonly backgroundId: string }
  | { readonly type: 'SELECT_ALIGNMENT'; readonly alignmentId: string }
  | { readonly type: 'SET_ABILITY_METHOD'; readonly method: AbilityMethod }
  | {
      readonly type: 'ASSIGN_ABILITY';
      readonly ability: AbilityId;
      readonly score: number | null;
    }
  | {
      readonly type: 'TOGGLE_CHOICE';
      readonly slotId: ChoiceSlotId;
      readonly optionId: string;
    }
  | { readonly type: 'SET_NAME'; readonly name: string }
  | {
      readonly type: 'SET_PERSONAL_TRAIT';
      readonly field: keyof PersonalTraits;
      readonly text: string;
    }
  | { readonly type: 'GO_NEXT' }
  | { readonly type: 'GO_BACK' }
  | { readonly type: 'GO_TO'; readonly screenId: ScreenId }
  | { readonly type: 'DISMISS_NOTICE'; readonly noticeId: string }
  | { readonly type: 'REPLACE_DRAFT'; readonly draft: CharacterDraft }
  | { readonly type: 'RESET' }
  | { readonly type: 'SET_STORAGE_STATUS'; readonly status: StorageStatus };
