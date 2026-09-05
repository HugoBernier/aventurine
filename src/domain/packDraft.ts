import type { SpellLevel } from './content';

/**
 * Le pack en cours d'écriture. Tout y est permis d'être incomplet — c'est déjà
 * la philosophie de l'assistant : on avance avec des trous, et un écran
 * récapitule ce qui manque. Ce qui décide de la validité reste `parsePack`, et
 * lui seul : ce brouillon ne juge de rien, il retient.
 *
 * Les champs sont plats et bruts, à l'image des champs de saisie qui les
 * portent : un formulaire n'a pas de `null`, il a des chaînes vides.
 */
export interface SpellDraft {
  /** Fixé à la création depuis le nom, jamais recalculé : les fiches qui s'en
   *  servent le nomment, et le renommer les couperait de leur sort. */
  readonly id: string;
  readonly name: string;
  readonly level: SpellLevel;
  readonly school: string;
  readonly castingTime: string;
  readonly range: string;
  readonly verbal: boolean;
  readonly somatic: boolean;
  readonly material: string;
  readonly duration: string;
  readonly concentration: boolean;
  readonly ritual: boolean;
  readonly summary: string;
  readonly classes: readonly string[];
}

export interface PackDraft {
  readonly id: string;
  readonly name: string;
  readonly author: string;
  readonly description: string;
  readonly spells: readonly SpellDraft[];
}

export function emptyPackDraft(): PackDraft {
  return { id: '', name: '', author: '', description: '', spells: [] };
}

export function emptySpellDraft(): SpellDraft {
  return {
    id: '',
    name: '',
    level: 0,
    school: 'evocation',
    castingTime: '1 action',
    range: '18 mètres',
    verbal: true,
    somatic: true,
    material: '',
    duration: 'instantanée',
    concentration: false,
    ritual: false,
    summary: '',
    classes: [],
  };
}

/** `Appel des brumes` → `appel-des-brumes`. Sans accent : c'est un identifiant. */
export function slug(value: string): string {
  return value
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, '-')
    .replaceAll(/^-|-$/gu, '');
}

/**
 * Le brouillon rendu au format du fichier. C'est ce qu'on écrit sur l'appareil
 * ET ce qu'on soumet à `parsePack` : le créateur et l'import jugent donc
 * exactement le même objet, ce qui est la seule façon qu'ils ne divergent pas.
 *
 * La date est celle de l'export, prise au moment de l'export : c'est tout ce
 * qu'elle prétend être, et elle sert de version.
 */
export function packDraftFile(
  draft: PackDraft,
  updatedAt: string,
): Record<string, unknown> {
  return {
    pack: {
      id: draft.id,
      name: draft.name,
      author: draft.author,
      description: draft.description,
      updatedAt,
    },
    races: [],
    classes: [],
    backgrounds: [],
    spells: draft.spells.map((spell) => ({
      id: spell.id,
      name: spell.name,
      level: spell.level,
      school: spell.school,
      castingTime: spell.castingTime,
      range: spell.range,
      components: {
        verbal: spell.verbal,
        somatic: spell.somatic,
        material: spell.material === '' ? null : spell.material,
      },
      duration: spell.duration,
      concentration: spell.concentration,
      ritual: spell.ritual,
      summary: spell.summary,
      classes: spell.classes,
    })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.slice(0, 600) : fallback;
}

function asLevel(value: unknown): SpellLevel {
  const levels: readonly SpellLevel[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  return levels.find((level) => level === value) ?? 0;
}

function asSpellDraft(value: unknown): SpellDraft {
  const source = isRecord(value) ? value : {};
  const components = isRecord(source.components) ? source.components : {};
  const empty = emptySpellDraft();
  return {
    id: asText(source.id),
    name: asText(source.name),
    level: asLevel(source.level),
    school: asText(source.school, empty.school),
    castingTime: asText(source.castingTime, empty.castingTime),
    range: asText(source.range, empty.range),
    verbal: components.verbal === true,
    somatic: components.somatic === true,
    material: asText(components.material),
    duration: asText(source.duration, empty.duration),
    concentration: source.concentration === true,
    ritual: source.ritual === true,
    summary: asText(source.summary),
    classes: Array.isArray(source.classes)
      ? source.classes.filter((entry): entry is string => typeof entry === 'string')
      : [],
  };
}

/**
 * Relit un fichier POUR L'ÉCRIRE, pas pour l'installer : ici l'incomplet est
 * normal, donc rien n'est refusé et tout ce qui manque devient un champ vide.
 *
 * Ce n'est pas une seconde validation — `parsePack` reste seul juge de ce qui
 * entre dans l'application. C'est la même séparation que pour un personnage :
 * `parseDraft` remplit un formulaire, il ne décide de rien.
 */
export function parsePackDraft(value: unknown): PackDraft {
  if (!isRecord(value)) {
    return emptyPackDraft();
  }
  const info = isRecord(value.pack) ? value.pack : {};
  return {
    id: asText(info.id),
    name: asText(info.name),
    author: asText(info.author),
    description: asText(info.description),
    spells: Array.isArray(value.spells)
      ? value.spells.slice(0, 500).map((entry) => asSpellDraft(entry))
      : [],
  };
}
