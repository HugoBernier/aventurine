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
    return `${String(count)} emplacement${count > 1 ? 's' : ''} de niveau ${String(slotLevel)}, rendus par un repos court`;
  }
  const parts = casting.slots
    .map((count, index) => ({ count, level: index + 1 }))
    .filter((entry) => entry.count > 0)
    .map((entry) => `niv. ${String(entry.level)} : ${String(entry.count)}`);
  return parts.length === 0 ? null : parts.join(' · ');
}

/** Les repères d'un sort, dans l'ordre où on les cherche en jouant. */
export function spellFacts(spell: {
  readonly range: string;
  readonly duration: string;
  readonly concentration: boolean;
  readonly ritual: boolean;
}): string {
  const marks = [spell.range, spell.duration];
  if (spell.concentration) {
    marks.push('concentration');
  }
  if (spell.ritual) {
    marks.push('rituel');
  }
  return marks.join(' · ');
}
