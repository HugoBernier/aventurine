import type { ReactNode } from 'react';
import styles from './PrintBoxes.module.css';

/**
 * Les cases qu'on remplit au crayon pendant la partie. Elles n'existent qu'à
 * l'impression : à l'écran, ces valeurs se saisissent ou se recalculent, et des
 * cadres vides n'y seraient que du bruit.
 *
 * Une fiche imprimée sans elles est un état des lieux, pas une fiche de jeu :
 * les points de vie bougent à chaque tour et les jets contre la mort se cochent
 * quand ça tourne mal. Les emplacements de sort, eux, se cochent à côté des
 * sorts du niveau : c'est là qu'on lit avant de lancer.
 */
export function PrintBoxes(): ReactNode {
  return (
    <div className={styles.boxes} data-print="only">
      <div className={styles.field}>
        <span className={styles.label}>Points de vie temporaires</span>
        <span className={styles.rule} />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Inspiration</span>
        <span className={styles.tick} />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Jets contre la mort · réussites</span>
        <span className={styles.ticks}>
          <span className={styles.tick} />
          <span className={styles.tick} />
          <span className={styles.tick} />
        </span>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Jets contre la mort · échecs</span>
        <span className={styles.ticks}>
          <span className={styles.tick} />
          <span className={styles.tick} />
          <span className={styles.tick} />
        </span>
      </div>
    </div>
  );
}
