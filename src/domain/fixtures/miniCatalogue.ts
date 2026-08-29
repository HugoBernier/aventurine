/**
 * Catalogue miniature pour les tests du domaine. Choisi pour couvrir les cas
 * durs, pas pour ressembler au SRD :
 *
 * - `nain` porte une sous-race, `demi-elfe` un choix de caractéristiques et un
 *   choix de compétences — donc deux sources de créneaux de race ;
 * - `roublard` a des compétences ET une expertise (dont les options sont les
 *   compétences déjà acquises), `clerc` lance des sorts et a une sous-classe ;
 * - `acolyte` donne Perception d'office, ce qui crée le doublon avec la classe ;
 * - `personnalise` est l'historique assemblé sur les règles génériques.
 */
import type { Catalogue } from '../catalogue';
import type {
  AbilityEntry,
  Background,
  CharacterClass,
  Race,
  Skill,
  Spell,
} from '../content';
import { NO_PROFICIENCIES } from '../content';
import { ALL_SKILLS, SKILL_ABILITY } from '../skills';
import { ABILITIES } from '../abilities';

const abilities: readonly AbilityEntry[] = ABILITIES.map((id) => ({
  id,
  name: id,
  purpose: `à quoi sert ${id}`,
}));

const skills: readonly Skill[] = ALL_SKILLS.map((id) => ({
  id,
  name: id,
  ability: SKILL_ABILITY[id],
  usage: `usage de ${id}`,
}));

const races: readonly Race[] = [
  {
    id: 'nain',
    name: 'Nain',
    blurb: 'Solide, tenace, dur au mal.',
    facts: ['+2 Constitution', '7,50 m', 'Vision dans le noir'],
    abilityBonuses: { constitution: 2 },
    size: 'M',
    speed: 7.5,
    darkvision: 18,
    languages: ['commun', 'nain'],
    skills: [],
    proficiencies: { ...NO_PROFICIENCIES, tools: ['outils-de-forgeron'] },
    resistances: ['poison'],
    features: [{ name: 'Résistance naine', text: 'Avantage contre le poison.' }],
    choices: [],
    subraces: [
      {
        id: 'nain-des-collines',
        name: 'Nain des collines',
        blurb: 'Plus vif, plus endurant.',
        facts: ['+1 Sagesse', '7,50 m', '+1 point de vie par niveau'],
        abilityBonuses: { sagesse: 1 },
        skills: [],
        proficiencies: NO_PROFICIENCIES,
        features: [],
        bonusHitPointsPerLevel: 1,
        speed: null,
        choices: [],
      },
    ],
  },
  {
    id: 'demi-elfe',
    name: 'Demi-elfe',
    blurb: 'À l’aise partout, chez lui nulle part.',
    facts: ['+2 Charisme', '9 m', 'Deux compétences au choix'],
    abilityBonuses: { charisme: 2 },
    size: 'M',
    speed: 9,
    darkvision: 18,
    languages: ['commun', 'elfique'],
    skills: [],
    proficiencies: NO_PROFICIENCIES,
    resistances: [],
    features: [],
    choices: [
      {
        kind: 'ability',
        subject: 'ability',
        title: 'Tes deux points de bonus',
        help: 'Le demi-elfe gagne +1 dans deux caractéristiques de son choix.',
        pick: 2,
        bonus: 1,
        from: ['force', 'dexterite', 'constitution', 'intelligence', 'sagesse'],
      },
      {
        kind: 'skill',
        subject: 'skills',
        title: 'Tes talents de demi-elfe',
        help: 'Le demi-elfe apprend deux compétences de son choix.',
        pick: 2,
        from: ALL_SKILLS,
      },
    ],
    subraces: [],
  },
];

export const ROGUE: CharacterClass = {
  id: 'roublard',
  name: 'Roublard',
  blurb: 'Discret, précis, opportuniste.',
  facts: ['d8', 'Dextérité + Intelligence', 'Armures légères'],
  hitDie: 8,
  saves: ['dexterite', 'intelligence'],
  proficiencies: {
    armor: ['legere'],
    weaponCategories: ['courantes'],
    weapons: [],
    tools: ['outils-de-voleur'],
  },
  unarmoredDefense: null,
  features: [{ name: 'Attaque sournoise', text: '1d6 de dégâts en plus.' }],
  choices: [
    {
      kind: 'skill',
      subject: 'skills',
      title: 'Tes compétences de roublard',
      help: 'Le roublard est la classe qui en maîtrise le plus.',
      pick: 4,
      from: ['acrobaties', 'athletisme', 'discretion', 'perception', 'supercherie'],
    },
    {
      kind: 'equipment',
      subject: 'equipment-1',
      title: 'Ton arme de départ',
      help: 'Les deux sont à finesse : tu frapperas avec ta Dextérité.',
      pick: 1,
      from: ['rapiere', 'epee-courte', 'arme-inconnue'],
    },
    {
      kind: 'expertise',
      subject: 'expertise',
      title: 'Tes spécialités',
      help: 'Tu doubles ton bonus de maîtrise sur ce que tu choisis ici.',
      pick: 2,
      tools: ['outils-de-voleur'],
    },
  ],
  equipmentOptions: [
    {
      id: 'rapiere',
      name: 'Une rapière',
      blurb: 'Longue, fine, rapide.',
      facts: ['1d8 perforant', 'Finesse', 'Corps à corps'],
      items: [{ itemId: 'rapiere', quantity: 1 }],
    },
    {
      id: 'epee-courte',
      name: 'Une épée courte',
      blurb: 'Courte et maniable.',
      facts: ['1d6 perforant', 'Finesse, légère', 'Corps à corps'],
      items: [{ itemId: 'epee-courte', quantity: 1 }],
    },
  ],
  fixedEquipment: [
    { itemId: 'outils-de-voleur', quantity: 1 },
    { itemId: 'armure-de-cuir', quantity: 1 },
  ],
  spellcasting: null,
  subclass: null,
};

