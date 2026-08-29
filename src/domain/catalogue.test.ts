import { describe, expect, it } from 'vitest';
import {
  findAbility,
  findAlignment,
  findArmor,
  findBackground,
  findClass,
  findItem,
  findLanguage,
  findRace,
  findSkill,
  findSpell,
  findSubrace,
  findTool,
  findWeapon,
  spellsForClass,
} from './catalogue';
import { MINI_CATALOGUE as C } from './fixtures/miniCatalogue';

describe('accès au catalogue', () => {
  it('retrouve une entrée par son identifiant', () => {
    expect(findRace(C, 'nain')?.name).toBe('Nain');
    expect(findClass(C, 'clerc')?.name).toBe('Clerc');
    expect(findBackground(C, 'acolyte')?.name).toBe('Acolyte');
  });

  it('rend null pour un identifiant absent plutôt que de lever une exception', () => {
    expect(findRace(C, 'tieffelin')).toBeNull();
    expect(findClass(C, 'barde')).toBeNull();
  });

  it('rend null quand aucun identifiant n’est encore choisi', () => {
    expect(findRace(C, null)).toBeNull();
    expect(findAlignment(C, null)).toBeNull();
  });

  it('cherche chaque identifiant dans sa propre table', () => {
    // « nain » est à la fois une race et une langue : deux tables, aucun conflit.
    expect(findRace(C, 'nain')?.name).toBe('Nain');
    expect(findLanguage(C, 'nain')?.name).toBe('Nain');
    // Un identifiant de classe ne se trouve pas dans la table des races.
    expect(findRace(C, 'clerc')).toBeNull();
  });

  it('donne accès aux tables secondaires', () => {
    expect(findSkill(C, 'discretion')?.ability).toBe('dexterite');
    expect(findAbility(C, 'force')?.purpose).toContain('force');
    expect(findTool(C, 'outils-de-voleur')?.costGp).toBe(25);
    expect(findWeapon(C, 'rapiere')?.finesse).toBe(true);
    expect(findArmor(C, 'cotte-de-mailles')?.dexterity).toBe('none');
    expect(findItem(C, 'symbole-sacre')?.weightKg).toBe(0.5);
    expect(findSpell(C, 'lumiere')?.level).toBe(0);
  });
});

describe('sous-races', () => {
  it('trouve la sous-race dans la race qui la contient', () => {
    expect(findSubrace(C, 'nain', 'nain-des-collines')?.bonusHitPointsPerLevel).toBe(1);
  });

  it('rend null quand la race ne porte pas cette sous-race', () => {
    expect(findSubrace(C, 'demi-elfe', 'nain-des-collines')).toBeNull();
  });

  it('rend null quand la race n’est pas encore choisie', () => {
    expect(findSubrace(C, null, 'nain-des-collines')).toBeNull();
  });
});

describe('listes de sorts', () => {
  it('dérive la liste d’une classe des sorts eux-mêmes', () => {
    const cantrips = spellsForClass(C, 'clerc', 0).map((spell) => spell.id);
    expect(cantrips).toEqual(['lumiere', 'flamme-sacree', 'assistance']);
  });

  it('sépare les tours de magie des sorts de niveau 1', () => {
    expect(spellsForClass(C, 'clerc', 1).map((spell) => spell.id)).toEqual([
      'benediction',
    ]);
  });

  it('ne rend aucun sort à une classe qui n’en lance pas', () => {
    expect(spellsForClass(C, 'roublard', 0)).toEqual([]);
  });

  it('ne rend aucun sort tant que la classe n’est pas choisie', () => {
    expect(spellsForClass(C, null, 0)).toEqual([]);
  });
});
