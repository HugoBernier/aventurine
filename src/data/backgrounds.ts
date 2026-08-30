// Contenu dérivé du SRD 5.1 (CC BY 4.0) — traduction Aventurine.
import type { Background } from '../domain/content';
import { NO_PROFICIENCIES } from '../domain/content';
import { ALL_SKILLS } from '../domain/skills';
import { TOOL_ENTRIES } from './tools';

const ALL_TOOLS = TOOL_ENTRIES.map((tool) => tool.id);
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

export const BACKGROUND_ENTRIES: readonly Background[] = [
  {
    id: 'acolyte',
    name: 'Acolyte',
    blurb: 'Tu as servi dans un temple, entre les rites et les fidèles.',
    facts: ['Perspicacité, Religion', 'Deux langues au choix', 'Symbole sacré, 15 po'],
    skills: ['perspicacite', 'religion'],
    proficiencies: NO_PROFICIENCIES,
    choices: [
      {
        kind: 'language',
        subject: 'languages',
        title: 'Les langues de ton temple',
        help: 'Les liturgies et les pèlerins t’ont familiarisé avec d’autres langues.',
        pick: 2,
        from: ANY_LANGUAGE,
      },
    ],
    equipment: [
      { itemId: 'symbole-sacre', quantity: 1 },
      { itemId: 'livre-de-prieres', quantity: 1 },
      { itemId: 'baton-d-encens', quantity: 5 },
      { itemId: 'habits-de-ceremonie', quantity: 1 },
      { itemId: 'paquetage-de-pretre', quantity: 1 },
    ],
    goldPieces: 15,
    feature: {
      name: 'Abri du fidèle',
      text: 'Toi et tes compagnons trouvez gîte et soins dans les temples de ta foi.',
    },
    suggestedTraits: {
      traits: [
        'J’ai une citation sacrée pour chaque situation.',
        'Je vois des présages dans tout ce qui arrive.',
        'Je parle doucement, même quand on me crie dessus.',
      ],
      ideals: [
        'Tradition. Les rites anciens doivent être préservés.',
        'Charité. J’aide ceux qui en ont besoin, quel qu’en soit le prix.',
        'Foi. Ma divinité guide chacun de mes pas.',
      ],
      bonds: [
        'Je dois tout au temple qui m’a recueilli.',
        'Je protège une relique dont nul ne doit connaître l’existence.',
        'Je cherche à racheter une faute que personne d’autre ne connaît.',
      ],
      flaws: [
        'Je juge les autres bien trop vite.',
        'Je fais aveuglément confiance à ma hiérarchie.',
        'Je suis inflexible dès qu’il s’agit de doctrine.',
      ],
    },
    assembledFromGenericRules: false,
  },

  {
    id: 'soldat',
    name: 'Soldat',
    blurb: 'Tu as porté l’uniforme, tenu un rang, et enterré des camarades.',
    facts: [
      'Athlétisme, Intimidation',
      'Un jeu et une langue',
      'Paquetage d’explorateur, 10 po',
    ],
    skills: ['athletisme', 'intimidation'],
    proficiencies: NO_PROFICIENCIES,
    choices: [
      {
        kind: 'tool',
        subject: 'tools',
        title: 'Ce à quoi vous jouiez',
        help: 'Les longues attentes se tuent aux dés ou aux cartes.',
        pick: 1,
        from: ['des-a-jouer', 'jeu-de-cartes'],
      },
      {
        kind: 'language',
        subject: 'languages',
        title: 'La langue d’en face',
        help: 'On finit par comprendre ceux qu’on a longtemps combattus.',
        pick: 1,
        from: ANY_LANGUAGE,
      },
    ],
    equipment: [
      { itemId: 'paquetage-d-explorateur', quantity: 1 },
      { itemId: 'corde-de-chanvre', quantity: 1 },
      { itemId: 'boite-a-amadou', quantity: 1 },
      { itemId: 'bourse', quantity: 1 },
    ],
    goldPieces: 10,
    feature: {
      name: 'Le mot du camp',
      text: 'Les soldats te reconnaissent des leurs : tu obtiens des nouvelles, un repas et un coin où dormir dans n’importe quelle garnison.',
    },
    suggestedTraits: {
      traits: [
        'Je donne des ordres avant de me rendre compte que je n’en ai plus le droit.',
        'Je compte mes affaires trois fois avant de dormir.',
        'Je ne hausse jamais la voix : ça n’a jamais servi à rien.',
      ],
      ideals: [
        'Devoir. On finit ce qu’on a promis de faire.',
        'Camaraderie. On ne laisse personne derrière, jamais.',
        'Paix. J’ai vu assez de guerre pour vouloir l’éviter.',
      ],
      bonds: [
        'Je porte encore l’insigne de quelqu’un qui n’est pas rentré.',
        'Un ordre que j’ai exécuté me poursuit toutes les nuits.',
        'Ma compagnie est ma seule vraie famille.',
      ],
      flaws: [
        'Je me méfie de tout ce qui ne se range pas.',
        'J’obéis à qui parle fort, même quand il a tort.',
        'Je règle les désaccords bien trop vite avec mes poings.',
      ],
    },
    assembledFromGenericRules: true,
  },

  {
    id: 'criminel',
    name: 'Criminel',
    blurb: 'Tu as vécu de ce que les autres gardaient mal.',
    facts: [
      'Discrétion, Supercherie',
      'Outils de voleur et un jeu',
      'Paquetage de cambrioleur, 15 po',
    ],
    skills: ['discretion', 'supercherie'],
    proficiencies: { ...NO_PROFICIENCIES, tools: ['outils-de-voleur'] },
    choices: [
      {
        kind: 'tool',
        subject: 'tools',
        title: 'Ce sur quoi tu misais',
        help: 'On apprend beaucoup d’un homme à sa façon de jouer.',
        pick: 1,
        from: ['des-a-jouer', 'jeu-de-cartes'],
      },
    ],
    equipment: [
      { itemId: 'paquetage-de-cambrioleur', quantity: 1 },
      { itemId: 'pied-de-biche', quantity: 1 },
      { itemId: 'bourse', quantity: 1 },
    ],
    goldPieces: 15,
    feature: {
      name: 'Un contact qui tient',
      text: 'Tu connais quelqu’un qui fait passer un message ou une marchandise sans jamais poser de question.',
    },
    suggestedTraits: {
      traits: [
        'Je repère les sorties d’une pièce avant d’y entrer.',
        'Je parle peu et j’écoute beaucoup.',
        'Je trouve toujours une raison de rire, même mal placée.',
      ],
      ideals: [
        'Liberté. Les chaînes ne valent rien, celles des lois comprises.',
        'Honneur. Je ne vole jamais ceux qui n’ont rien.',
        'Redistribution. Ce que les riches ont de trop revient à d’autres.',
      ],
      bonds: [
        'Je rembourse une dette que je ne dirai à personne.',
        'Quelqu’un a pris ma place en prison ; je lui dois tout.',
        'Je garde une clé dont j’ignore encore la serrure.',
      ],
      flaws: [
        'Je ne sais pas résister à une porte fermée.',
        'Je mens même quand la vérité m’arrangerait.',
        'Je fuis à la première ombre, en abandonnant les autres.',
      ],
    },
    assembledFromGenericRules: true,
  },

  {
    id: 'artisan',
    name: 'Artisan',
    blurb: 'Tu as un métier dans les mains et une réputation qui te précède.',
    facts: [
      'Perspicacité, Persuasion',
      'Un outil de métier et une langue',
      'Paquetage d’explorateur, 15 po',
    ],
    skills: ['perspicacite', 'persuasion'],
    proficiencies: NO_PROFICIENCIES,
    choices: [
      {
        kind: 'tool',
        subject: 'tools',
        title: 'Ton métier',
        help: 'Celui que tu as appris jeune, et que tes mains n’oublieront pas.',
        pick: 1,
        from: [
          'outils-de-forgeron',
          'outils-de-brasseur',
          'outils-de-macon',
          'outils-de-charpentier',
          'outils-de-cordonnier',
          'outils-de-cuisinier',
          'outils-de-bijoutier',
        ],
      },
      {
        kind: 'language',
        subject: 'languages',
        title: 'La langue de tes clients',
        help: 'On commerce mieux quand on parle la langue d’en face.',
        pick: 1,
        from: ANY_LANGUAGE,
      },
    ],
    equipment: [
      { itemId: 'paquetage-d-explorateur', quantity: 1 },
      { itemId: 'marteau', quantity: 1 },
      { itemId: 'bourse', quantity: 1 },
    ],
    goldPieces: 15,
    feature: {
      name: 'La marque de l’atelier',
      text: 'Les gens de ton métier t’accueillent partout : tu peux travailler, manger et loger contre ton ouvrage.',
    },
    suggestedTraits: {
      traits: [
        'J’évalue le prix de tout ce que je vois, sans le vouloir.',
        'Je ne supporte pas le travail bâclé, même chez les autres.',
        'Je parle de mon métier bien plus longtemps qu’il ne faudrait.',
      ],
      ideals: [
        'Ouvrage. Une chose bien faite dure plus longtemps que celui qui l’a faite.',
        'Communauté. Une ville tient par ceux qui y travaillent.',
        'Ambition. Je veux qu’on cite mon nom dans cent ans.',
      ],
      bonds: [
        'Mon atelier est tout ce que j’ai bâti.',
        'Je dois mon apprentissage à un maître que j’ai déçu.',
        'Une pièce que j’ai faite a mal tourné ; je veux la retrouver.',
      ],
      flaws: [
        'Je ne délègue rien, jamais.',
        'Je préfère mon travail aux gens qui m’entourent.',
        'Je supporte très mal la critique.',
      ],
    },
    assembledFromGenericRules: true,
  },

  {
    id: 'marin',
    name: 'Marin',
    blurb: 'Tu as passé plus de nuits sur l’eau que sur la terre ferme.',
    facts: [
      'Athlétisme, Perception',
      'Outils de navigateur et une langue',
      'Corde et paquetage, 10 po',
    ],
    skills: ['athletisme', 'perception'],
    proficiencies: { ...NO_PROFICIENCIES, tools: ['outils-de-navigateur'] },
    choices: [
      {
        kind: 'language',
        subject: 'languages',
        title: 'La langue des ports',
        help: 'Dans une cale, on apprend vite à se faire comprendre.',
        pick: 1,
        from: ANY_LANGUAGE,
      },
    ],
    equipment: [
      { itemId: 'corde-de-chanvre', quantity: 1 },
      { itemId: 'sac-de-couchage', quantity: 1 },
      { itemId: 'gourde', quantity: 1 },
      { itemId: 'bourse', quantity: 1 },
    ],
    goldPieces: 10,
    feature: {
      name: 'Une place à bord',
      text: 'Tu trouves un passage pour toi et tes compagnons sur un navire marchand, en échange de bras sur le pont.',
    },
    suggestedTraits: {
      traits: [
        'Je jure comme on respire, sans même l’entendre.',
        'Je raconte la même histoire de tempête à qui veut l’entendre.',
        'Je dors mieux quand ça bouge.',
      ],
      ideals: [
        'Équipage. Le bateau ne tient que si chacun tient son poste.',
        'Découverte. Il y a toujours une côte que personne n’a vue.',
        'Liberté. Aucun port ne me gardera plus de trois jours.',
      ],
      bonds: [
        'Mon ancien capitaine m’a sauvé la vie ; je la lui dois encore.',
        'Je cherche un navire qui n’est jamais rentré.',
        'Ma paie va entière à une famille restée au port.',
      ],
      flaws: [
        'Je bois plus que de raison dès que je touche terre.',
        'Je résous les discussions par un pari stupide.',
        'Je n’obéis qu’à ceux qui ont navigué.',
      ],
    },
    assembledFromGenericRules: true,
  },

  {
    id: 'erudit',
    name: 'Érudit',
    blurb: 'Tu as passé des années dans les livres, et tu commences à en sortir.',
    facts: ['Arcanes, Histoire', 'Deux langues au choix', 'Paquetage de savant, 10 po'],
    skills: ['arcanes', 'histoire'],
    proficiencies: NO_PROFICIENCIES,
    choices: [
      {
        kind: 'language',
        subject: 'languages',
        title: 'Les langues de tes lectures',
        help: 'Les textes anciens s’écrivent rarement en commun.',
        pick: 2,
        from: ANY_LANGUAGE,
      },
    ],
    equipment: [
      { itemId: 'paquetage-de-savant', quantity: 1 },
      { itemId: 'bourse', quantity: 1 },
    ],
    goldPieces: 10,
    feature: {
      name: 'Où chercher',
      text: 'Tu ignores beaucoup de choses, mais tu sais toujours quel livre ouvrir ou qui aller interroger.',
    },
    suggestedTraits: {
      traits: [
        'Je corrige les gens à voix haute, même quand ça ne sert à rien.',
        'Je note tout ce que je vois d’inhabituel.',
        'Je m’émerveille d’un détail pendant que tout le monde attend.',
      ],
      ideals: [
        'Savoir. Comprendre le monde vaut mieux que le changer au hasard.',
        'Transmission. Ce qu’on apprend ne vaut que si on le passe.',
        'Vérité. Une belle théorie fausse reste fausse.',
      ],
      bonds: [
        'Une question sans réponse me tient éveillé depuis des années.',
        'Je dois protéger la bibliothèque qui m’a formé.',
        'J’ai perdu un manuscrit dont j’étais responsable.',
      ],
      flaws: [
        'Je crois toujours celui qui cite une source.',
        'Je néglige tout ce qui n’est pas mon sujet.',
        'Je suis incapable d’admettre que j’ignore quelque chose.',
      ],
    },
    assembledFromGenericRules: true,
  },

  {
    id: 'noble',
    name: 'Noble',
    blurb: 'Tu es né du bon côté d’une porte, et tu ne l’as pas choisi.',
    facts: [
      'Histoire, Persuasion',
      'Un jeu et une langue',
      'Paquetage de diplomate, 25 po',
    ],
    skills: ['histoire', 'persuasion'],
    proficiencies: NO_PROFICIENCIES,
    choices: [
      {
        kind: 'tool',
        subject: 'tools',
        title: 'Le jeu des salons',
        help: 'On se mesure autrement quand on ne peut pas se battre.',
        pick: 1,
        from: ['des-a-jouer', 'jeu-de-cartes'],
      },
      {
        kind: 'language',
        subject: 'languages',
        title: 'La langue de la cour voisine',
        help: 'On t’a fait apprendre celle du royaume d’à côté.',
        pick: 1,
        from: ANY_LANGUAGE,
      },
    ],
    equipment: [
      { itemId: 'paquetage-de-diplomate', quantity: 1 },
      { itemId: 'habits-de-ceremonie', quantity: 1 },
      { itemId: 'bourse', quantity: 1 },
    ],
    goldPieces: 25,
    feature: {
      name: 'On te reçoit',
      text: 'Ton nom t’ouvre la porte des gens bien nés : ils t’écoutent avant de décider ce qu’ils pensent de toi.',
    },
    suggestedTraits: {
      traits: [
        'Je remercie toujours, même ceux qui me servent mal.',
        'Je ne sais pas parler à quelqu’un sans le jauger.',
        'Je m’excuse de ma fortune dès qu’on l’évoque.',
      ],
      ideals: [
        'Devoir. Un rang se paie en obligations, pas en privilèges.',
        'Justice. La loi doit s’appliquer aussi à ceux qui l’écrivent.',
        'Famille. Mon nom passe avant moi.',
      ],
      bonds: [
        'Je ferai tout pour laver le nom de ma maison.',
        'Un serviteur m’a élevé mieux que mes parents.',
        'Je dois un mariage que je n’ai pas envie d’honorer.',
      ],
      flaws: [
        'Je crois sincèrement valoir mieux que les autres.',
        'Je dépense sans jamais compter.',
        'Je ne supporte pas qu’on me contredise en public.',
      ],
    },
    assembledFromGenericRules: true,
  },

  {
    id: 'ermite',
    name: 'Ermite',
    blurb: 'Tu as vécu à l’écart, assez longtemps pour que le silence te réponde.',
    facts: [
      'Médecine, Religion',
      'Matériel d’herboriste et une langue',
      'Nécessaire de route, 5 po',
    ],
    skills: ['medecine', 'religion'],
    proficiencies: { ...NO_PROFICIENCIES, tools: ['materiel-d-herboriste'] },
    choices: [
      {
        kind: 'language',
        subject: 'languages',
        title: 'Ce que tu as appris à lire',
        help: 'Loin des villes, on tombe sur des textes que personne ne lit plus.',
        pick: 1,
        from: ANY_LANGUAGE,
      },
    ],
    equipment: [
      { itemId: 'sac-de-couchage', quantity: 1 },
      { itemId: 'gourde', quantity: 1 },
      { itemId: 'rations', quantity: 5 },
      { itemId: 'bourse', quantity: 1 },
    ],
    goldPieces: 5,
    feature: {
      name: 'Ce que tu as compris là-haut',
      text: 'Ta solitude t’a mené à une vérité que personne d’autre ne connaît encore. À toi de décider laquelle.',
    },
    suggestedTraits: {
      traits: [
        'Je mets très longtemps à répondre à une question simple.',
        'Je préfère la compagnie des bêtes à celle des gens.',
        'Je dis exactement ce que je pense, sans y mettre les formes.',
      ],
      ideals: [
        'Contemplation. On comprend mieux le monde en s’en retirant.',
        'Bonté. Je soigne qui se présente, sans demander qui il est.',
        'Discipline. Le corps obéit à qui sait attendre.',
      ],
      bonds: [
        'Ma retraite est un lieu que je défendrai.',
        'Je cherche celui qui m’a poussé à partir.',
        'Je dois ma survie à un inconnu que je n’ai jamais revu.',
      ],
      flaws: [
        'J’ai perdu l’habitude des gens et je le montre.',
        'Je tiens ma révélation pour plus importante que tout le reste.',
        'Je ne sais pas demander de l’aide.',
      ],
    },
    assembledFromGenericRules: true,
  },

  {
    id: 'artiste-de-rue',
    name: 'Artiste de rue',
    blurb: 'Tu vis de ce que les passants veulent bien lâcher, et tu vis bien.',
    facts: [
      'Acrobaties, Représentation',
      'Instrument et un second outil',
      'Paquetage d’artiste, 15 po',
    ],
    skills: ['acrobaties', 'representation'],
    proficiencies: { ...NO_PROFICIENCIES, tools: ['instrument-de-musique'] },
    choices: [
      {
        kind: 'tool',
        subject: 'tools',
        title: 'Ton second numéro',
        help: 'Un tour de plus dans la manche, pour les soirs sans public.',
        pick: 1,
        from: ['kit-de-deguisement', 'des-a-jouer', 'jeu-de-cartes'],
      },
    ],
    equipment: [
      { itemId: 'paquetage-d-artiste', quantity: 1 },
      { itemId: 'habits-de-ceremonie', quantity: 1 },
      { itemId: 'bourse', quantity: 1 },
    ],
    goldPieces: 15,
    feature: {
      name: 'La salle est avec toi',
      text: 'Là où tu as joué, on te loge et on te nourrit ; les gens se souviennent de toi et t’aident volontiers.',
    },
    suggestedTraits: {
      traits: [
        'Je transforme n’importe quelle attente en spectacle.',
        'Je connais une chanson pour chaque ville traversée.',
        'Je remarque tout de suite qui, dans une pièce, ne me regarde pas.',
      ],
      ideals: [
        'Beauté. Ce qui est beau justifie qu’on s’en donne la peine.',
        'Générosité. On donne son art, on ne le vend pas.',
        'Gloire. Je veux qu’on retienne mon nom.',
      ],
      bonds: [
        'Ma troupe s’est dispersée ; je la cherche encore.',
        'Un public m’a sauvé d’une foule hostile, une fois.',
        'Mon instrument me vient de quelqu’un que j’ai perdu.',
      ],
      flaws: [
        'Je ne supporte pas qu’on m’ignore.',
        'Je promets bien plus que je ne peux tenir.',
        'Je fuis dès qu’une situation cesse d’être amusante.',
      ],
    },
    assembledFromGenericRules: true,
  },

  {
    id: 'gamin-des-rues',
    name: 'Gamin des rues',
    blurb: 'Tu as grandi dehors, entre les caves et les toits, et tu as tenu.',
    facts: [
      'Discrétion, Escamotage',
      'Kit de déguisement et un outil',
      'Nécessaire de route, 5 po',
    ],
    skills: ['discretion', 'escamotage'],
    proficiencies: { ...NO_PROFICIENCIES, tools: ['kit-de-deguisement'] },
    choices: [
      {
        kind: 'tool',
        subject: 'tools',
        title: 'Ce que la rue t’a appris',
        help: 'Un savoir-faire ramassé à force de nécessité.',
        pick: 1,
        from: ['outils-de-voleur', 'des-a-jouer', 'jeu-de-cartes'],
      },
    ],
    equipment: [
      { itemId: 'sac-de-couchage', quantity: 1 },
      { itemId: 'boite-a-amadou', quantity: 1 },
      { itemId: 'bourse', quantity: 1 },
    ],
    goldPieces: 5,
    feature: {
      name: 'Les passages qu’on ne montre pas',
      text: 'Tu traverses une ville deux fois plus vite que quiconque, par les toits, les caves et les cours qu’on ne signale pas.',
    },
    suggestedTraits: {
      traits: [
        'Je cache de la nourriture partout, par réflexe.',
        'Je parle aux enfants avant de parler aux adultes.',
        'Je ne reste jamais dos à une porte.',
      ],
      ideals: [
        'Entraide. Ceux qui n’ont rien se doivent tout.',
        'Survie. Rien ne vaut la peine de mourir.',
        'Changement. Ce qui m’est arrivé ne doit arriver à personne d’autre.',
      ],
      bonds: [
        'Je nourris encore ceux qui m’ont nourri.',
        'Je cherche la famille dont on m’a séparé.',
        'Un quartier entier compte sur moi sans que je le dise.',
      ],
      flaws: [
        'Je vole par habitude, même quand je n’en ai pas besoin.',
        'Je ne fais confiance à personne au-dessus de moi.',
        'Je pars sans prévenir dès que ça sent mauvais.',
      ],
    },
    assembledFromGenericRules: true,
  },

  {
    id: 'coureur-des-bois',
    name: 'Coureur des bois',
    blurb: 'Tu connais les chemins qui ne figurent sur aucune carte.',
    facts: ['Nature, Survie', 'Un outil et une langue', 'Paquetage d’explorateur, 10 po'],
    skills: ['nature', 'survie'],
    proficiencies: NO_PROFICIENCIES,
    choices: [
      {
        kind: 'tool',
        subject: 'tools',
        title: 'Ce que tu emportes',
        help: 'Un savoir-faire qui rend les longues marches supportables.',
        pick: 1,
        from: ['materiel-d-herboriste', 'instrument-de-musique'],
      },
      {
        kind: 'language',
        subject: 'languages',
        title: 'La langue des gens d’ici',
        help: 'Les vallées ne parlent pas toutes la même.',
        pick: 1,
        from: ANY_LANGUAGE,
      },
    ],
    equipment: [
      { itemId: 'paquetage-d-explorateur', quantity: 1 },
      { itemId: 'corde-de-chanvre', quantity: 1 },
      { itemId: 'sac-de-couchage', quantity: 1 },
    ],
    goldPieces: 10,
    feature: {
      name: 'Tu sais où va la route',
      text: 'Tu retrouves ton chemin, l’eau potable et le gibier là où d’autres tourneraient en rond pendant des jours.',
    },
    suggestedTraits: {
      traits: [
        'Je m’oriente avant même de savoir où je vais.',
        'Je supporte mal les plafonds et les portes closes.',
        'Je remarque une trace bien avant de remarquer une personne.',
      ],
      ideals: [
        'Nature. On prend ce qu’il faut, jamais plus.',
        'Hospitalité. On ne refuse pas le feu à un voyageur.',
        'Indépendance. Je ne dois rien à aucune ville.',
      ],
      bonds: [
        'Une vallée m’a élevé ; je la défendrai.',
        'Je suis un chemin qu’un mort m’a décrit.',
        'Une bête m’accompagne depuis si longtemps que je la crois mienne.',
      ],
      flaws: [
        'Je méprise ceux qui n’ont jamais dormi dehors.',
        'Je pars devant sans attendre le groupe.',
        'Je tranche les problèmes bien trop directement.',
      ],
    },
    assembledFromGenericRules: true,
  },

  {
    id: 'charlatan',
    name: 'Charlatan',
    blurb: 'Tu vends des remèdes qui ne soignent rien, et on t’en redemande.',
    facts: [
      'Escamotage, Supercherie',
      'Kit de faussaire et de déguisement',
      'Paquetage de diplomate, 15 po',
    ],
    skills: ['escamotage', 'supercherie'],
    proficiencies: {
      ...NO_PROFICIENCIES,
      tools: ['kit-de-faussaire', 'kit-de-deguisement'],
    },
    choices: [],
    equipment: [
      { itemId: 'paquetage-de-diplomate', quantity: 1 },
      { itemId: 'habits-de-ceremonie', quantity: 1 },
      { itemId: 'bourse', quantity: 1 },
    ],
    goldPieces: 15,
    feature: {
      name: 'Un autre nom qui tient',
      text: 'Tu entretiens une seconde identité complète : des papiers, des habitudes, et des gens prêts à jurer qu’ils te connaissent sous ce nom.',
    },
    suggestedTraits: {
      traits: [
        'Je trouve un compliment sincère à faire à n’importe qui.',
        'Je change d’accent selon la ville.',
        'J’ai une histoire toute prête pour chaque question gênante.',
      ],
      ideals: [
        'Indépendance. Personne ne décide de ce que je vaux.',
        'Justice. Je ne prends qu’à ceux qui volent déjà les autres.',
        'Talent. Ce que je fais demande plus d’art qu’on ne le croit.',
      ],
      bonds: [
        'Quelqu’un m’a démasqué et m’a laissé partir ; je le lui revaudrai.',
        'Je dois de l’argent à des gens très patients.',
        'Je protège quelqu’un qui ignore tout de ce que je suis.',
      ],
      flaws: [
        'Je ne peux pas laisser passer une occasion facile.',
        'Je crois mes propres mensonges au bout d’un moment.',
        'Je m’enfuis dès qu’on commence à poser les bonnes questions.',
      ],
    },
    assembledFromGenericRules: true,
  },
  {
    id: 'personnalise',
    name: 'Personnalisé',
    blurb: 'Tu composes ton passé toi-même, à partir des règles générales.',
    facts: ['Deux compétences au choix', 'Deux outils ou langues', '15 po'],
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
      {
        kind: 'tool',
        subject: 'tools',
        title: 'Ton métier ou ton passe-temps',
        help: 'Un outil que tu sais manier depuis longtemps.',
        pick: 1,
        from: ALL_TOOLS,
      },
      {
        kind: 'language',
        subject: 'languages',
        title: 'Une langue de ton passé',
        help: 'Celle de ta région, de ton commerce ou de ceux qui t’ont élevé.',
        pick: 1,
        from: ANY_LANGUAGE,
      },
    ],
    equipment: [
      { itemId: 'habits-de-ceremonie', quantity: 1 },
      { itemId: 'bourse', quantity: 1 },
    ],
    goldPieces: 15,
    feature: null,
    suggestedTraits: { traits: [], ideals: [], bonds: [], flaws: [] },
    assembledFromGenericRules: true,
  },
];
