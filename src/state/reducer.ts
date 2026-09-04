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
import type { PersistedCharacter } from './persistence/DraftStorage';
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
import type { Notice, NoticeReason, ScreenId, WizardAction, WizardState } from './types';

/** Les avis les plus anciens disparaissent : on n'empile pas les bandeaux. */
const MAX_NOTICES = 3;

/**
 * Identifiant local, jamais partagé ni deviné. L'horodatage à la milliseconde
 * suffit : deux personnages ne naissent pas dans la même milliseconde, et le
 * suffixe aléatoire d'un générateur cryptographique serait ici du décorum.
 */
/**
 * L'horodatage seul suffisait tant qu'on créait un personnage à la fois. Un
 * nouveau puis un importé dans la même milliseconde recevaient le même
 * identifiant, et la bibliothèque n'en voyait plus qu'un.
 *
 * Le suffixe aléatoire lève la collision. `getRandomValues` et non
 * `randomUUID` : seul le second exige un contexte sécurisé, et un téléphone qui
 * vise un serveur de développement en http n'en a pas.
 */
export function newCharacterId(): string {
  const [random] = globalThis.crypto.getRandomValues(new Uint32Array(1));
  return `perso-${String(Date.now())}-${(random ?? 0).toString(36)}`;
}

export function initialState(
  draft: CharacterDraft = emptyDraft(),
  id: string = newCharacterId(),
): WizardState {
  return {
    draft,
    currentScreenId: 'race',
    notices: [],
    storage: 'ok',
    currentId: id,
    others: [],
    view: 'wizard',
  };
}

/** Le personnage courant, sous la forme qu'on range dans la bibliothèque. */
function packed(state: WizardState): PersistedCharacter {
  return {
    id: state.currentId,
    draft: state.draft,
    currentScreenId: state.currentScreenId,
  };
}

function noticeFor(removed: RemovedChoice): NoticeReason {
  const parsed = removed.reason === 'slot-closed' ? parseSlotId(removed.slotId) : null;
  if (parsed !== null) {
    return {
      kind: 'slot-closed',
      source: parsed.source,
      lost: removed.optionIds.length,
    };
  }
  if (removed.reason === 'too-many') {
    return {
      kind: 'too-many',
      slotId: removed.slotId,
      optionIds: removed.optionIds,
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
  const kinds = new Set(added.map((notice) => notice.reason.kind));
  const kept = existing.filter((notice) => !kinds.has(notice.reason.kind));
  return [...kept, ...added].slice(-MAX_NOTICES);
}

/**
 * Un avis explique ce que l'action qu'on vient de faire a retiré. Il n'a de
 * sens que sur l'écran où on l'a déclenchée : ailleurs il commente une action
 * qu'on ne voit plus, et il restait affiché jusqu'à ce qu'on le ferme.
 *
 * Seul le déplacement DÉLIBÉRÉ efface. Quand c'est la cascade qui a fait
 * disparaître l'écran sous les pieds du joueur, l'avis est la seule
 * explication du saut : `commit` le pose après coup.
 */
function movedTo(state: WizardState, screenId: ScreenId): WizardState {
  // Aller à un écran, c'est revenir à l'assistant : les raccourcis de la fiche
  // sautent vers un choix, et refermer la fiche n'a pas à être demandé à part.
  return { ...state, currentScreenId: screenId, notices: [], view: 'wizard' };
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
    ...state,
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
  return target === undefined ? state : movedTo(state, target.id);
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

/** Un jet effacé retire sa clé : « pas de jet » et « jet de 0 » ne sont pas la même chose. */
function withRoll(
  rolls: Readonly<Record<string, number>>,
  level: number,
  roll: number | null,
): Readonly<Record<string, number>> {
  const rest = Object.fromEntries(
    Object.entries(rolls).filter(([at]) => at !== String(level)),
  );
  return roll === null ? rest : { ...rest, [String(level)]: roll };
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
  return flow.some((screen) => screen.id === screenId) ? movedTo(state, screenId) : state;
}

function withDraft(state: WizardState, draft: CharacterDraft): WizardState {
  return { ...state, draft };
}

/**
 * Reprendre un autre personnage : le courant rejoint la bibliothèque et on
 * repart où il en était. Toucher celui sur lequel on travaille déjà ne change
 * rien d'autre que la vue : c'est la façon de refermer la liste.
 */
function switchedTo(state: WizardState, id: string): WizardState {
  if (id === state.currentId) {
    return { ...state, view: 'wizard' };
  }
  const target = state.others.find((entry) => entry.id === id);
  if (target === undefined) {
    return state;
  }
  return {
    ...initialState(target.draft, target.id),
    currentScreenId: target.currentScreenId,
    storage: state.storage,
    others: [...state.others.filter((entry) => entry.id !== id), packed(state)],
  };
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
      case 'NEW_CHARACTER': {
        // Le personnage courant rejoint la bibliothèque : « recommencer » ne
        // doit jamais vouloir dire « perdre ce que j'avais ».
        return {
          ...initialState(),
          storage: state.storage,
          others: [...state.others, packed(state)],
        };
      }
      case 'SWITCH_CHARACTER': {
        return switchedTo(state, action.id);
      }
      case 'DELETE_CHARACTER': {
        if (action.id !== state.currentId) {
          return {
            ...state,
            others: state.others.filter((entry) => entry.id !== action.id),
          };
        }
        // On supprime celui qu'on regarde : un autre prend sa place, ou on
        // repart d'une feuille blanche s'il était le dernier.
        const [next, ...rest] = state.others;
        if (next === undefined) {
          return { ...initialState(), storage: state.storage };
        }
        return {
          ...initialState(next.draft, next.id),
          currentScreenId: next.currentScreenId,
          storage: state.storage,
          others: rest,
        };
      }
      case 'SET_HIT_POINT_METHOD': {
        return draft.hitPointMethod === action.method
          ? state
          : withDraft(state, { ...draft, hitPointMethod: action.method });
      }
      case 'SET_HIT_POINT_ROLL': {
        return withDraft(state, {
          ...draft,
          hitPointRolls: withRoll(draft.hitPointRolls, action.level, action.roll),
        });
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
      case 'IMPORT_CHARACTER': {
        // Le personnage courant rejoint la bibliothèque, comme pour un nouveau :
        // ouvrir un fichier ne doit jamais coûter ce qu'on avait en cours.
        const imported = commit(initialState(action.draft), action.draft, catalogue);
        return {
          ...imported,
          storage: state.storage,
          others: [...state.others, packed(state)],
          // On reste où l'on est : le personnage ouvert apparaît dans la liste,
          // et l'on peut enchaîner les fichiers d'une sauvegarde sans revenir.
          view: state.view,
        };
      }
      case 'RESET': {
        return { ...initialState(), storage: state.storage };
      }
      case 'SET_VIEW': {
        return { ...state, view: action.view };
      }
      case 'SET_STORAGE_STATUS': {
        return { ...state, storage: action.status };
      }
    }
  };
}
