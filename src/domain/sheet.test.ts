import { describe, expect, it } from 'vitest';
import { emptyDraft } from './draft';
import type { CharacterDraft } from './draft';
import { MINI_CATALOGUE as C } from './fixtures/miniCatalogue';
import { buildSheet } from './sheet';

const draftWith = (parts: Partial<CharacterDraft>): CharacterDraft => ({
  ...emptyDraft(),
  ...parts,
});

const sheetOf = (parts: Partial<CharacterDraft>) => buildSheet(draftWith(parts), C);

const withScores = (
  parts: Partial<CharacterDraft>,
  scores: Partial<Record<string, number>>,
): CharacterDraft => {
  const draft = draftWith(parts);
  return {
    ...draft,
    baseAbilities: { ...draft.baseAbilities, ...scores },
  };
};

describe('bonus raciaux', () => {
  it('ajoute +2 en Constitution à un nain', () => {
    expect(sheetOf({ raceId: 'nain' }).abilities.constitution).toBe(10);
  });

  it('ajoute +1 en Sagesse à un nain des collines, en plus du +2 de Constitution', () => {
    const sheet = sheetOf({ raceId: 'nain', subraceId: 'nain-des-collines' });
    expect(sheet.abilities.constitution).toBe(10);
    expect(sheet.abilities.sagesse).toBe(9);
  });

  it('applique le +1 aux deux caractéristiques choisies par un demi-elfe', () => {
    const sheet = buildSheet(
      draftWith({
        raceId: 'demi-elfe',
        choices: { 'race:demi-elfe:ability': ['force', 'dexterite'] },
      }),
      C,
    );
    expect(sheet.abilities.force).toBe(9);
    expect(sheet.abilities.dexterite).toBe(9);
    expect(sheet.abilities.charisme).toBe(10);
  });

  it('ne modifie rien tant qu’aucune race n’est choisie', () => {
    expect(sheetOf({}).abilities.constitution).toBe(8);
  });
});

describe('valeurs dérivées de base', () => {
  it('donne un bonus de maîtrise de +2 au niveau 1', () => {
    expect(sheetOf({}).proficiencyBonus).toBe(2);
  });

  it('donne 10 points de vie à un clerc avec 14 en Constitution', () => {
    const sheet = buildSheet(withScores({ classId: 'clerc' }, { constitution: 14 }), C);
    expect(sheet.maxHitPoints).toBe(10);
  });

  it('ajoute 1 point de vie à un nain des collines', () => {
    const sheet = buildSheet(
      withScores(
        { classId: 'clerc', raceId: 'nain', subraceId: 'nain-des-collines' },
        { constitution: 12 },
      ),
      C,
    );
    expect(sheet.maxHitPoints).toBe(8 + 2 + 1);
  });

  it('ne renvoie aucun point de vie tant que la classe n’est pas choisie', () => {
    expect(sheetOf({ raceId: 'nain' }).maxHitPoints).toBeNull();
    expect(sheetOf({ raceId: 'nain' }).hitDice).toBeNull();
  });

  it('donne une vitesse de 7,50 mètres à un nain', () => {
    expect(sheetOf({ raceId: 'nain' }).speedMeters).toBe(7.5);
  });

  it('prend l’initiative sur la Dextérité', () => {
    expect(buildSheet(withScores({}, { dexterite: 16 }), C).initiative).toBe(3);
  });
});

