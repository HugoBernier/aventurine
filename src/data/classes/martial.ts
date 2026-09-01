// Contenu dérivé du SRD 5.1 (CC BY 4.0), traduction Aventurine.
import type { CharacterClass } from '../../domain/content';
import {
  ADVANCEMENTS,
  FIGHTER_ADVANCEMENTS,
  ROGUE_ADVANCEMENTS,
  equipmentChoice,
  equipmentOption,
  item,
  proficiencies,
  skillChoice,
  subclassChoice,
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
      text: 'En action bonus, une minute de rage, hors armure lourde : avantage aux tests et sauvegardes de Force, dégâts en plus sur tes attaques de mêlée en Force, et résistance aux contondants, perforants et tranchants. Tu ne lances pas de sorts en rage.',
      steps: [
        { from: 1, value: '2 rages par repos long, +2 aux dégâts' },
        { from: 3, value: '3 rages par repos long, +2 aux dégâts' },
        { from: 6, value: '4 rages par repos long, +2 aux dégâts' },
        { from: 9, value: '4 rages par repos long, +3 aux dégâts' },
        { from: 12, value: '5 rages par repos long, +3 aux dégâts' },
        { from: 16, value: '5 rages par repos long, +4 aux dégâts' },
        { from: 17, value: '6 rages par repos long, +4 aux dégâts' },
        { from: 20, value: 'rages illimitées, +4 aux dégâts' },
      ],
    },
    {
      level: 1,
      name: 'Défense sans armure',
      text: 'Sans armure, ta classe d’armure vaut 10 + Dextérité + Constitution. Le bouclier reste permis.',
    },
    {
      level: 2,
      name: 'Instinct du danger',
      text: 'Avantage aux sauvegardes de Dextérité contre ce que tu vois venir, pièges et sorts compris, sauf si tu es aveuglé, assourdi ou neutralisé.',
    },
    {
      level: 2,
      name: 'Attaque téméraire',
      text: 'Décidé sur ta première attaque du tour : avantage à tes attaques de mêlée en Force, et avantage à toutes les attaques contre toi jusqu’à ton tour suivant.',
    },
    {
      level: 3,
      name: 'Voie primitive',
      text: 'Tu choisis ce que ta rage fait de toi : berserker, guerrier totémique. Elle te donne des aptitudes aux niveaux 3, 6, 10 et 14.',
    },
    {
      level: 5,
      name: 'Attaque supplémentaire',
      text: 'Tu attaques deux fois quand tu prends l’action d’attaque.',
    },
    {
      level: 5,
      name: 'Déplacement accéléré',
      text: '+3 m de vitesse tant que tu ne portes pas d’armure lourde.',
    },
    {
      level: 7,
      name: 'Instinct sauvage',
      text: 'Avantage à l’initiative. Surpris et non neutralisé, tu agis quand même à ton premier tour si tu entres en rage avant toute autre chose.',
    },
    {
      level: 9,
      name: 'Critique brutal',
      text: 'Des dés de dégâts d’arme supplémentaires sur un critique en mêlée.',
      steps: [
        { from: 9, value: '+1 dé de dégâts sur un critique' },
        { from: 13, value: '+2 dés de dégâts sur un critique' },
        { from: 17, value: '+3 dés de dégâts sur un critique' },
      ],
    },
    {
      level: 11,
      name: 'Rage implacable',
      text: 'Tombé à 0 point de vie en rage sans mourir sur le coup : sauvegarde de Constitution DD 10, réussie tu restes debout à 1 point de vie. Le DD monte de 5 à chaque usage et retombe à 10 après un repos.',
    },
    {
      level: 15,
      name: 'Rage persistante',
      text: 'Ta rage ne prend fin que si tu tombes inconscient ou si tu y mets fin toi-même.',
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
  subclasses: [
    {
      id: 'voie-du-berserker',
      name: 'Voie du berserker',
      blurb: 'Ta rage ne connaît plus de frein, et tu le paies après.',
      facts: ['Une attaque de plus', 'Insensible à la peur', 'Épuisement au réveil'],
      features: [
        {
          level: 3,
          name: 'Frénésie',
          text: 'En entrant en rage, tu peux frapper une fois de plus en action bonus à chaque tour. La rage finie, tu gagnes un niveau d’épuisement.',
        },
        {
          level: 6,
          name: 'Rage aveugle',
          text: 'Impossible de te charmer ou de t’effrayer en rage. Un effet déjà en cours est suspendu le temps de la rage.',
        },
        {
          level: 10,
          name: 'Présence intimidante',
          text: 'En action, une créature à 9 m qui te voit ou t’entend est effrayée si elle rate une sauvegarde de Sagesse contre 8 + ta maîtrise + ton Charisme.',
        },
        {
          level: 14,
          name: 'Représailles',
          text: 'Quand une créature à 1,50 m te blesse, tu la frappes en réaction.',
        },
      ],
      proficiencies: null,
      alwaysPreparedSpells: [],
      unarmoredDefense: null,
      bonusHitPointsPerLevel: 0,
      choices: [],
    },
  ],
  subclassChoice: subclassChoice(
    3,
    'Ta voie primitive',
    'Ce que ta rage fait de toi. Elle te donnera des aptitudes aux niveaux 3, 6, 10 et 14.',
  ),
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
      text: 'En action bonus, tu récupères 1d10 + ton niveau de guerrier en points de vie. Une fois par repos court ou long.',
    },
    {
      level: 1,
      name: 'Style de combat',
      text: 'Une façon de te battre qui te donne un bonus précis : +2 aux attaques à distance, +1 en classe d’armure, +2 aux dégâts à une arme, et d’autres. Tu la choisis à l’écran suivant.',
    },
    {
      level: 2,
      name: 'Fougue',
      text: 'À ton tour, une action supplémentaire en plus de la normale. Une fois par repos court ou long, deux fois à partir du niveau 17.',
    },
    {
      level: 3,
      name: 'Archétype martial',
      text: 'Ce que tu as fait de ton entraînement : champion, maître de guerre, chevalier occulte. Il te donne des aptitudes aux niveaux 3, 7, 10, 15 et 18.',
    },
    {
      level: 5,
      name: 'Attaque supplémentaire',
      text: 'Tu attaques deux fois quand tu prends l’action d’attaque. Trois fois au niveau 11, quatre au 20.',
    },
    {
      level: 9,
      name: 'Indomptable',
      text: 'Tu relances une sauvegarde ratée et dois garder le nouveau résultat. Une fois par repos long, deux au niveau 13, trois au 17.',
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
  subclasses: [
    {
      id: 'champion',
      name: 'Champion',
      blurb: 'Rien de compliqué : tu frappes plus souvent, et plus fort.',
      facts: ['Critique sur 19-20', 'Puis sur 18-20', 'Régénère au combat'],
      features: [
        {
          level: 3,
          name: 'Critique amélioré',
          text: 'Tes attaques d’arme font un coup critique sur un 19 comme sur un 20.',
        },
        {
          level: 7,
          name: 'Athlète remarquable',
          text: 'Tu ajoutes la moitié de ton bonus de maîtrise, arrondie au supérieur, aux tests de Force, de Dextérité et de Constitution qui ne l’ont pas déjà. Tes sauts avec élan gagnent ta Force en mètres.',
        },
        {
          level: 10,
          name: 'Style de combat supplémentaire',
          text: 'Tu prends un second style de combat.',
        },
        {
          level: 15,
          name: 'Critique supérieur',
          text: 'Tes coups critiques tombent désormais sur 18, 19 et 20.',
        },
        {
          level: 18,
          name: 'Survivant',
          text: 'Au début de chacun de tes tours, si tu es à la moitié de tes points de vie ou moins sans être à 0, tu récupères 5 + ta Constitution.',
        },
      ],
      proficiencies: null,
      alwaysPreparedSpells: [],
      unarmoredDefense: null,
      bonusHitPointsPerLevel: 0,
      choices: [],
    },
  ],
  subclassChoice: subclassChoice(
    3,
    'Ton archétype martial',
    'Ce que tu as fait de ton entraînement. Il te donnera des aptitudes aux niveaux 3, 7, 10, 15 et 18.',
  ),
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
      text: 'À mains nues ou avec une arme de moine, sans armure ni bouclier : tu frappes avec ta Dextérité, tes dégâts passent à 1d4, et l’action d’attaque t’offre une frappe à mains nues en action bonus. Le dé passe à 1d6 au niveau 5, 1d8 au 11, 1d10 au 17.',
      steps: [
        { from: 1, value: 'dés de 1d4' },
        { from: 5, value: 'dés de 1d6' },
        { from: 11, value: 'dés de 1d8' },
        { from: 17, value: 'dés de 1d10' },
      ],
    },
    {
      level: 1,
      name: 'Défense sans armure',
      text: 'Sans armure ni bouclier, ta classe d’armure vaut 10 + Dextérité + Sagesse.',
    },
    {
      level: 2,
      name: 'Ki',
      text: 'Autant de points de ki que ton niveau, récupérés après un repos court. Quand une aptitude de ki demande une sauvegarde, son degré vaut 8 + ton bonus de maîtrise + ta Sagesse.',
      steps: [
        { from: 2, value: '2 points de ki' },
        { from: 3, value: 'autant de points de ki que ton niveau' },
      ],
    },
    {
      level: 2,
      name: 'Déluge de coups',
      text: 'Juste après ton action d’attaque, 1 point de ki pour deux frappes à mains nues en action bonus.',
    },
    {
      level: 2,
      name: 'Défense patiente',
      text: '1 point de ki pour prendre l’action Esquiver en action bonus.',
    },
    {
      level: 2,
      name: 'Pas du vent',
      text: '1 point de ki pour te précipiter ou te désengager en action bonus, et tes sauts portent deux fois plus loin ce tour-ci.',
    },
    {
      level: 2,
      name: 'Déplacement sans armure',
      text: '+3 m de vitesse sans armure ni bouclier. Le bonus monte à 4,50 m au niveau 6, 6 m au 10, 7,50 m au 14, 9 m au 18. Au niveau 9, tu cours sur les murs et sur l’eau.',
      steps: [
        { from: 2, value: '+3 m' },
        { from: 6, value: '+4,50 m' },
        { from: 10, value: '+6 m' },
        { from: 14, value: '+7,50 m' },
        { from: 18, value: '+9 m' },
      ],
    },
    {
      level: 3,
      name: 'Tradition monastique',
      text: 'L’enseignement que tu suis : la main ouverte, l’ombre, les quatre éléments. Il te donne des aptitudes aux niveaux 3, 6, 11 et 17.',
    },
    {
      level: 3,
      name: 'Déviation de projectiles',
      text: 'En réaction à une attaque à distance qui te touche, tu réduis les dégâts de 1d10 + ta Dextérité + ton niveau. Ramenés à 0, tu attrapes le projectile, et 1 point de ki te permet de le relancer aussitôt.',
    },
    {
      level: 4,
      name: 'Chute ralentie',
      text: 'En réaction, tu retires cinq fois ton niveau aux dégâts d’une chute.',
    },
    {
      level: 5,
      name: 'Attaque supplémentaire',
      text: 'Tu attaques deux fois quand tu prends l’action d’attaque.',
    },
    {
      level: 5,
      name: 'Frappe étourdissante',
      text: 'Sur une touche en mêlée, 1 point de ki : la cible rate sa sauvegarde de Constitution et reste étourdie jusqu’à la fin de ton prochain tour.',
    },
    {
      level: 6,
      name: 'Frappes ki',
      text: 'Tes coups à mains nues comptent comme magiques pour franchir les résistances.',
    },
    {
      level: 7,
      name: 'Évasion',
      text: 'Sur un effet de zone à sauvegarde de Dextérité : aucun dégât si tu réussis, la moitié si tu rates.',
    },
    {
      level: 7,
      name: 'Immobilité de l’esprit',
      text: 'À ton tour, en action, tu mets fin toi-même à un charme ou à une frayeur qui te touche.',
    },
    {
      level: 10,
      name: 'Pureté du corps',
      text: 'Tu es immunisé aux maladies et aux poisons.',
    },
    {
      level: 13,
      name: 'Langue du soleil et de la lune',
      text: 'Tu comprends toutes les langues parlées, et toute créature qui a une langue te comprend.',
    },
    {
      level: 14,
      name: 'Âme de diamant',
      text: 'Tu maîtrises les six sauvegardes, et 1 point de ki te permet de relancer celles que tu rates.',
    },
    {
      level: 15,
      name: 'Corps intemporel',
      text: 'Tu ne vieillis plus, aucune magie ne te vieillit, et tu n’as plus besoin de manger ni de boire.',
    },
    {
      level: 18,
      name: 'Corps vide',
      text: '4 points de ki pour devenir invisible pendant une minute, avec résistance à tout sauf à la force. 8 points pour lancer projection astrale sans composantes.',
    },
    {
      level: 20,
      name: 'Perfection intérieure',
      text: 'Ta Sagesse et ta Dextérité montent à 20 et leur maximum passe à 24. Si tu commences ton tour sans ki, tu en récupères 4.',
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
  subclasses: [
    {
      id: 'voie-de-la-main-ouverte',
      name: 'Voie de la main ouverte',
      blurb: 'Le corps à corps pur : tu déséquilibres, tu repousses, tu te soignes.',
      facts: ['Déluge qui contrôle', 'Soins par le ki', 'Paume frémissante'],
      features: [
        {
          level: 3,
          name: 'Technique de la main ouverte',
          text: 'Chaque coup de ton déluge impose un effet au choix : renverser la cible, la repousser de 4,50 m, ou lui retirer ses réactions jusqu’à ton tour suivant.',
        },
        {
          level: 6,
          name: 'Intégrité du corps',
          text: 'En action, tu récupères trois fois ton niveau en points de vie. Une fois par repos long.',
        },
        {
          level: 11,
          name: 'Tranquillité',
          text: 'Après un repos long, tu bénéficies de sanctuaire jusqu’au repos suivant, avec un degré de 8 + ta maîtrise + ta Sagesse.',
        },
        {
          level: 17,
          name: 'Paume frémissante',
          text: 'Sur une frappe à mains nues, 3 points de ki posent des vibrations qui durent autant de jours que ton niveau. En action, tu y mets fin : la cible tombe à 0 point de vie, ou subit 10d10 si elle réussit sa sauvegarde de Constitution.',
        },
      ],
      proficiencies: null,
      alwaysPreparedSpells: [],
      unarmoredDefense: null,
      bonusHitPointsPerLevel: 0,
      choices: [],
    },
  ],
  subclassChoice: subclassChoice(
    3,
    'Ta tradition monastique',
    'L’enseignement que tu suis. Il te donnera des aptitudes aux niveaux 3, 6, 11 et 17.',
  ),
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
      text: 'Une fois par tour, des dégâts en plus sur une touche à l’arme de finesse ou à distance, si tu as l’avantage ou si un ennemi de la cible est au contact d’elle.',
      steps: [
        { from: 1, value: '1d6' },
        { from: 3, value: '2d6' },
        { from: 5, value: '3d6' },
        { from: 7, value: '4d6' },
        { from: 9, value: '5d6' },
        { from: 11, value: '6d6' },
        { from: 13, value: '7d6' },
        { from: 15, value: '8d6' },
        { from: 17, value: '9d6' },
        { from: 19, value: '10d6' },
      ],
    },
    {
      level: 1,
      name: 'Expertise',
      text: 'Deux de tes maîtrises, compétences ou outils de voleur, comptent double ton bonus de maîtrise. Deux autres au niveau 6.',
    },
    {
      level: 1,
      name: 'Argot des voleurs',
      text: 'Un code secret qui passe pour une conversation ordinaire, et des signes laissés dans la rue.',
    },
    {
      level: 2,
      name: 'Ruse',
      text: 'Chaque tour, une action bonus pour te précipiter, te désengager ou te cacher.',
    },
    {
      level: 3,
      name: 'Archétype de roublard',
      text: 'La voie qui affine ta manière de faire : voleur, assassin, escroc arcanique. Elle te donne des aptitudes aux niveaux 3, 9, 13 et 17.',
    },
    {
      level: 5,
      name: 'Esquive instinctive',
      text: 'En réaction à une attaque que tu vois venir, tu réduis ses dégâts de moitié.',
    },
    {
      level: 7,
      name: 'Évasion',
      text: 'Sur un effet de zone à sauvegarde de Dextérité : aucun dégât si tu réussis, la moitié si tu rates.',
    },
    {
      level: 11,
      name: 'Talent fiable',
      text: 'Sur un test où tu ajoutes ton bonus de maîtrise, tout dé inférieur à 10 compte comme un 10.',
    },
    {
      level: 14,
      name: 'Perception aveugle',
      text: 'Si tu entends, tu sais où se trouve toute créature cachée ou invisible à 3 mètres.',
    },
    {
      level: 15,
      name: 'Esprit insaisissable',
      text: 'Tu gagnes la maîtrise des jets de sauvegarde de Sagesse.',
    },
    {
      level: 18,
      name: 'Insaisissable',
      text: 'Aucune attaque ne bénéficie de l’avantage contre toi tant que tu n’es pas neutralisé.',
    },
    {
      level: 20,
      name: 'Coup de chance',
      text: 'Une attaque ratée devient une touche, ou un test raté compte comme un 20. Une fois par repos court ou long.',
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
  subclasses: [
    {
      id: 'voleur',
      name: 'Voleur',
      blurb:
        'Des mains rapides, des murs qui se grimpent, et deux tours au premier round.',
      facts: ['Ruse élargie', 'Escalade sans coût', 'Deux tours au premier round'],
      features: [
        {
          level: 3,
          name: 'Mains agiles',
          text: 'Ton action bonus de Ruse sert aussi à un test d’Escamotage, à crocheter une serrure, à désamorcer un piège ou à utiliser un objet.',
        },
        {
          level: 3,
          name: 'Travail en hauteur',
          text: 'Grimper ne te coûte plus de déplacement supplémentaire, et tes sauts avec élan gagnent ta Dextérité en mètres.',
        },
        {
          level: 9,
          name: 'Discrétion suprême',
          text: 'Avantage à la Discrétion si tu ne parcours pas plus de la moitié de ta vitesse dans le tour.',
        },
        {
          level: 13,
          name: 'Utilisation d’objet magique',
          text: 'Tu ignores toute condition de classe, de peuple ou de niveau sur un objet magique.',
        },
        {
          level: 17,
          name: 'Réflexes du voleur',
          text: 'Deux tours au premier round d’un combat : le tien, puis un second à ton initiative moins 10. Pas si tu es surpris.',
        },
      ],
      proficiencies: null,
      alwaysPreparedSpells: [],
      unarmoredDefense: null,
      bonusHitPointsPerLevel: 0,
      choices: [],
    },
  ],
  subclassChoice: subclassChoice(
    3,
    'Ton archétype de roublard',
    'La voie qui affine ta manière de faire. Elle te donnera des aptitudes aux niveaux 3, 9, 13 et 17.',
  ),
  advancements: ROGUE_ADVANCEMENTS,
};
