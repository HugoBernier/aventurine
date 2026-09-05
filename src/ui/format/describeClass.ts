import type { ChoiceDetail } from '../../domain/choice';
import type { Catalogue } from '../../domain/catalogue';
import { findAbility, findItem } from '../../domain/catalogue';
import type { CharacterClass, LeveledFeature, Spellcasting } from '../../domain/content';
import type { CastingProgression } from '../../domain/progression';
import { armorLine, toolLine, weaponLine } from './proficiencies';
import { counted } from './plural';

const PROGRESSION_TEXT: Record<CastingProgression, string> = {
  full: 'Lanceur complet : tes emplacements de sorts montent jusqu’au 9e niveau.',
  half: 'Demi-lanceur : la magie t’arrive au niveau 2, et tes emplacements montent jusqu’au 5e niveau.',
  pact: 'Magie de pacte : peu d’emplacements, mais ils reviennent à chaque repos court.',
};

const PREPARATION_TEXT = {
  known: 'Tu connais tes sorts une fois pour toutes.',
  prepared: 'Tu prépares tes sorts après chaque repos long.',
  spellbook:
    'Tu copies tes sorts dans un grimoire, et tu en prépares une partie chaque jour.',
} as const;

function hitPoints(entry: CharacterClass): ChoiceDetail {
  const die = `d${String(entry.hitDie)}`;
  return {
    title: 'Points de vie',
    body: `${die} par niveau. Au niveau 1 tu démarres à ${String(entry.hitDie)} + ton modificateur de Constitution.`,
  };
}

function saves(entry: CharacterClass, catalogue: Catalogue): ChoiceDetail {
  const names = entry.saves.map((id) => findAbility(catalogue, id)?.name ?? id);
  return {
    title: 'Jets de sauvegarde',
    body: `Tu ajoutes ta maîtrise à tes jets de ${names.join(' et de ')}.`,
  };
}

function spellcasting(magic: Spellcasting, catalogue: Catalogue): ChoiceDetail {
  const ability = findAbility(catalogue, magic.ability)?.name ?? magic.ability;
  const lines = [
    `Ta magie passe par ${ability}.`,
    PROGRESSION_TEXT[magic.progression],
    PREPARATION_TEXT[magic.preparation],
  ];
  if (magic.ritual) {
    lines.push('Tu peux lancer certains sorts en rituel, sans dépenser d’emplacement.');
  }
  return { title: 'Magie', body: lines.join('\n') };
}

function equipment(entry: CharacterClass, catalogue: Catalogue): ChoiceDetail | null {
  const fixed = entry.fixedEquipment.map((line) => {
    const name = findItem(catalogue, line.itemId)?.name ?? line.itemId;
    return line.quantity > 1 ? `${name} (×${String(line.quantity)})` : name;
  });
  const options = entry.equipmentOptions.map((option) => option.name);
  if (fixed.length === 0 && options.length === 0) {
    return null;
  }
  const lines: string[] = [];
  if (fixed.length > 0) {
    lines.push(`Tu pars toujours avec : ${fixed.join(', ')}.`);
  }
  if (options.length > 0) {
    lines.push(`Puis tu choisis ton paquetage : ${options.join(', ')}.`);
  }
  return { title: 'Équipement de départ', body: lines.join('\n') };
}

function paths(entry: CharacterClass): ChoiceDetail | null {
  if (entry.subclasses.length === 0) {
    return null;
  }
  const names = entry.subclasses.map((subclass) => subclass.name);
  return {
    title: entry.subclassChoice.title,
    body: `Tu la choisis au niveau ${String(entry.subclassChoice.level)} : ${names.join(', ')}.`,
  };
}

function advancements(entry: CharacterClass): ChoiceDetail | null {
  const levels = entry.advancements.map((step) => String(step.level));
  if (levels.length === 0) {
    return null;
  }
  return {
    title: 'Améliorations',
    body: `Aux niveaux ${levels.join(', ')}, tu montes tes caractéristiques ou tu prends un don. Soit ${counted(levels.length, 'palier', 'paliers')} en tout.`,
  };
}

/** Une aptitude, sa règle, et le tableau qu'elle suit quand elle en a un. */
function featureBlock(feature: LeveledFeature): string {
  // « À partir du » et non « Niveau N » : la section porte déjà un titre de
  // niveau, et deux « Niveau 1 » de sens différents à trois lignes d'écart se
  // lisent comme une répétition, pas comme un tableau.
  const steps = (feature.steps ?? []).map(
    (step) => `À partir du niveau ${String(step.from)} : ${step.value}`,
  );
  return [`${feature.name} — ${feature.text}`, ...steps].join('\n');
}

/**
 * Une entrée par niveau qui apporte quelque chose. Les niveaux muets ne
 * s'affichent pas : « Niveau 4 : rien » est une ligne qui n'apprend rien.
 */
function featuresByLevel(entry: CharacterClass): readonly ChoiceDetail[] {
  const levels = [...new Set(entry.features.map((feature) => feature.level))].toSorted(
    (a, b) => a - b,
  );
  return levels.map((level) => ({
    title: `Niveau ${String(level)}`,
    body: entry.features
      .filter((feature) => feature.level === level)
      .map((feature) => featureBlock(feature))
      .join('\n\n'),
  }));
}

/**
 * La fiche d'une classe, composée à partir de ses seuls champs typés.
 *
 * Rien n'est stocké : ni `data/` ni un pack ne portent cette prose. C'est ce
 * qui la rend gratuite pour le contenu importé — une classe écrite par un
 * joueur est un `CharacterClass` comme les autres, et rend sa fiche sans une
 * ligne de plus dans le format de pack ni un champ de plus dans le créateur.
 */
export function describeClass(
  entry: CharacterClass,
  catalogue: Catalogue,
): readonly ChoiceDetail[] {
  const armor = armorLine(entry.proficiencies);
  const weapons = weaponLine(entry.proficiencies, catalogue);
  const tools = toolLine(entry.proficiencies, catalogue);
  const sections: readonly (ChoiceDetail | null)[] = [
    hitPoints(entry),
    saves(entry, catalogue),
    armor === null
      ? { title: 'Armures', body: 'Aucune.' }
      : { title: 'Armures', body: armor },
    weapons === null ? null : { title: 'Armes', body: weapons },
    tools === null ? null : { title: 'Outils', body: tools },
    entry.spellcasting === null ? null : spellcasting(entry.spellcasting, catalogue),
    equipment(entry, catalogue),
    paths(entry),
    advancements(entry),
    ...featuresByLevel(entry),
  ];
  return sections.filter((section) => section !== null);
}
