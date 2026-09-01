import type { CharacterSheet } from '../../domain/sheet';
import { formatResistances } from './damageTypes';
import { formatMeters } from './meters';

/**
 * La ligne « ce que ça change », affichée en permanence sous l'assistant. Elle
 * ne dit que ce qui est déjà calculable : un brouillon incomplet n'invente pas
 * de zéro. L'ordre va du plus lu au moins lu, parce que sur 360 px la fin de la
 * ligne passe à la ligne suivante.
 */
export function formatSheetSummary(sheet: CharacterSheet): string | null {
  const parts: string[] = [];
  if (sheet.maxHitPoints !== null) {
    parts.push(`${String(sheet.maxHitPoints)} points de vie`);
  }
  if (sheet.armorClass !== null) {
    parts.push(`défense ${String(sheet.armorClass.total)}`);
  }
  if (sheet.speedMeters !== null) {
    parts.push(`${formatMeters(sheet.speedMeters)} m`);
  }
  // Moyenne est le cas de presque tout le monde et n'a aucune conséquence :
  // seule la petite taille change quelque chose, donc seule elle se dit.
  if (sheet.size === 'P') {
    parts.push('petite taille');
  }
  if (sheet.darkvisionMeters !== null && sheet.darkvisionMeters > 0) {
    parts.push(`vision ${formatMeters(sheet.darkvisionMeters)} m`);
  }
  const resistances = formatResistances(sheet.resistances);
  if (resistances !== null) {
    parts.push(resistances);
  }
  return parts.length === 0 ? null : parts.join(' · ');
}
