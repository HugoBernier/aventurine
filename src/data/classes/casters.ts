// Contenu dérivé du SRD 5.1 (CC BY 4.0) — traduction Aventurine.
import type { CharacterClass } from '../../domain/content';
import {
  cantripChoice,
  equipmentChoice,
  equipmentOption,
  item,
  proficiencies,
  skillChoice,
  spellChoice,
} from './helpers';

export const BARD: CharacterClass = {
  id: 'barde',
  name: 'Barde',
  blurb: 'Tu parles, tu joues, tu inspires — et parfois tu lances un sort.',
  facts: ['Dé de vie d8', 'Dextérité + Charisme', 'Trois compétences au choix'],
  hitDie: 8,
  saves: ['dexterite', 'charisme'],
  proficiencies: proficiencies({
    armor: ['legere'],
    weaponCategories: ['courantes'],
    weapons: ['arbalete-de-poing', 'epee-longue', 'rapiere', 'epee-courte'],
    tools: ['instrument-de-musique'],
  }),
  unarmoredDefense: null,
  features: [
    {
      name: 'Inspiration bardique',
      text: 'Tu donnes un d6 à un allié, qu’il ajoute à un jet de son choix.',
    },
  ],
  choices: [
    skillChoice(
      'Tes compétences de barde',
      'Trois compétences, n’importe lesquelles : le barde touche à tout.',
      3,
      [
        'acrobaties',
        'dressage',
        'arcanes',
        'athletisme',
        'supercherie',
        'histoire',
        'perspicacite',
        'intimidation',
        'investigation',
        'medecine',
        'nature',
        'perception',
        'representation',
        'persuasion',
        'religion',
        'escamotage',
        'discretion',
        'survie',
      ],
    ),
    cantripChoice('barde', 2, 'De petits sorts que tu peux relancer autant que tu veux.'),
    spellChoice('barde', 4, 'Quatre sorts que tu connais par cœur.'),
    equipmentChoice(
      'equipment-1',
      'Ton arme',
      'Le barde se bat peu, mais il se bat bien.',
      ['rapiere-barde', 'epee-longue-barde'],
    ),
  ],
  equipmentOptions: [
    equipmentOption(
      'rapiere-barde',
      'Une rapière',
      'Élégante, et elle suit ta Dextérité.',
      ['1d8 perforant', 'Finesse', 'Corps à corps'],
      [item('rapiere')],
    ),
    equipmentOption(
      'epee-longue-barde',
      'Une épée longue',
      'Plus lourde, plus rassurante.',
      ['1d8 tranchant', 'Polyvalente (1d10)', 'Corps à corps'],
      [item('epee-longue')],
    ),
  ],
  fixedEquipment: [
    item('armure-de-cuir'),
    item('dague'),
    item('instrument-de-musique'),
    item('paquetage-de-diplomate'),
  ],
  spellcasting: {
    ability: 'charisme',
    level1Slots: 2,
    preparation: 'known',
    ritual: true,
  },
  subclass: null,
};

