// Contenu dérivé du SRD 5.1 (CC BY 4.0) — traduction Aventurine.
import type { FightingStyle } from '../domain/content';

export const FIGHTING_STYLE_ENTRIES: readonly FightingStyle[] = [
  {
    id: 'archerie',
    name: 'Archerie',
    text: 'Tu gagnes +2 à tes jets d’attaque avec les armes à distance.',
    armorClassBonusWithArmor: 0,
  },
  {
    id: 'combat-a-deux-armes',
    name: 'Combat à deux armes',
    text: 'Quand tu frappes de ta seconde arme, tu ajoutes ton modificateur aux dégâts.',
    armorClassBonusWithArmor: 0,
  },
  {
    id: 'defense',
    name: 'Défense',
    text: 'Tant que tu portes une armure, tu gagnes +1 en classe d’armure.',
    armorClassBonusWithArmor: 1,
  },
  {
    id: 'duel',
    name: 'Duel',
    text: 'Une arme en main et rien dans l’autre : +2 aux dégâts de cette arme.',
    armorClassBonusWithArmor: 0,
  },
  {
    id: 'combat-a-deux-mains',
    name: 'Combat à deux mains',
    text: 'Tu relances les 1 et les 2 sur les dés de dégâts d’une arme à deux mains.',
    armorClassBonusWithArmor: 0,
  },
  {
    id: 'protection',
    name: 'Protection',
    text: 'Avec un bouclier, tu gênes une attaque dirigée contre un allié proche.',
    armorClassBonusWithArmor: 0,
  },
];
