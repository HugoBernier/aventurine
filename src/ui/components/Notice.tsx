import type { ReactNode } from 'react';
import styles from './Notice.module.css';

export interface NoticeProps {
  readonly tone: 'error' | 'reminder';
  readonly children: ReactNode;
  readonly live?: boolean | undefined;
  readonly onDismiss?: (() => void) | undefined;
}

/**
 * Le ton se lit dans le TEXTE avant la couleur, « Erreur : … », et un filet
 * de 4 px double l'information sans dépendre de la teinte.
 */
export function Notice({ tone, children, live, onDismiss }: NoticeProps): ReactNode {
  const liveRole = tone === 'error' ? 'alert' : 'status';
  const role = live === true ? liveRole : undefined;
  return (
    <div className={tone === 'error' ? styles.error : styles.notice} role={role}>
      {/* Un `div` et non un `p` : plusieurs avis portent la LISTE de ce qui
          manque, et une liste dans un paragraphe est du HTML invalide que le
          navigateur défait en silence. */}
      <div className={styles.body}>
        {tone === 'error' ? <strong>Erreur : </strong> : null}
        {children}
      </div>
      {onDismiss === undefined ? null : (
        <button type="button" className={styles.dismiss} onClick={onDismiss}>
          Fermer
        </button>
      )}
    </div>
  );
}
