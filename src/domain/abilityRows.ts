import { ABILITIES, abilityModifier } from './abilities';
import type { AbilityId } from './abilities';
import { findRace, findSubrace } from './catalogue';
import type { Catalogue } from './catalogue';
import type { CharacterDraft } from './draft';
import { chosenAbilityBonuses } from './openChoices';
import type { ChosenAbilityBonus } from './openChoices';
import { POINT_BUY_MAX, POINT_BUY_MIN, increaseCost, pointsRemaining } from './pointBuy';

/** Même forme que `UnavailableReason` : structuré, jamais rédigé. */
export type BlockedReason =
  | {
      readonly kind: 'not-enough-points';
      readonly required: number;
      readonly remaining: number;
    }
  | { readonly kind: 'max-score'; readonly max: number };

export interface AbilityRow {
  readonly id: AbilityId;
  /** Valeur de base, avant bonus. C'est elle que les boutons font varier. */
  readonly score: number;
  readonly racialBonus: number;
  /** Des identifiants : `ui/format/` va chercher les noms dans `data/`. */
  readonly bonusSources: readonly string[];
  readonly total: number;
  readonly modifier: number;
  readonly canIncrease: boolean;
  readonly canDecrease: boolean;
  readonly increaseCost: number | null;
  readonly blockedBy: BlockedReason | null;
}

interface Bonus {
  readonly value: number;
  readonly sources: readonly string[];
}

function bonusFor(
  ability: AbilityId,
  race: {
    readonly id: string;
    readonly abilityBonuses: Partial<Record<AbilityId, number>>;
  } | null,
  subrace: {
    readonly id: string;
    readonly abilityBonuses: Partial<Record<AbilityId, number>>;
  } | null,
  chosen: readonly ChosenAbilityBonus[],
): Bonus {
  const sources: string[] = [];
  let value = 0;

  const fromRace = race?.abilityBonuses[ability] ?? 0;
  if (race !== null && fromRace !== 0) {
    value += fromRace;
    sources.push(race.id);
  }
  const fromSubrace = subrace?.abilityBonuses[ability] ?? 0;
  if (subrace !== null && fromSubrace !== 0) {
    value += fromSubrace;
    sources.push(subrace.id);
  }
  const picked = chosen.filter((entry) => entry.ability === ability);
  value += picked.reduce((total, entry) => total + entry.bonus, 0);
  sources.push(...picked.map((entry) => entry.slotId));

  return { value, sources };
}

function racialBonuses(
  draft: CharacterDraft,
  catalogue: Catalogue,
): Readonly<Record<AbilityId, Bonus>> {
  const race = findRace(catalogue, draft.raceId);
  const subrace = findSubrace(catalogue, draft.raceId, draft.subraceId);
  const chosen = chosenAbilityBonuses(draft, catalogue);

  const bonuses = {} as Record<AbilityId, Bonus>;
  for (const ability of ABILITIES) {
    bonuses[ability] = bonusFor(ability, race, subrace, chosen);
  }
  return bonuses;
}

function blockedBy(
  score: number,
  cost: number | null,
  remaining: number,
): BlockedReason | null {
  if (score >= POINT_BUY_MAX) {
    return { kind: 'max-score', max: POINT_BUY_MAX };
  }
  if (cost !== null && cost > remaining) {
    return { kind: 'not-enough-points', required: cost, remaining };
  }
  return null;
}

/**
 * Une ligne par caractéristique, prête à piloter l'écran de répartition.
 *
 * Sans elle, l'interface devrait connaître la table de coûts pour décider si
 * le bouton « + » est actif : ce serait un calcul de règle dans un composant,
 * donc un bug de conception (docs/plans/00-arbitrage.md §A16).
 */
export function abilityRows(
  draft: CharacterDraft,
  catalogue: Catalogue,
): readonly AbilityRow[] {
  const bonuses = racialBonuses(draft, catalogue);
  const remaining = pointsRemaining(draft.baseAbilities);
  const isPointBuy = draft.abilityMethod === 'point-buy';

  return ABILITIES.map((ability): AbilityRow => {
    const score = draft.baseAbilities[ability];
    const bonus = bonuses[ability];
    const total = score + bonus.value;
    const cost = isPointBuy ? increaseCost(score) : null;
    const blocked = isPointBuy ? blockedBy(score, cost, remaining) : null;

    return {
      id: ability,
      score,
      racialBonus: bonus.value,
      bonusSources: bonus.sources,
      total,
      modifier: abilityModifier(total),
      canIncrease: isPointBuy && blocked === null && cost !== null,
      canDecrease: isPointBuy && score > POINT_BUY_MIN,
      increaseCost: cost,
      blockedBy: blocked,
    };
  });
}
