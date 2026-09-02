import type { AbilityId } from './abilities';
import { MAX_LEVEL } from './progression';
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

/**
 * Le style de combat. Il porte SON niveau — 1 pour le guerrier, 2 pour le
 * paladin et le rôdeur — et SA liste : le SRD n'ouvre pas les mêmes options
 * aux trois classes.
 */
export interface FightingStyleSpec extends BaseSpec {
  readonly kind: 'fighting-style';
  readonly level: number;
  readonly from: readonly string[];
}

/**
 * La voie que la classe fait choisir : domaine du clerc, archétype du
 * guerrier, collège du barde. Elle porte SON niveau, parce qu'il change d'une
 * classe à l'autre : 1 pour le clerc, 2 pour le magicien, 3 pour les autres.
 */
export interface SubclassSpec extends BaseSpec {
  readonly kind: 'subclass';
  readonly level: number;
}

/**
 * Deux façons de monter un score, distinguées par leur genre.
 *
 * `ability` est un bonus d'ORIGINE : le registre du domaine empêche d'en poser
 * deux sur le même score. `improvement` est une amélioration de NIVEAU : deux
 * +1 sur un même score y sont légitimes, mais rien ne dépasse 20.
 */
export interface AbilitySpec extends BaseSpec {
  readonly kind: 'ability' | 'improvement';
  readonly bonus: number;
  readonly from: readonly AbilityId[];
}

/** Un don, pris à la place d'une amélioration de caractéristique. */
export interface FeatSpec extends BaseSpec {
  readonly kind: 'feat';
}

/** Le choix AMONT : améliorer ses scores, ou prendre un don. */
export interface AdvancementSpec extends BaseSpec {
  readonly kind: 'advancement';
  readonly from: readonly AdvancementOption[];
}

export type AdvancementMode = 'ability-2' | 'ability-1-1' | 'feat';

export interface AdvancementOption {
  readonly id: AdvancementMode;
  readonly label: string;
  readonly blurb: string;
}

/**
 * D'où vient le nombre de sorts d'un créneau. Le barde lit une table ; le clerc
 * calcule, parce que son nombre dépend de sa Sagesse autant que de son niveau.
 */
export type SpellCount =
  | { readonly kind: 'known'; readonly byLevel: readonly number[] }
  | { readonly kind: 'prepared' };

/**
 * La liste de sorts n'est jamais recopiée : on référence celle d'une classe.
 *
 * Le nombre à choisir n'est jamais fixe — un barde connaît quatre sorts au
 * niveau 1 et vingt-deux au niveau 20 — donc cette spec porte sa source et pas
 * le `pick` d'un `BaseSpec`, qui resterait au niveau 1. `openChoices` la
 * résout : lui seul connaît les caractéristiques du personnage.
 */
export interface SpellSpec extends Omit<BaseSpec, 'pick'> {
  readonly kind: 'cantrip' | 'spell';
  readonly listFrom: string;
  readonly count: SpellCount;
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
  | FeatSpec
  | AdvancementSpec
  | SpellSpec
  | SubclassSpec
  | ExpertiseSpec;

/** Les créneaux de maîtrise sont regroupés dans l'étape « Ce que tu sais faire ». */
const DEFERRED_KINDS = new Set<ChoiceKind>(['skill', 'language', 'tool', 'expertise']);

export function isDeferredKind(kind: ChoiceKind): boolean {
  return DEFERRED_KINDS.has(kind);
}

/**
 * Une table par niveau écrite par ses paliers : `byLevel({ 1: 2, 4: 3, 10: 4 })`
 * donne deux tours de magie du niveau 1 au 3, trois du 4 au 9, quatre ensuite.
 * Les tables du SRD se lisent ainsi ; vingt nombres à la file se relisent mal.
 */
export function byLevel(steps: Readonly<Record<number, number>>): readonly number[] {
  const table: number[] = [];
  let current = 0;
  for (let level = 1; level <= MAX_LEVEL; level += 1) {
    current = steps[level] ?? current;
    table.push(current);
  }
  return table;
}
