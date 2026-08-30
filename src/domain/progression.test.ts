import { describe, expect, it } from 'vitest';
import {
  MAX_LEVEL,
  clampLevel,
  maxHitPoints,
  pactMagic,
  proficiencyBonus,
  spellSlots,
} from './progression';

describe('bonus de maîtrise', () => {
  it('vaut +2 du niveau 1 au niveau 4', () => {
    expect([1, 2, 3, 4].map((level) => proficiencyBonus(level))).toEqual([2, 2, 2, 2]);
  });

  it('monte d’un point tous les quatre niveaux', () => {
    expect([5, 9, 13, 17].map((level) => proficiencyBonus(level))).toEqual([3, 4, 5, 6]);
  });

  it('plafonne à +6 au niveau 20', () => {
    expect(proficiencyBonus(MAX_LEVEL)).toBe(6);
  });
});

describe('niveau', () => {
  it('ramène dans les bornes un niveau venu d’un fichier', () => {
    expect(clampLevel(0)).toBe(1);
    expect(clampLevel(99)).toBe(20);
    expect(clampLevel(3.5)).toBe(1);
  });
});

describe('points de vie', () => {
  it('donne le maximum du dé au niveau 1', () => {
    expect(maxHitPoints(1, 10, 0, 0)).toBe(10);
  });

  it('ajoute la Constitution dès le premier niveau', () => {
    expect(maxHitPoints(1, 8, 2, 0)).toBe(10);
  });

  it('ajoute la moyenne fixe du dé à chaque niveau suivant', () => {
    // d10 : 10 au niveau 1, puis 6 par niveau.
    expect(maxHitPoints(3, 10, 0, 0)).toBe(22);
  });

  it('compte la Constitution à chaque niveau, pas une seule fois', () => {
    // d8, Constitution +2 : (8 + 2) + 2 × (5 + 2) = 24.
    expect(maxHitPoints(3, 8, 2, 0)).toBe(24);
  });

  it('ajoute le point par niveau du nain des collines', () => {
    expect(maxHitPoints(4, 8, 0, 1)).toBe(8 + 1 + 3 * (5 + 1));
  });

  it('remplace la moyenne par le dé que le joueur a lancé', () => {
    // d10, Constitution +0 : 10 au niveau 1, puis le jet au lieu des 6 fixes.
    expect(maxHitPoints(3, 10, 0, 0, { 2: 9, 3: 2 })).toBe(10 + 9 + 2);
  });

  it('ne prend un jet en compte que pour les niveaux atteints', () => {
    expect(maxHitPoints(2, 10, 0, 0, { 2: 9, 3: 10 })).toBe(10 + 9);
  });

  it('retombe sur la moyenne fixe pour un niveau sans jet saisi', () => {
    expect(maxHitPoints(3, 10, 0, 0, { 2: 9 })).toBe(10 + 9 + 6);
  });

  it('ignore un jet impossible pour le dé de la classe', () => {
    // Un fichier importé peut annoncer 12 sur un d8 : on retombe sur la moyenne.
    expect(maxHitPoints(2, 8, 0, 0, { 2: 12 })).toBe(8 + 5);
    expect(maxHitPoints(2, 8, 0, 0, { 2: 0 })).toBe(8 + 5);
  });

  it('ajoute la Constitution au jet comme à la moyenne', () => {
    expect(maxHitPoints(2, 8, 2, 0, { 2: 7 })).toBe(8 + 2 + 7 + 2);
  });

  it('ne descend jamais sous un point de vie par niveau', () => {
    expect(maxHitPoints(5, 6, -5, 0)).toBe(5);
  });
});

describe('emplacements de sorts', () => {
  it('donne deux emplacements de niveau 1 à un lanceur complet débutant', () => {
    expect(spellSlots('full', 1)).toEqual([2]);
  });

  it('ouvre les sorts de niveau 3 au niveau 5', () => {
    expect(spellSlots('full', 5)).toEqual([4, 3, 2]);
  });

  it('donne au niveau 20 un emplacement de chaque niveau jusqu’au neuvième', () => {
    expect(spellSlots('full', 20)).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
  });

  it('ne donne aucun sort à un demi-lanceur de niveau 1', () => {
    expect(spellSlots('half', 1)).toEqual([]);
  });

  it('commence les demi-lanceurs au niveau 2', () => {
    expect(spellSlots('half', 2)).toEqual([2]);
  });

  it('mène un demi-lanceur au cinquième niveau de sort, pas au-delà', () => {
    expect(spellSlots('half', 20)).toEqual([4, 3, 3, 3, 2]);
  });
});

describe('magie de pacte', () => {
  it('donne un seul emplacement de niveau 1 à l’occultiste débutant', () => {
    expect(pactMagic(1)).toEqual({ slots: 1, slotLevel: 1 });
  });

  it('monte le niveau des emplacements tous les deux niveaux jusqu’au cinquième', () => {
    expect(pactMagic(9)).toEqual({ slots: 2, slotLevel: 5 });
  });

  it('donne quatre emplacements de niveau 5 au niveau 20', () => {
    expect(pactMagic(20)).toEqual({ slots: 4, slotLevel: 5 });
  });
});
