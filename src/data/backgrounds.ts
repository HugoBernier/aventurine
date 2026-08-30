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
