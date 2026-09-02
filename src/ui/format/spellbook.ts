import type { SpellcastingSheet } from '../../domain/sheet';

const ABILITY_NAMES: Record<string, string> = {
  force: 'Force',
  dexterite: 'Dextérité',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  sagesse: 'Sagesse',
  charisme: 'Charisme',
};

const PREPARATION: Record<string, string> = {
  known: 'Tu connais tes sorts par cœur : ils ne changent qu’en montant de niveau.',
  prepared: 'Tu prépares tes sorts chaque matin : la liste change à chaque repos long.',
  spellbook: 'Ton grimoire garde tout ; tu en prépares une partie chaque matin.',
};

export function formatCastingAbility(casting: SpellcastingSheet): string {
  return ABILITY_NAMES[casting.ability] ?? casting.ability;
}

export function formatPreparation(casting: SpellcastingSheet): string {
  return PREPARATION[casting.preparation] ?? '';
}

/** « niveau 1 : 4 · niveau 2 : 3 ». Les niveaux sans emplacement se taisent. */
export function formatSlots(casting: SpellcastingSheet): string | null {
  if (casting.pact !== null) {
    const { slots: count, slotLevel } = casting.pact;
    return `${String(count)} emplacement${count > 1 ? 's' : ''} de niveau ${String(slotLevel)}, rendu${count > 1 ? 's' : ''} par un repos court`;
  }
  const parts = casting.slots
    .map((count, index) => ({ count, level: index + 1 }))
    .filter((entry) => entry.count > 0)
    .map((entry) => `niv. ${String(entry.level)} : ${String(entry.count)}`);
  return parts.length === 0 ? null : parts.join(' · ');
}

/** Les niveaux où le personnage a des emplacements, le pacte compris. */
export function slotLevels(casting: SpellcastingSheet): readonly number[] {
  if (casting.pact !== null) {
    return [casting.pact.slotLevel];
  }
  return casting.slots.flatMap((count, index) => (count > 0 ? [index + 1] : []));
}

/** Combien de cases à cocher à ce niveau : un emplacement, une case. */
export function slotsAtLevel(casting: SpellcastingSheet, level: number): number {
  if (casting.pact !== null) {
    return casting.pact.slotLevel === level ? casting.pact.slots : 0;
  }
  return casting.slots[level - 1] ?? 0;
}

/**
 * Ce qu'on lit sous un niveau sans sort. Un clerc ne choisit rien à l'avance :
 * la place vide est faite pour être remplie au crayon le matin venu.
 */
export function formatEmptyLevel(casting: SpellcastingSheet): string {
  return casting.preparation === 'prepared'
    ? 'À remplir au crayon, chaque matin.'
    : 'Rien à ce niveau pour l’instant.';
}

/** Le cas ordinaire : l'annoncer sur chaque sort n'apprendrait rien. */
const PLAIN_ACTION = '1 action';

/** Les repères d'un sort, dans l'ordre où on les cherche en jouant. */
export function spellFacts(spell: {
  readonly castingTime: string;
  readonly range: string;
  readonly duration: string;
  readonly concentration: boolean;
  readonly ritual: boolean;
}): string {
  const marks = [spell.range, spell.duration];
  // Lancer un sort en action bonus ou en réaction change un tour de jeu : ça se
  // lit sur la fiche, pas seulement à l'écran de choix.
  if (spell.castingTime !== PLAIN_ACTION) {
    marks.unshift(spell.castingTime);
  }
  if (spell.concentration) {
    marks.push('concentration');
  }
  if (spell.ritual) {
    marks.push('rituel');
  }
  return marks.join(' · ');
}