describe('classe d’armure', () => {
  it('ne renvoie aucune classe d’armure tant que la classe n’est pas choisie', () => {
    expect(sheetOf({ raceId: 'nain' }).armorClass).toBeNull();
  });

  it('ajoute le bonus de Dextérité complet avec une armure légère', () => {
    const sheet = buildSheet(withScores({ classId: 'roublard' }, { dexterite: 16 }), C);
    expect(sheet.armorClass?.total).toBe(11 + 3);
  });

  it('ignore le bonus de Dextérité avec une cotte de mailles', () => {
    const sheet = buildSheet(withScores({ classId: 'clerc' }, { dexterite: 16 }), C);
    expect(sheet.armorClass?.total).toBe(16 + 2);
  });

  it('détaille la classe d’armure par sa provenance', () => {
    const sheet = buildSheet(withScores({ classId: 'clerc' }, { dexterite: 16 }), C);
    expect(sheet.armorClass?.parts).toEqual([
      { source: 'armor', id: 'cotte-de-mailles', value: 16 },
      { source: 'shield', id: 'bouclier', value: 2 },
    ]);
  });

  it('retient la meilleure classe d’armure entre l’armure portée et le sans-armure', () => {
    // L'armure de cuir accepte tout le bonus de Dextérité : 11 + 5 devance
    // toujours le 10 + 5 du sans-armure, d'un point.
    const sheet = buildSheet(withScores({ classId: 'roublard' }, { dexterite: 20 }), C);
    expect(sheet.armorClass?.total).toBe(11 + 5);
  });

  it('réduit la vitesse d’une armure lourde portée sans la Force requise', () => {
    const sheet = buildSheet(withScores({ classId: 'clerc' }, { force: 8 }), C);
    expect(sheet.speedReducedByArmor).toBe(true);
  });

  it('ne réduit pas la vitesse quand la Force suffit', () => {
    const sheet = buildSheet(withScores({ classId: 'clerc' }, { force: 14 }), C);
    expect(sheet.speedReducedByArmor).toBe(false);
  });
});

describe('jets de sauvegarde et compétences', () => {
  it('ajoute le bonus de maîtrise aux deux sauvegardes de la classe seulement', () => {
    const sheet = sheetOf({ classId: 'roublard' });
    const saves = new Map(sheet.saves.map((line) => [line.id, line]));
    expect(saves.get('dexterite')?.proficient).toBe(true);
    expect(saves.get('intelligence')?.proficient).toBe(true);
    expect(saves.get('force')?.proficient).toBe(false);
    expect(saves.get('dexterite')?.bonus).toBe(-1 + 2);
  });

  it('affiche les dix-huit compétences, maîtrisées ou non', () => {
    expect(sheetOf({}).skills).toHaveLength(18);
  });

  it('ajoute le bonus de maîtrise à une compétence choisie', () => {
    const sheet = buildSheet(
      withScores(
        {
          classId: 'roublard',
          choices: { 'class:roublard:skills': ['discretion'] },
        },
        { dexterite: 14 },
      ),
      C,
    );
    const discretion = sheet.skills.find((line) => line.id === 'discretion');
    expect(discretion?.bonus).toBe(2 + 2);
  });

  it('double le bonus de maîtrise sur une compétence prise en expertise', () => {
    const sheet = buildSheet(
      withScores(
        {
          classId: 'roublard',
          choices: {
            'class:roublard:skills': ['discretion'],
            'class:roublard:expertise': ['discretion'],
          },
        },
        { dexterite: 14 },
      ),
      C,
    );
    const discretion = sheet.skills.find((line) => line.id === 'discretion');
    expect(discretion?.expert).toBe(true);
    expect(discretion?.bonus).toBe(2 + 4);
  });

  it('reçoit d’office les compétences de l’historique', () => {
    const sheet = sheetOf({ backgroundId: 'acolyte' });
    const perception = sheet.skills.find((line) => line.id === 'perception');
    expect(perception?.proficient).toBe(true);
  });
});

describe('attaques', () => {
  it('utilise la Dextérité pour une arme de finesse quand elle est meilleure', () => {
    const sheet = buildSheet(
      withScores(
        {
          classId: 'roublard',
          choices: { 'class:roublard:equipment-1': ['epee-courte'] },
        },
        { force: 8, dexterite: 16 },
      ),
      C,
    );
    const attack = sheet.attacks.find((entry) => entry.weaponId === 'epee-courte');
    expect(attack?.damageBonus).toBe(3);
  });

  it('ajoute le bonus de maîtrise à une arme que la classe maîtrise', () => {
    const sheet = buildSheet(
      withScores(
        {
          classId: 'roublard',
          choices: { 'class:roublard:equipment-1': ['epee-courte'] },
        },
        { dexterite: 16 },
      ),
      C,
    );
    const attack = sheet.attacks.find((entry) => entry.weaponId === 'epee-courte');
    expect(attack?.attackBonus).toBe(3 + 2);
  });

  it('n’ajoute pas le bonus de maîtrise à une arme non maîtrisée', () => {
    const sheet = buildSheet(
      withScores(
        {
          classId: 'roublard',
          choices: { 'class:roublard:equipment-1': ['rapiere'] },
        },
        { dexterite: 16 },
      ),
      C,
    );
    const attack = sheet.attacks.find((entry) => entry.weaponId === 'rapiere');
    expect(attack?.attackBonus).toBe(3);
  });

  it('n’expose aucune attaque sans arme', () => {
    expect(sheetOf({ classId: 'clerc' }).attacks).toEqual([]);
  });
});

