import type { ReactNode } from 'react';
import styles from './Notice.module.css';

export interface NoticeProps {
  readonly tone: 'error' | 'reminder';
  readonly children: ReactNode;
  readonly live?: boolean;
  readonly onDismiss?: () => void;
}

/**
 * Le ton se lit dans le TEXTE avant la couleur — « Erreur : … » — et un filet
 * de 4 px double l'information sans dépendre de la teinte.
 */
export function Notice({ tone, children, live, onDismiss }: NoticeProps): ReactNode {
  const liveRole = tone === 'error' ? 'alert' : 'status';
  const role = live === true ? liveRole : undefined;
  return (
    <div className={tone === 'error' ? styles.error : styles.notice} role={role}>
      <p className={styles.body}>
        {tone === 'error' ? <strong>Erreur : </strong> : null}
        {children}
      </p>
      {onDismiss === undefined ? null : (
        <button type="button" className={styles.dismiss} onClick={onDismiss}>
          Fermer
        </button>
      )}
    </div>
  );
}
