// Contenu dérivé du SRD 5.1 (CC BY 4.0), traduction Aventurine.
import type { CharacterClass } from '../../domain/content';
import {
  ADVANCEMENTS,
  equipmentChoice,
  equipmentOption,
  item,
  proficiencies,
  skillChoice,
  spellChoice,
  subclassChoice,
} from './helpers';

/**
 * Paladin et rôdeur ne lancent aucun sort au niveau 1 : leur table
 * d'emplacements est vide à ce niveau-là, et la fiche n'affiche donc pas de
 * bloc Magie tant qu'elle l'est. Leur magie s'ouvre d'elle-même au niveau 2.
 *
 * Le paladin prépare depuis toute la liste de sa classe, comme le clerc : rien
 * à choisir dans l'assistant. Le rôdeur, lui, connaît ses sorts par cœur.
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
      level: 1,
      name: 'Sens divin',
      text: 'En action, jusqu’à la fin de ton tour suivant, tu repères tout céleste, fiélon ou mort-vivant à 18 m sans couverture totale, et son type. Autant de fois que 1 + ton Charisme, par repos long.',
    },
    {
      level: 1,
      name: 'Imposition des mains',
      text: 'Une réserve de soins égale à cinq fois ton niveau, rendue par un repos long. En action, tu en dépenses ce que tu veux au toucher ; 5 points guérissent une maladie ou neutralisent un poison.',
    },
    {
      level: 2,
      name: 'Style de combat',
      text: 'Une façon de te battre qui te donne un bonus précis : +1 en classe d’armure, +2 aux dégâts à une arme, et d’autres. Tu la choisis à l’écran suivant.',
    },
    {
      level: 2,
      name: 'Châtiment divin',
      text: 'Sur une touche en mêlée, tu brûles un emplacement de sort pour +2d8 de dégâts radiants, +1d8 par niveau d’emplacement au-dessus du premier, jusqu’à 5d8. Un dé de plus contre un mort-vivant ou un fiélon.',
    },
    {
      level: 3,
      name: 'Serment sacré',
      text: 'La promesse qui te tient : dévotion, ancêtres, vengeance. Elle ajoute des sorts toujours préparés et des aptitudes aux niveaux 3, 7, 15 et 20.',
    },
    {
      level: 3,
      name: 'Conduit divin',
      text: 'Une fois par repos court ou long, ton serment te prête un effet qui lui est propre. Son degré de sauvegarde est celui de tes sorts.',
    },
    {
      level: 3,
      name: 'Santé divine',
      text: 'Tu es immunisé aux maladies.',
    },
    {
      level: 5,
      name: 'Attaque supplémentaire',
      text: 'Tu attaques deux fois quand tu prends l’action d’attaque.',
    },
    {
      level: 6,
      name: 'Aura de protection',
      text: 'Toi et tes alliés à 3 m ajoutez ton Charisme, au minimum +1, à toutes vos sauvegardes, tant que tu es conscient. La portée passe à 9 m au niveau 18.',
    },
    {
      level: 10,
      name: 'Aura de courage',
      text: 'Personne ne peut être effrayé dans ton aura de 3 m tant que tu es conscient. La portée passe à 9 m au niveau 18.',
    },
    {
      level: 11,
      name: 'Châtiment divin amélioré',
      text: 'Toutes tes touches en mêlée ajoutent 1d8 radiant, sans rien dépenser, et ce dé s’ajoute à ton châtiment divin.',
    },
    {
      level: 14,
      name: 'Toucher purificateur',
      text: 'En action, tu mets fin à un sort sur toi ou sur une créature consentante que tu touches. Autant de fois que ton Charisme, au minimum une, par repos long.',
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
  spellcasting: {
    ability: 'charisme',
    progression: 'half',
    preparation: 'prepared',
    ritual: false,
  },
  subclasses: [
    {
      id: 'serment-de-devotion',
      name: 'Serment de dévotion',
      blurb: 'Le paladin du livre d’images : honnêteté, courage, compassion.',
      facts: ['Arme sacrée', 'Aura anti-charme', 'Nimbe au niveau 20'],
      features: [
        {
          level: 3,
          name: 'Conduit divin : arme sacrée',
          text: 'En action, une minute durant, ton arme ajoute ton Charisme aux attaques, au minimum +1, compte comme magique et éclaire sur 6 m.',
        },
        {
          level: 3,
          name: 'Conduit divin : renvoi de l’impie',
          text: 'En action, chaque fiélon et mort-vivant à 9 m qui te voit ou t’entend fuit une minute s’il rate sa sauvegarde de Sagesse.',
        },
        {
          level: 7,
          name: 'Aura de dévotion',
          text: 'Toi et tes alliés à 3 m ne pouvez pas être charmés tant que tu es conscient. La portée passe à 9 m au niveau 18.',
        },
        {
          level: 15,
          name: 'Pureté d’âme',
          text: 'Tu es en permanence sous protection contre le mal et le bien.',
        },
        {
          level: 20,
          name: 'Nimbe sacré',
          text: 'En action, une minute durant, tu brilles sur 9 m : tes ennemis dans la lumière subissent 10 radiants par tour et te ciblent avec désavantage. Une fois par repos long.',
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
    'Ton serment sacré',
    'La promesse qui te tient. Elle te donnera des aptitudes aux niveaux 3, 7, 15 et 20.',
  ),
  advancements: ADVANCEMENTS,
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
      level: 1,
      name: 'Ennemi juré',
      text: 'Un type de créature que tu pistes avec l’avantage, et sur lequel tu retiens tout ce que tu apprends. Tu parles une de ses langues. Un deuxième type au niveau 6, un troisième au 14.',
    },
    {
      level: 1,
      name: 'Explorateur né',
      text: 'Un terrain où ton bonus de maîtrise compte double sur tes tests d’Intelligence et de Sagesse. En voyage, tu n’y es jamais ralenti ni perdu, tu restes en alerte et tu trouves deux fois plus de nourriture. Un deuxième terrain au niveau 6, un troisième au 10.',
    },
    {
      level: 2,
      name: 'Style de combat',
      text: 'Une façon de te battre qui te donne un bonus précis : +2 aux attaques à distance, +1 en classe d’armure, et d’autres. Tu la choisis à l’écran suivant.',
    },
    {
      level: 3,
      name: 'Archétype de rôdeur',
      text: 'La spécialité que tu t’es faite : chasseur, maître des bêtes. Elle te donne des aptitudes aux niveaux 3, 7, 11 et 15.',
    },
    {
      level: 3,
      name: 'Conscience primitive',
      text: 'En action, tu brûles un emplacement pour sentir, pendant une minute par niveau d’emplacement, la présence d’aberrations, de célestes, de dragons, d’élémentaires, de fées, de fiélons ou de morts-vivants à 1,5 km, ou 10 km sur ton terrain de prédilection. Sans nombre ni position.',
    },
    {
      level: 5,
      name: 'Attaque supplémentaire',
      text: 'Tu attaques deux fois quand tu prends l’action d’attaque.',
    },
    {
      level: 8,
      name: 'Foulée aisée',
      text: 'Le terrain difficile naturel ne te coûte rien, et les plantes ne te ralentissent ni ne te blessent. Avantage contre les plantes animées par magie.',
    },
    {
      level: 10,
      name: 'Camouflage naturel',
      text: 'Une minute à te couvrir de boue et de feuilles : plaqué contre une surface aussi haute et large que toi, tu gagnes +10 en Discrétion tant que tu ne bouges ni n’agis.',
    },
    {
      level: 14,
      name: 'Disparition',
      text: 'Tu te caches en action bonus, et aucun moyen non magique ne suit ta trace, sauf si tu en laisses une exprès.',
    },
    {
      level: 18,
      name: 'Sens féroces',
      text: 'Attaquer une créature que tu ne vois pas ne te donne plus de désavantage, et tu repères toute créature invisible à 9 m si elle ne se cache pas et que tu n’es ni aveuglé ni assourdi.',
    },
    {
      level: 20,
      name: 'Tueur d’ennemis',
      text: 'Une fois par tour, tu ajoutes ta Sagesse à l’attaque ou aux dégâts contre un de tes ennemis jurés, avant ou après le jet.',
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
    spellChoice(
      'rodeur',
      // SRD, table du rôdeur : « Spells Known ». Rien avant le niveau 2.
      [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11],
      'Les sorts que tu as appris dehors, à force de marcher et d’observer.',
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
  spellcasting: {
    ability: 'sagesse',
    progression: 'half',
    preparation: 'known',
    ritual: false,
  },
  subclasses: [
    {
      id: 'chasseur',
      name: 'Chasseur',
      blurb: 'Tu choisis à chaque palier comment tu abats ta proie.',
      facts: ['Proie au choix', 'Défense au choix', 'Attaque multiple'],
      features: [
        {
          level: 3,
          name: 'Proie du chasseur',
          text: 'Une option au choix : +1d8 sur une cible déjà blessée, une riposte contre les créatures de grande taille, ou une seconde attaque sur un voisin de ta cible.',
        },
        {
          level: 7,
          name: 'Tactique défensive',
          text: 'Une option au choix : les attaques d’opportunité contre toi ont le désavantage, +4 en classe d’armure contre celui qui vient de te toucher, ou l’avantage contre la frayeur.',
        },
        {
          level: 11,
          name: 'Attaque multiple',
          text: 'Une option au choix : une salve à distance sur toutes les créatures autour d’un point, ou une attaque de mêlée sur tout ce qui t’entoure.',
        },
        {
          level: 15,
          name: 'Défense supérieure',
          text: 'Une option au choix : l’évasion, renvoyer sur un autre l’attaque de celui qui te rate, ou réduire de moitié les dégâts d’un coup que tu vois venir.',
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
    'Ton archétype de rôdeur',
    'La spécialité que tu t’es faite. Elle te donnera des aptitudes aux niveaux 3, 7, 11 et 15.',
  ),
  advancements: ADVANCEMENTS,
};