describe('magie', () => {
  it('n’expose aucune magie pour un roublard', () => {
    expect(sheetOf({ classId: 'roublard' }).spellcasting).toBeNull();
  });

  it('calcule un DD de sauvegarde de 12 pour un clerc avec 14 en Sagesse', () => {
    // 8 + bonus de maîtrise (2) + modificateur de Sagesse (+2).
    const sheet = buildSheet(withScores({ classId: 'clerc' }, { sagesse: 14 }), C);
    expect(sheet.spellcasting?.saveDc).toBe(12);
    expect(sheet.spellcasting?.attackBonus).toBe(4);
  });

  it('calcule un DD de sauvegarde de 13 pour un clerc avec 16 en Sagesse', () => {
    const sheet = buildSheet(withScores({ classId: 'clerc' }, { sagesse: 16 }), C);
    expect(sheet.spellcasting?.saveDc).toBe(13);
  });

  it('donne 2 emplacements de sorts de niveau 1 à un clerc', () => {
    expect(sheetOf({ classId: 'clerc' }).spellcasting?.level1Slots).toBe(2);
  });

  it('rend préparables mod. de Sagesse + 1 sorts, au minimum 1', () => {
    const generous = buildSheet(withScores({ classId: 'clerc' }, { sagesse: 16 }), C);
    expect(generous.spellcasting?.preparedCount).toBe(4);
    const poor = buildSheet(withScores({ classId: 'clerc' }, { sagesse: 6 }), C);
    expect(poor.spellcasting?.preparedCount).toBe(1);
  });

  it('ajoute les sorts toujours préparés de la sous-classe', () => {
    expect(sheetOf({ classId: 'clerc' }).spellcasting?.alwaysPreparedIds).toEqual([
      'benediction',
    ]);
  });

  it('retient les tours de magie choisis', () => {
    const sheet = buildSheet(
      draftWith({
        classId: 'clerc',
        choices: { 'class:clerc:cantrips': ['lumiere', 'assistance'] },
      }),
      C,
    );
    expect(sheet.spellcasting?.cantripIds).toEqual(['lumiere', 'assistance']);
  });
});

describe('maîtrises, aptitudes et équipement', () => {
  it('réunit les maîtrises de la race, de la classe et de la sous-classe', () => {
    const sheet = sheetOf({ classId: 'clerc', raceId: 'nain' });
    expect(sheet.proficiencies.armor).toContain('lourde');
    expect(sheet.proficiencies.tools).toContain('outils-de-forgeron');
  });

  it('rassemble les aptitudes en indiquant leur source', () => {
    const sheet = sheetOf({
      raceId: 'nain',
      classId: 'roublard',
      backgroundId: 'acolyte',
    });
    expect(sheet.features.map((feature) => feature.source)).toEqual([
      'race',
      'class',
      'background',
    ]);
  });

  it('rend des identifiants et jamais des noms affichables', () => {
    const sheet = sheetOf({ raceId: 'nain', classId: 'clerc' });
    expect(sheet.languageIds).toEqual(['commun', 'nain']);
    expect(sheet.equipment.map((line) => line.itemId)).toContain('cotte-de-mailles');
  });

  it('additionne les pièces d’or de l’historique', () => {
    expect(sheetOf({ backgroundId: 'acolyte' }).goldPieces).toBe(15);
  });
});

describe('vision dans le noir', () => {
  it('reprend la portée de la race quand la sous-race n’en change pas', () => {
    expect(
      sheetOf({ raceId: 'nain', subraceId: 'nain-des-collines' }).darkvisionMeters,
    ).toBe(18);
  });

  it('ne connaît aucune portée tant que la race n’est pas choisie', () => {
    expect(sheetOf({}).darkvisionMeters).toBeNull();
  });
});