export const CLERIC: CharacterClass = {
  id: 'clerc',
  name: 'Clerc',
  blurb: 'Porte-parole d’un dieu. Tu soignes, tu protèges, tu tiens la ligne.',
  facts: ['Dé de vie d8', 'Sagesse + Charisme', 'Lanceur de sorts préparés'],
  hitDie: 8,
  saves: ['sagesse', 'charisme'],
  proficiencies: proficiencies({
    armor: ['legere', 'intermediaire', 'bouclier'],
    weaponCategories: ['courantes'],
  }),
  unarmoredDefense: null,
  features: [
    {
      name: 'Incantation divine',
      text: 'Tu prépares chaque jour tes sorts parmi toute la liste du clerc.',
    },
  ],
  choices: [
    skillChoice(
      'Tes compétences de clerc',
      'Ce que ton service au temple t’a appris.',
      2,
      ['histoire', 'perspicacite', 'medecine', 'persuasion', 'religion'],
    ),
    cantripChoice('clerc', 3, 'Trois petits sorts, relançables à volonté.'),
    equipmentChoice('equipment-1', 'Ton arme', 'Le clerc frappe peu, mais il frappe.', [
      'masse-clerc',
      'marteau-clerc',
    ]),
    equipmentChoice(
      'equipment-2',
      'Ton armure',
      'Ce que tu portes décide de ta classe d’armure.',
      ['ecailles-clerc', 'cuir-clerc'],
    ),
  ],
  equipmentOptions: [
    equipmentOption(
      'masse-clerc',
      'Une masse d’armes',
      'Simple et fiable.',
      ['1d6 contondant', 'Aucune propriété', 'Corps à corps'],
      [item('masse-d-armes')],
    ),
    equipmentOption(
      'marteau-clerc',
      'Un marteau de guerre',
      'Plus lourd — encore faut-il le maîtriser.',
      ['1d8 contondant', 'Polyvalente (1d10)', 'Arme de guerre'],
      [item('marteau-de-guerre')],
    ),
    equipmentOption(
      'ecailles-clerc',
      'Une armure d’écailles et un bouclier',
      'Solide, au prix d’un peu de discrétion.',
      ['CA 14 + Dex (max 2)', '+2 avec le bouclier', 'Intermédiaire'],
      [item('armure-d-ecailles'), item('bouclier')],
    ),
    equipmentOption(
      'cuir-clerc',
      'Une armure de cuir et un bouclier',
      'Légère : tout ton bonus de Dextérité compte.',
      ['CA 11 + Dex', '+2 avec le bouclier', 'Légère'],
      [item('armure-de-cuir'), item('bouclier')],
    ),
  ],
  fixedEquipment: [
    item('arbalete-legere'),
    item('carreaux'),
    item('symbole-sacre'),
    item('paquetage-de-pretre'),
  ],
  spellcasting: {
    ability: 'sagesse',
    level1Slots: 2,
    preparation: 'prepared',
    ritual: true,
  },
  subclass: {
    id: 'domaine-de-la-vie',
    name: 'Domaine de la Vie',
    blurb: 'Tu soignes plus fort que les autres, et tu portes l’acier lourd.',
    features: [
      {
        name: 'Disciple de la vie',
        text: 'Tes sorts de soins rendent 2 + le niveau du sort en plus.',
      },
      {
        name: 'Maîtrise supplémentaire',
        text: 'Tu maîtrises les armures lourdes.',
      },
    ],
    proficiencies: proficiencies({ armor: ['lourde'] }),
    alwaysPreparedSpells: ['benediction', 'soin-des-blessures'],
    unarmoredDefense: null,
    bonusHitPointsPerLevel: 0,
    choices: [],
  },
};

export const DRUID: CharacterClass = {
  id: 'druide',
  name: 'Druide',
  blurb: 'La nature te répond. Tu soignes, tu entraves, tu changes de forme plus tard.',
  facts: ['Dé de vie d8', 'Intelligence + Sagesse', 'Lanceur de sorts préparés'],
  hitDie: 8,
  saves: ['intelligence', 'sagesse'],
  proficiencies: proficiencies({
    armor: ['legere', 'intermediaire', 'bouclier'],
    weapons: [
      'gourdin',
      'dague',
      'flechette',
      'javeline',
      'masse-d-armes',
      'baton',
      'cimeterre',
      'faucille',
      'fronde',
      'lance',
    ],
    tools: ['materiel-d-herboriste'],
  }),
  unarmoredDefense: null,
  features: [
    {
      name: 'Druidique',
      text: 'La langue secrète des druides, que seuls les initiés remarquent.',
    },
    {
      name: 'Incantation naturelle',
      text: 'Tu prépares chaque jour tes sorts parmi toute la liste du druide.',
    },
  ],
  choices: [
    skillChoice(
      'Tes compétences de druide',
      'Deux savoirs tirés de la forêt plutôt que des livres.',
      2,
      [
        'arcanes',
        'dressage',
        'perspicacite',
        'medecine',
        'nature',
        'perception',
        'religion',
        'survie',
      ],
    ),
    cantripChoice('druide', 2, 'Deux petits sorts, relançables à volonté.'),
    equipmentChoice('equipment-1', 'Ton arme', 'Le druide reste sobre en acier.', [
      'bouclier-druide',
      'cimeterre-druide',
    ]),
  ],
  equipmentOptions: [
    equipmentOption(
      'bouclier-druide',
      'Un bouclier de bois',
      'Deux points de classe d’armure, sans métal.',
      ['+2 en classe d’armure', 'Aucun métal', 'Main libre occupée'],
      [item('bouclier')],
    ),
    equipmentOption(
      'cimeterre-druide',
      'Un cimeterre',
      'Courbe et léger, il suit ta Dextérité.',
      ['1d6 tranchant', 'Finesse, légère', 'Corps à corps'],
      [item('cimeterre')],
    ),
  ],
  fixedEquipment: [
    item('armure-de-cuir'),
    item('paquetage-d-explorateur'),
    item('focaliseur-druidique'),
  ],
  spellcasting: {
    ability: 'sagesse',
    level1Slots: 2,
    preparation: 'prepared',
    ritual: true,
  },
  subclass: null,
};

