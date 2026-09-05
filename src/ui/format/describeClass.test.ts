import { describe, expect, it } from 'vitest';
import { CATALOGUE } from '../../data/catalogue';
import { findClass } from '../../domain/catalogue';
import type { CharacterClass } from '../../domain/content';
import { NO_PROFICIENCIES } from '../../domain/content';
import { describeClass } from './describeClass';

/** Le catalogue SRD est la meilleure table d'essai qui soit : c'est celle que
 *  la fiche rendra pour de vrai. Absente, on veut l'erreur, pas un test vert. */
function classOf(id: string): CharacterClass {
  const found = findClass(CATALOGUE, id);
  if (found === null) {
    throw new Error(`classe absente du catalogue : ${id}`);
  }
  return found;
}

const barbarian = classOf('barbare');
const wizard = classOf('magicien');

/** Une classe de pack réduite à l'os : rien que les champs obligatoires. */
const bare: CharacterClass = {
  id: 'karn-veilleur',
  name: 'Veilleur',
  blurb: 'Tu regardes, tu attends, tu frappes une seule fois.',
  facts: ['Dé de vie d8', 'Dextérité + Sagesse', 'Aucune armure'],
  hitDie: 8,
  saves: ['dexterite', 'sagesse'],
  proficiencies: { ...NO_PROFICIENCIES, weapons: ['arme-inconnue'] },
  unarmoredDefense: null,
  features: [{ level: 1, name: 'Guet', text: 'Tu ne peux pas être surpris.' }],
  choices: [],
  equipmentOptions: [],
  fixedEquipment: [],
  spellcasting: null,
  subclasses: [],
  subclassChoice: {
    kind: 'subclass',
    subject: 'subclass',
    title: 'Ta veille',
    help: '',
    pick: 1,
    level: 3,
  },
  advancements: [],
};

const bodyOf = (entry: CharacterClass, title: string): string | undefined =>
  describeClass(entry, CATALOGUE).find((detail) => detail.title === title)?.body;

describe('fiche de classe', () => {
  it('annonce le dé de vie et le point de départ au niveau 1', () => {
    expect(bodyOf(bare, 'Points de vie')).toBe(
      'd8 par niveau. Au niveau 1 tu démarres à 8 + ton modificateur de Constitution.',
    );
  });

  it('nomme les jets de sauvegarde au lieu d’en donner les identifiants', () => {
    expect(bodyOf(bare, 'Jets de sauvegarde')).toBe(
      'Tu ajoutes ta maîtrise à tes jets de Dextérité et de Sagesse.',
    );
  });

  it('dit « Aucune » plutôt que de taire une classe sans armure', () => {
    expect(bodyOf(bare, 'Armures')).toBe('Aucune.');
  });

  it('rend tel quel un identifiant d’arme absent du catalogue', () => {
    expect(bodyOf(bare, 'Armes')).toBe('arme-inconnue');
  });

  it('n’ouvre pas de section Magie pour une classe qui n’en a pas', () => {
    const titles = describeClass(bare, CATALOGUE).map((detail) => detail.title);
    expect(titles).not.toContain('Magie');
  });

  it('n’ouvre pas de section Voies pour une classe qui n’en a pas', () => {
    const titles = describeClass(bare, CATALOGUE).map((detail) => detail.title);
    expect(titles).not.toContain('Ta veille');
  });

  it('donne une section par niveau qui apporte une aptitude, et aucune pour les niveaux muets', () => {
    const titles = describeClass(bare, CATALOGUE).map((detail) => detail.title);
    expect(titles).toContain('Niveau 1');
    expect(titles).not.toContain('Niveau 2');
  });

  it('déplie le tableau d’une aptitude qui en suit un', () => {
    const rage = bodyOf(barbarian, 'Niveau 1');
    expect(rage).toContain('Rage — ');
    expect(rage).toContain('Niveau 9 : 4 rages par repos long, +3 aux dégâts');
  });

  it('range les niveaux dans l’ordre croissant', () => {
    const levels = describeClass(barbarian, CATALOGUE)
      .map((detail) => /^Niveau (\d+)$/.exec(detail.title)?.[1])
      .filter((found) => found !== undefined)
      .map(Number);
    expect(levels).toStrictEqual([...levels].toSorted((a, b) => a - b));
  });

  it('décrit la magie par sa caractéristique et sa façon de préparer', () => {
    const magic = bodyOf(wizard, 'Magie');
    expect(magic).toContain('Ta magie passe par Intelligence.');
    expect(magic).toContain('grimoire');
  });

  it('nomme les voies sous le titre que la classe leur donne', () => {
    const path = bodyOf(barbarian, barbarian.subclassChoice.title);
    expect(path).toContain(`niveau ${String(barbarian.subclassChoice.level)}`);
    expect(path).toContain(barbarian.subclasses[0]?.name ?? '');
  });
});
