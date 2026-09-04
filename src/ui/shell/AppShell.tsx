import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import styles from './AppShell.module.css';
import { rememberScroll, rememberedScroll } from './scrollMemory';

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
  const contentRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  // Changer d'écran remet en haut ; rouvrir l'onglet reprend la lecture où
  // elle en était. Seul le tout premier rendu restaure donc quelque chose.
  const hasOpened = useRef(false);

  useEffect(() => {
    const content = contentRef.current;
    // `scrollTop` plutôt que `scrollTo` : même effet, et pas d'API à simuler
    // dans les tests.
    if (content !== null) {
      content.scrollTop = hasOpened.current ? 0 : rememberedScroll(screenKey);
    }
    hasOpened.current = true;
    // Le déplacement de focus EST l'annonce du changement d'écran : une région
    // live en plus provoquerait une double lecture. `preventScroll` parce que
    // le défilement vient d'être remis à zéro juste au-dessus : laisser le
    // navigateur « révéler » le titre le referait bouger.
    titleRef.current?.focus({ preventScroll: true });
    document.title = `${title} · Aventurine`;

    // Sur mobile l'onglet est mis en veille ou tué sans prévenir : on note la
    // position quand la page se cache, et en quittant l'écran.
    const remember = (): void => {
      if (content !== null) {
        rememberScroll(screenKey, content.scrollTop);
      }
    };
    globalThis.addEventListener('pagehide', remember);
    document.addEventListener('visibilitychange', remember);
    return () => {
      remember();
      globalThis.removeEventListener('pagehide', remember);
      document.removeEventListener('visibilitychange', remember);
    };
  }, [screenKey, title]);

  return (
    <div className={styles.app} data-print="frame">
      <header className={styles.header} data-print="hide">
        <div className={styles.inner}>{header}</div>
      </header>

      <main className={styles.content} ref={contentRef}>
        <div className={styles.inner}>
          <h1 className={styles.title} tabIndex={-1} ref={titleRef}>
            {title}
          </h1>
          {lead === undefined ? null : <p className={styles.lead}>{lead}</p>}
          {children}
        </div>
      </main>

      <div className={styles.actions} data-print="hide">
        <div className={styles.inner}>{actions}</div>
      </div>
    </div>
  );
}
