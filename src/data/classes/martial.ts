// Contenu dérivé du SRD 5.1 (CC BY 4.0) — traduction Aventurine.
import type { CharacterClass } from '../../domain/content';
import {
  ROGUE_ADVANCEMENTS,
  FIGHTER_ADVANCEMENTS,
  ADVANCEMENTS,
  equipmentChoice,
  equipmentOption,
  item,
  proficiencies,
  skillChoice,
} from './helpers';

export const BARBARIAN: CharacterClass = {
  id: 'barbare',
  name: 'Barbare',
  blurb: 'Tu encaisses, tu avances, tu frappes. La rage fait le reste.',
  facts: ['Dé de vie d12', 'Force + Constitution', 'Armures intermédiaires, boucliers'],
  hitDie: 12,
  saves: ['force', 'constitution'],
  proficiencies: proficiencies({
    armor: ['legere', 'intermediaire', 'bouclier'],
    weaponCategories: ['courantes', 'de-guerre'],
  }),
  unarmoredDefense: {
    base: 10,
    addedAbilities: ['dexterite', 'constitution'],
    shieldAllowed: true,
  },
  features: [
    {
      level: 1,
      name: 'Rage',
      text: 'En action bonus : avantage en Force, dégâts de mêlée en plus, et résistance aux coups, perforations et tranchants.',
    },
    {
      level: 1,
      name: 'Défense sans armure',
      text: 'Sans armure, ta classe d’armure vaut 10 + Dextérité + Constitution. Le bouclier reste permis.',
    },
    {
      level: 2,
      name: 'Instinct du danger',
      text: 'Avantage aux sauvegardes de Dextérité contre ce que tu vois venir : pièges, sorts, souffles.',
    },
    {
      level: 2,
      name: 'Attaque téméraire',
      text: 'Tu attaques avec l’avantage — et on t’attaque avec l’avantage jusqu’à ton tour suivant.',
    },
    {
      level: 3,
      name: 'Voie primitive',
      text: 'Tu choisis ce que ta rage fait de toi — berserker, guerrier totémique.',
    },
    {
      level: 5,
      name: 'Attaque supplémentaire',
      text: 'Tu attaques deux fois quand tu prends l’action d’attaque.',
    },
    {
      level: 5,
      name: 'Déplacement accéléré',
      text: 'Ta vitesse augmente de 3 mètres tant que tu ne portes pas d’armure lourde.',
    },
    {
      level: 7,
      name: 'Instinct sauvage',
      text: 'Avantage à l’initiative, et tu peux agir même surpris si tu entres en rage aussitôt.',
    },
    {
      level: 9,
      name: 'Critique brutal',
      text: 'Un dé de dégâts supplémentaire sur un critique en mêlée. Deux au niveau 13, trois au niveau 17.',
    },
    {
      level: 11,
      name: 'Rage implacable',
      text: 'Tombé à 0 point de vie en rage, tu tiens debout avec 1 point si tu réussis une sauvegarde.',
    },
    {
      level: 15,
      name: 'Rage persistante',
      text: 'Ta rage ne s’arrête plus que si tu tombes inconscient ou si tu y mets fin.',
    },
    {
      level: 18,
      name: 'Puissance indomptable',
      text: 'Un test de Force inférieur à ton score de Force est remplacé par ce score.',
    },
    {
      level: 20,
      name: 'Champion primitif',
      text: 'Ta Force et ta Constitution montent de 4, jusqu’à un maximum de 24.',
    },
  ],
  choices: [
    skillChoice(
      'Tes compétences de barbare',
      'Deux domaines où ta force et ton instinct parlent pour toi.',
      2,
      ['dressage', 'athletisme', 'intimidation', 'nature', 'perception', 'survie'],
    ),
    equipmentChoice(
      'equipment-1',
      'Ton arme principale',
      'De quoi frapper fort, dès le premier tour.',
      ['hache-a-deux-mains', 'arme-de-guerre-au-choix'],
    ),
  ],
  equipmentOptions: [
    equipmentOption(
      'hache-a-deux-mains',
      'Une hache à deux mains',
      'Lourde, lente, dévastatrice.',
      ['1d12 tranchant', 'Lourde, à deux mains', 'Corps à corps'],
      [item('hache-a-deux-mains')],
    ),
    equipmentOption(
      'arme-de-guerre-au-choix',
      'Une épée à deux mains',
      'Un peu moins brutale, plus régulière.',
      ['2d6 tranchant', 'Lourde, à deux mains', 'Corps à corps'],
      [item('epee-a-deux-mains')],
    ),
  ],
  fixedEquipment: [
    item('hachette', 2),
    item('javeline', 4),
    item('paquetage-d-explorateur'),
  ],
  spellcasting: null,
  subclass: null,
  advancements: ADVANCEMENTS,
};