const classes: readonly CharacterClass[] = [
  ROGUE,
  {
    id: 'clerc',
    name: 'Clerc',
    blurb: 'Porte-parole d’un dieu, soigneur au front.',
    facts: ['d8', 'Sagesse + Charisme', 'Lanceur de sorts'],
    hitDie: 8,
    saves: ['sagesse', 'charisme'],
    proficiencies: {
      armor: ['legere', 'intermediaire', 'bouclier'],
      weaponCategories: ['courantes'],
      weapons: [],
      tools: [],
    },
    unarmoredDefense: null,
    features: [],
    choices: [
      {
        kind: 'skill',
        subject: 'skills',
        title: 'Tes compétences de clerc',
        help: 'Choisis ce que ton service au temple t’a appris.',
        pick: 2,
        from: ['histoire', 'medecine', 'perception', 'persuasion', 'religion'],
      },
      {
        kind: 'ancestry',
        subject: 'ancestry',
        title: 'Ton ascendance',
        help: 'Le sang qui coule dans tes veines.',
        pick: 1,
      },
      {
        kind: 'fighting-style',
        subject: 'fighting-style',
        title: 'Ta façon de te battre',
        help: 'Une manière de combattre qui te ressemble.',
        pick: 1,
      },
      {
        kind: 'cantrip',
        subject: 'cantrips',
        title: 'Tes tours de magie',
        help: 'De petits sorts que tu peux relancer autant de fois que tu veux.',
        pick: 3,
        listFrom: 'clerc',
      },
    ],
    equipmentOptions: [],
    fixedEquipment: [
      { itemId: 'cotte-de-mailles', quantity: 1 },
      { itemId: 'bouclier', quantity: 1 },
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
      blurb: 'Tu soignes, tu protèges, tu tiens la ligne.',
      features: [{ name: 'Disciple de la vie', text: 'Tes soins rendent plus.' }],
      proficiencies: { ...NO_PROFICIENCIES, armor: ['lourde'] },
      alwaysPreparedSpells: ['benediction'],
      unarmoredDefense: null,
      bonusHitPointsPerLevel: 0,
      choices: [],
    },
  },
];

const backgrounds: readonly Background[] = [
  {
    id: 'acolyte',
    name: 'Acolyte',
    blurb: 'Tu as servi dans un temple.',
    facts: ['Perspicacité, Perception', 'Deux langues', 'Symbole sacré'],
    skills: ['perspicacite', 'perception'],
    proficiencies: NO_PROFICIENCIES,
    choices: [
      {
        kind: 'language',
        subject: 'languages',
        title: 'Les langues de ton temple',
        help: 'Les liturgies t’ont familiarisé avec d’autres langues.',
        pick: 2,
        from: ['nain', 'elfique', 'gobelin'],
      },
    ],
    equipment: [{ itemId: 'symbole-sacre', quantity: 1 }],
    goldPieces: 15,
    feature: { name: 'Abri du fidèle', text: 'Les temples t’accueillent.' },
    suggestedTraits: {
      traits: ['Je cite les textes en toute occasion.'],
      ideals: ['La foi guide mes pas.'],
      bonds: ['Je dois tout à mon temple.'],
      flaws: ['Je juge trop vite.'],
    },
    assembledFromGenericRules: false,
  },
  {
    id: 'personnalise',
    name: 'Personnalisé',
    blurb: 'Tu composes ton passé toi-même.',
    facts: ['Deux compétences au choix', 'Un outil', '15 po'],
    skills: [],
    proficiencies: NO_PROFICIENCIES,
    choices: [
      {
        kind: 'skill',
        subject: 'skills',
        title: 'Ce que ton passé t’a appris',
        help: 'Choisis deux compétences qui racontent d’où tu viens.',
        pick: 2,
        from: ALL_SKILLS,
      },
    ],
    equipment: [],
    goldPieces: 15,
    feature: null,
    suggestedTraits: { traits: [], ideals: [], bonds: [], flaws: [] },
    assembledFromGenericRules: true,
  },
];

