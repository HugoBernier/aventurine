import type { ReactNode } from 'react';
import styles from './ActionBar.module.css';

export interface ActionBarProps {
  readonly back?: { readonly label: string; readonly onClick: () => void } | undefined;
  readonly primary: {
    readonly label: string;
    readonly onClick?: (() => void) | undefined;
    readonly type?: 'button' | 'submit' | undefined;
  };
  /**
   * « Ce que ça change sur ta fiche ». Il est ici, dans la barre qui ne défile
   * jamais, et non en bas de la liste : sur neuf races il faudrait dérouler
   * jusqu'en bas pour lire l'effet du choix qu'on vient de faire en haut.
   */
  readonly effect?: string | null | undefined;
}

/**
 * « Précédent » compact à gauche, action principale large à droite, du côté du
 * pouce. La barre n'est jamais désactivée : avancer avec un choix incomplet
 * est un usage normal, pas une erreur.
 */
export function ActionBar({ back, primary, effect = null }: ActionBarProps): ReactNode {
  return (
    <div className={styles.bar} data-print="hide">
      {effect === null ? null : (
        <p className={styles.effect}>
          <span className={styles.effectLabel}>Ta fiche : </span>
          {effect}
        </p>
      )}
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
    </div>
  );
}
