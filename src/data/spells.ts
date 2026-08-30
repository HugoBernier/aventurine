// Contenu dérivé du SRD 5.1 (CC BY 4.0) — traduction Aventurine.
import type { MagicSchool, Spell } from '../domain/content';

interface Draft {
  readonly id: string;
  readonly name: string;
  readonly school: MagicSchool;
  readonly time?: string;
  readonly range: string;
  readonly v?: false;
  readonly s?: false;
  readonly m?: string;
  readonly duration?: string;
  readonly concentration?: true;
  readonly ritual?: true;
  readonly summary: string;
  readonly classes: readonly string[];
}

const spell =
  (level: 0 | 1) =>
  (draft: Draft): Spell => ({
    id: draft.id,
    name: draft.name,
    level,
    school: draft.school,
    castingTime: draft.time ?? '1 action',
    range: draft.range,
    components: {
      verbal: draft.v !== false,
      somatic: draft.s !== false,
      material: draft.m ?? null,
    },
    duration: draft.duration ?? 'instantanée',
    concentration: draft.concentration === true,
    ritual: draft.ritual === true,
    summary: draft.summary,
    classes: draft.classes,
  });

const cantrip = spell(0);
const level1 = spell(1);

const ARCANE = ['ensorceleur', 'magicien'];

