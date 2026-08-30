import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './Explainer.module.css';

export interface ExplainerProps {
  readonly label: string;
  readonly children: ReactNode;
}

/**
 * Seul mécanisme d'aide du site, et volontairement natif : `<details>` gère
 * l'ouverture, le clavier et l'exposition aux lecteurs d'écran gratuitement.
 * Une feuille glissante coûterait un piège de focus, un verrou de défilement
 * — un nid à bugs connu sur iOS — et masquerait le contexte qu'on explique.
 */
export function Explainer({ label, children }: ExplainerProps): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const id = useId();

  return (
    <details
      className={styles.details}
      onToggle={(event) => {
        setIsOpen(event.currentTarget.open);
      }}
    >
      <summary className={styles.summary} aria-controls={id}>
        {isOpen ? '⌄ Masquer' : `▸ ${label}`}
      </summary>
      <div className={styles.body} id={id}>
        {children}
      </div>
    </details>
  );
}
