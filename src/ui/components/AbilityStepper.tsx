import type { ReactNode } from 'react';
import { formatModifier } from '../format/abilityBlock';
import styles from './AbilityStepper.module.css';

export interface AbilityStepperProps {
  readonly label: string;
  readonly purpose: string;
  readonly score: number;
  readonly racialBonus: number;
  readonly bonusSourceLabel: string | null;
  readonly total: number;
  readonly modifier: number;
  readonly canIncrease: boolean;
  readonly canDecrease: boolean;
  readonly blockedReason: string | null;
  readonly onIncrease: () => void;
  readonly onDecrease: () => void;
}

/**
 * Boutons EMPILÉS à droite : en ligne, le calcul « 13 + 1 (nain) = 14 » plus
 * deux cibles de 44 px ne tient pas dans 360 px, et pas du tout à 200 % de
 * zoom. Empilés, les deux cibles sont aussi du côté du pouce.
 */
export function AbilityStepper({
  label,
  purpose,
  score,
  racialBonus,
  bonusSourceLabel,
  total,
  modifier,
  canIncrease,
  canDecrease,
  blockedReason,
  onIncrease,
  onDecrease,
}: AbilityStepperProps): ReactNode {
  // Sans bonus, « 8 = 8 » n'apprend rien et se lit comme une coquille : on
  // n'affiche le calcul que quand il y a un calcul.
  const bonusText =
    racialBonus === 0
      ? String(total)
      : `${String(score)} + ${String(racialBonus)} (${bonusSourceLabel ?? 'bonus'}) = ${String(total)}`;

  return (
    <div className={styles.row}>
      <div>
        <div className={styles.name}>{label}</div>
        <p className={styles.purpose}>{purpose}</p>
        <div className={styles.maths}>{bonusText}</div>
        <div>
          modificateur <span className={styles.modifier}>{formatModifier(modifier)}</span>
        </div>
        {blockedReason === null ? null : (
          <p className={styles.blocked}>{blockedReason}</p>
        )}
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.step}
          onClick={onIncrease}
          disabled={!canIncrease}
          aria-label={`Augmenter ${label}`}
        >
          +
        </button>
        <button
          type="button"
          className={styles.step}
          onClick={onDecrease}
          disabled={!canDecrease}
          aria-label={`Diminuer ${label}`}
        >
          −
        </button>
      </div>
    </div>
  );
}

export interface AbilityPickerProps {
  readonly label: string;
  readonly purpose: string;
  readonly score: number;
  readonly racialBonus: number;
  readonly total: number;
  readonly modifier: number;
  readonly choices: readonly number[];
  readonly onAssign: (score: number) => void;
}

/**
 * Variante « tableau standard » : un `<select>` natif remplace les deux
 * boutons. Il est grand, familier, accessible, et coûte zéro ligne de code.
 */
export function AbilityPicker({
  label,
  purpose,
  score,
  racialBonus,
  total,
  modifier,
  choices,
  onAssign,
}: AbilityPickerProps): ReactNode {
  return (
    <div className={styles.row}>
      <div>
        <div className={styles.name}>{label}</div>
        <p className={styles.purpose}>{purpose}</p>
        <div className={styles.maths}>
          {racialBonus === 0
            ? `${String(score)} = ${String(total)}`
            : `${String(score)} + ${String(racialBonus)} = ${String(total)}`}
        </div>
        <div>
          modificateur <span className={styles.modifier}>{formatModifier(modifier)}</span>
        </div>
      </div>
      <select
        className={styles.select}
        value={score}
        aria-label={`Valeur de ${label}`}
        onChange={(event) => {
          onAssign(Number(event.currentTarget.value));
        }}
      >
        {choices.map((choice) => (
          <option key={choice} value={choice}>
            {choice}
          </option>
        ))}
      </select>
    </div>
  );
}
