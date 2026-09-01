/**
 * Identifiant d'un créneau de choix, sous la forme `source:parentId:subject`
 * Par exemple `class:roublard:skills`.
 *
 * Le parent est TOUJOURS un identifiant que le joueur a choisi lui-même. C'est
 * ce qui rend l'invalidation en cascade gratuite : passer de roublard à clerc
 * n'ouvre pas le même créneau mais `class:clerc:skills`, donc l'ancien
 * disparaît et ses réponses avec lui, sans une ligne de code par catégorie.
 */
export type ChoiceSlotId = string;

export type ChoiceSource = 'race' | 'class' | 'background';

export type ChoiceKind =
  | 'skill'
  | 'language'
  | 'tool'
  | 'cantrip'
  | 'spell'
  | 'ability'
  | 'improvement'
  | 'feat'
  | 'advancement'
  | 'equipment'
  | 'ancestry'
  | 'fighting-style'
  | 'subclass'
  | 'expertise';

/** Structuré, jamais rédigé : `ui/format/` compose la phrase française. */
export type UnavailableReason =
  | { readonly kind: 'already-granted'; readonly source: ChoiceSource }
  | { readonly kind: 'slot-full' }
  /** Un score au maximum : la règle interdit de dépasser 20 par progression. */
  | { readonly kind: 'max-ability'; readonly max: number };

export interface ChoiceDetail {
  readonly title: string;
  readonly body: string;
}

export interface ChoiceOption {
  readonly id: string;
  readonly label: string;
  /** Une phrase, vocabulaire de joueur. Rédigée dans `data/`. */
  readonly blurb: string;
  /**
   * Trois repères ALIGNÉS : même sens à chaque indice, sur toutes les options
   * d'un même créneau. C'est ce qui permet de comparer neuf races sur 360 px
   * en balayant verticalement, sans tableau ni défilement horizontal.
   * `'—'` quand une option n'a rien à dire à un indice.
   */
  readonly facts: readonly [string, string, string];
  readonly details: readonly ChoiceDetail[];
  readonly unavailable: UnavailableReason | null;
}

export interface ChoiceSlot {
  readonly id: ChoiceSlotId;
  readonly source: ChoiceSource;
  readonly kind: ChoiceKind;
  /** Prose venue de `data/`, recopiée telle quelle. N'écrit pas le nombre. */
  readonly title: string;
  readonly help: string;
  readonly pick: number;
  readonly options: readonly ChoiceOption[];
}

/**
 * Seule fabrique d'identifiants de créneau. Une `ChoiceSpec` ne porte que son
 * `subject` : la source et le parent viennent du lieu de déclaration, donc un
 * identifiant mal formé est inexprimable.
 */
export function slotId(
  source: ChoiceSource,
  parentId: string,
  subject: string,
): ChoiceSlotId {
  return `${source}:${parentId}:${subject}`;
}

const SLOT_ID_PATTERN = /^(?:race|class|background):[a-z0-9-]+:[a-z0-9-]+$/;

/** Filet à l'import d'un fichier : les clés d'un JSON ne sont pas de confiance. */
export function isWellFormedSlotId(value: string): boolean {
  return SLOT_ID_PATTERN.test(value);
}

export interface ParsedSlotId {
  readonly source: ChoiceSource;
  readonly parentId: string;
  readonly subject: string;
}

/** Un créneau fermé n'existe plus : son identifiant est la seule trace qui reste. */
export function parseSlotId(value: string): ParsedSlotId | null {
  if (!isWellFormedSlotId(value)) {
    return null;
  }
  const [source, parentId, subject] = value.split(':', 3);
  if (source === undefined || parentId === undefined || subject === undefined) {
    return null;
  }
  return { source: source as ChoiceSource, parentId, subject };
}