const spells: readonly Spell[] = [
  {
    id: 'lumiere',
    name: 'Lumière',
    level: 0,
    school: 'evocation',
    castingTime: '1 action',
    range: 'contact',
    components: { verbal: true, somatic: false, material: 'une luciole' },
    duration: '1 heure',
    concentration: false,
    ritual: false,
    summary: 'Fait briller un objet comme une torche.',
    classes: ['clerc'],
  },
  {
    id: 'flamme-sacree',
    name: 'Flamme sacrée',
    level: 0,
    school: 'evocation',
    castingTime: '1 action',
    range: '18 mètres',
    components: { verbal: true, somatic: true, material: null },
    duration: 'instantanée',
    concentration: false,
    ritual: false,
    summary: 'Une lumière brûlante tombe sur une créature.',
    classes: ['clerc'],
  },
  {
    id: 'assistance',
    name: 'Assistance',
    level: 0,
    school: 'divination',
    castingTime: '1 action',
    range: 'contact',
    components: { verbal: true, somatic: true, material: null },
    duration: 'concentration, 1 minute',
    concentration: true,
    ritual: false,
    summary: 'Ta cible ajoute 1d4 à un jet de caractéristique.',
    classes: ['clerc'],
  },
  {
    id: 'benediction',
    name: 'Bénédiction',
    level: 1,
    school: 'enchantement',
    castingTime: '1 action',
    range: '9 mètres',
    components: { verbal: true, somatic: true, material: 'de l’eau bénite' },
    duration: 'concentration, 1 minute',
    concentration: true,
    ritual: false,
    summary: 'Trois alliés ajoutent 1d4 à leurs attaques et sauvegardes.',
    classes: ['clerc'],
  },
];

export const MINI_CATALOGUE: Catalogue = {
  abilities,
  skills,
  races,
  classes,
  backgrounds,
  alignments: [{ id: 'loyal-bon', name: 'Loyal bon', blurb: 'Tu tiens parole.' }],
  languages: [
    { id: 'commun', name: 'Commun', script: 'commun', exotic: false },
    { id: 'nain', name: 'Nain', script: 'naine', exotic: false },
    { id: 'elfique', name: 'Elfique', script: 'elfique', exotic: false },
    { id: 'gobelin', name: 'Gobelin', script: 'naine', exotic: false },
  ],
  tools: [
    { id: 'outils-de-voleur', name: 'Outils de voleur', category: 'outil', costGp: 25 },
    {
      id: 'outils-de-forgeron',
      name: 'Outils de forgeron',
      category: 'artisan',
      costGp: 20,
    },
  ],
  weapons: [
    {
      id: 'rapiere',
      name: 'Rapière',
      category: 'de-guerre',
      damageDice: '1d8',
      damageType: 'perforant',
      finesse: true,
      ranged: false,
      rangeMeters: null,
      properties: ['finesse'],
    },
    {
      id: 'epee-courte',
      name: 'Épée courte',
      category: 'courantes',
      damageDice: '1d6',
      damageType: 'perforant',
      finesse: true,
      ranged: false,
      rangeMeters: null,
      properties: ['finesse', 'légère'],
    },
  ],
  armor: [
    {
      id: 'armure-de-cuir',
      name: 'Armure de cuir',
      category: 'legere',
      base: 11,
      dexterity: 'full',
      strengthRequired: 0,
    },
    {
      id: 'cotte-de-mailles',
      name: 'Cotte de mailles',
      category: 'lourde',
      base: 16,
      dexterity: 'none',
      strengthRequired: 13,
    },
    {
      id: 'bouclier',
      name: 'Bouclier',
      category: 'bouclier',
      base: 2,
      dexterity: 'none',
      strengthRequired: 0,
    },
  ],
  items: [
    { id: 'symbole-sacre', name: 'Symbole sacré', weightKg: 0.5 },
    { id: 'outils-de-voleur', name: 'Outils de voleur', weightKg: 0.5 },
    { id: 'rapiere', name: 'Rapière', weightKg: 1 },
    { id: 'epee-courte', name: 'Épée courte', weightKg: 1 },
    { id: 'armure-de-cuir', name: 'Armure de cuir', weightKg: 5 },
    { id: 'cotte-de-mailles', name: 'Cotte de mailles', weightKg: 25 },
    { id: 'bouclier', name: 'Bouclier', weightKg: 3 },
  ],
  spells,
  ancestries: [
    {
      id: 'or',
      name: 'Or',
      blurb: 'Le souffle des dragons d’or.',
      damageType: 'feu',
      breathWeapon: 'cône de 4,50 m',
    },
    {
      id: 'argent',
      name: 'Argent',
      blurb: 'Le souffle des dragons d’argent.',
      damageType: 'froid',
      breathWeapon: 'cône de 4,50 m',
    },
  ],
  fightingStyles: [
    {
      id: 'defense',
      name: 'Défense',
      text: 'Tu gagnes +1 en classe d’armure quand tu portes une armure.',
      armorClassBonusWithArmor: 1,
    },
    {
      id: 'duel',
      name: 'Duel',
      text: 'Tu frappes plus fort avec une seule arme en main.',
      armorClassBonusWithArmor: 0,
    },
  ],
};
