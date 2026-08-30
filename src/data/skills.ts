// Contenu dérivé du SRD 5.1 (CC BY 4.0) — traduction Aventurine.
import type { Skill } from '../domain/content';

export const SKILL_ENTRIES: readonly Skill[] = [
  {
    id: 'acrobaties',
    name: 'Acrobaties',
    ability: 'dexterite',
    usage: 'Garder l’équilibre, amortir une chute, se dégager.',
  },
  {
    id: 'arcanes',
    name: 'Arcanes',
    ability: 'intelligence',
    usage: 'Reconnaître un sort, un symbole magique, un plan d’existence.',
  },
  {
    id: 'athletisme',
    name: 'Athlétisme',
    ability: 'force',
    usage: 'Escalader, nager, sauter, agripper.',
  },
  {
    id: 'discretion',
    name: 'Discrétion',
    ability: 'dexterite',
    usage: 'Se cacher, avancer sans bruit, suivre sans être vu.',
  },
  {
    id: 'dressage',
    name: 'Dressage',
    ability: 'sagesse',
    usage: 'Calmer une monture, comprendre l’humeur d’une bête.',
  },
  {
    id: 'escamotage',
    name: 'Escamotage',
    ability: 'dexterite',
    usage: 'Faire les poches, dissimuler un objet, un tour de main.',
  },
  {
    id: 'histoire',
    name: 'Histoire',
    ability: 'intelligence',
    usage: 'Se souvenir d’un royaume, d’une guerre, d’une lignée.',
  },
  {
    id: 'intimidation',
    name: 'Intimidation',
    ability: 'charisme',
    usage: 'Menacer, imposer le silence, faire parler.',
  },
  {
    id: 'investigation',
    name: 'Investigation',
    ability: 'intelligence',
    usage: 'Fouiller une pièce, recouper des indices, trouver le mécanisme.',
  },
  {
    id: 'medecine',
    name: 'Médecine',
    ability: 'sagesse',
    usage: 'Stabiliser un mourant, reconnaître une maladie.',
  },
  {
    id: 'nature',
    name: 'Nature',
    ability: 'intelligence',
    usage: 'Connaître les plantes, les bêtes, les saisons, le terrain.',
  },
  {
    id: 'perception',
    name: 'Perception',
    ability: 'sagesse',
    usage: 'Voir, entendre, remarquer ce qui cloche.',
  },
  {
    id: 'perspicacite',
    name: 'Perspicacité',
    ability: 'sagesse',
    usage: 'Deviner une intention, sentir un mensonge.',
  },
  {
    id: 'persuasion',
    name: 'Persuasion',
    ability: 'charisme',
    usage: 'Convaincre de bonne foi, négocier, apaiser.',
  },
  {
    id: 'religion',
    name: 'Religion',
    ability: 'intelligence',
    usage: 'Reconnaître un rite, un dieu, un symbole sacré.',
  },
  {
    id: 'representation',
    name: 'Représentation',
    ability: 'charisme',
    usage: 'Chanter, jouer, danser, tenir une salle.',
  },
  {
    id: 'supercherie',
    name: 'Supercherie',
    ability: 'charisme',
    usage: 'Mentir avec aplomb, se faire passer pour un autre.',
  },
  {
    id: 'survie',
    name: 'Survie',
    ability: 'sagesse',
    usage: 'Pister, s’orienter, chasser, éviter les dangers naturels.',
  },
];
