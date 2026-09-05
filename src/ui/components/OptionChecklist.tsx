import type { ReactNode } from 'react';
import styles from './OptionChecklist.module.css';

export interface OptionChecklistProps {
  readonly legend: string;
  readonly options: readonly { readonly id: string; readonly name: string }[];
  readonly checked: readonly string[];
  readonly onChange: (checked: readonly string[]) => void;
}

/**
 * Cocher dans une liste du catalogue — des compétences, des langues, des
 * outils. « Toutes » et « aucune » sont là parce que le cas le plus fréquent
 * du SRD est « n'importe laquelle » : cocher dix-huit cases à la main pour
 * exprimer ça serait une punition.
 */
export function OptionChecklist({
  legend,
  options,
  checked,
  onChange,
}: OptionChecklistProps): ReactNode {
  const toggle = (id: string, isChecked: boolean): void => {
    onChange(isChecked ? [...checked, id] : checked.filter((kept) => kept !== id));
  };

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      {options.length === 0 ? (
        <p className={styles.empty}>Rien à cocher ici.</p>
      ) : (
        <>
          <div className={styles.shortcuts}>
            <button
              type="button"
              className={styles.shortcut}
              onClick={() => {
                onChange(options.map((option) => option.id));
              }}
            >
              Tout cocher
            </button>
            <button
              type="button"
              className={styles.shortcut}
              onClick={() => {
                onChange([]);
              }}
            >
              Tout décocher
            </button>
          </div>
          <div className={styles.checks}>
            {options.map((option) => (
              <label className={styles.check} key={option.id}>
                <input
                  type="checkbox"
                  checked={checked.includes(option.id)}
                  onChange={(event) => {
                    toggle(option.id, event.currentTarget.checked);
                  }}
                />
                {option.name}
              </label>
            ))}
          </div>
        </>
      )}
    </fieldset>
  );
}
