import { describe, expect, it } from 'vitest';
import { isWellFormedSlotId, slotId } from './choice';

describe('identifiant de créneau', () => {
  it('compose source, parent et sujet', () => {
    expect(slotId('class', 'roublard', 'skills')).toBe('class:roublard:skills');
  });

  it('porte le parent choisi par le joueur, pas la sous-classe', () => {
    expect(slotId('class', 'ensorceleur', 'ancestry')).toBe('class:ensorceleur:ancestry');
  });

  it('accepte un identifiant bien formé', () => {
    expect(isWellFormedSlotId('race:haut-elfe:cantrip')).toBe(true);
    expect(isWellFormedSlotId('background:acolyte:languages')).toBe(true);
  });

  it('refuse une source inconnue', () => {
    expect(isWellFormedSlotId('feat:guerrier:skills')).toBe(false);
  });

  it('refuse un identifiant accentué ou en majuscules', () => {
    expect(isWellFormedSlotId('race:Haut-Elfe:cantrip')).toBe(false);
    expect(isWellFormedSlotId('class:éclaireur:skills')).toBe(false);
  });

  it('refuse un identifiant auquel il manque une partie', () => {
    expect(isWellFormedSlotId('class:roublard')).toBe(false);
  });
});
