import type { ReactNode } from 'react';
import type { ChoiceDraft } from '../../domain/packDraft';
import { TextField } from '../components/TextField';
import styles from './SpellForm.module.css';

/** Jamais zéro, jamais au-delà de la borne : un nombre qui reste jouable. */
function asCount(value: string, max: number): number {
  const asked = Number(value);
  return Number.isFinite(asked) ? Math.min(Math.max(Math.trunc(asked), 1), max) : 1;
}

export interface SpellCountEditorProps {
  readonly choice: ChoiceDraft;
  readonly onChange: (parts: Partial<ChoiceDraft>) => void;
}

/**
 * Combien de sorts, et d'où vient le nombre.
 *
 * Deux façons, et le SRD n'en connaît pas d'autre : une table qui monte avec
 * le niveau — le barde, le magicien — ou un calcul « caractéristique + niveau »
 * que le clerc et le druide emploient. La table s'écrit en paliers, parce que
 * vingt nombres à la main sont vingt occasions de se tromper.
 */
export function SpellCountEditor({ choice, onChange }: SpellCountEditorProps): ReactNode {
  const set = (index: number, parts: { level?: number; howMany?: number }): void => {
    onChange({
      steps: choice.steps.map((step, at) =>
        at === index ? { ...step, ...parts } : step,
      ),
    });
  };
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Combien il en connaît</legend>
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={choice.prepared}
          onChange={(event) => {
            onChange({ prepared: event.currentTarget.checked });
          }}
        />
        Le nombre se calcule (caractéristique + niveau), comme le clerc
      </label>

      {!choice.prepared && (
        <>
          {choice.steps.map((step, index) => (
            <div className={styles.row} key={index}>
              <TextField
                label="À partir du niveau"
                defaultValue={String(step.level)}
                maxLength={2}
                onCommit={(value) => {
                  set(index, { level: asCount(value, 20) });
                }}
              />
              <TextField
                label="Il en connaît"
                defaultValue={String(step.howMany)}
                maxLength={2}
                onCommit={(value) => {
                  set(index, { howMany: asCount(value, 40) });
                }}
              />
              <button
                type="button"
                className={styles.cancel}
                onClick={() => {
                  onChange({ steps: choice.steps.filter((_, at) => at !== index) });
                }}
              >
                Retirer
              </button>
            </div>
          ))}
          <button
            type="button"
            className={styles.cancel}
            onClick={() => {
              onChange({ steps: [...choice.steps, { level: 1, howMany: 1 }] });
            }}
          >
            + Ajouter un palier
          </button>
        </>
      )}
    </fieldset>
  );
}
