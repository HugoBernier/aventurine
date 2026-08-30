import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import styles from './AppShell.module.css';

export interface AppShellProps {
  readonly header: ReactNode;
  readonly actions: ReactNode;
  /** Change à chaque écran : remet le défilement en haut et déplace le focus. */
  readonly screenKey: string;
  readonly title: string;
  readonly lead?: string | undefined;
  readonly children: ReactNode;
}

export function AppShell({
  header,
  actions,
  screenKey,
  title,
  lead,
  children,
}: AppShellProps): ReactNode {
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // `scrollTop` plutôt que `scrollTo` : même effet, et pas d'API à simuler
    // dans les tests.
    if (contentRef.current !== null) {
      contentRef.current.scrollTop = 0;
    }
    // Le déplacement de focus EST l'annonce du changement d'écran : une région
    // live en plus provoquerait une double lecture.
    titleRef.current?.focus();
    document.title = `${title} — Aventurine`;
  }, [screenKey, title]);

  return (
    <div className={styles.app} data-print="frame">
      <header className={styles.header} data-print="hide">
        <div className={styles.inner}>{header}</div>
      </header>

      <div className={styles.content} ref={contentRef}>
        <div className={styles.inner}>
          <h1 className={styles.title} tabIndex={-1} ref={titleRef}>
            {title}
          </h1>
          {lead === undefined ? null : <p className={styles.lead}>{lead}</p>}
          {children}
        </div>
      </div>

      <div className={styles.actions} data-print="hide">
        <div className={styles.inner}>{actions}</div>
      </div>
    </div>
  );
}