export const SORCERER: CharacterClass = {
  id: 'ensorceleur',
  name: 'Ensorceleur',
  blurb: 'La magie est en toi, pas dans un livre. Elle sort parfois toute seule.',
  facts: ['Dé de vie d6', 'Constitution + Charisme', 'Sorts connus par cœur'],
  hitDie: 6,
  saves: ['constitution', 'charisme'],
  proficiencies: proficiencies({
    weapons: ['dague', 'flechette', 'fronde', 'baton', 'arbalete-legere'],
  }),
  unarmoredDefense: null,
  features: [
    {
      name: 'Magie innée',
      text: 'Tes sorts viennent de ton sang : tu les connais, tu ne les prépares pas.',
    },
  ],
  choices: [
    skillChoice(
      'Tes compétences d’ensorceleur',
      'Deux domaines où ton aisance naturelle se voit.',
      2,
      [
        'arcanes',
        'supercherie',
        'perspicacite',
        'intimidation',
        'persuasion',
        'religion',
      ],
    ),
    cantripChoice('ensorceleur', 4, 'Quatre petits sorts, relançables à volonté.'),
    spellChoice('ensorceleur', 2, 'Deux sorts que tu connais par cœur.'),
    equipmentChoice(
      'equipment-1',
      'Ton arme',
      'L’ensorceleur ne compte pas sur l’acier.',
      ['arbalete-ensorceleur', 'baton-ensorceleur'],
    ),
  ],
  equipmentOptions: [
    equipmentOption(
      'arbalete-ensorceleur',
      'Une arbalète légère et des carreaux',
      'De quoi rester utile quand les sorts manquent.',
      ['1d8 perforant', 'Portée 24/96 m', 'Chargement'],
      [item('arbalete-legere'), item('carreaux')],
    ),
    equipmentOption(
      'baton-ensorceleur',
      'Un bâton',
      'Simple, et il tient lieu de focaliseur.',
      ['1d6 contondant', 'Polyvalente (1d8)', 'Corps à corps'],
      [item('baton')],
    ),
  ],
  fixedEquipment: [
    item('dague', 2),
    item('focaliseur-arcanique'),
    item('paquetage-de-donjon'),
  ],
  spellcasting: {
    ability: 'charisme',
    level1Slots: 2,
    preparation: 'known',
    ritual: false,
  },
  subclass: {
    id: 'lignage-draconique',
    name: 'Lignage draconique',
    blurb: 'Un dragon dans ton arbre généalogique, et ça se voit.',
    features: [
      {
        name: 'Résilience draconique',
        text: 'Tu gagnes 1 point de vie par niveau, et ta peau vaut 13 + Dextérité sans armure.',
      },
      {
        name: 'Ascendance draconique',
        text: 'Tu parles draconique et tu résistes au type de dégâts de ton dragon.',
      },
    ],
    proficiencies: null,
    alwaysPreparedSpells: [],
    unarmoredDefense: { base: 13, addedAbilities: ['dexterite'], shieldAllowed: true },
    bonusHitPointsPerLevel: 1,
    choices: [
      {
        kind: 'ancestry',
        subject: 'ancestry',
        title: 'Ton ascendance draconique',
        help: 'Le dragon dont tu descends décide de ta résistance.',
        pick: 1,
      },
    ],
  },
};

