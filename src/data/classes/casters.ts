// Contenu dérivé du SRD 5.1 (CC BY 4.0), traduction Aventurine.
import { byLevel } from '../../domain/choiceSpec';
import type { CharacterClass } from '../../domain/content';
import {
  ADVANCEMENTS,
  cantripChoice,
  equipmentChoice,
  equipmentOption,
  item,
  proficiencies,
  skillChoice,
  spellChoice,
  subclassChoice,
} from './helpers';

export const BARD: CharacterClass = {
  id: 'barde',
  name: 'Barde',
  blurb: 'Tu parles, tu joues, tu inspires, et parfois tu lances un sort.',
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
      level: 1,
      name: 'Inspiration bardique',
      text: 'En action bonus, tu donnes un d6 à un allié à 18 m qui t’entend. Dans les dix minutes, il l’ajoute à un test, une attaque ou une sauvegarde, même après avoir vu le d20. Le dé passe à d8 au niveau 5, d10 au 10, d12 au 15.',
      steps: [
        { from: 1, value: 'dé de d6' },
        { from: 5, value: 'dé de d8' },
        { from: 10, value: 'dé de d10' },
        { from: 15, value: 'dé de d12' },
      ],
    },
    {
      level: 2,
      name: 'Touche-à-tout',
      text: 'Sur un test de caractéristique où ton bonus de maîtrise ne s’applique pas, tu en ajoutes la moitié, arrondie à l’inférieur.',
    },
    {
      level: 2,
      name: 'Chanson de repos',
      text: 'Pendant un repos court, ceux qui t’écoutent et dépensent des dés de vie récupèrent 1d6 points de vie en plus. Le dé passe à d8 au niveau 9, d10 au 13, d12 au 17.',
      steps: [
        { from: 2, value: '1d6 points de vie' },
        { from: 9, value: '1d8 points de vie' },
        { from: 13, value: '1d10 points de vie' },
        { from: 17, value: '1d12 points de vie' },
      ],
    },
    {
      level: 3,
      name: 'Collège bardique',
      text: 'Où tu as appris ton art : le collège du savoir, celui de la vaillance. Il te donne des aptitudes aux niveaux 3, 6 et 14.',
    },
    {
      level: 3,
      name: 'Expertise',
      text: 'Deux de tes compétences comptent double ton bonus de maîtrise. Deux autres au niveau 10.',
    },
    {
      level: 5,
      name: 'Source d’inspiration',
      text: 'Tes inspirations bardiques reviennent après un repos court, plus seulement après un repos long.',
    },
    {
      level: 6,
      name: 'Contre-chant',
      text: 'En action, tu joues jusqu’à la fin de ton prochain tour : toi et tes alliés à 9 m qui t’entendent avez l’avantage aux sauvegardes contre la frayeur et le charme.',
    },
    {
      level: 10,
      name: 'Secrets magiques',
      text: 'Deux sorts pris dans la liste de n’importe quelle classe, d’un niveau que tu peux lancer, deviennent des sorts de barde. Deux de plus aux niveaux 14 et 18.',
    },
    {
      level: 20,
      name: 'Inspiration suprême',
      text: 'Si tu jettes l’initiative sans inspiration bardique en réserve, tu en récupères une.',
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
    cantripChoice(
      'barde',
      byLevel({ 1: 2, 4: 3, 10: 4 }),
      'De petits sorts que tu peux relancer autant que tu veux.',
    ),
    spellChoice(
      'barde',
      // SRD, table du barde : « Spells Known ».
      [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22],
      'Les sorts que tu connais par cœur, sans les avoir écrits nulle part.',
    ),
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
    progression: 'full',
    preparation: 'known',
    ritual: true,
  },
  subclasses: [
    {
      id: 'college-du-savoir',
      name: 'Collège du savoir',
      blurb: 'Tu sais un peu de tout, et tu sapes la confiance des autres.',
      facts: ['Trois compétences', 'Sape un jet ennemi', 'Deux sorts de plus'],
      features: [
        {
          level: 3,
          name: 'Maîtrises supplémentaires',
          text: 'Tu maîtrises trois compétences de ton choix.',
        },
        {
          level: 3,
          name: 'Mots cinglants',
          text: 'En réaction, tu dépenses une inspiration bardique pour retirer le dé au jet d’attaque, au test ou aux dégâts d’une créature à 18 m qui t’entend.',
        },
        {
          level: 6,
          name: 'Secrets magiques supplémentaires',
          text: 'Deux sorts de n’importe quelle classe, d’un niveau que tu peux lancer, sans compter dans tes sorts connus.',
        },
        {
          level: 14,
          name: 'Talent sans égal',
          text: 'Tu ajoutes un dé d’inspiration bardique à un test de caractéristique, même après avoir vu le d20.',
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
    'Ton collège bardique',
    'Où tu as appris ton art. Il te donnera des aptitudes aux niveaux 3, 6 et 14.',
  ),
  advancements: ADVANCEMENTS,
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
      level: 1,
      name: 'Incantation divine',
      text: 'Chaque jour tu prépares tes sorts parmi toute la liste du clerc : ton modificateur de Sagesse + ton niveau. Ton degré de sauvegarde vaut 8 + maîtrise + Sagesse.',
    },
    {
      level: 1,
      name: 'Domaine divin',
      text: 'La part de ton dieu que tu sers : la vie, la guerre, la lumière, la ruse. Elle ajoute des sorts toujours préparés et des aptitudes aux niveaux 1, 2, 6, 8 et 17.',
    },
    {
      level: 2,
      name: 'Conduit divin',
      text: 'Une fois par repos court ou long, tu canalises ton dieu : renvoyer les morts-vivants, ou l’effet propre à ton domaine. Deux fois au niveau 6, trois au 18.',
      steps: [
        { from: 2, value: '1 usage par repos' },
        { from: 6, value: '2 usages par repos' },
        { from: 18, value: '3 usages par repos' },
      ],
    },
    {
      level: 2,
      name: 'Renvoi des morts-vivants',
      text: 'En action, chaque mort-vivant à 9 m qui te voit ou t’entend fait une sauvegarde de Sagesse. Raté, il fuit une minute, ne t’approche plus à 9 m et ne prend pas de réaction. Un dégât met fin à l’effet.',
    },
    {
      level: 5,
      name: 'Destruction des morts-vivants',
      text: 'Un mort-vivant qui rate ton renvoi est détruit sur place si son facteur de puissance ne dépasse pas 1/2. Le seuil monte aux niveaux 8, 11, 14 et 17.',
      steps: [
        { from: 5, value: 'puissance 1/2 ou moins' },
        { from: 8, value: 'puissance 1 ou moins' },
        { from: 11, value: 'puissance 2 ou moins' },
        { from: 14, value: 'puissance 3 ou moins' },
        { from: 17, value: 'puissance 4 ou moins' },
      ],
    },
    {
      level: 10,
      name: 'Intervention divine',
      text: 'En action, tu implores ton dieu et lances des dés de pourcentage : sous ton niveau de clerc, il agit. Réussi, sept jours d’attente ; raté, tu réessaies le lendemain. À partir du niveau 20, il répond toujours.',
    },
    {
      level: 17,
      name: 'Guérison suprême',
      text: 'Tes sorts de soin ne se lancent plus au dé : chaque dé compte pour son maximum. Un soin de 2d6 rend 12.',
    },
  ],
  choices: [
    skillChoice(
      'Tes compétences de clerc',
      'Ce que ton service au temple t’a appris.',
      2,
      ['histoire', 'perspicacite', 'medecine', 'persuasion', 'religion'],
    ),
    cantripChoice(
      'clerc',
      byLevel({ 1: 3, 4: 4, 10: 5 }),
      'De petits sorts, relançables à volonté.',
    ),
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
      'Plus lourd, encore faut-il le maîtriser.',
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
    progression: 'full',
    preparation: 'prepared',
    ritual: true,
  },
  subclasses: [
    {
      id: 'domaine-de-la-vie',
      name: 'Domaine de la Vie',
      blurb: 'Tu soignes plus fort que les autres, et tu portes l’acier lourd.',
      facts: ['Armures lourdes', 'Soins renforcés', 'Frappe divine'],
      features: [
        {
          level: 1,
          name: 'Maîtrise supplémentaire',
          text: 'Tu maîtrises les armures lourdes.',
        },
        {
          level: 1,
          name: 'Disciple de la vie',
          text: 'Chacun de tes sorts de soin de niveau 1 ou plus rend 2 + le niveau du sort en points de vie supplémentaires.',
        },
        {
          level: 2,
          name: 'Conduit divin : préserver la vie',
          text: 'En action, tu répartis cinq fois ton niveau en points de vie entre des créatures à 9 m, sans dépasser la moitié du maximum de chacune.',
        },
        {
          level: 6,
          name: 'Guérisseur béni',
          text: 'Quand un de tes sorts de soin en soigne un autre, tu récupères 2 + le niveau du sort.',
        },
        {
          level: 8,
          name: 'Frappe divine',
          text: 'Une fois par tour, ton attaque d’arme ajoute 1d8 radiants. Deux dés au niveau 14.',
        },
      ],
      proficiencies: proficiencies({ armor: ['lourde'] }),
      alwaysPreparedSpells: ['benediction', 'soin-des-blessures'],
      unarmoredDefense: null,
      bonusHitPointsPerLevel: 0,
      choices: [],
    },
  ],
  subclassChoice: subclassChoice(
    1,
    'Ton domaine divin',
    'La part de ton dieu que tu sers. Elle te donnera des sorts et des aptitudes aux niveaux 1, 2, 6 et 8.',
  ),
  advancements: ADVANCEMENTS,
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
      level: 1,
      name: 'Druidique',
      text: 'La langue secrète des druides. Tu y laisses des messages cachés, que les initiés repèrent d’office et les autres sur un test de Perception DD 15, sans pouvoir les lire.',
    },
    {
      level: 1,
      name: 'Incantation naturelle',
      text: 'Chaque jour tu prépares tes sorts parmi toute la liste du druide : ton modificateur de Sagesse + ton niveau. Ton degré de sauvegarde vaut 8 + maîtrise + Sagesse.',
    },
    {
      level: 2,
      name: 'Cercle druidique',
      text: 'Le cercle que tu rejoins : celui de la terre, celui de la lune. Il te donne des aptitudes aux niveaux 2, 6, 10 et 14.',
    },
    {
      level: 2,
      name: 'Forme sauvage',
      text: 'En action, tu prends la forme d’une bête déjà vue, deux fois par repos, pour la moitié de ton niveau en heures. Facteur de puissance 1/4 sans vol ni nage au niveau 2, 1/2 au niveau 4, 1 au niveau 8.',
      steps: [
        { from: 2, value: 'puissance 1/4, sans vol ni nage' },
        { from: 4, value: 'puissance 1/2, sans vol' },
        { from: 8, value: 'puissance 1' },
      ],
    },
    {
      level: 18,
      name: 'Sorts en forme de bête',
      text: 'Transformé, tu lances tes sorts de druide : gestes et paroles passent, mais pas les composantes matérielles.',
    },
    {
      level: 18,
      name: 'Corps intemporel',
      text: 'Ton corps ne prend qu’une année tous les dix ans.',
    },
    {
      level: 20,
      name: 'Archidruide',
      text: 'Ta forme sauvage n’a plus de limite d’usage, et tes sorts se passent de gestes, de paroles et de toute composante sans coût.',
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
    cantripChoice(
      'druide',
      byLevel({ 1: 2, 4: 3, 10: 4 }),
      'De petits sorts, relançables à volonté.',
    ),
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
    progression: 'full',
    preparation: 'prepared',
    ritual: true,
  },
  subclasses: [
    {
      id: 'cercle-de-la-terre',
      name: 'Cercle de la terre',
      blurb:
        'Le savoir d’un terroir, un tour de magie de plus, et des sorts qu’il t’offre.',
      facts: ['Un tour de magie', 'Emplacements au repos', 'Sorts du terroir'],
      features: [
        {
          level: 2,
          name: 'Tour de magie supplémentaire',
          text: 'Tu apprends un tour de magie de druide de plus.',
        },
        {
          level: 2,
          name: 'Récupération naturelle',
          text: 'Un repos court par jour te rend des emplacements dont les niveaux cumulés valent la moitié de ton niveau arrondie au supérieur, aucun au-dessus du niveau 5.',
        },
        {
          level: 3,
          name: 'Sorts du cercle',
          text: 'Le terroir où tu es devenu druide, arctique, côte, désert, forêt, prairie, montagne ou marais, te donne des sorts toujours préparés aux niveaux 3, 5, 7 et 9.',
        },
        {
          level: 6,
          name: 'Foulée aisée',
          text: 'Le terrain difficile naturel ne te coûte rien, les plantes ne te ralentissent ni ne te blessent, et tu as l’avantage contre celles animées par magie.',
        },
        {
          level: 10,
          name: 'Garde de la nature',
          text: 'Ni élémentaire ni fée ne peut te charmer ou t’effrayer, et tu es immunisé aux poisons et aux maladies.',
        },
        {
          level: 14,
          name: 'Sanctuaire naturel',
          text: 'Une bête ou une plante qui t’attaque doit réussir une sauvegarde de Sagesse contre ton degré, sinon elle choisit une autre cible ou perd son attaque.',
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
    2,
    'Ton cercle druidique',
    'Le cercle que tu rejoins. Il te donnera des aptitudes aux niveaux 2, 6, 10 et 14.',
  ),
  advancements: ADVANCEMENTS,
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
      level: 1,
      name: 'Magie innée',
      text: 'Tes sorts viennent de ton sang : tu en connais un nombre fixe et ne les prépares pas. Ton degré de sauvegarde vaut 8 + maîtrise + Charisme.',
    },
    {
      level: 1,
      name: 'Origine magique',
      text: 'D’où vient ce sang : un dragon, une déchirure du chaos. Elle te donne des aptitudes aux niveaux 1, 6, 14 et 18.',
    },
    {
      level: 2,
      name: 'Source de magie',
      text: 'Des points de sorcellerie, 2 au niveau 2 puis autant que ton niveau, rendus par un repos long. Tu les échanges contre des emplacements de sort, et l’inverse.',
    },
    {
      level: 3,
      name: 'Métamagie',
      text: 'Deux façons de tordre un sort, une seule par incantation : le doubler, le presser en action bonus, l’étendre, l’allonger, le rendre discret. Une de plus aux niveaux 10 et 17.',
      steps: [
        { from: 3, value: '2 options' },
        { from: 10, value: '3 options' },
        { from: 17, value: '4 options' },
      ],
    },
    {
      level: 20,
      name: 'Restauration sorcière',
      text: 'Chaque repos court te rend 4 points de sorcellerie.',
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
    cantripChoice(
      'ensorceleur',
      byLevel({ 1: 4, 4: 5, 10: 6 }),
      'De petits sorts, relançables à volonté.',
    ),
    spellChoice(
      'ensorceleur',
      // SRD, table de l'ensorceleur : « Spells Known ».
      [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
      'Les sorts que ton sang connaît, sans livre ni prière.',
    ),
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
    progression: 'full',
    preparation: 'known',
    ritual: false,
  },
  subclasses: [
    {
      id: 'lignage-draconique',
      name: 'Lignage draconique',
      blurb: 'Un dragon dans ton arbre généalogique, et ça se voit.',
      facts: ['+1 pv par niveau', 'Peau d’écailles', 'Ailes au niveau 14'],
      features: [
        {
          level: 1,
          name: 'Ascendance draconique',
          text: 'Tu choisis ton dragon, tu parles draconique, et tu as l’avantage aux tests de Charisme face aux dragons.',
        },
        {
          level: 1,
          name: 'Résilience draconique',
          text: 'Tu gagnes 1 point de vie par niveau, et sans armure ta classe d’armure vaut 13 + Dextérité.',
        },
        {
          level: 6,
          name: 'Affinité élémentaire',
          text: 'Tes sorts du type de dégâts de ton dragon ajoutent ton Charisme à un jet de dégâts, et 1 point de sorcellerie t’y donne la résistance pendant une heure.',
        },
        {
          level: 14,
          name: 'Ailes de dragon',
          text: 'En action bonus, des ailes te donnent une vitesse de vol égale à ta vitesse au sol.',
        },
        {
          level: 18,
          name: 'Présence draconique',
          text: 'En action, 5 points de sorcellerie effraient ou fascinent une minute durant toute créature à 18 m qui rate sa sauvegarde de Sagesse.',
        },
      ],
      proficiencies: null,
      alwaysPreparedSpells: [],
      unarmoredDefense: { base: 13, addedAbilities: ['dexterite'], shieldAllowed: true },
      bonusHitPointsPerLevel: 1,
      choices: [],
    },
  ],
  subclassChoice: subclassChoice(
    1,
    'Ton origine magique',
    'D’où vient ton pouvoir. Elle te donnera des aptitudes aux niveaux 1, 6, 14 et 18.',
  ),
  advancements: ADVANCEMENTS,
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
      level: 1,
      name: 'Magie de pacte',
      text: 'Peu d’emplacements, tous du même niveau, rendus par un repos court. Ton degré de sauvegarde vaut 8 + maîtrise + Charisme.',
    },
    {
      level: 1,
      name: 'Protecteur d’outre-monde',
      text: 'Qui a signé en face : un fiélon, un archifée, un Grand Ancien. Il ajoute des sorts et des aptitudes aux niveaux 1, 6, 10 et 14.',
    },
    {
      level: 2,
      name: 'Manifestations occultes',
      text: 'Deux tours permanents offerts par ton pacte, sans coût ni emplacement : voir dans le noir magique, pousser d’un trait, porter une armure sans en avoir. Tu en gagnes d’autres en montant, et tu peux en échanger un à chaque niveau.',
    },
    {
      level: 3,
      name: 'Faveur de pacte',
      text: 'Le cadeau de ton patron : une arme qui apparaît à l’appel, un familier plus rusé qu’un autre, ou un livre de trois tours de magie pris hors de ta liste.',
    },
    {
      level: 11,
      name: 'Arcanum mystique',
      text: 'Un sort de niveau 6 de ta liste, lançable une fois par repos long sans emplacement. Un sort de niveau 7 au niveau 13, de niveau 8 au 15, de niveau 9 au 17.',
      steps: [
        { from: 11, value: 'un sort de niveau 6' },
        { from: 13, value: 'des sorts de niveaux 6 et 7' },
        { from: 15, value: 'des sorts de niveaux 6, 7 et 8' },
        { from: 17, value: 'des sorts de niveaux 6, 7, 8 et 9' },
      ],
    },
    {
      level: 20,
      name: 'Maître occultiste',
      text: 'Une minute d’imploration et tous tes emplacements de magie de pacte reviennent. Une fois par repos long.',
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
    cantripChoice(
      'occultiste',
      byLevel({ 1: 2, 4: 3, 10: 4 }),
      'De petits sorts, relançables à volonté.',
    ),
    spellChoice(
      'occultiste',
      // SRD, table de l'occultiste : « Spells Known ».
      [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
      'Les sorts que ton pacte t’a enseignés.',
    ),
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
    progression: 'pact',
    preparation: 'known',
    ritual: false,
  },
  subclasses: [
    {
      id: 'le-fielon',
      name: 'Le Fiélon',
      blurb: 'Un pacte signé en bas, et des points de vie temporaires à chaque mort.',
      facts: ['Pv temporaires', 'Un d10 à volonté', 'Résistance au choix'],
      features: [
        {
          level: 1,
          name: 'Bénédiction du Ténébreux',
          text: 'Chaque fois que tu réduis une créature hostile à 0 point de vie, tu gagnes ton Charisme + ton niveau en points de vie temporaires, au minimum 1.',
        },
        {
          level: 6,
          name: 'Chance du Ténébreux',
          text: 'Tu ajoutes 1d10 à un test ou une sauvegarde, même après le jet. Une fois par repos.',
        },
        {
          level: 10,
          name: 'Résilience fiélonne',
          text: 'À chaque repos, tu choisis un type de dégâts non magiques auquel tu résistes jusqu’au repos suivant.',
        },
        {
          level: 14,
          name: 'Précipiter en enfer',
          text: 'Sur une touche, la cible disparaît dans les plans inférieurs et revient à la fin de ton prochain tour avec 10d10 dégâts psychiques, sauf si elle est fiélonne.',
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
    1,
    'Ton protecteur',
    'Qui a signé en face. Il te donnera des aptitudes aux niveaux 1, 6, 10 et 14.',
  ),
  advancements: ADVANCEMENTS,
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
      level: 1,
      name: 'Grimoire',
      text: 'Six sorts de niveau 1 y sont copiés au départ, deux de plus à chaque niveau. Tu en prépares chaque jour ton modificateur d’Intelligence + ton niveau.',
    },
    {
      level: 1,
      name: 'Récupération arcanique',
      text: 'Une fois par jour, après un repos court, tu récupères des emplacements dont les niveaux cumulés valent la moitié de ton niveau de magicien arrondie au supérieur, aucun au-dessus du niveau 5.',
    },
    {
      level: 2,
      name: 'Tradition arcanique',
      text: 'L’école que tu approfondis : évocation, illusion, nécromancie, et les autres. Elle te donne des aptitudes aux niveaux 2, 6, 10 et 14.',
    },
    {
      level: 18,
      name: 'Maîtrise des sorts',
      text: 'Un sort de niveau 1 et un de niveau 2 de ton grimoire se lancent à volonté à leur niveau de base, sans emplacement, tant qu’ils sont préparés.',
    },
    {
      level: 20,
      name: 'Sort personnel',
      text: 'Deux sorts de niveau 3 sont toujours préparés sans compter dans ton total, et se lancent chacun une fois par repos sans emplacement.',
    },
  ],
  choices: [
    skillChoice(
      'Tes compétences de magicien',
      'Deux savoirs tirés de longues heures d’étude.',
      2,
      ['arcanes', 'histoire', 'perspicacite', 'investigation', 'medecine', 'religion'],
    ),
    cantripChoice(
      'magicien',
      byLevel({ 1: 3, 4: 4, 10: 5 }),
      'De petits sorts, relançables à volonté.',
    ),
    spellChoice(
      'magicien',
      // SRD : six sorts au niveau 1, puis deux de plus à chaque niveau gagné.
      [6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44],
      'Les sorts copiés dans ton grimoire. Tu en prépares une partie chaque matin.',
    ),
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
    progression: 'full',
    preparation: 'spellbook',
    ritual: true,
  },
  subclasses: [
    {
      id: 'ecole-d-evocation',
      name: 'École d’évocation',
      blurb: 'Tu fais des dégâts, et tu épargnes qui tu veux dans la zone.',
      facts: ['Épargne tes alliés', 'Tours de magie renforcés', 'Dégâts maximaux'],
      features: [
        {
          level: 2,
          name: 'Spécialiste de l’évocation',
          text: 'Copier un sort d’évocation dans ton grimoire coûte moitié moins de temps et d’or.',
        },
        {
          level: 2,
          name: 'Sculpter les sorts',
          text: 'Dans la zone de tes sorts d’évocation, tu épargnes 1 + le niveau du sort en créatures : elles réussissent d’office leur sauvegarde et ne subissent aucun dégât.',
        },
        {
          level: 6,
          name: 'Tour de magie puissant',
          text: 'Une créature qui réussit sa sauvegarde contre un de tes tours de magie encaisse quand même la moitié des dégâts.',
        },
        {
          level: 10,
          name: 'Évocation renforcée',
          text: 'Tu ajoutes ton Intelligence à un jet de dégâts de chacun de tes sorts d’évocation.',
        },
        {
          level: 14,
          name: 'Surcharge',
          text: 'Un sort de niveau 1 à 5 inflige ses dégâts maximaux. Gratuit la première fois, puis 2d12 nécrotiques par usage supplémentaire avant un repos long, et 1d12 de plus à chaque fois.',
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
    2,
    'Ta tradition arcanique',
    'L’école que tu approfondis. Elle te donnera des aptitudes aux niveaux 2, 6, 10 et 14.',
  ),
  advancements: ADVANCEMENTS,
};
