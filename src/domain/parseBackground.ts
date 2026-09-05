import { findItem, findTool } from './catalogue';
import type { Catalogue } from './catalogue';
import type { ChoiceSpec } from './choiceSpec';
import { BACKGROUND_CHOICE_KINDS, parseChoiceSpec } from './parseChoice';
import { ALL_SKILLS } from './skills';
import {
  ID_SHAPE,
  MAX_ID,
  MAX_LINE,
  MAX_NAME,
  MAX_TEXT,
  isRecord,
  text,
} from './parseValues';
import { strings } from './parseValues';
import type { SkillId } from './skills';
import type { PackIssue } from './pack';
import type { Background, Feature, ItemLine, SuggestedTraits } from './content';
import { NO_PROFICIENCIES } from './content';

const MAX_LIST = 20;
const MAX_CHOICES = 4;
/** Le SRD n'en donne jamais plus d'une poignée ; la borne arrête l'absurde. */
const MAX_ITEMS = 20;
const MAX_QUANTITY = 99;
const MAX_GOLD = 1000;

/**
 * Ce qu'un historique ne donne pas. Le SRD lui accorde des compétences, des
 * outils, de l'équipement et une aptitude — jamais une armure ni une arme.
 * Refusé plutôt que tu : perdre un champ à la réexportation rendrait à son
 * auteur un fichier plus pauvre que celui qu'il a donné.
 */
const NOT_FOR_BACKGROUNDS = ['armor', 'weaponCategories', 'weapons'];

const SKILL_IDS: readonly string[] = ALL_SKILLS;

/** Trois amorces par colonne dans le SRD ; on garde ce qui tient debout. */
function traitsOf(value: unknown): SuggestedTraits {
  const source = isRecord(value) ? value : {};
  const list = (key: string): readonly string[] =>
    strings(source[key], MAX_LIST)
      .map((entry) => entry.trim())
      .filter((entry) => entry !== '' && entry.length <= MAX_TEXT);
  return {
    traits: list('traits'),
    ideals: list('ideals'),
    bonds: list('bonds'),
    flaws: list('flaws'),
  };
}

function equipmentOf(value: unknown, catalogue: Catalogue): readonly ItemLine[] {
  const raw = Array.isArray(value) ? value.slice(0, MAX_ITEMS) : [];
  const lines: ItemLine[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) continue;
    const itemId = text(entry.itemId, MAX_ID);
    // Une ligne d'équipement qui ne nomme rien de connu est écartée : c'est une
    // liste, et une entrée morte n'empêche pas les autres de servir.
    if (itemId === null || findItem(catalogue, itemId) === null) continue;
    const quantity =
      typeof entry.quantity === 'number' &&
      Number.isSafeInteger(entry.quantity) &&
      entry.quantity > 0 &&
      entry.quantity <= MAX_QUANTITY
        ? entry.quantity
        : 1;
    lines.push({ itemId, quantity });
  }
  return lines;
}

/** Un historique peut n'avoir aucune aptitude ; il ne peut pas en avoir une à moitié. */
function featureOf(value: unknown): { readonly feature: Feature | null } | null {
  if (value === undefined || value === null) {
    return { feature: null };
  }
  if (!isRecord(value)) {
    return null;
  }
  const name = text(value.name, MAX_NAME);
  const body = text(value.text, MAX_TEXT);
  return name === null || body === null ? null : { feature: { name, text: body } };
}

function reportUnsupported(
  proficiencies: Record<string, unknown>,
  at: number,
  entry: string,
  issues: PackIssue[],
): void {
  for (const field of NOT_FOR_BACKGROUNDS) {
    const carried = proficiencies[field];
    if (Array.isArray(carried) && carried.length > 0) {
      issues.push({
        kind: 'field-not-yet-supported',
        at,
        entry,
        what: 'background',
        field,
      });
    }
  }
}

/** `null` : un des choix est mal écrit, et l'historique entier est refusé. */
function choicesOf(value: unknown, catalogue: Catalogue): readonly ChoiceSpec[] | null {
  const raw = Array.isArray(value) ? value.slice(0, MAX_CHOICES) : [];
  const choices: ChoiceSpec[] = [];
  for (const entry of raw) {
    const choice = parseChoiceSpec(entry, catalogue, BACKGROUND_CHOICE_KINDS);
    if (choice === null) return null;
    choices.push(choice);
  }
  return choices;
}

function goldOf(value: unknown): number {
  return typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= MAX_GOLD
    ? value
    : 0;
}

export interface BackgroundParse {
  readonly background: Background | null;
  readonly issues: readonly PackIssue[];
}

/**
 * Un historique venu d'un fichier. C'est l'entrée la plus autonome du format :
 * elle ne référence ni classe ni peuple, seulement des compétences, des outils
 * et des objets — tous du SRD.
 *
 * `assembledFromGenericRules` n'est pas lu du fichier et vaut toujours faux :
 * ce drapeau dit « écrit pour Aventurine sur les règles génériques du SRD »,
 * ce qui serait faux du contenu de quelqu'un d'autre. La provenance d'un pack
 * se dit par son nom, sous celui de l'entrée.
 */
export function parseBackground(
  value: unknown,
  at: number,
  prefix: string,
  catalogue: Catalogue,
): BackgroundParse {
  const issues: PackIssue[] = [];
  const entry = isRecord(value)
    ? (text(value.id, MAX_ID) ?? text(value.name, MAX_NAME) ?? '')
    : '';
  const miss = (field: string): BackgroundParse => {
    issues.push({ kind: 'missing-field', at, entry, what: 'background', field });
    return { background: null, issues };
  };

  if (!isRecord(value)) return miss('historique');
  const id = text(value.id, MAX_ID);
  if (id === null || !ID_SHAPE.test(id)) return miss('id');
  if (!id.startsWith(prefix)) {
    issues.push({ kind: 'bad-prefix', at, entry, what: 'background' });
    return { background: null, issues };
  }
  const name = text(value.name, MAX_NAME);
  if (name === null) return miss('name');
  const blurb = text(value.blurb, MAX_TEXT);
  if (blurb === null) return miss('blurb');

  const carried = featureOf(value.feature);
  if (carried === null) return miss('feature');

  const proficiencies = isRecord(value.proficiencies) ? value.proficiencies : {};
  reportUnsupported(proficiencies, at, entry, issues);

  const choices = choicesOf(value.choices, catalogue);
  if (choices === null) return miss('choices');

  const facts = Array.isArray(value.facts) ? value.facts : [];
  const fact = (index: number): string => text(facts[index], MAX_LINE) ?? '—';

  return {
    background: {
      id,
      name,
      blurb,
      facts: [fact(0), fact(1), fact(2)],
      skills: strings(value.skills, MAX_LIST).filter((skill): skill is SkillId =>
        SKILL_IDS.includes(skill),
      ),
      proficiencies: {
        ...NO_PROFICIENCIES,
        tools: strings(proficiencies.tools, MAX_LIST).filter(
          (tool) => findTool(catalogue, tool) !== null,
        ),
      },
      choices,
      equipment: equipmentOf(value.equipment, catalogue),
      goldPieces: goldOf(value.goldPieces),
      feature: carried.feature,
      suggestedTraits: traitsOf(value.suggestedTraits),
      assembledFromGenericRules: false,
    },
    issues,
  };
}