export const FIGHTER: CharacterClass = {
  id: 'guerrier',
  name: 'Guerrier',
  blurb: 'Tu sais te battre, avec à peu près tout, et tu tiens la ligne.',
  facts: ['Dé de vie d10', 'Force + Constitution', 'Toutes armures, tous boucliers'],
  hitDie: 10,
  saves: ['force', 'constitution'],
  proficiencies: proficiencies({
    armor: ['legere', 'intermediaire', 'lourde', 'bouclier'],
    weaponCategories: ['courantes', 'de-guerre'],
  }),
  unarmoredDefense: null,
  features: [
    {
      level: 1,
      name: 'Second souffle',
      text: 'Une fois par repos, tu récupères 1d10 + 1 points de vie en action bonus.',
    },
  ],
  choices: [
    skillChoice(
      'Tes compétences de guerrier',
      'Deux domaines appris à la caserne, à l’écurie ou sur la route.',
      2,
      [
        'acrobaties',
        'dressage',
        'athletisme',
        'histoire',
        'perspicacite',
        'intimidation',
        'perception',
        'survie',
      ],
    ),
    {
      kind: 'fighting-style',
      subject: 'fighting-style',
      title: 'Ta façon de te battre',
      help: 'Une manière de combattre qui te distingue des autres guerriers.',
      pick: 1,
    },
    equipmentChoice(
      'equipment-1',
      'Ton armure de départ',
      'Ce que tu portes décide de ta classe d’armure.',
      ['cotte-de-mailles-guerrier', 'cuir-et-arc'],
    ),
    equipmentChoice(
      'equipment-2',
      'Ton arme et ta main libre',
      'Une arme lourde, ou une arme et un bouclier.',
      ['arme-et-bouclier', 'deux-armes'],
    ),
  ],
  equipmentOptions: [
    equipmentOption(
      'cotte-de-mailles-guerrier',
      'Une cotte de mailles',
      'Lourde, mais on ne passe pas au travers.',
      ['CA 16', 'Ignore la Dextérité', 'Force 13 requise'],
      [item('cotte-de-mailles')],
    ),
    equipmentOption(
      'cuir-et-arc',
      'Cuir clouté, arc long et flèches',
      'Plus léger, et tu frappes de loin.',
      ['CA 12 + Dex', 'Arc long 1d8', 'Portée 45/180 m'],
      [item('armure-de-cuir-clairsemee'), item('arc-long'), item('fleches')],
    ),
    equipmentOption(
      'arme-et-bouclier',
      'Une épée longue et un bouclier',
      'Le classique : on frappe, on se couvre.',
      ['1d8 tranchant', '+2 en classe d’armure', 'Corps à corps'],
      [item('epee-longue'), item('bouclier')],
    ),
    equipmentOption(
      'deux-armes',
      'Deux épées courtes',
      'Deux lames, deux occasions de toucher.',
      ['1d6 perforant', 'Finesse, légère', 'Corps à corps'],
      [item('epee-courte', 2)],
    ),
  ],
  fixedEquipment: [
    item('arbalete-legere'),
    item('carreaux'),
    item('paquetage-de-donjon'),
  ],
  spellcasting: null,
  subclass: null,
  advancements: FIGHTER_ADVANCEMENTS,
};

export const MONK: CharacterClass = {
  id: 'moine',
  name: 'Moine',
  blurb: 'Rapide, sobre, redoutable à mains nues. L’armure te ralentirait.',
  facts: ['Dé de vie d8', 'Force + Dextérité', 'Arts martiaux, sans armure'],
  hitDie: 8,
  saves: ['force', 'dexterite'],
  proficiencies: proficiencies({
    weaponCategories: ['courantes'],
    weapons: ['epee-courte'],
  }),
  unarmoredDefense: {
    base: 10,
    addedAbilities: ['dexterite', 'sagesse'],
    shieldAllowed: false,
  },
  features: [
    {
      level: 1,
      name: 'Arts martiaux',
      text: 'Tu frappes à mains nues avec ta Dextérité, et tu enchaînes en action bonus.',
    },
    {
      level: 1,
      name: 'Défense sans armure',
      text: 'Sans armure ni bouclier, ta classe d’armure vaut 10 + Dextérité + Sagesse.',
    },
  ],
  choices: [
    skillChoice(
      'Tes compétences de moine',
      'Deux disciplines cultivées au monastère.',
      2,
      ['acrobaties', 'athletisme', 'histoire', 'perspicacite', 'religion', 'discretion'],
    ),
    equipmentChoice(
      'equipment-1',
      'Ton arme',
      'Le moine se bat surtout sans arme ; celle-ci est un appoint.',
      ['epee-courte-moine', 'baton-moine'],
    ),
  ],
  equipmentOptions: [
    equipmentOption(
      'epee-courte-moine',
      'Une épée courte',
      'Légère, à finesse : elle suit ta Dextérité.',
      ['1d6 perforant', 'Finesse, légère', 'Corps à corps'],
      [item('epee-courte')],
    ),
    equipmentOption(
      'baton-moine',
      'Un bâton',
      'Simple, polyvalent, toujours à portée de main.',
      ['1d6 contondant', 'Polyvalente (1d8)', 'Corps à corps'],
      [item('baton')],
    ),
  ],
  fixedEquipment: [item('flechette', 10), item('paquetage-d-explorateur')],
  spellcasting: null,
  subclass: null,
  advancements: ADVANCEMENTS,
};

