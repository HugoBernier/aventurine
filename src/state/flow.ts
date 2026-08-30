import { findRace } from '../domain/catalogue';
import type { Catalogue } from '../domain/catalogue';
import type { ChoiceKind, ChoiceSlot } from '../domain/choice';
import { isDeferredKind } from '../domain/choiceSpec';
import type { CharacterDraft } from '../domain/draft';
import { openChoices } from '../domain/openChoices';
import type { AnchorId, Screen, ScreenId, StepId } from './types';

/** Les huit chapitres, dans l'ordre des dépendances (§A9). */
export const STEPS: readonly StepId[] = [
  'race',
  'class',
  'abilities',
  'advancement',
  'background',
  'proficiencies',
  'spells',
  'equipment',
  'identity',
];

const anchor = (step: StepId, id: AnchorId): Screen => ({
  id,
  step,
  kind: 'anchor',
  anchor: id,
});

const choiceScreen = (step: StepId, slot: ChoiceSlot): Screen => ({
  id: `choice:${slot.id}`,
  step,
  kind: 'choice',
  slotId: slot.id,
});

const SPELL_KINDS = new Set<ChoiceKind>(['cantrip', 'spell']);

/** Ce qu'on gagne en montant de niveau, dans son propre chapitre. */
const ADVANCEMENT_KINDS = new Set<ChoiceKind>(['advancement', 'improvement', 'feat']);

function stepFor(slot: ChoiceSlot): StepId | null {
  if (isDeferredKind(slot.kind)) {
    return 'proficiencies';
  }
  if (SPELL_KINDS.has(slot.kind)) {
    return 'spells';
  }
  if (slot.kind === 'equipment') {
    return 'equipment';
  }
  // Placer un +2 se fait en VOYANT ses six scores : le créneau rejoint donc
  // l'étape des caractéristiques, jamais celle de la race qui l'a ouvert.
  if (slot.kind === 'ability') {
    return 'abilities';
  }
  // Ce qu'on gagne en montant de niveau : sa propre étape, parce qu'un
  // guerrier de niveau 20 y passe sept écrans.
  if (ADVANCEMENT_KINDS.has(slot.kind)) {
    return 'advancement';
  }
  return slot.source === 'background' ? 'background' : slot.source;
}

/**
 * Le parcours n'est jamais stocké : il se recalcule depuis le brouillon.
 *
 * Un écran de créneau naît d'`openChoices`, donc ajouter une race à sous-races
 * n'ajoute aucun code ici, seulement une entrée de données. Une étape sans
 * écran (les sorts d'un roublard) disparaît du parcours au lieu d'apparaître
 * grisée.
 */
export function buildFlow(
  draft: CharacterDraft,
  catalogue: Catalogue,
): readonly Screen[] {
  const slots = openChoices(draft, catalogue);
  const inStep = (step: StepId): readonly Screen[] =>
    slots
      .filter((slot) => stepFor(slot) === step)
      .map((slot) => choiceScreen(step, slot));

  const race = findRace(catalogue, draft.raceId);
  const screens: Screen[] = [
    anchor('race', 'race'),
    ...(race !== null && race.subraces.length > 0 ? [anchor('race', 'subrace')] : []),
    ...inStep('race'),

    anchor('class', 'class'),
    // Le niveau se choisit juste après la classe : il décide des points de vie,
    // du bonus de maîtrise, des emplacements de sorts et des paliers ouverts.
    anchor('class', 'level'),
    ...inStep('class'),

    anchor('abilities', 'ability-method'),
    anchor('abilities', 'ability-assign'),
    ...inStep('abilities'),

    ...inStep('advancement'),

    anchor('background', 'background'),
    ...inStep('background'),

    ...inStep('proficiencies'),
    ...inStep('spells'),
    ...inStep('equipment'),

    anchor('identity', 'name'),
    anchor('identity', 'alignment'),
    anchor('identity', 'personality'),
  ];
  return screens;
}

export function findScreen(flow: readonly Screen[], screenId: ScreenId): Screen | null {
  return flow.find((screen) => screen.id === screenId) ?? null;
}

export interface Progress {
  readonly step: StepId;
  readonly stepIndex: number;
  readonly stepCount: number;
  readonly screenIndex: number;
  readonly screenCount: number;
}

export function progressOf(flow: readonly Screen[], screenId: ScreenId): Progress | null {
  const screenIndex = flow.findIndex((screen) => screen.id === screenId);
  const screen = flow[screenIndex];
  if (screen === undefined) {
    return null;
  }
  return {
    step: screen.step,
    // Le dénominateur compte les huit chapitres, PAS ceux que le brouillon a
    // déjà ouverts. Compter les étapes applicables le faisait grandir à chaque
    // choix, « étape 1 sur 5 », puis « sur 6 », puis « sur 7 », donc avancer
    // donnait l'impression de reculer. Un roublard saute le numéro des sorts :
    // un chapitre passé se voit, un but qui recule se subit.
    stepIndex: STEPS.indexOf(screen.step) + 1,
    stepCount: STEPS.length,
    screenIndex: screenIndex + 1,
    screenCount: flow.length,
  };
}

/** L'écran où réparer une anomalie : le domaine ne connaît pas les écrans. */
export function screenForSlot(flow: readonly Screen[], slotId: string): ScreenId | null {
  return (
    flow.find((screen) => screen.kind === 'choice' && screen.slotId === slotId)?.id ??
    null
  );
}

const FIELD_SCREENS: Readonly<Record<string, AnchorId>> = {
  raceId: 'race',
  subraceId: 'subrace',
  classId: 'class',
  baseAbilities: 'ability-assign',
  backgroundId: 'background',
  name: 'name',
  alignmentId: 'alignment',
  personalTraits: 'personality',
};

export function screenForField(field: string): ScreenId | null {
  return FIELD_SCREENS[field] ?? null;
}
