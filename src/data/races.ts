// Contenu dérivé du SRD 5.1 (CC BY 4.0), traduction Aventurine.
import { ABILITIES } from '../domain/abilities';
import type { ChoiceSpec } from '../domain/choiceSpec';
import type { Race } from '../domain/content';
import { NO_PROFICIENCIES } from '../domain/content';
import { ALL_SKILLS } from '../domain/skills';

/**
 * Origines personnalisées : le joueur PLACE le bonus de son peuple au lieu de
 * le subir. C'est la seule règle de ce dépôt qui ne vient pas du SRD 5.1 :
 * exception assumée, voir CLAUDE.md, « Sources et droits ».
 *
 * Le registre des caractéristiques du domaine interdit d'empiler deux bonus
 * sur un même score : le second créneau grise ce que le premier a pris.
 */
function originChoice(bonus: 1 | 2): ChoiceSpec {
  return {
    kind: 'ability',
    subject: `origin-${String(bonus)}`,
    title: `Où mettre ton +${String(bonus)} ?`,
    help:
      bonus === 2
        ? 'Ton peuple te donne +2. C’est toi qui décides où : mets-le dans ce que ton personnage fera le plus souvent.'
        : 'Un point de plus, dans une caractéristique qui n’a pas déjà reçu un bonus.',
    pick: 1,
    bonus,
    from: ABILITIES,
  };
}

const ANY_LANGUAGE = [
  'nain',
  'elfique',
  'gigant',
  'gnome',
  'gobelin',
  'halfelin',
  'orc',
  'draconique',
  'abyssal',
  'celeste',
  'infernal',
  'sylvestre',
  'primordial',
  'parler-souterrain',
];

