// Contenu dérivé du SRD 5.1 (CC BY 4.0) — traduction Aventurine.
import type { CharacterClass } from '../../domain/content';
import {
  equipmentChoice,
  equipmentOption,
  item,
  proficiencies,
  skillChoice,
} from './helpers';

/**
 * Paladin et rôdeur ne lancent aucun sort au niveau 1 : leur `spellcasting`
 * reste `null`, et la fiche n'affiche donc pas de bloc Magie. C'est correct
 * au regard des règles, et cela évite un bloc vide qui ferait croire à un bug.
 */
export const PALADIN: CharacterClass = {
  id: 'paladin',
  name: 'Paladin',
  blurb: 'Un serment, une lourde armure, et de quoi soigner par imposition des mains.',
  facts: ['Dé de vie d10', 'Sagesse + Charisme', 'Toutes armures, tous boucliers'],
  hitDie: 10,
  saves: ['sagesse', 'charisme'],
  proficiencies: proficiencies({
    armor: ['legere', 'intermediaire', 'lourde', 'bouclier'],
    weaponCategories: ['courantes', 'de-guerre'],
  }),
  unarmoredDefense: null,
  features: [
    {
      name: 'Sens divin',
      text: 'Tu repères les célestes, les fiélons et les morts-vivants à 18 mètres.',
    },
    {
      name: 'Imposition des mains',
      text: 'Une réserve de soins de 5 points, que tu distribues comme tu veux.',
    },
  ],
  choices: [
    skillChoice(
      'Tes compétences de paladin',
      'Deux domaines qui servent ton serment autant que ton bras.',
      2,
      [
        'athletisme',
        'perspicacite',
        'intimidation',
        'medecine',
        'persuasion',
        'religion',
      ],
    ),
    equipmentChoice(
      'equipment-1',
      'Ton arme et ta main libre',
      'Une arme et un bouclier, ou deux armes.',
      ['arme-bouclier-paladin', 'deux-armes-paladin'],
    ),
  ],
  equipmentOptions: [
    equipmentOption(
      'arme-bouclier-paladin',
      'Une épée longue et un bouclier',
      'Le classique du serment : on frappe, on protège.',
      ['1d8 tranchant', '+2 en classe d’armure', 'Corps à corps'],
      [item('epee-longue'), item('bouclier')],
    ),
    equipmentOption(
      'deux-armes-paladin',
      'Deux épées courtes',
      'Plus mobile, plus offensif.',
      ['1d6 perforant', 'Finesse, légère', 'Corps à corps'],
      [item('epee-courte', 2)],
    ),
  ],
  fixedEquipment: [
    item('javeline', 5),
    item('cotte-de-mailles'),
    item('symbole-sacre'),
    item('paquetage-de-pretre'),
  ],
  spellcasting: null,
  subclass: null,
};

export const RANGER: CharacterClass = {
  id: 'rodeur',
  name: 'Rôdeur',
  blurb: 'Tu connais le terrain, tu connais tes proies, et tu tires juste.',
  facts: ['Dé de vie d10', 'Force + Dextérité', 'Trois compétences au choix'],
  hitDie: 10,
  saves: ['force', 'dexterite'],
  proficiencies: proficiencies({
    armor: ['legere', 'intermediaire', 'bouclier'],
    weaponCategories: ['courantes', 'de-guerre'],
  }),
  unarmoredDefense: null,
  features: [
    {
      name: 'Ennemi juré',
      text: 'Tu pistes un type de créature avec l’avantage, et tu parles sa langue.',
    },
    {
      name: 'Explorateur né',
      text: 'Un terrain que tu connais ne te ralentit pas et ne t’égare pas.',
    },
  ],
  choices: [
    skillChoice(
      'Tes compétences de rôdeur',
      'Trois domaines appris dehors, loin des routes.',
      3,
      [
        'dressage',
        'athletisme',
        'perspicacite',
        'investigation',
        'nature',
        'perception',
        'discretion',
        'survie',
      ],
    ),
    equipmentChoice(
      'equipment-1',
      'Ton armure',
      'Ce que tu portes décide de ta classe d’armure.',
      ['ecailles-rodeur', 'cuir-rodeur'],
    ),
    equipmentChoice(
      'equipment-2',
      'Tes armes de corps à corps',
      'Deux lames courtes, ou deux armes courantes.',
      ['deux-epees-rodeur', 'deux-armes-simples-rodeur'],
    ),
  ],
  equipmentOptions: [
    equipmentOption(
      'ecailles-rodeur',
      'Une armure d’écailles',
      'Plus solide, au prix de la discrétion.',
      ['CA 14 + Dex (max 2)', 'Intermédiaire', 'Désavantage en Discrétion'],
      [item('armure-d-ecailles')],
    ),
    equipmentOption(
      'cuir-rodeur',
      'Une armure de cuir',
      'Légère : tout ton bonus de Dextérité compte.',
      ['CA 11 + Dex', 'Légère', 'Aucune gêne'],
      [item('armure-de-cuir')],
    ),
    equipmentOption(
      'deux-epees-rodeur',
      'Deux épées courtes',
      'Deux lames à finesse, pour frapper deux fois.',
      ['1d6 perforant', 'Finesse, légère', 'Corps à corps'],
      [item('epee-courte', 2)],
    ),
    equipmentOption(
      'deux-armes-simples-rodeur',
      'Deux lances',
      'Plus de portée, et elles se lancent.',
      ['1d6 perforant', 'Lancer', 'Polyvalente (1d8)'],
      [item('lance', 2)],
    ),
  ],
  fixedEquipment: [
    item('arc-long'),
    item('fleches'),
    item('carquois'),
    item('paquetage-d-explorateur'),
  ],
  spellcasting: null,
  subclass: null,
};
