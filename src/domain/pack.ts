import type { Background, Race, Spell, Subclass } from './content';

/**
 * Un pack de contenu maison : un fichier, un supplément. Ce n'est pas une
 * entrée mais un ensemble — une campagne apporte ses sorts, ses peuples et sa
 * classe d'un bloc, et s'installe ou se retire d'un bloc.
 *
 * Le contenu d'un pack n'est PAS du contenu de `data/` : la règle de revue du
 * SRD ne s'y applique pas, l'attribution SRD ne le couvre pas, et
 * l'application ne le distribue jamais (CLAUDE.md, « Sources et droits »).
 */
export interface PackInfo {
  /** Le préfixe de tout ce que le pack définit : `karn` → `karn-brumeux`. */
  readonly id: string;
  readonly name: string;
  /** Facultatifs, mais montrés partout où le pack est nommé : vide, pas absent. */
  readonly author: string;
  readonly description: string;
  /** La date d'export, en ISO. Elle sert de version : il n'y en a pas d'autre. */
  readonly updatedAt: string;
}

/**
 * Une sous-classe greffée : elle vit dans un pack, mais se propose sous une
 * classe qui existe déjà. C'est le homebrew le plus courant — un collège de
 * barde, un domaine de clerc — et il n'invente pas de classe.
 *
 * On n'écrase aucun champ, on ajoute à une liste : la classe garde son dé de
 * vie, ses sauvegardes et ses aptitudes, et gagne une voie de plus. Modifier un
 * champ rendrait un personnage ambigu ; ajouter une option ne change rien à ce
 * qui existe.
 */
export interface GraftedSubclass {
  /** La classe visée, du SRD : `barde`. Le champ `for` du fichier. */
  readonly forClassId: string;
  readonly subclass: Subclass;
}

export interface ContentPack {
  readonly info: PackInfo;
  readonly spells: readonly Spell[];
  readonly subclasses: readonly GraftedSubclass[];
  /** Des peuples entiers : ils s'ajoutent au choix de race, ils n'y touchent pas. */
  readonly races: readonly Race[];
  /** L'entrée la plus autonome du format : elle ne référence ni classe ni peuple. */
  readonly backgrounds: readonly Background[];
}

/**
 * Ce qui empêche un fichier d'être un pack. Structuré : la phrase française se
 * compose dans `ui/format/`, et le formulaire du créateur s'en sert pour
 * pointer le champ fautif — c'est la même fonction qui juge des deux côtés.
 *
 * `at` est le rang de l'entrée dans son tableau, 1 en tête ; `entry` son
 * identifiant s'il est lisible, sinon le nom, sinon vide ; `what` le genre
 * d'entrée, pour que la phrase sache dire « Sort » ou « Sous-classe ». Le
 * domaine ne rédige pas : il donne de quoi nommer.
 */
export type PackEntryKind = 'spell' | 'subclass' | 'race' | 'subrace' | 'background';

interface AtEntry {
  readonly at: number;
  readonly entry: string;
  readonly what: PackEntryKind;
}

export type PackIssue =
  | { readonly kind: 'not-a-pack' }
  | { readonly kind: 'bad-pack-id'; readonly value: string }
  | { readonly kind: 'missing-name' }
  | ({ readonly kind: 'missing-field'; readonly field: string } & AtEntry)
  | ({ readonly kind: 'bad-prefix' } & AtEntry)
  | ({ readonly kind: 'duplicate-id' } & AtEntry)
  | ({ readonly kind: 'unknown-class'; readonly value: string } & AtEntry)
  /** Un champ que cette version ne sait pas encore porter, et ne taira pas. */
  | ({ readonly kind: 'field-not-yet-supported'; readonly field: string } & AtEntry)
  /** Un genre de contenu que cette version ne sait pas encore lire. */
  | { readonly kind: 'not-yet-supported'; readonly section: string };

export type PackParse =
  | { readonly kind: 'ok'; readonly pack: ContentPack }
  | { readonly kind: 'invalid'; readonly issues: readonly PackIssue[] };

/** `karn` → `karn-appel-des-brumes`. Le tiret, jamais le deux-points : un
 *  identifiant de créneau se lit `class:karn-chasseur:skills`, et un
 *  deux-points de plus en casserait l'analyse. */
export function prefixOf(packId: string): string {
  return `${packId}-`;
}

/** Le pack qui a défini cet identifiant, ou `null` s'il vient du SRD. */
export function packOf(id: string, packs: readonly ContentPack[]): ContentPack | null {
  return packs.find((pack) => id.startsWith(prefixOf(pack.info.id))) ?? null;
}