export const SPELL_ENTRIES: readonly Spell[] = [
  // ---------- Tours de magie ----------
  cantrip({
    id: 'lumiere',
    name: 'Lumière',
    school: 'evocation',
    range: 'contact',
    m: 'une luciole ou de la mousse phosphorescente',
    duration: '1 heure',
    summary:
      'Un objet que tu touches brille comme une torche sur 6 mètres. Une créature peut résister avec une sauvegarde de Dextérité.',
    classes: ['barde', 'clerc', 'ensorceleur', 'magicien'],
  }),
  cantrip({
    id: 'prestidigitation',
    name: 'Prestidigitation',
    school: 'transmutation',
    range: '3 mètres',
    duration: "jusqu'à 1 heure",
    summary:
      'De petits effets sans conséquence : une étincelle, une odeur, un objet nettoyé ou sali.',
    classes: ['barde', 'ensorceleur', 'magicien', 'occultiste'],
  }),
  cantrip({
    id: 'thaumaturgie',
    name: 'Thaumaturgie',
    school: 'transmutation',
    s: false,
    range: '9 mètres',
    duration: "jusqu'à 1 minute",
    summary:
      'Une manifestation divine mineure : ta voix tonne, les flammes vacillent, une porte claque.',
    classes: ['clerc'],
  }),
  cantrip({
    id: 'flamme-sacree',
    name: 'Flamme sacrée',
    school: 'evocation',
    range: '18 mètres',
    summary:
      'Une lumière brûlante tombe sur une créature : 1d8 dégâts radiants, sauvegarde de Dextérité pour éviter.',
    classes: ['clerc'],
  }),
  cantrip({
    id: 'assistance',
    name: 'Assistance',
    school: 'divination',
    range: 'contact',
    duration: 'concentration, 1 minute',
    concentration: true,
    summary: 'Ta cible ajoute 1d4 à un jet de caractéristique de son choix, une fois.',
    classes: ['clerc', 'druide'],
  }),
  cantrip({
    id: 'resistance',
    name: 'Résistance',
    school: 'abjuration',
    range: 'contact',
    m: 'une cape miniature',
    duration: 'concentration, 1 minute',
    concentration: true,
    summary: 'Ta cible ajoute 1d4 à un jet de sauvegarde, une fois.',
    classes: ['clerc', 'druide'],
  }),
  cantrip({
    id: 'trait-de-feu',
    name: 'Trait de feu',
    school: 'evocation',
    range: '36 mètres',
    summary:
      'Tu lances une flamme : 1d10 dégâts de feu au toucher, et les objets inflammables prennent feu.',
    classes: ARCANE,
  }),
  cantrip({
    id: 'rayon-de-givre',
    name: 'Rayon de givre',
    school: 'evocation',
    range: '18 mètres',
    summary:
      'Un trait de froid inflige 1d8 dégâts et réduit la vitesse de la cible de 3 mètres.',
    classes: ARCANE,
  }),
  cantrip({
    id: 'projection-acide',
    name: "Projection d'acide",
    school: 'invocation',
    range: '18 mètres',
    summary:
      'Une bulle d’acide éclabousse une cible, ou deux si elles sont côte à côte : 1d6 chacune, sauvegarde de Dextérité.',
    classes: ARCANE,
  }),
  cantrip({
    id: 'poigne-electrique',
    name: 'Poigne électrique',
    school: 'evocation',
    range: 'contact',
    summary:
      'Ta main libère un éclair : 1d8 dégâts de foudre, et la cible perd sa réaction.',
    classes: ARCANE,
  }),
  cantrip({
    id: 'main-du-mage',
    name: 'Main du mage',
    school: 'invocation',
    range: '9 mètres',
    duration: '1 minute',
    summary: 'Une main spectrale manipule des objets légers à distance.',
    classes: ['barde', 'ensorceleur', 'magicien', 'occultiste'],
  }),
  cantrip({
    id: 'illusion-mineure',
    name: 'Illusion mineure',
    school: 'illusion',
    v: false,
    m: 'un peu de laine',
    range: '9 mètres',
    duration: '1 minute',
    summary: 'Un son ou une image sans substance, que l’on perce à jour en l’étudiant.',
    classes: ['barde', 'ensorceleur', 'magicien', 'occultiste'],
  }),
  cantrip({
    id: 'moquerie-cruelle',
    name: 'Moquerie cruelle',
    school: 'enchantement',
    s: false,
    range: '18 mètres',
    summary:
      'Une insulte chargée de magie : 1d4 dégâts psychiques et désavantage à la prochaine attaque, sauvegarde de Sagesse.',
    classes: ['barde'],
  }),
  cantrip({
    id: 'druidisme',
    name: 'Druidisme',
    school: 'transmutation',
    range: '9 mètres',
    summary:
      'De petits effets naturels : prédire la météo, faire éclore une fleur, éteindre une flamme.',
    classes: ['druide'],
  }),
  cantrip({
    id: 'gourdin-magique',
    name: 'Gourdin magique',
    school: 'transmutation',
    m: 'du gui et une feuille de trèfle',
    time: '1 action bonus',
    range: 'contact',
    duration: 'concentration, 1 minute',
    concentration: true,
    summary:
      'Un gourdin devient magique : ses dégâts passent à 1d8 et suivent ta caractéristique d’incantation.',
    classes: ['druide'],
  }),
  cantrip({
    id: 'explosion-occulte',
    name: 'Explosion occulte',
    school: 'evocation',
    range: '36 mètres',
    summary:
      'Un trait d’énergie noire : 1d10 dégâts de force au toucher. Le sort emblématique de l’occultiste.',
    classes: ['occultiste'],
  }),
  cantrip({
    id: 'toucher-du-vampire',
    name: 'Contact glacial',
    school: 'necromancie',
    range: '36 mètres',
    duration: 'instantanée',
    summary:
      'Une main spectrale inflige 1d8 dégâts nécrotiques et empêche la cible de récupérer des points de vie.',
    classes: ARCANE,
  }),
  cantrip({
    id: 'reparation',
    name: 'Réparation',
    school: 'transmutation',
    m: 'deux aimants',
    time: '1 minute',
    range: 'contact',
    summary: 'Répare une déchirure ou une cassure unique dans un objet.',
    classes: ['barde', 'clerc', 'druide', 'ensorceleur', 'magicien'],
  }),
  cantrip({
    id: 'message',
    name: 'Message',
    school: 'transmutation',
    m: 'un fil de cuivre',
    range: '36 mètres',
    duration: '1 round',
    summary:
      'Tu murmures à une créature que tu vois ; elle seule t’entend et peut répondre.',
    classes: ARCANE,
  }),
  cantrip({
    id: 'aspersion-de-poison',
    name: 'Aspersion de poison',
    school: 'invocation',
    range: '3 mètres',
    summary:
      'Un gaz toxique : 1d12 dégâts de poison, sauvegarde de Constitution pour éviter.',
    classes: ARCANE,
  }),

  // ---------- Sorts de niveau 1 ----------
  level1({
    id: 'soin-des-blessures',
    name: 'Soin des blessures',
    school: 'evocation',
    range: 'contact',
    summary:
      'Ta cible récupère 1d8 + ton modificateur d’incantation points de vie. Sans effet sur les morts-vivants.',
    classes: ['barde', 'clerc', 'druide', 'paladin', 'rodeur'],
  }),
  level1({
    id: 'benediction',
    name: 'Bénédiction',
    school: 'enchantement',
    m: 'une goutte d’eau bénite',
    range: '9 mètres',
    duration: 'concentration, 1 minute',
    concentration: true,
    summary: 'Trois créatures ajoutent 1d4 à leurs jets d’attaque et leurs sauvegardes.',
    classes: ['clerc', 'paladin'],
  }),
  level1({
    id: 'projectile-magique',
    name: 'Projectile magique',
    school: 'evocation',
    range: '36 mètres',
    summary:
      'Trois fléchettes de force touchent automatiquement : 1d4 + 1 chacune, réparties comme tu veux.',
    classes: ARCANE,
  }),
  level1({
    id: 'bouclier',
    name: 'Bouclier',
    school: 'abjuration',
    time: '1 réaction',
    range: 'personnelle',
    duration: '1 round',
    summary:
      'En réaction à une attaque, tu gagnes +5 en classe d’armure et l’immunité au projectile magique.',
    classes: ARCANE,
  }),
  level1({
    id: 'mains-brulantes',
    name: 'Mains brûlantes',
    school: 'evocation',
    range: 'cône de 4,50 m',
    summary:
      'Une nappe de flammes : 3d6 dégâts de feu, moitié moins avec une sauvegarde de Dextérité.',
    classes: ARCANE,
  }),
  level1({
    id: 'charme-personne',
    name: 'Charme-personne',
    school: 'enchantement',
    range: '9 mètres',
    duration: '1 heure',
    summary:
      'Une créature te considère comme un ami, sauf sauvegarde de Sagesse. Elle le saura ensuite.',
    classes: ['barde', 'druide', 'ensorceleur', 'magicien', 'occultiste'],
  }),
  level1({
    id: 'detection-de-la-magie',
    name: 'Détection de la magie',
    school: 'divination',
    range: 'personnelle',
    duration: 'concentration, 10 minutes',
    concentration: true,
    ritual: true,
    summary: 'Tu perçois la magie à 9 mètres et son école d’origine.',
    classes: ['barde', 'clerc', 'druide', 'ensorceleur', 'magicien', 'paladin', 'rodeur'],
  }),
  level1({
    id: 'identification',
    name: 'Identification',
    school: 'divination',
    m: 'une perle et une plume de hibou',
    time: '1 minute',
    range: 'contact',
    ritual: true,
    summary:
      'Tu apprends les propriétés d’un objet magique et les sorts qui l’affectent.',
    classes: ['barde', 'magicien'],
  }),
  level1({
    id: 'armure-du-mage',
    name: 'Armure du mage',
    school: 'abjuration',
    m: 'un morceau de cuir tanné',
    range: 'contact',
    duration: '8 heures',
    summary:
      'Sans armure, la classe d’armure de la cible passe à 13 + son modificateur de Dextérité.',
    classes: ARCANE,
  }),
  level1({
    id: 'sommeil',
    name: 'Sommeil',
    school: 'enchantement',
    m: 'une pincée de sable fin',
    range: '27 mètres',
    duration: '1 minute',
    summary:
      '5d8 points de vie de créatures s’endorment, des plus faibles aux plus fortes.',
    classes: ['barde', 'ensorceleur', 'magicien'],
  }),
  level1({
    id: 'vague-tonnante',
    name: 'Vague tonnante',
    school: 'evocation',
    s: false,
    range: 'cube de 4,50 m',
    summary:
      'Une onde de choc : 2d8 dégâts de tonnerre et 3 mètres de recul, sauvegarde de Constitution.',
    classes: ['barde', 'druide', 'ensorceleur', 'magicien'],
  }),
  level1({
    id: 'nappe-de-brouillard',
    name: 'Nappe de brouillard',
    school: 'invocation',
    range: '36 mètres',
    duration: 'concentration, 1 heure',
    concentration: true,
    summary: 'Une sphère de brume de 6 mètres rend la zone lourdement obscurcie.',
    classes: ['druide', 'ensorceleur', 'magicien', 'rodeur'],
  }),
  level1({
    id: 'enchevetrement',
    name: 'Enchevêtrement',
    school: 'invocation',
    range: '27 mètres',
    duration: 'concentration, 1 minute',
    concentration: true,
    summary:
      'Des lianes jaillissent du sol et entravent tout ce qui entre dans un carré de 6 mètres.',
    classes: ['druide', 'rodeur'],
  }),
  level1({
    id: 'baies-nourricieres',
    name: 'Baies nourricières',
    school: 'transmutation',
    m: 'une branche de gui',
    range: 'contact',
    duration: '24 heures',
    summary:
      'Dix baies qui rendent 1 point de vie et nourrissent une créature pour la journée.',
    classes: ['druide', 'rodeur'],
  }),
  level1({
    id: 'mot-de-guerison',
    name: 'Mot de guérison',
    school: 'evocation',
    s: false,
    time: '1 action bonus',
    range: '18 mètres',
    summary:
      'À distance et en action bonus : 1d4 + ton modificateur d’incantation points de vie.',
    classes: ['barde', 'clerc', 'druide'],
  }),
  level1({
    id: 'sanctuaire',
    name: 'Sanctuaire',
    school: 'abjuration',
    m: 'un miroir d’argent',
    time: '1 action bonus',
    range: '9 mètres',
    duration: '1 minute',
    summary:
      'On hésite à attaquer ta cible : sauvegarde de Sagesse, sinon l’attaquant vise ailleurs.',
    classes: ['clerc'],
  }),
  level1({
    id: 'protection-mal-bien',
    name: 'Protection contre le mal et le bien',
    school: 'abjuration',
    m: 'de l’eau bénite',
    range: 'contact',
    duration: 'concentration, 10 minutes',
    concentration: true,
    summary:
      'Célestes, fiélons, morts-vivants et fées attaquent ta cible avec désavantage.',
    classes: ['clerc', 'magicien', 'paladin', 'occultiste'],
  }),
  level1({
    id: 'injonction',
    name: 'Injonction',
    school: 'enchantement',
    s: false,
    range: '18 mètres',
    duration: '1 round',
    summary:
      'Un mot d’ordre d’un seul mot que la cible exécute, sauf sauvegarde de Sagesse.',
    classes: ['clerc', 'paladin'],
  }),
  level1({
    id: 'faveur-divine',
    name: 'Faveur divine',
    school: 'evocation',
    time: '1 action bonus',
    range: 'personnelle',
    duration: 'concentration, 1 minute',
    concentration: true,
    summary: 'Tes armes infligent 1d4 dégâts radiants supplémentaires.',
    classes: ['paladin'],
  }),
  level1({
    id: 'heroisme',
    name: 'Héroïsme',
    school: 'enchantement',
    range: 'contact',
    duration: 'concentration, 1 minute',
    concentration: true,
    summary:
      'Ta cible ne peut plus être effrayée et gagne des points de vie temporaires à chaque tour.',
    classes: ['barde', 'paladin'],
  }),
  level1({
    id: 'flechette-acide',
    name: 'Trait ensorcelé',
    school: 'evocation',
    range: '36 mètres',
    summary: 'Un éclat d’énergie inflige 1d6 dégâts du type de ton choix parmi quatre.',
    classes: ['ensorceleur'],
  }),
  level1({
    id: 'grande-foulee',
    name: 'Grande foulée',
    school: 'transmutation',
    m: 'une racine de réglisse',
    time: '1 action bonus',
    range: 'contact',
    duration: 'concentration, 1 heure',
    concentration: true,
    summary: 'Ta cible double sa vitesse de saut.',
    classes: ['druide', 'rodeur', 'ensorceleur', 'magicien'],
  }),
  level1({
    id: 'compagnon-animal',
    name: 'Communication avec les animaux',
    school: 'divination',
    range: 'personnelle',
    duration: '10 minutes',
    ritual: true,
    summary: 'Tu comprends les bêtes et leur poses des questions simples.',
    classes: ['barde', 'druide', 'rodeur'],
  }),
  level1({
    id: 'deguisement',
    name: 'Déguisement',
    school: 'illusion',
    range: 'personnelle',
    duration: '1 heure',
    summary: 'Une illusion change ton apparence ; le toucher la révèle.',
    classes: ['barde', 'ensorceleur', 'magicien'],
  }),
  level1({
    id: 'saut-illusoire',
    name: 'Image silencieuse',
    school: 'illusion',
    m: 'un peu de laine',
    range: '18 mètres',
    duration: 'concentration, 10 minutes',
    concentration: true,
    summary: 'Une image immobile et sans son, de la taille d’un cube de 4,50 mètres.',
    classes: ['barde', 'ensorceleur', 'magicien'],
  }),
  level1({
    id: 'fou-rire',
    name: 'Fou rire',
    school: 'enchantement',
    m: 'de minuscules tartelettes',
    range: '9 mètres',
    duration: 'concentration, 1 minute',
    concentration: true,
    summary:
      'La cible s’effondre de rire, à terre et neutralisée, sauf sauvegarde de Sagesse.',
    classes: ['barde'],
  }),
  level1({
    id: 'malediction',
    name: 'Malédiction',
    school: 'enchantement',
    time: '1 action bonus',
    range: '27 mètres',
    duration: 'concentration, 1 minute',
    concentration: true,
    summary:
      'Tu ajoutes 1d6 à tes dégâts contre une cible et la retrouves plus facilement.',
    classes: ['occultiste'],
  }),
  level1({
    id: 'armure-d-agathys',
    name: 'Armure d’Agathys',
    school: 'abjuration',
    m: 'une coupe d’eau',
    range: 'personnelle',
    duration: '1 heure',
    summary:
      '5 points de vie temporaires, et 5 dégâts de froid à qui te frappe au corps à corps.',
    classes: ['occultiste'],
  }),
  level1({
    id: 'comprehension-des-langues',
    name: 'Compréhension des langues',
    school: 'divination',
    m: 'une pincée de suie et de sel',
    range: 'personnelle',
    duration: '1 heure',
    ritual: true,
    summary: 'Tu comprends toute langue parlée et tout texte écrit que tu touches.',
    classes: ['barde', 'ensorceleur', 'magicien', 'occultiste'],
  }),
  level1({
    id: 'chute-ralentie',
    name: 'Chute ralentie',
    school: 'transmutation',
    s: false,
    m: 'une petite plume',
    time: '1 réaction',
    range: '18 mètres',
    duration: '1 minute',
    summary: 'Jusqu’à cinq créatures tombent lentement et ne subissent aucun dégât.',
    classes: ['barde', 'ensorceleur', 'magicien'],
  }),
  level1({
    id: 'grease',
    name: 'Graisse',
    school: 'invocation',
    m: 'une couenne de lard',
    range: '18 mètres',
    duration: '1 minute',
    summary: 'Un carré de 3 mètres devient glissant : sauvegarde de Dextérité ou chute.',
    classes: ARCANE,
  }),
  level1({
    id: 'flechettes-de-feu',
    name: 'Bouclier de flammes',
    school: 'evocation',
    m: 'du miel vert',
    range: 'personnelle',
    duration: '10 minutes',
    summary:
      'Tu résistes au froid, tu éclaires, et qui te frappe subit 2d8 dégâts de feu.',
    classes: ARCANE,
  }),
  level1({
    id: 'trait-de-lumiere',
    name: 'Rayon de maladie',
    school: 'necromancie',
    range: '18 mètres',
    summary: 'Un rayon verdâtre : 2d8 dégâts nécrotiques et un possible empoisonnement.',
    classes: ARCANE,
  }),
  level1({
    id: 'purification-de-nourriture',
    name: 'Purification de nourriture et de boisson',
    school: 'transmutation',
    time: '1 action',
    range: '3 mètres',
    ritual: true,
    summary: 'Nourriture et boisson deviennent saines dans une sphère de 1,50 mètre.',
    classes: ['clerc', 'druide', 'paladin'],
  }),
  level1({
    id: 'alarme',
    name: 'Alarme',
    school: 'abjuration',
    m: 'une clochette et un fil d’argent',
    time: '1 minute',
    range: '9 mètres',
    duration: '8 heures',
    ritual: true,
    summary: 'Tu es averti dès qu’une créature entre dans la zone protégée.',
    classes: ['magicien', 'rodeur'],
  }),
  level1({
    id: 'serviteur-invisible',
    name: 'Serviteur invisible',
    school: 'invocation',
    m: 'un bout de ficelle et de bois',
    time: '1 minute',
    range: '18 mètres',
    duration: '1 heure',
    ritual: true,
    summary: 'Une force invisible exécute pour toi les tâches simples d’un domestique.',
    classes: ['barde', 'magicien', 'occultiste'],
  }),
];
