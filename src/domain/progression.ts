/**
 * Ce que le NIVEAU décide : bonus de maîtrise, points de vie, dés de vie,
 * emplacements de sorts et nombre de sorts préparés. Aucune de ces valeurs ne
 * dépend d'un choix du joueur ; la dernière ajoute au niveau le modificateur
 * de la caractéristique d'incantation, et rien d'autre.
 */

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 20;

/** Un niveau venu d'un fichier importé n'est pas de confiance. */
export function clampLevel(level: number): number {
  if (!Number.isSafeInteger(level)) {
    return MIN_LEVEL;
  }
  return Math.min(Math.max(level, MIN_LEVEL), MAX_LEVEL);
}

/** SRD, « Beyond 1st Level » : +2, puis +1 tous les quatre niveaux. */
export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((clampLevel(level) - 1) / 4);
}

/** Un jet venu d'un fichier n'est pas de confiance : il doit tenir sur le dé. */
/**
 * Le dé retenu, ou `null` si la saisie ne peut pas sortir de ce dé.
 *
 * Renvoyer un prédicat `roll is number` serait un mensonge : un 15 sur un d12
 * est bien un nombre, et TypeScript en déduisait que tout ce qui échoue au
 * test vaut `undefined`. La valeur refusée était alors indistinguable d'un
 * champ vide, donc écartée sans un mot.
 */
function usableRoll(roll: number | undefined, hitDie: number): number | null {
  const isUsable =
    roll !== undefined && Number.isSafeInteger(roll) && roll >= 1 && roll <= hitDie;
  return isUsable ? roll : null;
}

/** Ce que le joueur a lancé, par niveau. Une clé absente vaut « moyenne fixe ». */
export type HitPointRolls = Readonly<Record<string, number>>;

/**
 * Niveau 1 : le maximum du dé, toujours : la règle ne le fait jamais lancer.
 * Ensuite, au choix du joueur : la moyenne fixe `dé / 2 + 1`, ou le dé qu'il a
 * lancé à sa table et saisi ici. La Constitution s'ajoute à chaque niveau,
 * premier compris.
 */
/** La valeur fixe que le SRD donne à la place du dé : d6 → 4, d12 → 7. */
export function averageRoll(hitDie: number): number {
  return Math.floor(hitDie / 2) + 1;
}

export type HitPointSource = 'max' | 'rolled' | 'average';

/**
 * Ce qu'UN niveau rapporte, en pièces détachées. L'interface affichait avant
 * un « +6 par niveau » calculé à part, faux au niveau 1 (qui prend le dé au
 * maximum) et faux dès que le joueur lance ses dés. Une seule source, détaillée
 * ligne à ligne, ne peut plus contredire le total.
 */
export interface HitPointRow {
  readonly level: number;
  readonly source: HitPointSource;
  /** La valeur du dé retenue pour ce niveau. */
  readonly die: number;
  readonly constitution: number;
  readonly bonus: number;
  /** Le minimum de 1 a joué : la Constitution aurait donné moins. */
  readonly isFloored: boolean;
  /** Une saisie impossible sur ce dé, écartée. Le joueur doit le savoir. */
  readonly ignoredRoll: number | null;
  readonly total: number;
}

function row(
  level: number,
  source: HitPointSource,
  die: number,
  constitutionModifier: number,
  bonusPerLevel: number,
  ignoredRoll: number | null,
): HitPointRow {
  const raw = die + constitutionModifier;
  return {
    level,
    source,
    die,
    constitution: constitutionModifier,
    bonus: bonusPerLevel,
    isFloored: raw < 1,
    ignoredRoll,
    total: Math.max(1, raw) + bonusPerLevel,
  };
}

/** Le détail niveau par niveau. `maxHitPoints` n'en est que la somme. */
export function hitPointRows(
  level: number,
  hitDie: number,
  constitutionModifier: number,
  bonusPerLevel: number,
  rolls: HitPointRolls = {},
): readonly HitPointRow[] {
  const levels = clampLevel(level);
  const rows: HitPointRow[] = [
    row(1, 'max', hitDie, constitutionModifier, bonusPerLevel, null),
  ];
  for (let at = 2; at <= levels; at++) {
    const rolled = rolls[String(at)];
    const usable = usableRoll(rolled, hitDie);
    rows.push(
      usable === null
        ? row(
            at,
            'average',
            averageRoll(hitDie),
            constitutionModifier,
            bonusPerLevel,
            rolled ?? null,
          )
        : row(at, 'rolled', usable, constitutionModifier, bonusPerLevel, null),
    );
  }
  return rows;
}

export function maxHitPoints(
  level: number,
  hitDie: number,
  constitutionModifier: number,
  bonusPerLevel: number,
  rolls: HitPointRolls = {},
): number {
  return hitPointRows(level, hitDie, constitutionModifier, bonusPerLevel, rolls).reduce(
    (total, line) => total + line.total,
    0,
  );
}

/** Emplacements du niveau 1 au niveau 9, index 0 = sorts de niveau 1. */
export type SpellSlots = readonly number[];

/** SRD, table des lanceurs de sorts complets : barde, clerc, druide… */
const FULL_CASTER: readonly SpellSlots[] = [
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

/** Paladin et rôdeur : rien au niveau 1, puis la moitié du rythme. */
const HALF_CASTER: readonly SpellSlots[] = [
  [],
  [2],
  [3],
  [3],
  [4, 2],
  [4, 2],
  [4, 3],
  [4, 3],
  [4, 3, 2],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2],
];

/** Occultiste : peu d'emplacements, tous du même niveau, tous récupérés vite. */
const PACT_SLOTS = [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4];
const PACT_SLOT_LEVEL = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];

export type CastingProgression = 'full' | 'half' | 'pact';

/** Ce que l'occultiste a de particulier : peu d'emplacements, d'un seul niveau. */
export interface PactMagic {
  readonly slots: number;
  readonly slotLevel: number;
}

export function spellSlots(
  progression: Exclude<CastingProgression, 'pact'>,
  level: number,
): SpellSlots {
  const table = progression === 'full' ? FULL_CASTER : HALF_CASTER;
  return table[clampLevel(level) - 1] ?? [];
}

export function pactMagic(level: number): PactMagic {
  const index = clampLevel(level) - 1;
  return {
    slots: PACT_SLOTS[index] ?? 1,
    slotLevel: PACT_SLOT_LEVEL[index] ?? 1,
  };
}

/**
 * Le niveau qui compte pour la magie. Le paladin et le rôdeur avancent à
 * moitié : au niveau 5, ils lancent comme un lanceur de niveau 2.
 */
export function castingLevel(progression: CastingProgression, level: number): number {
  const reached = clampLevel(level);
  return progression === 'half' ? Math.floor(reached / 2) : reached;
}

/**
 * Sorts préparés : modificateur d'incantation + niveau de lanceur, jamais moins
 * de un. Même formule pour le clerc, le druide, le paladin et le magicien.
 */
export function preparedSpellCount(
  castingLevelReached: number,
  abilityModifier: number,
): number {
  return Math.max(1, abilityModifier + castingLevelReached);
}
