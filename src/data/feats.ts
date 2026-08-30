// Le SRD 5.1 ne publie qu'UN don, le Lutteur, et présente les dons comme une
// règle optionnelle. Les autres sont écrits pour Aventurine sur la même forme :
// un titre, une phrase d'ambiance, trois repères, un texte de règle court.
// Aucun ne reprend un don du Player's Handbook. Voir CLAUDE.md, « Sources et
// droits ».
import type { Feat } from '../domain/content';

export const FEAT_ENTRIES: readonly Feat[] = [
  {
    id: 'lutteur',
    name: 'Lutteur',
    blurb: 'Tu sais attraper quelqu’un et ne plus le lâcher.',
    facts: ['Force 13 requise', 'Avantage sur l’agrippé', 'Immobilise à deux'],
    text: 'Tu as l’avantage à tes attaques contre une créature que tu agrippes, et tu peux tenter de vous immobiliser tous les deux.',
    fromSrd: true,
  },

  {
    id: 'pied-sur',
    name: 'Pied sûr',
    blurb: 'Le terrain qui fait tomber les autres ne te ralentit pas.',
    facts: ['+1 Dextérité', 'Terrain difficile ignoré', 'Chutes amorties'],
    text: 'Tu gagnes +1 en Dextérité. Le terrain difficile ne coûte plus de déplacement supplémentaire, et tu réduis de moitié les dégâts d’une chute.',
    fromSrd: false,
  },

  {
    id: 'souffle-long',
    name: 'Souffle long',
    blurb: 'Tu tiens debout après tout le monde.',
    facts: ['+1 Constitution', '+2 points de vie', 'Avantage contre l’épuisement'],
    text: 'Tu gagnes +1 en Constitution et 2 points de vie supplémentaires. Tu as l’avantage aux jets contre l’épuisement.',
    fromSrd: false,
  },

  {
    id: 'oeil-exerce',
    name: 'Œil exercé',
    blurb: 'Tu remarques ce que les autres traversent sans voir.',
    facts: ['+1 Sagesse', 'Perception passive +5', 'Fouille rapide'],
    text: 'Tu gagnes +1 en Sagesse et +5 à ta Perception passive. Fouiller une pièce te prend deux fois moins de temps.',
    fromSrd: false,
  },

  {
    id: 'main-preste',
    name: 'Main preste',
    blurb: 'Tes doigts vont plus vite que le regard d’en face.',
    facts: ['+1 Dextérité', 'Escamotage en action bonus', 'Outils sans matériel'],
    text: 'Tu gagnes +1 en Dextérité. Tu peux tenter un escamotage en action bonus, et te servir d’outils de voleur sans les avoir en main.',
    fromSrd: false,
  },

  {
    id: 'voix-qui-porte',
    name: 'Voix qui porte',
    blurb: 'On t’écoute avant même de savoir pourquoi.',
    facts: ['+1 Charisme', 'Relance sociale', 'Une langue de plus'],
    text: 'Tu gagnes +1 en Charisme et une langue supplémentaire. Une fois par repos court, tu relances un jet de Persuasion ou d’Intimidation raté.',
    fromSrd: false,
  },

  {
    id: 'lecteur-de-signes',
    name: 'Lecteur de signes',
    blurb: 'Un symbole, une trace, une odeur : tout te dit quelque chose.',
    facts: ['+1 Intelligence', 'Deux compétences', 'Traces persistantes'],
    text: 'Tu gagnes +1 en Intelligence et la maîtrise d’Investigation et de Survie. Tu suis une piste vieille d’un jour de plus que quiconque.',
    fromSrd: false,
  },

  {
    id: 'garde-haute',
    name: 'Garde haute',
    blurb: 'Tu encaisses là où les autres reculent.',
    facts: ['+1 Force', 'CA +1 avec bouclier', 'Riposte au désengagement'],
    text: 'Tu gagnes +1 en Force. Avec un bouclier, ta classe d’armure augmente de 1, et tu attaques une créature qui se désengage de toi.',
    fromSrd: false,
  },

  {
    id: 'geste-sur',
    name: 'Geste sûr',
    blurb: 'Ta magie ne tremble pas, même sous les coups.',
    facts: ['+1 dans une carac.', 'Concentration protégée', 'Incantation d’une main'],
    text: 'Tu gagnes +1 en Intelligence, Sagesse ou Charisme — celle qui porte tes sorts. Tu as l’avantage aux jets de concentration, et tu incantes une main occupée.',
    fromSrd: false,
  },
];