export const RACE_ENTRIES: readonly Race[] = [
  {
    id: 'nain',
    name: 'Nain',
    blurb: 'Solide, tenace, dur au mal. On ne le déplace pas facilement.',
    facts: ['+2 au choix', '7,50 m · taille moyenne', 'Vision 18 m, résiste au poison'],
    abilityBonuses: {},
    size: 'M',
    speed: 7.5,
    darkvision: 18,
    languages: ['commun', 'nain'],
    skills: [],
    proficiencies: {
      armor: [],
      weaponCategories: [],
      weapons: ['hache-d-armes', 'hachette', 'marteau-leger', 'marteau-de-guerre'],
      tools: [],
    },
    resistances: ['poison'],
    features: [
      {
        name: 'Vision dans le noir',
        text: 'Tu vois à 18 mètres dans le noir, en nuances de gris.',
      },
      {
        name: 'Résistance naine',
        text: 'Tu as l’avantage contre le poison, et tu encaisses moitié moins de dégâts de poison.',
      },
      {
        name: 'Connaissance de la pierre',
        text: 'Face à un ouvrage de pierre, tu ajoutes deux fois ton bonus de maîtrise à ton enquête.',
      },
    ],
    choices: [
      originChoice(2),
      {
        kind: 'tool',
        subject: 'tools',
        title: 'L’outil de ton clan',
        help: 'Les nains apprennent un métier avant de tenir une arme.',
        pick: 1,
        from: ['outils-de-forgeron', 'outils-de-brasseur', 'outils-de-macon'],
      },
    ],
    subraces: [
      {
        id: 'nain-des-collines',
        name: 'Nain des collines',
        blurb: 'Plus vif, plus endurant. Il encaisse ce que les autres esquivent.',
        facts: ['+1 au choix', '7,50 m', '+1 point de vie par niveau'],
        abilityBonuses: {},
        skills: [],
        proficiencies: NO_PROFICIENCIES,
        features: [
          { name: 'Robustesse naine', text: 'Tu gagnes 1 point de vie par niveau.' },
        ],
        bonusHitPointsPerLevel: 1,
        darkvision: null,
        speed: null,
        choices: [originChoice(1)],
      },
      {
        id: 'nain-des-montagnes',
        name: 'Nain des montagnes',
        blurb: 'Élevé dans les hauteurs, habitué au poids de l’acier.',
        facts: ['+2 au choix', '7,50 m', 'Armures légères et intermédiaires'],
        abilityBonuses: {},
        skills: [],
        proficiencies: {
          armor: ['legere', 'intermediaire'],
          weaponCategories: [],
          weapons: [],
          tools: [],
        },
        features: [
          {
            name: 'Entraînement nain au combat',
            text: 'Tu maîtrises les armures légères et intermédiaires.',
          },
        ],
        bonusHitPointsPerLevel: 0,
        darkvision: null,
        speed: null,
        choices: [originChoice(2)],
      },
    ],
  },

  {
    id: 'elfe',
    name: 'Elfe',
    blurb: 'Vif et attentif. Il dort peu et remarque beaucoup.',
    facts: ['+2 au choix', '9 m · taille moyenne', 'Vision 18 m, Perception'],
    abilityBonuses: {},
    size: 'M',
    speed: 9,
    darkvision: 18,
    languages: ['commun', 'elfique'],
    skills: ['perception'],
    proficiencies: NO_PROFICIENCIES,
    resistances: [],
    features: [
      {
        name: 'Vision dans le noir',
        text: 'Tu vois à 18 mètres dans le noir, en nuances de gris.',
      },
      {
        name: 'Sens aiguisés',
        text: 'Tu maîtrises la compétence Perception.',
      },
      {
        name: 'Ascendance féerique',
        text: 'Tu as l’avantage contre le charme, et la magie ne peut pas t’endormir.',
      },
      {
        name: 'Transe',
        text: 'Quatre heures de méditation te valent huit heures de sommeil.',
      },
    ],
    choices: [originChoice(2)],
    subraces: [
      {
        id: 'haut-elfe',
        name: 'Haut-elfe',
        blurb: 'Vif d’esprit, formé à l’épée comme au sortilège.',
        facts: ['+1 au choix', '9 m', 'Un tour de magie de magicien'],
        abilityBonuses: {},
        skills: [],
        proficiencies: {
          armor: [],
          weaponCategories: [],
          weapons: ['epee-longue', 'epee-courte', 'arc-court', 'arc-long'],
          tools: [],
        },
        features: [
          {
            name: 'Entraînement elfique aux armes',
            text: 'Tu maîtrises l’épée longue, l’épée courte, l’arc court et l’arc long.',
          },
        ],
        bonusHitPointsPerLevel: 0,
        darkvision: null,
        speed: null,
        choices: [
          originChoice(1),
          {
            kind: 'cantrip',
            subject: 'cantrip',
            title: 'Ton tour de magie elfique',
            help: 'Un petit sort appris très tôt, que tu peux relancer autant de fois que tu veux.',
            pick: 1,
            listFrom: 'magicien',
          },
          {
            kind: 'language',
            subject: 'language',
            title: 'Ta langue supplémentaire',
            help: 'Les hauts-elfes apprennent volontiers les langues de leurs voisins.',
            pick: 1,
            from: ANY_LANGUAGE,
          },
        ],
      },
      {
        id: 'elfe-des-bois',
        name: 'Elfe des bois',
        blurb: 'Rapide et silencieux, à l’aise sous le couvert des arbres.',
        facts: ['+1 au choix', '10,50 m', 'Se cacher dans la nature'],
        abilityBonuses: {},
        skills: [],
        proficiencies: {
          armor: [],
          weaponCategories: [],
          weapons: ['epee-longue', 'epee-courte', 'arc-court', 'arc-long'],
          tools: [],
        },
        features: [
          {
            name: 'Pieds légers',
            text: 'Ta vitesse de base passe à 10,50 mètres.',
          },
          {
            name: 'Masque de la nature',
            text: 'Tu peux te cacher même faiblement dissimulé par la végétation ou la pluie.',
          },
        ],
        bonusHitPointsPerLevel: 0,
        darkvision: null,
        speed: 10.5,
        choices: [originChoice(1)],
      },
      {
        id: 'elfe-noir',
        name: 'Elfe noir',
        blurb:
          'Grandi sous la terre, à l’aise dans le noir complet, et mal à l’aise au grand jour.',
        facts: ['+1 au choix', '9 m', 'Vision 36 m, gêné en plein soleil'],
        abilityBonuses: {},
        skills: [],
        proficiencies: {
          armor: [],
          weaponCategories: [],
          weapons: ['rapiere', 'epee-courte', 'arbalete-de-poing'],
          tools: [],
        },
        features: [
          {
            name: 'Vision supérieure dans le noir',
            text: 'Tu vois dans le noir jusqu’à 36 mètres, soit deux fois plus loin que les autres elfes.',
          },
          {
            name: 'Sensibilité au soleil',
            text: 'En plein soleil, tu as un désavantage à tes attaques et à ce que tu perçois à la vue.',
          },
          {
            name: 'Magie des elfes noirs',
            text: 'Tu connais le tour de magie Lumières dansantes ; d’autres sorts viendront plus tard.',
          },
          {
            name: 'Entraînement des elfes noirs aux armes',
            text: 'Tu maîtrises la rapière, l’épée courte et l’arbalète de poing.',
          },
        ],
        bonusHitPointsPerLevel: 0,
        darkvision: 36,
        speed: null,
        choices: [originChoice(1)],
      },
    ],
  },

  {
    id: 'halfelin',
    name: 'Halfelin',
    blurb: 'Petit, chanceux, difficile à effrayer et encore plus à attraper.',
    facts: ['+2 au choix', '7,50 m · petite taille', 'Chanceux, brave'],
    abilityBonuses: {},
    size: 'P',
    speed: 7.5,
    darkvision: 0,
    languages: ['commun', 'halfelin'],
    skills: [],
    proficiencies: NO_PROFICIENCIES,
    resistances: [],
    features: [
      { name: 'Chanceux', text: 'Quand tu fais 1 sur un d20, tu relances le dé.' },
      { name: 'Brave', text: 'Tu as l’avantage contre la terreur.' },
      {
        name: 'Agilité halfeline',
        text: 'Tu traverses l’espace d’une créature plus grande que toi.',
      },
    ],
    choices: [originChoice(2)],
    subraces: [
      {
        id: 'halfelin-pied-leger',
        name: 'Pied-léger',
        blurb: 'Sociable et discret : on l’aime bien, on ne le voit pas venir.',
        facts: ['+1 au choix', '7,50 m', 'Se cacher derrière plus grand'],
        abilityBonuses: {},
        skills: [],
        proficiencies: NO_PROFICIENCIES,
        features: [
          {
            name: 'Discrétion naturelle',
            text: 'Tu peux te cacher derrière une créature plus grande que toi.',
          },
        ],
        bonusHitPointsPerLevel: 0,
        darkvision: null,
        speed: null,
        choices: [originChoice(1)],
      },
      {
        id: 'halfelin-robuste',
        name: 'Robuste',
        blurb: 'Un estomac solide et un sang qui pardonne beaucoup.',
        facts: ['+1 au choix', '7,50 m', 'Résistance au poison'],
        abilityBonuses: {},
        skills: [],
        proficiencies: NO_PROFICIENCIES,
        features: [
          {
            name: 'Résilience robuste',
            text: 'Tu as l’avantage contre le poison, et tu en encaisses moitié moins.',
          },
        ],
        bonusHitPointsPerLevel: 0,
        darkvision: null,
        speed: null,
        choices: [originChoice(1)],
      },
    ],
  },

  {
    id: 'humain',
    name: 'Humain',
    blurb: 'Partout, en tout, et jamais très longtemps au même endroit.',
    facts: ['+1 partout', '9 m · taille moyenne', 'Une langue de plus'],
    abilityBonuses: {
      force: 1,
      dexterite: 1,
      constitution: 1,
      intelligence: 1,
      sagesse: 1,
      charisme: 1,
    },
    size: 'M',
    speed: 9,
    darkvision: 0,
    languages: ['commun'],
    skills: [],
    proficiencies: NO_PROFICIENCIES,
    resistances: [],
    features: [
      {
        name: 'Polyvalence humaine',
        text: 'Tu gagnes +1 dans chacune des six caractéristiques.',
      },
    ],
    choices: [
      {
        kind: 'language',
        subject: 'language',
        title: 'Ta seconde langue',
        help: 'Les humains commercent, voyagent et apprennent vite.',
        pick: 1,
        from: ANY_LANGUAGE,
      },
    ],
    subraces: [],
  },

  {
    id: 'drakeide',
    name: 'Drakéide',
    blurb: 'Du sang de dragon, une fierté de clan et un souffle qui brûle.',
    facts: [
      '+2 et +1 au choix',
      '9 m · taille moyenne',
      'Souffle et résistance de ton dragon',
    ],
    abilityBonuses: {},
    size: 'M',
    speed: 9,
    darkvision: 0,
    languages: ['commun', 'draconique'],
    skills: [],
    proficiencies: NO_PROFICIENCIES,
    resistances: [],
    features: [
      {
        name: 'Souffle de dragon',
        text: 'Tu craches une gerbe d’énergie ; le type et la forme dépendent de ton ascendance.',
      },
      {
        name: 'Résistance draconique',
        text: 'Tu résistes au type de dégâts de ton ascendance.',
      },
    ],
    choices: [
      originChoice(2),
      originChoice(1),
      {
        kind: 'ancestry',
        subject: 'ancestry',
        title: 'Ton ascendance draconique',
        help: 'Le dragon dont tu descends décide de ce que crache ton souffle.',
        pick: 1,
      },
    ],
    subraces: [],
  },

  {
    id: 'gnome',
    name: 'Gnome',
    blurb: 'Curieux jusqu’à l’imprudence, inventif jusqu’à l’explosion.',
    facts: ['+2 au choix', '7,50 m · petite taille', 'Vision 18 m, ruse gnome'],
    abilityBonuses: {},
    size: 'P',
    speed: 7.5,
    darkvision: 18,
    languages: ['commun', 'gnome'],
    skills: [],
    proficiencies: NO_PROFICIENCIES,
    resistances: [],
    features: [
      {
        name: 'Vision dans le noir',
        text: 'Tu vois à 18 mètres dans le noir, en nuances de gris.',
      },
      {
        name: 'Ruse gnome',
        text: 'Tu as l’avantage sur toutes tes sauvegardes mentales contre la magie.',
      },
    ],
    choices: [originChoice(2)],
    subraces: [
      {
        id: 'gnome-des-forets',
        name: 'Gnome des forêts',
        blurb:
          'Discret sous les feuilles, il parle aux bestioles et fait apparaître ce qui n’existe pas.',
        facts: ['+1 au choix', '7,50 m', 'Illusion mineure, parle aux bêtes'],
        abilityBonuses: {},
        skills: [],
        proficiencies: {
          armor: [],
          weaponCategories: [],
          weapons: [],
          tools: [],
        },
        features: [
          {
            name: 'Illusionniste-né',
            text: 'Tu connais le tour de magie Illusion mineure. C’est ton Intelligence qui le porte.',
          },
          {
            name: 'Discours avec les petites bêtes',
            text: 'Par des sons et des gestes, tu échanges des idées simples avec les petits animaux.',
          },
        ],
        bonusHitPointsPerLevel: 0,
        darkvision: null,
        speed: null,
        choices: [originChoice(1)],
      },
      {
        id: 'gnome-des-roches',
        name: 'Gnome des roches',
        blurb: 'Bricoleur né : il démonte tout, et remonte presque tout.',
        facts: ['+1 au choix', '7,50 m', 'Bricoleur'],
        abilityBonuses: {},
        skills: [],
        proficiencies: { ...NO_PROFICIENCIES, tools: ['outils-de-bijoutier'] },
        features: [
          {
            name: 'Connaissance de l’artificier',
            text: 'Tu ajoutes deux fois ton bonus de maîtrise pour identifier un objet magique.',
          },
          {
            name: 'Bricoleur',
            text: 'Tu assembles de petits engins mécaniques qui tiennent une heure.',
          },
        ],
        bonusHitPointsPerLevel: 0,
        darkvision: null,
        speed: null,
        choices: [originChoice(1)],
      },
    ],
  },

  {
    id: 'demi-elfe',
    name: 'Demi-elfe',
    blurb: 'À l’aise partout, chez lui nulle part. Il sait s’en servir.',
    facts: [
      '+2 et deux +1 au choix',
      '9 m · taille moyenne',
      'Vision 18 m, deux compétences',
    ],
    abilityBonuses: {},
    size: 'M',
    speed: 9,
    darkvision: 18,
    languages: ['commun', 'elfique'],
    skills: [],
    proficiencies: NO_PROFICIENCIES,
    resistances: [],
    features: [
      {
        name: 'Vision dans le noir',
        text: 'Tu vois à 18 mètres dans le noir, en nuances de gris.',
      },
      { name: 'Ascendance féerique', text: 'Tu as l’avantage contre le charme.' },
      {
        name: 'Polyvalence',
        text: 'Tu maîtrises deux compétences de ton choix.',
      },
    ],
    choices: [
      originChoice(2),
      {
        kind: 'ability',
        // Le SRD réservait ces deux +1 aux caractéristiques AUTRES que le
        // Charisme, parce que le +2 y tombait d'office. Le +2 se plaçant
        // maintenant librement, la restriction n'a plus d'objet : c'est le
        // registre qui empêche deux bonus sur un même score.
        subject: 'ability',
        title: 'Tes deux autres points',
        help: 'Le demi-elfe apprend un peu de tout : deux caractéristiques de plus gagnent +1.',
        pick: 2,
        bonus: 1,
        from: ABILITIES,
      },
      {
        kind: 'skill',
        subject: 'skills',
        title: 'Tes deux talents',
        help: 'Le demi-elfe apprend un peu de tout, partout où il passe.',
        pick: 2,
        from: ALL_SKILLS,
      },
      {
        kind: 'language',
        subject: 'language',
        title: 'Ta troisième langue',
        help: 'Entre deux mondes, on apprend vite à parler celui des autres.',
        pick: 1,
        from: ANY_LANGUAGE,
      },
    ],
    subraces: [],
  },

  {
    id: 'demi-orc',
    name: 'Demi-orc',
    blurb: 'On le regarde de travers. Il tient debout plus longtemps que les autres.',
    facts: [
      '+2 et +1 au choix',
      '9 m · taille moyenne',
      'Vision 18 m, endurance implacable',
    ],
    abilityBonuses: {},
    size: 'M',
    speed: 9,
    darkvision: 18,
    languages: ['commun', 'orc'],
    skills: ['intimidation'],
    proficiencies: NO_PROFICIENCIES,
    resistances: [],
    features: [
      {
        name: 'Vision dans le noir',
        text: 'Tu vois à 18 mètres dans le noir, en nuances de gris.',
      },
      { name: 'Menaçant', text: 'Tu maîtrises la compétence Intimidation.' },
      {
        name: 'Endurance implacable',
        text: 'Une fois par repos long, tomber à 0 point de vie te laisse à 1.',
      },
      {
        name: 'Attaques sauvages',
        text: 'Sur un coup critique en corps à corps, tu ajoutes un dé de dégâts.',
      },
    ],
    choices: [originChoice(2), originChoice(1)],
    subraces: [],
  },

  {
    id: 'tieffelin',
    name: 'Tieffelin',
    blurb: 'Un héritage infernal, un regard qui met mal à l’aise, et de l’aplomb.',
    facts: ['+2 et +1 au choix', '9 m · taille moyenne', 'Vision 18 m, résiste au feu'],
    abilityBonuses: {},
    size: 'M',
    speed: 9,
    darkvision: 18,
    languages: ['commun', 'infernal'],
    skills: [],
    proficiencies: NO_PROFICIENCIES,
    resistances: ['feu'],
    features: [
      {
        name: 'Vision dans le noir',
        text: 'Tu vois à 18 mètres dans le noir, en nuances de gris.',
      },
      {
        name: 'Résistance infernale',
        text: 'Tu encaisses moitié moins de dégâts de feu.',
      },
      {
        name: 'Legs infernal',
        text: 'Tu connais le tour de magie Thaumaturgie ; d’autres sorts viendront plus tard.',
      },
    ],
    choices: [originChoice(2), originChoice(1)],
    subraces: [],
  },
];