export const ROGUE: CharacterClass = {
  id: 'roublard',
  name: 'Roublard',
  blurb: 'Tu frappes au bon moment, au bon endroit, et tu n’étais pas là.',
  facts: ['Dé de vie d8', 'Dextérité + Intelligence', 'Attaque sournoise, expertise'],
  hitDie: 8,
  saves: ['dexterite', 'intelligence'],
  proficiencies: proficiencies({
    armor: ['legere'],
    weaponCategories: ['courantes'],
    weapons: ['arbalete-de-poing', 'epee-longue', 'rapiere', 'epee-courte'],
    tools: ['outils-de-voleur'],
  }),
  unarmoredDefense: null,
  features: [
    {
      level: 1,
      name: 'Attaque sournoise',
      text: 'Une fois par tour, tu ajoutes 1d6 quand tu as l’avantage ou qu’un allié est au contact. Le dé grandit d’un cran tous les deux niveaux.',
    },
    {
      level: 1,
      name: 'Argot des voleurs',
      text: 'Un code secret qui passe pour une conversation ordinaire.',
    },
    {
      level: 2,
      name: 'Ruse',
      text: 'Tu peux te précipiter, te désengager ou te cacher en action bonus, à chaque tour.',
    },
    {
      level: 3,
      name: 'Archétype de roublard',
      text: 'Tu choisis la voie qui affine ta manière de faire — voleur, assassin, escroc arcanique.',
    },
    {
      level: 5,
      name: 'Esquive instinctive',
      text: 'En réaction, tu réduis de moitié les dégâts d’une attaque que tu vois venir.',
    },
    {
      level: 7,
      name: 'Évasion',
      text: 'Les effets de zone à sauvegarde de Dextérité ne te font plus rien si tu réussis, et moitié moins si tu rates.',
    },
    {
      level: 11,
      name: 'Talent fiable',
      text: 'Sur un test où tu ajoutes ta maîtrise, tout dé inférieur à 10 compte comme un 10.',
    },
    {
      level: 14,
      name: 'Perception aveugle',
      text: 'Si tu entends, tu sais où se trouve toute créature cachée ou invisible à 3 mètres.',
    },
    {
      level: 15,
      name: 'Esprit insaisissable',
      text: 'Tu maîtrises les jets de sauvegarde de Sagesse.',
    },
    {
      level: 18,
      name: 'Insaisissable',
      text: 'Aucune attaque ne bénéficie de l’avantage contre toi, sauf si tu es neutralisé.',
    },
    {
      level: 20,
      name: 'Coup de chance',
      text: 'Une fois par repos, tu transformes un raté en réussite, ou un test manqué en 20.',
    },
  ],
  choices: [
    skillChoice(
      'Tes compétences de roublard',
      'C’est la classe qui en maîtrise le plus : choisis large.',
      4,
      [
        'acrobaties',
        'athletisme',
        'supercherie',
        'perspicacite',
        'intimidation',
        'investigation',
        'perception',
        'representation',
        'persuasion',
        'escamotage',
        'discretion',
      ],
    ),
    equipmentChoice(
      'equipment-1',
      'Ton arme principale',
      'Les deux suivent ta Dextérité : choisis au style.',
      ['rapiere-roublard', 'epee-courte-roublard'],
    ),
    {
      kind: 'expertise',
      subject: 'expertise',
      title: 'Tes deux spécialités',
      help: 'Tu doubles ton bonus de maîtrise sur ce que tu choisis ici.',
      pick: 2,
      tools: ['outils-de-voleur'],
    },
  ],
  equipmentOptions: [
    equipmentOption(
      'rapiere-roublard',
      'Une rapière',
      'Longue, fine, rapide.',
      ['1d8 perforant', 'Finesse', 'Corps à corps'],
      [item('rapiere')],
    ),
    equipmentOption(
      'epee-courte-roublard',
      'Une épée courte',
      'Plus discrète, plus maniable.',
      ['1d6 perforant', 'Finesse, légère', 'Corps à corps'],
      [item('epee-courte')],
    ),
  ],
  fixedEquipment: [
    item('arc-court'),
    item('fleches'),
    item('armure-de-cuir'),
    item('dague', 2),
    item('outils-de-voleur'),
    item('paquetage-de-cambrioleur'),
  ],
  spellcasting: null,
  subclass: null,
  advancements: ROGUE_ADVANCEMENTS,
};
