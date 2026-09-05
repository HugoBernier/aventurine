import type { ReactNode } from 'react';
import { TextField } from './TextField';
import styles from './OptionChecklist.module.css';

export interface StringListEditorProps {
  readonly legend: string;
  readonly hint: string;
  readonly lines: readonly string[];
  readonly onChange: (lines: readonly string[]) => void;
}

/**
 * Une colonne d'amorces : « J'ai une citation sacrée pour chaque situation. »
 * Trois par colonne dans le SRD, autant qu'on veut ici.
 *
 * Les lignes n'ont pas d'identifiant : leur rang EST leur identité, et rien ne
 * les réordonne — on ajoute à la fin, on retire au milieu.
 */
export function StringListEditor({
  legend,
  hint,
  lines,
  onChange,
}: StringListEditorProps): ReactNode {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <p className={styles.empty}>{hint}</p>
      {lines.map((line, index) => (
        <div className={styles.shortcuts} key={index}>
          <TextField
            label={`Ligne ${String(index + 1)}`}
            defaultValue={line}
            maxLength={600}
            onCommit={(value) => {
              onChange(lines.map((kept, at) => (at === index ? value : kept)));
            }}
            onInput={(value) => {
              onChange(lines.map((kept, at) => (at === index ? value : kept)));
            }}
          />
          <button
            type="button"
            className={styles.shortcut}
            onClick={() => {
              onChange(lines.filter((_, at) => at !== index));
            }}
          >
            Retirer
          </button>
        </div>
      ))}
      <button
        type="button"
        className={styles.shortcut}
        onClick={() => {
          onChange([...lines, '']);
        }}
      >
        + Ajouter une ligne
      </button>
    </fieldset>
  );
}
