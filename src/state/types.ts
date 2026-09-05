import type { AbilityId } from '../domain/abilities';
import type { ChoiceSlotId, ChoiceSource } from '../domain/choice';
import type { PersistedCharacter } from './persistence/DraftStorage';
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
      readonly lost: number;
    }
  | {
      readonly kind: 'options-withdrawn';
      readonly slotId: ChoiceSlotId;
      readonly optionIds: readonly string[];
    }
  | {
      readonly kind: 'too-many';
      readonly slotId: ChoiceSlotId;
      readonly optionIds: readonly string[];
    }
  | { readonly kind: 'abilities-reset'; readonly method: AbilityMethod };

export interface Notice {
  readonly id: string;
  readonly reason: NoticeReason;
}

export type StorageStatus = 'ok' | 'memory' | 'quota' | 'unavailable';

/**
 * Ce qu'on regarde : l'assistant, la fiche, ou la liste des personnages. La
 * fiche et la liste ne sont pas des étapes, mais un rechargement doit ramener
 * là où on était : elles font donc partie de l'état sauvegardé.
 */
export type WizardView = 'wizard' | 'summary' | 'library' | 'packs' | 'creator';

export interface WizardState {
  readonly draft: CharacterDraft;
  /** Un identifiant, jamais un indice : le parcours change de longueur. */
  readonly currentScreenId: ScreenId;
  readonly notices: readonly Notice[];
  readonly storage: StorageStatus;
  /** Le personnage sur lequel on travaille. */
  readonly currentId: string;
  /** Les AUTRES personnages rangés. Le courant vit dans `draft`. */
  readonly others: readonly PersistedCharacter[];
  readonly view: WizardView;
}

export type WizardAction =
  | { readonly type: 'NEW_CHARACTER' }
  | { readonly type: 'SWITCH_CHARACTER'; readonly id: string }
  | { readonly type: 'DELETE_CHARACTER'; readonly id: string }
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
  /** Le personnage importé s'AJOUTE : ouvrir un fichier ne perd jamais rien. */
  | { readonly type: 'IMPORT_CHARACTER'; readonly draft: CharacterDraft }
  | { readonly type: 'RESET' }
  | { readonly type: 'SET_VIEW'; readonly view: WizardView }
  | { readonly type: 'SET_STORAGE_STATUS'; readonly status: StorageStatus };
