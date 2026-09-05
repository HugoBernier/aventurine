import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import styles from './FormHeader.module.css';

export interface FormHeaderProps {
  readonly title: string;
  readonly lead: string;
  readonly onCancel: () => void;
}

/**
 * La sortie d'un formulaire, EN HAUT.
 *
 * Elle était en bas, sous vingt champs : ouvrir « écrire un peuple » par
 * curiosité obligeait à en écrire un pour revenir. Une sortie qu'il faut
 * chercher n'est pas une sortie.
 */
export function FormHeader({ title, lead, onCancel }: FormHeaderProps): ReactNode {
  const header = useRef<HTMLDivElement>(null);

  // Un formulaire s'ouvre DANS l'écran qu'on quittait, à la hauteur où on
  // l'avait laissé : sans ça, on arrive au milieu des champs, sans titre et
  // sans sortie, alors qu'on vient d'appuyer sur « écrire un peuple ».
  useEffect(() => {
    // `scrollTop` sur la région qui défile, comme le cadre le fait déjà en
    // changeant d'écran : `scrollIntoView` n'existe pas partout, et ceci est
    // exactement l'effet voulu — revenir en haut du formulaire qui s'ouvre.
    const region = header.current?.closest('main');
    if (region !== null && region !== undefined) {
      region.scrollTop = 0;
    }
  }, []);

  return (
    <>
      <div className={styles.header} ref={header}>
        <button type="button" className={styles.back} onClick={onCancel}>
          ‹ Annuler
        </button>
        <span className={styles.title}>{title}</span>
      </div>
      <p className={styles.lead}>{lead}</p>
    </>
  );
}
