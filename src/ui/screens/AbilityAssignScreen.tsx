import type { ReactNode } from 'react';
import { STANDARD_ARRAY } from '../../domain/pointBuy';
import { useAbilities, useCatalogue, useDraft } from '../../state/hooks';
import { findAbility, findRace, findSubrace } from '../../domain/catalogue';
import { AbilityPicker, AbilityStepper } from '../components/AbilityStepper';
import { Explainer } from '../components/Explainer';
import { Notice } from '../components/Notice';
import { formatBlocked } from '../format/abilityBlock';
import { counted } from '../format/plural';
import styles from './AbilityScreens.module.css';

export function AbilityAssignScreen(): ReactNode {
  const catalogue = useCatalogue();
  const draft = useDraft();
  const { method, rows, pointsLeft, assign } = useAbilities();

  const race = findRace(catalogue, draft.raceId);
  const subrace = findSubrace(catalogue, draft.raceId, draft.subraceId);

  const sourceLabel = (ids: readonly string[]): string | null => {
    const first = ids[0];
    if (first === undefined) {
      return null;
    }
    if (race?.id === first) {
      return race.name;
    }
    if (subrace?.id === first) {
      return subrace.name;
    }
    return 'ton choix';
  };

  return (
    <>
      <Explainer label="Comment ça marche ?">
        {method === 'point-buy'
          ? 'Tu as 27 points. Monter un score coûte de plus en plus cher : passer de 13 à 14 coûte 2 points, alors que passer de 8 à 9 n’en coûte qu’un.'
          : 'Six valeurs toutes prêtes. Choisis-en une par caractéristique ; si tu réutilises une valeur déjà placée, les deux caractéristiques échangent leurs scores.'}
      </Explainer>

      {race === null && (
        <Notice tone="reminder">
          Tu n’as pas encore de race : ses bonus s’ajouteront tout seuls après.
        </Notice>
      )}

      {pointsLeft !== null && (
        <p className={styles.budget}>
          Points restants : {counted(pointsLeft, 'point', 'points')} sur 27
        </p>
      )}

      {rows.map((row) => {
        const ability = findAbility(catalogue, row.id);
        const label = ability?.name ?? row.id;
        if (method === 'standard-array') {
          return (
            <AbilityPicker
              key={row.id}
              label={label}
              purpose={ability?.purpose ?? ''}
              score={row.score}
              racialBonus={row.racialBonus}
              total={row.total}
              modifier={row.modifier}
              choices={[...STANDARD_ARRAY]}
              onAssign={(score) => {
                assign(row.id, score);
              }}
            />
          );
        }
        return (
          <AbilityStepper
            key={row.id}
            label={label}
            purpose={ability?.purpose ?? ''}
            score={row.score}
            racialBonus={row.racialBonus}
            bonusSourceLabel={sourceLabel(row.bonusSources)}
            total={row.total}
            modifier={row.modifier}
            canIncrease={row.canIncrease}
            canDecrease={row.canDecrease}
            blockedReason={
              row.blockedBy === null ? null : formatBlocked(row.blockedBy, label)
            }
            onIncrease={() => {
              assign(row.id, row.score + 1);
            }}
            onDecrease={() => {
              assign(row.id, row.score - 1);
            }}
          />
        );
      })}
    </>
  );
}
