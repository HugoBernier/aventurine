import type { AbilityId } from './abilities';
import type { ChoiceKind } from './choice';
import type { SkillId } from './skills';

/**
 * Forme AUTEUR d'un choix : ce qu'on écrit dans `data/`. Compacte, parfois
 * implicite (« un tour de magie de la liste du magicien »), et surtout sans
 * connaissance de l'état du brouillon.
 *
 * `openChoices` la résout en `ChoiceSlot`, forme plate et uniforme que l'état
 * et l'interface consomment. C'est cette séparation qui permet à `data/` de
 * rester bref et à l'interface de n'avoir qu'un seul composant de choix.
 *
 * Une spec ne porte QUE son `subject` : la source et le parent viennent du
 * lieu de déclaration, donc un identifiant mal formé est inexprimable.
 */
interface BaseSpec {
  readonly subject: string;
  /** Prose française. N'écrit jamais le nombre : `pick` en est la source. */
  readonly title: string;
  readonly help: string;
  readonly pick: number;
}

export interface SkillSpec extends BaseSpec {
  readonly kind: 'skill';
  readonly from: readonly SkillId[];
}

export interface LanguageSpec extends BaseSpec {
  readonly kind: 'language';
  readonly from: readonly string[];
}

export interface ToolSpec extends BaseSpec {
  readonly kind: 'tool';
  readonly from: readonly string[];
}

export interface EquipmentSpec extends BaseSpec {
  readonly kind: 'equipment';
  readonly from: readonly string[];
}

export interface AncestrySpec extends BaseSpec {
  readonly kind: 'ancestry';
}

export interface FightingStyleSpec extends BaseSpec {
  readonly kind: 'fighting-style';
}

/** Demi-elfe : +1 à deux caractéristiques autres que le Charisme. */
export interface AbilitySpec extends BaseSpec {
  readonly kind: 'ability';
  readonly bonus: number;
  readonly from: readonly AbilityId[];
}

/** La liste de sorts n'est jamais recopiée : on référence celle d'une classe. */
export interface SpellSpec extends BaseSpec {
  readonly kind: 'cantrip' | 'spell';
  readonly listFrom: string;
}

/** Options calculées à l'exécution : les compétences déjà acquises. */
export interface ExpertiseSpec extends BaseSpec {
  readonly kind: 'expertise';
  readonly tools: readonly string[];
}

export type ChoiceSpec =
  | SkillSpec
  | LanguageSpec
  | ToolSpec
  | EquipmentSpec
  | AncestrySpec
  | FightingStyleSpec
  | AbilitySpec
  | SpellSpec
  | ExpertiseSpec;

/** Les créneaux de maîtrise sont regroupés dans l'étape « Ce que tu sais faire ». */
const DEFERRED_KINDS = new Set<ChoiceKind>(['skill', 'language', 'tool', 'expertise']);

export function isDeferredKind(kind: ChoiceKind): boolean {
  return DEFERRED_KINDS.has(kind);
}
