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

/** Le roublard choisit son arme de départ : c'est par là qu'on l'arme. */
const armed = (raceId: string, weaponId: string) =>
  sheetOf({
    raceId,
    classId: 'roublard',
    choices: { 'class:roublard:equipment-1': [weaponId] },
  }).attacks.find((attack) => attack.weaponId === weaponId);

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

describe('bonus d’origine', () => {
  it('place le +2 du nain là où le joueur l’a mis', () => {
    const sheet = buildSheet(
      draftWith({ raceId: 'nain', choices: { 'race:nain:origin-2': ['force'] } }),
      C,
    );
    expect(sheet.abilities.force).toBe(10);
    expect(sheet.abilities.constitution).toBe(8);
  });

  it('additionne le +2 de la race et le +1 de la sous-race, chacun là où il est posé', () => {
    const sheet = buildSheet(
      draftWith({
        raceId: 'nain',
        subraceId: 'nain-des-collines',
        choices: {
          'race:nain:origin-2': ['force'],
          'race:nain-des-collines:origin-1': ['sagesse'],
        },
      }),
      C,
    );
    expect(sheet.abilities.force).toBe(10);
    expect(sheet.abilities.sagesse).toBe(9);
    expect(sheet.abilities.constitution).toBe(8);
  });

  it('compte un créneau de +2 pour deux points, pas pour un', () => {
    const sheet = buildSheet(
      draftWith({ raceId: 'nain', choices: { 'race:nain:origin-2': ['sagesse'] } }),
      C,
    );
    expect(sheet.abilities.sagesse).toBe(10);
  });

  it('applique le +1 aux deux caractéristiques choisies par un demi-elfe', () => {
    const sheet = buildSheet(
      draftWith({
        raceId: 'demi-elfe',
        choices: {
          'race:demi-elfe:origin-2': ['charisme'],
          'race:demi-elfe:ability': ['force', 'dexterite'],
        },
      }),
      C,
    );
    expect(sheet.abilities.force).toBe(9);
    expect(sheet.abilities.dexterite).toBe(9);
    expect(sheet.abilities.charisme).toBe(10);
  });

  it('ne modifie rien tant qu’aucun bonus n’est placé', () => {
    expect(sheetOf({ raceId: 'nain' }).abilities.constitution).toBe(8);
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
        {
          classId: 'clerc',
          raceId: 'nain',
          subraceId: 'nain-des-collines',
          // Le +2 est posé sur la Constitution : le test isole le point de vie
          // de la sous-race, il ne teste pas où va le bonus d'origine.
          choices: { 'race:nain:origin-2': ['constitution'] },
        },
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
    expect(sheetOf({ classId: 'clerc' }).spellcasting?.slots).toEqual([2]);
  });

  it('rend préparables mod. de Sagesse + 1 sorts, au minimum 1', () => {
    const generous = buildSheet(withScores({ classId: 'clerc' }, { sagesse: 16 }), C);
    expect(generous.spellcasting?.preparedCount).toBe(4);
    const poor = buildSheet(withScores({ classId: 'clerc' }, { sagesse: 6 }), C);
    expect(poor.spellcasting?.preparedCount).toBe(1);
  });

  it('ajoute les sorts toujours préparés de la voie CHOISIE', () => {
    const sheet = sheetOf({
      classId: 'clerc',
      choices: { 'class:clerc:subclass': ['domaine-de-la-vie'] },
    });
    expect(sheet.spellcasting?.alwaysPreparedIds).toEqual(['benediction']);
  });

  it('n’en ajoute aucun tant que la voie n’est pas choisie', () => {
    // La voie était imposée : un clerc recevait les sorts d'un domaine qu'il
    // n'avait jamais vu passer.
    expect(sheetOf({ classId: 'clerc' }).spellcasting?.alwaysPreparedIds).toEqual([]);
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
  it('réunit les maîtrises de la race, de la classe et de la voie choisie', () => {
    const sheet = sheetOf({
      classId: 'clerc',
      raceId: 'nain',
      choices: { 'class:clerc:subclass': ['domaine-de-la-vie'] },
    });
    expect(sheet.proficiencies.armor).toContain('lourde');
    expect(sheet.proficiencies.tools).toContain('outils-de-forgeron');
  });

  it('ne donne pas les maîtrises d’une voie qu’on n’a pas prise', () => {
    const sheet = sheetOf({
      classId: 'clerc',
      raceId: 'nain',
      choices: { 'class:clerc:subclass': ['domaine-de-la-guerre'] },
    });
    expect(sheet.proficiencies.armor).not.toContain('lourde');
    expect(sheet.proficiencies.weaponCategories).toContain('de-guerre');
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

describe('aptitudes par niveau', () => {
  it('n’affiche pas une aptitude que le niveau n’a pas encore ouverte', () => {
    const names = sheetOf({ classId: 'roublard' }).features.map(
      (feature) => feature.name,
    );
    expect(names).toContain('Attaque sournoise');
    expect(names).not.toContain('Esquive instinctive');
  });

  it('l’affiche une fois le niveau atteint', () => {
    const names = sheetOf({ classId: 'roublard', level: 5 }).features.map(
      (feature) => feature.name,
    );
    expect(names).toContain('Esquive instinctive');
  });
});

describe('résistances aux dégâts', () => {
  it('donne au nain la résistance au poison de son peuple', () => {
    expect(sheetOf({ raceId: 'nain' }).resistances).toEqual(['poison']);
  });

  it('n’en donne aucune au gnome, qui n’en a pas', () => {
    expect(sheetOf({ raceId: 'gnome' }).resistances).toEqual([]);
  });

  it('n’en donne aucune tant qu’aucune race n’est choisie', () => {
    expect(sheetOf({}).resistances).toEqual([]);
  });

  it('ajoute le type de dégâts de l’ascendance choisie', () => {
    const sheet = sheetOf({
      classId: 'clerc',
      choices: { 'class:clerc:ancestry': ['or'] },
    });
    expect(sheet.resistances).toContain('feu');
  });

  it('ne compte pas deux fois une résistance déjà donnée par le peuple', () => {
    const sheet = sheetOf({
      raceId: 'nain',
      classId: 'clerc',
      choices: { 'class:clerc:ancestry': ['argent'] },
    });
    expect(sheet.resistances).toEqual(['poison', 'froid']);
  });
});

describe('taille et armes lourdes', () => {
  it('reporte la taille du peuple sur la fiche', () => {
    expect(sheetOf({ raceId: 'gnome' }).size).toBe('P');
    expect(sheetOf({ raceId: 'nain' }).size).toBe('M');
  });

  it('laisse la taille vide tant qu’aucune race n’est choisie', () => {
    expect(sheetOf({}).size).toBeNull();
  });

  it('signale le désavantage d’une créature de petite taille à l’arme lourde', () => {
    expect(armed('gnome', 'hache-a-deux-mains')?.heavyForSmallSize).toBe(true);
  });

  it('ne le signale pas pour une créature de taille moyenne', () => {
    expect(armed('nain', 'hache-a-deux-mains')?.heavyForSmallSize).toBe(false);
  });

  it('ne le signale pas pour une arme qui n’est pas lourde', () => {
    expect(armed('gnome', 'rapiere')?.heavyForSmallSize).toBe(false);
  });
});

const sneakAt = (level: number) =>
  sheetOf({ classId: 'roublard', level }).features.find(
    (feature) => feature.name === 'Attaque sournoise',
  );

describe('aptitudes à tableau', () => {
  it('donne la ligne du niveau atteint, pas la première', () => {
    expect(sneakAt(1)?.value).toBe('1d6');
    expect(sneakAt(5)?.value).toBe('3d6');
    expect(sneakAt(20)?.value).toBe('3d6');
  });

  it('reste sur la dernière ligne franchie entre deux paliers', () => {
    expect(sneakAt(4)?.value).toBe('2d6');
  });

  it('laisse la valeur vide pour une aptitude sans tableau', () => {
    const feature = sheetOf({ raceId: 'nain' }).features.find(
      (entry) => entry.name === 'Résistance naine',
    );
    expect(feature?.value).toBeNull();
  });
});
