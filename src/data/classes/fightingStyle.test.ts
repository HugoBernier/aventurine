import { describe, expect, it } from 'vitest';
import { emptyDraft } from '../../domain/draft';
import type { CharacterDraft } from '../../domain/draft';
import { openChoices } from '../../domain/openChoices';
import { buildSheet } from '../../domain/sheet';
import { CATALOGUE as C } from '../catalogue';

const character = (classId: string, level: number, styleId?: string): CharacterDraft => ({
  ...emptyDraft(),
  classId,
  level,
  choices:
    styleId === undefined ? {} : { [`class:${classId}:fighting-style`]: [styleId] },
});

const styleOptions = (draft: CharacterDraft): readonly string[] => {
  const slot = openChoices(draft, C).find((entry) => entry.kind === 'fighting-style');
  return (slot?.options ?? []).map((option) => option.id);
};

const feature = (draft: CharacterDraft, name: string) =>
  buildSheet(draft, C).features.find((entry) => entry.name === name);

describe('le style de combat s’ouvre au niveau de sa classe', () => {
  it('est là dès le niveau 1 pour le guerrier', () => {
    expect(styleOptions(character('guerrier', 1))).toHaveLength(6);
  });

  it('attend le niveau 2 chez le paladin et le rôdeur', () => {
    expect(styleOptions(character('paladin', 1))).toEqual([]);
    expect(styleOptions(character('rodeur', 1))).toEqual([]);
    expect(styleOptions(character('paladin', 2)).length).toBeGreaterThan(0);
    expect(styleOptions(character('rodeur', 2)).length).toBeGreaterThan(0);
  });
});

describe('chaque classe a sa liste', () => {
  it('n’offre pas l’archerie au paladin, qui ne l’a pas dans le SRD', () => {
    expect(styleOptions(character('paladin', 2))).toEqual([
      'defense',
      'duel',
      'combat-a-deux-mains',
      'protection',
    ]);
  });

  it('n’offre ni protection ni arme à deux mains au rôdeur', () => {
    // L'ordre est celui du catalogue, le même d'une classe à l'autre : on
    // retrouve un style à la même place quelle que soit la fiche.
    expect(styleOptions(character('rodeur', 2))).toEqual([
      'archerie',
      'combat-a-deux-armes',
      'defense',
      'duel',
    ]);
  });
});

describe('la fiche montre le style retenu', () => {
  it('annonce le choix tant qu’il n’est pas fait', () => {
    const annonce = feature(character('guerrier', 1), 'Style de combat');
    expect(annonce?.value).toBeNull();
    expect(annonce?.text).toContain('Une façon de te battre');
  });

  it('remplace l’annonce par le style et son effet', () => {
    const rempli = feature(character('guerrier', 1, 'defense'), 'Style de combat');
    expect(rempli?.value).toBe('Défense');
    expect(rempli?.text).toBe(
      'Tant que tu portes une armure, tu gagnes +1 en classe d’armure.',
    );
  });

  it('vaut aussi pour le paladin, qui reçoit le sien plus tard', () => {
    const rempli = feature(character('paladin', 2, 'duel'), 'Style de combat');
    expect(rempli?.value).toBe('Duel');
  });
});

describe('le style agit sur la fiche, pas seulement sur le texte', () => {
  it('donne son +1 de classe d’armure au paladin comme au guerrier', () => {
    // La défense ajoute +1 tant qu'on porte une armure. Le paladin part en
    // cotte de mailles, le guerrier avec l'armure de son équipement de départ.
    const sans = buildSheet(character('paladin', 2), C).armorClass?.total ?? 0;
    const avec = buildSheet(character('paladin', 2, 'defense'), C).armorClass?.total ?? 0;
    expect({ sans: sans > 0, gagne: avec - sans }).toEqual({ sans: true, gagne: 1 });
  });
});