export const WARLOCK: CharacterClass = {
  id: 'occultiste',
  name: 'Occultiste',
  blurb: 'Un pacte avec quelque chose de plus grand. Peu d’emplacements, mais puissants.',
  facts: ['Dé de vie d8', 'Sagesse + Charisme', 'Un seul emplacement de sort'],
  hitDie: 8,
  saves: ['sagesse', 'charisme'],
  proficiencies: proficiencies({
    armor: ['legere'],
    weaponCategories: ['courantes'],
  }),
  unarmoredDefense: null,
  features: [
    {
      name: 'Magie de pacte',
      text: 'Peu d’emplacements, mais ils reviennent après un repos court.',
    },
  ],
  choices: [
    skillChoice(
      'Tes compétences d’occultiste',
      'Deux domaines nourris par ce que ton patron t’a montré.',
      2,
      [
        'arcanes',
        'supercherie',
        'histoire',
        'intimidation',
        'investigation',
        'nature',
        'religion',
      ],
    ),
    cantripChoice('occultiste', 2, 'Deux petits sorts, relançables à volonté.'),
    spellChoice('occultiste', 2, 'Deux sorts que ton pacte t’a enseignés.'),
    equipmentChoice(
      'equipment-1',
      'Ton arme',
      'L’occultiste compte surtout sur son pacte.',
      ['arbalete-occultiste', 'arme-courante-occultiste'],
    ),
  ],
  equipmentOptions: [
    equipmentOption(
      'arbalete-occultiste',
      'Une arbalète légère et des carreaux',
      'De quoi frapper de loin sans dépenser un sort.',
      ['1d8 perforant', 'Portée 24/96 m', 'Chargement'],
      [item('arbalete-legere'), item('carreaux')],
    ),
    equipmentOption(
      'arme-courante-occultiste',
      'Un bâton',
      'Sobre, et il ne quitte jamais ta main.',
      ['1d6 contondant', 'Polyvalente (1d8)', 'Corps à corps'],
      [item('baton')],
    ),
  ],
  fixedEquipment: [
    item('armure-de-cuir'),
    item('dague', 2),
    item('bourse-a-composantes'),
    item('paquetage-de-savant'),
  ],
  spellcasting: {
    ability: 'charisme',
    level1Slots: 1,
    preparation: 'known',
    ritual: false,
  },
  subclass: {
    id: 'le-fielon',
    name: 'Le Fiélon',
    blurb: 'Ton patron vient des Enfers. Il ne fait pas de cadeau, mais il paie.',
    features: [
      {
        name: 'Bénédiction du Ténébreux',
        text: 'Quand tu abats une créature, tu gagnes des points de vie temporaires.',
      },
    ],
    proficiencies: null,
    alwaysPreparedSpells: [],
    unarmoredDefense: null,
    bonusHitPointsPerLevel: 0,
    choices: [],
  },
};

export const WIZARD: CharacterClass = {
  id: 'magicien',
  name: 'Magicien',
  blurb: 'Tu as tout appris dans des livres, et tu les emportes partout.',
  facts: ['Dé de vie d6', 'Intelligence + Sagesse', 'Grimoire de six sorts'],
  hitDie: 6,
  saves: ['intelligence', 'sagesse'],
  proficiencies: proficiencies({
    weapons: ['dague', 'flechette', 'fronde', 'baton', 'arbalete-legere'],
  }),
  unarmoredDefense: null,
  features: [
    {
      name: 'Grimoire',
      text: 'Six sorts y sont copiés ; tu en prépares une partie chaque jour.',
    },
    {
      name: 'Récupération arcanique',
      text: 'Un repos court par jour te rend un emplacement de sort.',
    },
  ],
  choices: [
    skillChoice(
      'Tes compétences de magicien',
      'Deux savoirs tirés de longues heures d’étude.',
      2,
      ['arcanes', 'histoire', 'perspicacite', 'investigation', 'medecine', 'religion'],
    ),
    cantripChoice('magicien', 3, 'Trois petits sorts, relançables à volonté.'),
    spellChoice('magicien', 6, 'Six sorts copiés dans ton grimoire.'),
    equipmentChoice(
      'equipment-1',
      'Ton arme',
      'Le magicien ne se bat pas au corps à corps s’il peut l’éviter.',
      ['baton-magicien', 'dague-magicien'],
    ),
  ],
  equipmentOptions: [
    equipmentOption(
      'baton-magicien',
      'Un bâton',
      'Il sert de focaliseur autant que d’arme.',
      ['1d6 contondant', 'Polyvalente (1d8)', 'Corps à corps'],
      [item('baton')],
    ),
    equipmentOption(
      'dague-magicien',
      'Une dague',
      'Légère, à finesse, et elle se lance.',
      ['1d4 perforant', 'Finesse, légère', 'Lancer'],
      [item('dague')],
    ),
  ],
  fixedEquipment: [
    item('grimoire'),
    item('focaliseur-arcanique'),
    item('paquetage-de-savant'),
  ],
  spellcasting: {
    ability: 'intelligence',
    level1Slots: 2,
    preparation: 'spellbook',
    ritual: true,
  },
  subclass: null,
};
