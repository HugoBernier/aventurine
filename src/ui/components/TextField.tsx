import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './TextField.module.css';

export interface TextFieldProps {
  readonly label: string;
  readonly defaultValue: string;
  /** Remonte au `blur` et à la validation, jamais à chaque touche. */
  readonly onCommit: (value: string) => void;
  readonly onInput?: ((value: string) => void) | undefined;
  readonly type?: 'text' | 'search' | undefined;
  readonly hint?: string | undefined;
  readonly error?: string | undefined;
  readonly placeholder?: string | undefined;
  readonly enterKeyHint?: 'next' | 'done' | 'search' | undefined;
  readonly maxLength?: number | undefined;
  readonly multiline?: boolean | undefined;
}

/**
 * Non contrôlé par conception : le champ garde sa frappe en local et ne
 * remonte qu'au `blur`, donc une touche ne déclenche ni purge, ni validation,
 * ni sauvegarde.
 */
export function TextField({
  label,
  defaultValue,
  onCommit,
  onInput,
  type = 'text',
  hint,
  error,
  placeholder,
  enterKeyHint,
  maxLength,
  multiline,
}: TextFieldProps): ReactNode {
  const id = useId();
  const describedBy = `${id}-hint`;
  const [value, setValue] = useState(defaultValue);

  const shared = {
    id,
    value,
    placeholder,
    maxLength,
    className: styles.input,
    'aria-describedby':
      hint === undefined && error === undefined ? undefined : describedBy,
    'aria-invalid': error === undefined ? undefined : true,
    onChange: (event: { currentTarget: { value: string } }) => {
      setValue(event.currentTarget.value);
      onInput?.(event.currentTarget.value);
    },
    onBlur: () => {
      onCommit(value);
    },
  };

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {multiline === true ? (
        <textarea {...shared} rows={3} />
      ) : (
        <input {...shared} type={type} enterKeyHint={enterKeyHint} />
      )}
      {error !== undefined && (
        <p className={styles.error} id={describedBy}>
          Erreur : {error}
        </p>
      )}
      {error === undefined && hint !== undefined && (
        <p className={styles.hint} id={describedBy}>
          {hint}
        </p>
      )}
    </div>
  );
}
