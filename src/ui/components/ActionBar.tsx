import type { ReactNode } from 'react';
import styles from './ActionBar.module.css';

export interface ActionBarProps {
  readonly back?: { readonly label: string; readonly onClick: () => void };
  readonly primary: {
    readonly label: string;
    readonly onClick?: () => void;
    readonly type?: 'button' | 'submit';
  };
  readonly note?: string;
}

/**
 * « Précédent » compact à gauche, action principale large à droite, du côté du
 * pouce. La barre n'est jamais désactivée : avancer avec un choix incomplet
 * est un usage normal, pas une erreur.
 */
export function ActionBar({ back, primary, note }: ActionBarProps): ReactNode {
  return (
    <div className={styles.bar} data-print="hide">
      {back === undefined ? (
        <span />
      ) : (
        <button type="button" className={styles.button} onClick={back.onClick}>
          {back.label}
        </button>
      )}
      <button
        type={primary.type ?? 'button'}
        className={styles.primary}
        onClick={primary.onClick}
      >
        {primary.label}
      </button>
      {note === undefined ? null : <p className={styles.note}>{note}</p>}
    </div>
  );
}
